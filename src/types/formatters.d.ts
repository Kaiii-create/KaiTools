declare module "csso" {
  export function minify(source: string): { css: string; map?: unknown };
}

declare module "html-minifier-terser" {
  export function minify(source: string, options?: Record<string, unknown>): Promise<string>;
}

declare module "html-minifier-terser/dist/htmlminifier.esm.bundle" {
  export function minify(source: string, options?: Record<string, unknown>): Promise<string>;
}
