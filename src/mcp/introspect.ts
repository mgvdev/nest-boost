import { RequestMethod } from "@nestjs/common";
import {
  GUARDS_METADATA,
  INTERCEPTORS_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
  PIPES_METADATA,
} from "@nestjs/common/constants";
import { MetadataScanner, type ModulesContainer } from "@nestjs/core";

const scanner = new MetadataScanner();

/** NestJS registers this synthetic module internally; never user-facing. */
const INTERNAL_MODULES = new Set(["InternalCoreModule"]);

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

export interface RouteInfo {
  method: string;
  path: string;
  controller: string;
  handler: string;
  module: string;
  guards: string[];
  interceptors: string[];
  pipes: string[];
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
      // Skip the module class itself, which Nest registers as a provider.
      if (name === mod.metatype!.name) continue;
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
