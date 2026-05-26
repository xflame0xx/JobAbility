import fs from "node:fs";
import { defineConfig, loadEnv, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const readHttpsConfig = (keyPath: string, certPath: string) => {
  if (!keyPath || !certPath) {
    return undefined;
  }

  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    return undefined;
  }

  return {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };
};

const normalizeBasePath = (value: string) => {
  if (!value || value === ".") {
    return "/";
  }

  if (value === "./") {
    return "./";
  }

  const withStartSlash = value.startsWith("/") ? value : `/${value}`;
  return withStartSlash.endsWith("/") ? withStartSlash : `${withStartSlash}/`;
};

const getPagesBase = (mode: string, envBasePath: string) => {
  if (envBasePath) {
    return normalizeBasePath(envBasePath);
  }

  if (mode !== "pages") {
    return "/";
  }

  const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];

  if (!repositoryName) {
    return "/";
  }

  return `/${repositoryName}/`;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const base =
    mode === "tauri"
      ? "./"
      : getPagesBase(mode, env.VITE_BASE_PATH || "");

  const backendTarget =
    env.VITE_DEV_PROXY_TARGET || "http://127.0.0.1:9003";

  const devHost = env.VITE_DEV_HOST || "127.0.0.1";

  const https = readHttpsConfig(
    env.VITE_HTTPS_KEY || "",
    env.VITE_HTTPS_CERT || "",
  );

  const usePwa = mode === "pages" || mode === "mock";

  const plugins: PluginOption[] = [
    react(),

    usePwa &&
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",

        includeAssets: [
          "jobability-mark.svg",
        ],

        manifest: {
          name: "JobAbility",
          short_name: "JobAbility",
          description:
            "Система трудоустройства для людей с ограниченными возможностями.",
          theme_color: "#5751ea",
          background_color: "#f5f7fc",
          display: "standalone",
          orientation: "portrait",
          lang: "ru",
          scope: base,
          start_url: base,
          icons: [
            {
              src: `${base}jobability-mark.svg`,
              sizes: "any",
              type: "image/svg+xml",
              purpose: "any maskable",
            },
          ],
        },

        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,png,jpg,jpeg,webp,ico}"],
          globIgnores: ["**/ort-*.wasm", "**/transformers*.js"],
          navigateFallback: `${base}index.html`,
        },

        devOptions: {
          enabled: mode === "mock",
        },
      }),
  ].filter(Boolean) as PluginOption[];

  return {
    base,

    plugins,

    build: {
      emptyOutDir: true,
    },

    server: {
      host: devHost,
      port: 3000,
      strictPort: true,
      https,
      proxy: {
        "/api": {
          target: backendTarget,
          changeOrigin: true,
        },
        "/media": {
          target: backendTarget,
          changeOrigin: true,
        },
        "/swagger": {
          target: backendTarget,
          changeOrigin: true,
        },
        "/admin": {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },

    preview: {
      host: "0.0.0.0",
      port: 4173,
      strictPort: true,
      https,
    },
  };
});
