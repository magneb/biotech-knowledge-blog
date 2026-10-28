/**
 * Ambient type definitions for OpenNext compiled Cloudflare Worker output.
 * Ensures TypeScript compiler (tsc --noEmit) can type-check web/worker.ts cleanly
 * both before and after .open-next/worker.js is generated.
 */
interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
  [key: string]: unknown;
}

declare module "./.open-next/worker.js" {
  interface OpenNextWorkerExport {
    fetch: (request: Request, env: unknown, ctx: ExecutionContext) => Promise<Response>;
    [key: string]: unknown;
  }
  const handler: OpenNextWorkerExport;
  export default handler;
  export const DOQueueHandler: unknown;
  export const DOShardedTagCache: unknown;
  export const BucketCachePurge: unknown;
}

declare module "*/.open-next/worker.js" {
  interface OpenNextWorkerExport {
    fetch: (request: Request, env: unknown, ctx: ExecutionContext) => Promise<Response>;
    [key: string]: unknown;
  }
  const handler: OpenNextWorkerExport;
  export default handler;
  export const DOQueueHandler: unknown;
  export const DOShardedTagCache: unknown;
  export const BucketCachePurge: unknown;
}
