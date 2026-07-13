/**
 * NestJS reflection metadata keys, inlined from `@nestjs/common/constants`.
 *
 * That subpath has no `exports` map, so importing it fails under Node ESM. These
 * values are part of Nest's stable reflection contract and have been unchanged
 * for years, so we mirror them here to keep the package Node-native.
 */
export const PATH_METADATA = "path";
export const METHOD_METADATA = "method";
export const GUARDS_METADATA = "__guards__";
export const INTERCEPTORS_METADATA = "__interceptors__";
export const PIPES_METADATA = "__pipes__";
export const ROUTE_ARGS_METADATA = "__routeArguments__";
