import { RequestMethod } from "@nestjs/common";
import { MetadataScanner, type ModulesContainer } from "@nestjs/core";
import {
  GUARDS_METADATA,
  INTERCEPTORS_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
  PIPES_METADATA,
  ROUTE_ARGS_METADATA,
} from "./nest-constants";

const scanner = new MetadataScanner();

/** NestJS registers this synthetic module internally; never user-facing. */
const INTERNAL_MODULES = new Set(["InternalCoreModule"]);

/** Framework providers Nest injects into every module — noise in the graph. */
const INTERNAL_PROVIDERS = new Set([
  "ModuleRef",
  "ApplicationConfig",
  "Reflector",
  "HttpAdapterHost",
  "ExternalContextCreator",
  "ModulesContainer",
  "SerializedGraph",
  "LazyModuleLoader",
]);

export interface ProviderInfo {
  name: string;
  scope: "default" | "request" | "transient";
  exported: boolean;
  isController: false;
}

export interface ModuleInfo {
  name: string;
  controllers: string[];
  providers: ProviderInfo[];
  imports: string[];
  exports: string[];
}

export interface RouteSchemaInfo {
  index: number;
  library: string;
}

export interface RouteInfo {
  method: string;
  path: string;
  controller: string;
  handler: string;
  module: string;
  guards: string[];
  interceptors: string[];
  pipes: string[];
  schemas: RouteSchemaInfo[];
}

function enhancerNames(metadataKey: string, target: object): string[] {
  const list: unknown[] = Reflect.getMetadata(metadataKey, target) ?? [];
  return list.map((item: any) => item?.name ?? item?.constructor?.name ?? String(item));
}

function scopeLabel(scope: unknown): ProviderInfo["scope"] {
  // @nestjs/common Scope: DEFAULT=0, TRANSIENT=1, REQUEST=2
  if (scope === 1) return "transient";
  if (scope === 2) return "request";
  return "default";
}

function joinPath(base: string, route: string): string {
  const combined = `/${base}/${route}`.replace(/\/+/g, "/").replace(/\/+$/, "");
  return combined === "" ? "/" : combined;
}

function detectSchemaLibrary(schema: unknown): string {
  if (!schema || typeof schema !== "object") return "unknown";
  const standard = (schema as Record<string, unknown>)["~standard"];
  if (standard && typeof standard === "object" && "vendor" in standard) {
    return String((standard as { vendor?: unknown }).vendor).toLowerCase();
  }
  const ctorName = (schema as { constructor?: { name?: string } }).constructor?.name;
  if (ctorName?.startsWith("Zod") || ctorName === "ZodType") return "zod";
  if (ctorName?.toLowerCase().includes("valibot")) return "valibot";
  if (ctorName?.toLowerCase().includes("arktype")) return "arktype";
  return "unknown";
}

function collectRouteSchemas(handler: unknown, cls: new (...args: any[]) => unknown, methodName: string): RouteSchemaInfo[] {
  const metadata: Record<string, { index: number; schema?: unknown }> =
    Reflect.getMetadata(ROUTE_ARGS_METADATA, cls, methodName) ?? {};
  const schemas: RouteSchemaInfo[] = [];
  for (const entry of Object.values(metadata)) {
    if (entry?.schema) {
      schemas.push({ index: entry.index, library: detectSchemaLibrary(entry.schema) });
    }
  }
  return schemas;
}

function userModules(modules: ModulesContainer) {
  return [...modules.values()].filter(
    (mod) => mod.metatype && !INTERNAL_MODULES.has(mod.metatype.name),
  );
}

/** Build a structural view of every user module: controllers, providers, imports, exports. */
export function collectModules(modules: ModulesContainer): ModuleInfo[] {
  return userModules(modules).map((mod) => {
    const exportedTokens = new Set([...mod.exports].map(tokenName));

    const providers: ProviderInfo[] = [];
    for (const [token, wrapper] of mod.providers) {
      const name = wrapper.name ?? tokenName(token);
      // Skip the module class itself and Nest's per-module framework providers.
      if (name === mod.metatype!.name || INTERNAL_PROVIDERS.has(name)) continue;
      providers.push({
        name,
        scope: scopeLabel((wrapper as any).scope),
        exported: exportedTokens.has(name),
        isController: false,
      });
    }

    return {
      name: mod.metatype!.name,
      controllers: [...mod.controllers.values()].map((w) => w.name ?? "(anonymous)"),
      providers,
      imports: [...mod.imports]
        .filter((m) => m.metatype && !INTERNAL_MODULES.has(m.metatype.name))
        .map((m) => m.metatype!.name),
      exports: [...exportedTokens],
    };
  });
}

/** Reflect every HTTP route across all user controllers. */
export function collectRoutes(modules: ModulesContainer): RouteInfo[] {
  const routes: RouteInfo[] = [];

  for (const mod of userModules(modules)) {
    for (const wrapper of mod.controllers.values()) {
      const cls = wrapper.metatype as (new (...args: any[]) => unknown) | undefined;
      if (!cls) continue;

      const basePath = String(Reflect.getMetadata(PATH_METADATA, cls) ?? "");
      const classGuards = enhancerNames(GUARDS_METADATA, cls);
      const classInterceptors = enhancerNames(INTERCEPTORS_METADATA, cls);
      const classPipes = enhancerNames(PIPES_METADATA, cls);
      const proto = cls.prototype;

      for (const methodName of scanner.getAllMethodNames(proto)) {
        const handler = proto[methodName];
        const httpMethod = Reflect.getMetadata(METHOD_METADATA, handler);
        if (httpMethod === undefined) continue; // not a route handler
        const routePath = String(Reflect.getMetadata(PATH_METADATA, handler) ?? "");

        routes.push({
          method: RequestMethod[httpMethod] ?? String(httpMethod),
          path: joinPath(basePath, routePath),
          controller: cls.name,
          handler: methodName,
          module: mod.metatype!.name,
          guards: [...classGuards, ...enhancerNames(GUARDS_METADATA, handler)],
          interceptors: [...classInterceptors, ...enhancerNames(INTERCEPTORS_METADATA, handler)],
          pipes: [...classPipes, ...enhancerNames(PIPES_METADATA, handler)],
          schemas: collectRouteSchemas(handler, cls, methodName),
        });
      }
    }
  }

  return routes;
}

export function countModules(modules: ModulesContainer): number {
  return userModules(modules).length;
}

function tokenName(token: unknown): string {
  if (typeof token === "string") return token;
  if (typeof token === "symbol") return token.toString();
  if (typeof token === "function") return token.name;
  return String(token);
}
