import { type Express } from "express";
import { createServer as createViteServer, type ViteDevServer } from "vite";
import { type Server } from "http";
import express from "express";
import path from "path";

export function log(message: string) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  // In development, don't set up Vite middleware since it runs separately
  if (process.env.NODE_ENV === "development") {
    log("Vite running separately on port 5000");
    return;
  }
  
  const vite: ViteDevServer = await createViteServer({
    configFile: path.resolve(process.cwd(), "vite.config.ts"),
    server: { middlewareMode: true },
    appType: "spa",
  });

  app.use(vite.ssrFixStacktrace);
  app.use(vite.middlewares);

  // Catch-all handler for SPA routing
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // Skip API routes
      if (url.startsWith('/api')) {
        return next();
      }

      // Transform and serve the HTML
      const template = await vite.transformIndexHtml(url, 
        `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>BlackByte Forum</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
      );

      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e: any) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });

  log("Vite development server configured");
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist/public");
  
  app.use(express.static(distPath, {
    maxAge: "1y",
    setHeaders: (res, path) => {
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    }
  }));

  // Catch-all handler for SPA routing in production
  app.get("*", (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
      return next();
    }

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(distPath, "index.html"));
  });

  log("Static files configured");
}