"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useWebContainer } from "@/lib/webcontainer/useWebContainer";
import SandboxTerminal from "./SandboxTerminal";

/**
 * SandboxPreview — full WebContainer-powered sandbox environment
 * Mounts project files, installs deps, runs dev server, shows live preview.
 */
export default function SandboxPreview({
  files = {},           // { "path/to/file": "content" } flat map
  viewportMode = "desktop",
  onStatusChange,
}) {
  const {
    status,
    previewUrl,
    error,
    logs,
    setupProject,
    updateProject,
    addLog,
  } = useWebContainer();

  const [activePanel, setActivePanel] = useState("preview"); // preview | terminal
  const [hasSetup, setHasSetup] = useState(false);
  const prevFilesRef = useRef(null);
  const iframeRef = useRef(null);

  // Report status changes to parent
  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  // Set up the project when files first arrive
  useEffect(() => {
    if (!files || Object.keys(files).length === 0) return;
    if (hasSetup) return;

    const init = async () => {
      setHasSetup(true);
      prevFilesRef.current = files;
      await setupProject(files);
    };

    init();
  }, [files, hasSetup, setupProject]);

  // Update project when files change (after initial setup)
  useEffect(() => {
    if (!hasSetup) return;
    if (!files || Object.keys(files).length === 0) return;

    // Deep compare — only update if files actually changed
    const prev = prevFilesRef.current;
    if (prev && JSON.stringify(prev) === JSON.stringify(files)) return;

    prevFilesRef.current = files;
    updateProject(files);
  }, [files, hasSetup, updateProject]);

  // Auto-switch to terminal when installing, back to preview when ready
  useEffect(() => {
    if (status === "installing" || status === "booting") {
      setActivePanel("terminal");
    }
    if (status === "ready" && previewUrl) {
      setActivePanel("preview");
    }
  }, [status, previewUrl]);

  const handleRefresh = useCallback(() => {
    if (iframeRef.current && previewUrl) {
      iframeRef.current.src = previewUrl;
    }
  }, [previewUrl]);

  return (
    <div className="sandbox-container">
      {/* Sandbox Toolbar */}
      <div className="sandbox-toolbar">
        <div className="sandbox-toolbar-left">
          <button
            className={`sandbox-tab ${activePanel === "preview" ? "active" : ""}`}
            onClick={() => setActivePanel("preview")}
            id="sandbox-preview-tab"
          >
            <span className="sandbox-tab-icon">👁️</span>
            Preview
            {status === "ready" && (
              <span className="sandbox-tab-badge ready">●</span>
            )}
          </button>
          <button
            className={`sandbox-tab ${activePanel === "terminal" ? "active" : ""}`}
            onClick={() => setActivePanel("terminal")}
            id="sandbox-terminal-tab"
          >
            <span className="sandbox-tab-icon">⬛</span>
            Terminal
            {(status === "installing" || status === "booting") && (
              <span className="sandbox-tab-badge active">●</span>
            )}
          </button>
        </div>

        <div className="sandbox-toolbar-right">
          {activePanel === "preview" && (
            <>
              <button
                className="sandbox-action-btn"
                onClick={handleRefresh}
                disabled={!previewUrl}
                title="Refresh preview"
              >
                🔄
              </button>
              {previewUrl && (
                <a
                  className="sandbox-action-btn"
                  href={previewUrl}
                  target="_blank"
                  rel="opener"
                  title="Open in new tab"
                >
                  ↗
                </a>
              )}
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="sandbox-content">
        {activePanel === "preview" ? (
          previewUrl ? (
            <div className={`sandbox-preview-frame ${viewportMode}`}>
              <iframe
                ref={iframeRef}
                className="sandbox-iframe"
                src={previewUrl}
                title="Sandbox Preview"
                allow="cross-origin-isolated"
              />
            </div>
          ) : (
            <div className="sandbox-placeholder">
              <div className="sandbox-placeholder-icon">
                {status === "error" ? "⚠️" : status === "idle" ? "📦" : "⚙️"}
              </div>
              <p className="sandbox-placeholder-title">
                {status === "error"
                  ? "Sandbox Error"
                  : status === "idle"
                  ? "Waiting for code..."
                  : status === "booting"
                  ? "Booting sandbox environment..."
                  : status === "installing"
                  ? "Installing packages..."
                  : status === "running"
                  ? "Starting dev server..."
                  : "Preparing preview..."}
              </p>
              <p className="sandbox-placeholder-desc">
                {status === "error"
                  ? error || "Something went wrong"
                  : status === "idle"
                  ? "Generate a project to see it live here"
                  : "Switch to Terminal tab to see live progress"}
              </p>
              {(status === "booting" ||
                status === "installing" ||
                status === "running") && (
                <div className="sandbox-progress">
                  <div className="sandbox-progress-bar" />
                </div>
              )}
            </div>
          )
        ) : (
          <SandboxTerminal logs={logs} status={status} />
        )}
      </div>
    </div>
  );
}
