"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { WebContainer } from "@webcontainer/api";

// Singleton: only one WebContainer instance per page
let _wcInstance = null;
let _wcBooting = false;
let _wcBootPromise = null;

async function getWebContainer() {
  if (_wcInstance) return _wcInstance;
  if (_wcBooting) return _wcBootPromise;

  _wcBooting = true;
  _wcBootPromise = WebContainer.boot();

  try {
    _wcInstance = await _wcBootPromise;
    return _wcInstance;
  } catch (err) {
    _wcBooting = false;
    _wcBootPromise = null;
    throw err;
  }
}

/**
 * Convert a flat file map { "src/App.jsx": "code...", "package.json": "{...}" }
 * into the nested tree structure WebContainer expects
 */
function buildFileTree(flatFiles) {
  const tree = {};

  for (const [filePath, content] of Object.entries(flatFiles)) {
    const parts = filePath.split("/");
    let current = tree;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      if (i === parts.length - 1) {
        // Leaf node: file
        current[part] = {
          file: { contents: content },
        };
      } else {
        // Directory node
        if (!current[part]) {
          current[part] = { directory: {} };
        }
        current = current[part].directory;
      }
    }
  }

  return tree;
}

export function useWebContainer() {
  const [status, setStatus] = useState("idle"); // idle | booting | installing | running | ready | error
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  const wcRef = useRef(null);
  const serverProcessRef = useRef(null);
  const installProcessRef = useRef(null);

  const addLog = useCallback((text, type = "info") => {
    setLogs((prev) => [...prev, { text, type, ts: Date.now() }]);
  }, []);

  /**
   * Boot WebContainer (idempotent)
   */
  const boot = useCallback(async () => {
    if (wcRef.current) return wcRef.current;

    try {
      setStatus("booting");
      setError(null);
      addLog("⚡ Booting WebContainer...", "system");

      const wc = await getWebContainer();
      wcRef.current = wc;

      // Listen for server-ready events
      wc.on("server-ready", (port, url) => {
        addLog(`✅ Dev server ready on port ${port}`, "success");
        setPreviewUrl(url);
        setStatus("ready");
      });

      wc.on("error", (err) => {
        addLog(`❌ WebContainer error: ${err.message}`, "error");
        setError(err.message);
      });

      addLog("✅ WebContainer booted successfully", "success");
      return wc;
    } catch (err) {
      const msg = err.message || "Failed to boot WebContainer";
      addLog(`❌ Boot failed: ${msg}`, "error");
      setError(msg);
      setStatus("error");
      throw err;
    }
  }, [addLog]);

  /**
   * Mount files into the WebContainer
   */
  const mountFiles = useCallback(
    async (flatFiles) => {
      const wc = wcRef.current;
      if (!wc) throw new Error("WebContainer not booted");

      addLog("📁 Mounting project files...", "system");

      const tree = buildFileTree(flatFiles);
      await wc.mount(tree);

      const fileNames = Object.keys(flatFiles);
      addLog(`📁 Mounted ${fileNames.length} files: ${fileNames.join(", ")}`, "info");
    },
    [addLog]
  );

  /**
   * Write a single file
   */
  const writeFile = useCallback(
    async (path, content) => {
      const wc = wcRef.current;
      if (!wc) throw new Error("WebContainer not booted");

      await wc.fs.writeFile(path, content);
      addLog(`📝 Updated: ${path}`, "info");
    },
    [addLog]
  );

  /**
   * Install npm packages
   */
  const installDependencies = useCallback(async () => {
    const wc = wcRef.current;
    if (!wc) throw new Error("WebContainer not booted");

    try {
      const pkgStr = await wc.fs.readFile("package.json", "utf-8");
      const pkg = JSON.parse(pkgStr);
      if (!pkg.dependencies && !pkg.devDependencies) {
        addLog("⚡ No dependencies found, skipping npm install", "system");
        return 0; // Skip install successfully
      }
    } catch (e) {
      addLog("⚡ No valid package.json found, skipping npm install", "system");
      return 0;
    }

    setStatus("installing");
    addLog("📦 Installing dependencies (npm install)...", "system");

    const installProcess = await wc.spawn("npm", ["install"]);
    installProcessRef.current = installProcess;

    // Pipe output to logs
    installProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          // clean up ANSI, trim
          const clean = data.replace(/\x1b\[[0-9;]*m/g, "").trim();
          if (clean) addLog(clean, "npm");
        },
      })
    );

    const exitCode = await installProcess.exit;

    if (exitCode !== 0) {
      addLog(`❌ npm install failed with exit code ${exitCode}`, "error");
      setError(`npm install failed (exit code ${exitCode})`);
      setStatus("error");
      throw new Error(`npm install failed with exit code ${exitCode}`);
    }

    addLog("✅ Dependencies installed successfully", "success");
    return exitCode;
  }, [addLog]);

  /**
   * Start a dev server (npm run dev / npm start)
   */
  const startDevServer = useCallback(
    async (command = "dev") => {
      const wc = wcRef.current;
      if (!wc) throw new Error("WebContainer not booted");

      // Kill any existing server
      if (serverProcessRef.current) {
        serverProcessRef.current.kill();
        serverProcessRef.current = null;
        setPreviewUrl(null);
      }

      setStatus("running");
      addLog(`🚀 Starting dev server (npm run ${command})...`, "system");

      const serverProcess = await wc.spawn("npm", ["run", command]);
      serverProcessRef.current = serverProcess;

      // Pipe output to logs
      serverProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            const clean = data.replace(/\x1b\[[0-9;]*m/g, "").trim();
            if (clean) addLog(clean, "server");
          },
        })
      );

      // Monitor exit
      serverProcess.exit.then((code) => {
        if (code !== 0) {
          addLog(`⚠️ Dev server exited with code ${code}`, "warning");
        }
        serverProcessRef.current = null;
      });
    },
    [addLog]
  );

  /**
   * Run an arbitrary command in the WebContainer
   */
  const runCommand = useCallback(
    async (cmd, args = []) => {
      const wc = wcRef.current;
      if (!wc) throw new Error("WebContainer not booted");

      addLog(`▶ ${cmd} ${args.join(" ")}`, "system");

      const process = await wc.spawn(cmd, args);

      process.output.pipeTo(
        new WritableStream({
          write(data) {
            const clean = data.replace(/\x1b\[[0-9;]*m/g, "").trim();
            if (clean) addLog(clean, "cmd");
          },
        })
      );

      const exitCode = await process.exit;
      return exitCode;
    },
    [addLog]
  );

  /**
   * Full pipeline: mount → install → start
   */
  const setupProject = useCallback(
    async (flatFiles) => {
      try {
        await boot();
        await mountFiles(flatFiles);
        await installDependencies();
        await startDevServer();
      } catch (err) {
        console.error("WebContainer setup error:", err);
        setError(err.message);
        setStatus("error");
      }
    },
    [boot, mountFiles, installDependencies, startDevServer]
  );

  /**
   * Update files and restart server
   */
  const updateProject = useCallback(
    async (flatFiles) => {
      try {
        setStatus("installing");
        addLog("🔄 Updating project files...", "system");

        await mountFiles(flatFiles);
        await installDependencies();

        // Kill and restart server
        if (serverProcessRef.current) {
          serverProcessRef.current.kill();
          serverProcessRef.current = null;
        }

        setPreviewUrl(null);
        await startDevServer();
      } catch (err) {
        console.error("WebContainer update error:", err);
        setError(err.message);
        setStatus("error");
      }
    },
    [mountFiles, installDependencies, startDevServer, addLog]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (serverProcessRef.current) {
        serverProcessRef.current.kill();
      }
    };
  }, []);

  return {
    status,
    previewUrl,
    error,
    logs,
    boot,
    mountFiles,
    writeFile,
    installDependencies,
    startDevServer,
    runCommand,
    setupProject,
    updateProject,
    addLog,
  };
}
