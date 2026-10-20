import express, { type Express, type RequestHandler } from "express";
import fs from "node:fs";
import { type Server } from "node:http";
import { nanoid } from "nanoid";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { buildSsrPrefetch } from "./ssrCaller";
import { composeHtml } from "../seoHtml";
import {
  canonicalPathFor,
  getPageMeta,
  PUBLIC_PAGES,
} from "../../client/src/data/siteMetadata";

const normalizePublicUrl: RequestHandler = (req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  const qi = req.originalUrl.indexOf("?");
  const rawPath = qi === -1 ? req.originalUrl : req.originalUrl.slice(0, qi);
  const query = qi === -1 ? "" : req.originalUrl.slice(qi);
  let target = rawPath.replace(/^\/{2,}/, "/").replace(/\/+$/, "") || "/";
  if (target === "/index.html") target = "/";
  // Only known static segments are case-normalised. Dynamic identifiers are untouched.
  const staticMatch = Object.keys(PUBLIC_PAGES).find(
    p => p.toLowerCase() === target.toLowerCase()
  );
  if (staticMatch) target = staticMatch;
  else
    target = target.replace(/^\/(insights|resources)(?=\/)/i, m =>
      m.toLowerCase()
    );
  target = canonicalPathFor(target);
  if (target !== rawPath) return res.redirect(301, target + query);
  next();
};

export async function setupVite(app: Express, server: Server) {
  // Loaded only in development. The module names are variables so bundlers
  // and the Vercel file tracer leave Vite out of the production function.
  const viteModule = "vite";
  const configModule = "../../vite.config";
  const { createServer: createViteServer } = await import(viteModule);
  const viteConfig = (await import(configModule)).default;
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: { middlewareMode: true, hmr: { server }, allowedHosts: true },
    appType: "custom",
  });
  app.use(normalizePublicUrl);
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    try {
      const templatePath = path.resolve(
        import.meta.dirname,
        "../../client/index.html"
      );
      let template = await fs.promises.readFile(templatePath, "utf-8");
      template = template.replace(
        'src="/src/entry-client.tsx"',
        () => `src="/src/entry-client.tsx?v=${nanoid()}"`
      );
      template = await vite.transformIndexHtml(req.originalUrl, template);
      template = template.replace(
        "</head>",
        () =>
          '<link rel="stylesheet" href="/src/index.css?direct" data-ssr-dev-css></head>'
      );
      const { render } = await vite.ssrLoadModule("/src/entry-server.tsx");
      const result = await render(
        req.originalUrl,
        await buildSsrPrefetch(req, res)
      );
      res
        .status(result.head.notFound ? 404 : 200)
        .set("Cache-Control", "no-cache")
        .type("html")
        .end(
          composeHtml(
            template,
            result.html,
            result.head,
            result.dehydratedState
          )
        );
    } catch (error) {
      vite.ssrFixStacktrace(error as Error);
      console.error("[SSR] dev render failed:", error);
      next(error);
    }
  });
}

// The built site lives in dist/ at the project root. Resolve it from the
// project root (not from this file) so the same code works when run from
// the esbuild bundle, from tsx, or inside a Vercel function.
function resolveDist(): string {
  const candidates = [
    process.env.DIST_DIR,
    path.resolve(process.cwd(), "dist"),
    path.resolve(import.meta.dirname, "../../dist"),
    path.resolve(import.meta.dirname, ".."),
  ].filter((p): p is string => Boolean(p));
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "template.html"))) return dir;
    if (fs.existsSync(path.join(dir, "public", "index.html"))) return dir;
  }
  return candidates[1];
}

/** A file under client/public, wherever the build put it. */
export function publicFilePath(rel: string): string {
  const built = path.join(resolveDist(), "public", rel);
  if (fs.existsSync(built)) return built;
  return path.resolve(import.meta.dirname, "../../client/public", rel);
}

// The HTML template is moved out of dist/public after the build (see
// scripts/postbuild.mjs) so Vercel's CDN cannot serve it as a static home page.
function resolveTemplate(dist: string): string {
  const moved = path.join(dist, "template.html");
  if (fs.existsSync(moved)) return moved;
  return path.join(dist, "public", "index.html");
}

export function serveStatic(app: Express) {
  const dist = resolveDist();
  const distPath = path.join(dist, "public");
  const templatePath = resolveTemplate(dist);
  const entryPath = path.join(dist, "server-ssr", "entry-server.js");
  app.use(normalizePublicUrl);
  app.use(
    express.static(distPath, {
      index: false,
      redirect: false,
      maxAge: "1h",
      setHeaders: (res, filePath) => {
        if (filePath.includes(`${path.sep}assets${path.sep}`) || /\.(webp|jpg|jpeg|png|svg|woff2?)$/.test(filePath)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    })
  );
  app.use("*", async (req, res) => {
    const template = await fs.promises.readFile(templatePath, "utf-8");
    // The dashboard is private and client only. Serve the shell straight away
    // instead of a server render that would only produce a loading state.
    if (/^\/admin(\/|$)/.test(req.path)) {
      res
        .status(200)
        .set("Cache-Control", "no-store")
        .type("html")
        .end(composeHtml(template, "", getPageMeta(req.originalUrl), { mutations: [], queries: [] }));
      return;
    }
    try {
      const { render } = await import(pathToFileURL(entryPath).href);
      const result = await render(
        req.originalUrl,
        await buildSsrPrefetch(req, res)
      );
      res
        .status(result.head.notFound ? 404 : 200)
        .set("Cache-Control", "no-cache")
        .type("html")
        .end(
          composeHtml(
            template,
            result.html,
            result.head,
            result.dehydratedState
          )
        );
    } catch (error) {
      // Keep visitors working through the client app if SSR fails. Do not turn outages into missing pages.
      console.error("[SSR] render failed, serving shell:", error);
      const head = getPageMeta(req.originalUrl);
      res
        .status(head.notFound ? 404 : 200)
        .set("Cache-Control", "no-cache")
        .type("html")
        .end(composeHtml(template, "", head, { mutations: [], queries: [] }));
    }
  });
}
