import express, { type Express, type Request, type Response, type NextFunction } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url'; // Add this import
import { createServer as createViteServer, type ViteDevServer, createLogger, type Logger } from "vite";
import type { Server as HttpServer } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

// Get ESM-compatible __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const viteLogger: Logger = createLogger();

// Export the log function
export function log(message: string, source: string = "express"): void {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// Export setupVite function
export async function setupVite(app: Express, httpServer: HttpServer): Promise<void> {
  const serverOptions = {
    middlewareMode: true,
    hmr: {
      server: httpServer,
      protocol: 'ws',
      host: 'localhost'
    },
    allowedHosts: ['localhost', '127.0.0.1'],
    port: 5173,
    strictPort: true
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: viteLogger,
    server: serverOptions,
    appType: "custom",
    root: path.resolve(__dirname, '..'), // Now works in ESM
  });

  app.use(vite.middlewares);

  app.use("*", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const templatePath = path.resolve(__dirname, "../client/index.html");
      let template = await fs.promises.readFile(templatePath, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

// Export serveStatic function
export function serveStatic(app: Express): void {
  const distPath = path.resolve(__dirname, "..", "dist");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));
  app.use("*", (_req: Request, res: Response) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}