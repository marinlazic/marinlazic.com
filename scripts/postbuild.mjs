// Runs after the client build. Vercel serves any file in dist/public straight
// from its CDN before the rewrite to the server function runs, so a static
// dist/public/index.html would shadow the server rendered home page. Move the
// template out of the public folder; the server reads it from dist/template.html.
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const from = path.join(root, "dist", "public", "index.html");
const to = path.join(root, "dist", "template.html");

if (fs.existsSync(from)) {
  fs.renameSync(from, to);
  console.log("[postbuild] moved dist/public/index.html to dist/template.html");
} else if (fs.existsSync(to)) {
  console.log("[postbuild] template already at dist/template.html");
} else {
  console.error("[postbuild] no index.html found in dist/public");
  process.exit(1);
}
