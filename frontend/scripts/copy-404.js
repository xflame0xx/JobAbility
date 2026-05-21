import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const indexPath = resolve("dist", "index.html");
const notFoundPath = resolve("dist", "404.html");

if (existsSync(indexPath)) {
  copyFileSync(indexPath, notFoundPath);
  console.log("Created dist/404.html for GitHub Pages SPA fallback.");
} else {
  console.log("dist/index.html not found. 404.html was not created.");
}
