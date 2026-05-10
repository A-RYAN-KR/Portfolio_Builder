/**
 * Converts a single self-contained HTML file (from AI) into a
 * multi-file project that can be served by a simple dev server
 * inside WebContainer.
 *
 * Returns a flat file map: { "filename": "content" }
 */
export function htmlToProject(htmlCode) {
  if (!htmlCode) return null;

  // Build a minimal static-server project
  const files = {
    "package.json": JSON.stringify(
      {
        name: "portfolio-preview",
        version: "1.0.0",
        private: true,
        scripts: {
          dev: "npx -y serve -l 3111 .",
        },
      },
      null,
      2
    ),
    "index.html": htmlCode,
  };

  return files;
}

/**
 * Converts a multi-file project (from AI structured output) into
 * the flat file map expected by the WebContainer.
 *
 * Input:  Array of { name: "src/App.jsx", content: "..." }
 * Output: { "src/App.jsx": "..." }
 */
export function projectFilesToMap(projectFiles) {
  const map = {};
  for (const file of projectFiles) {
    map[file.name] = file.content;
  }
  return map;
}

/**
 * Creates a Vite + React project scaffold for more complex apps.
 * Returns a flat file map.
 */
export function createViteReactProject(appFiles = {}) {
  const packageJson = {
    name: "ai-generated-app",
    version: "1.0.0",
    private: true,
    type: "module",
    scripts: {
      dev: "vite",
      build: "vite build",
      preview: "vite preview",
    },
    dependencies: {
      react: "^18.2.0",
      "react-dom": "^18.2.0",
    },
    devDependencies: {
      "@vitejs/plugin-react": "^4.2.1",
      vite: "^5.1.0",
    },
  };

  const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
`;

  const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Generated App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;

  const mainJsx =
    appFiles["src/main.jsx"] ||
    `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`;

  const appJsx =
    appFiles["src/App.jsx"] ||
    `export default function App() {
  return <div>Hello from AI Generated App!</div>
}
`;

  const indexCss =
    appFiles["src/index.css"] ||
    `*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: system-ui, sans-serif; }
`;

  return {
    "package.json": JSON.stringify(packageJson, null, 2),
    "vite.config.js": viteConfig,
    "index.html": indexHtml,
    "src/main.jsx": mainJsx,
    "src/App.jsx": appJsx,
    "src/index.css": indexCss,
    ...appFiles,
  };
}

/**
 * Creates a Next.js (App Router) project scaffold.
 * Returns a flat file map.
 */
export function createNextJsProject(appFiles = {}) {
  const packageJson = {
    name: "ai-generated-next-app",
    version: "1.0.0",
    private: true,
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
    },
    dependencies: {
      react: "^18.2.0",
      "react-dom": "^18.2.0",
      next: "14.1.0",
    },
  };

  const layoutJsx =
    appFiles["app/layout.jsx"] ||
    `import './globals.css'
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
`;

  const pageJsx =
    appFiles["app/page.jsx"] ||
    `export default function Page() {
  return <main>Hello from AI Generated Next.js App!</main>
}
`;

  const globalsCss =
    appFiles["app/globals.css"] ||
    `*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: system-ui, sans-serif; }
`;

  return {
    "package.json": JSON.stringify(packageJson, null, 2),
    "app/layout.jsx": layoutJsx,
    "app/page.jsx": pageJsx,
    "app/globals.css": globalsCss,
    ...appFiles,
  };
}
