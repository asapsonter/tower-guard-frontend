import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import { handleGuardian, handleOps } from "./router.js";

/** Serves /api/* from the same handlers Vercel runs, under `vite dev` and `vite preview`. */
export function devApi(): Plugin {
  return {
    name: "ops-dev-api",
    configureServer(server) {
      server.middlewares.use(apiMiddleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(apiMiddleware);
    },
  };
}

async function apiMiddleware(req: IncomingMessage, res: ServerResponse, next: () => void) {
  if (!req.url?.startsWith("/api/")) return next();
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const request = new Request(`http://localhost${req.url}`, {
    method: req.method,
    headers: req.headers as Record<string, string>,
    body: chunks.length && req.method !== "GET" ? Buffer.concat(chunks) : undefined,
  });
  const handler = req.url.startsWith("/api/guardian") ? handleGuardian : handleOps;
  const response = await handler(request);
  res.statusCode = response.status;
  response.headers.forEach((v, k) => res.setHeader(k, v));
  res.end(Buffer.from(await response.arrayBuffer()));
}
