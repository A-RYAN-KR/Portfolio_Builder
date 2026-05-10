"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * A styled terminal log viewer that displays sandbox output.
 * Uses a simple div-based renderer for reliability (no xterm dependency issues).
 */
export default function SandboxTerminal({ logs = [], status = "idle" }) {
  const containerRef = useRef(null);
  const autoScrollRef = useRef(true);

  // Auto-scroll to bottom when new logs come in
  useEffect(() => {
    if (containerRef.current && autoScrollRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  // Handle scroll to toggle auto-scroll
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    autoScrollRef.current = isAtBottom;
  }, []);

  const getLogColor = (type) => {
    switch (type) {
      case "system":
        return "var(--accent-cyan)";
      case "success":
        return "var(--accent-emerald)";
      case "error":
        return "#ef4444";
      case "warning":
        return "#f59e0b";
      case "npm":
        return "var(--accent-violet)";
      case "server":
        return "var(--accent-teal)";
      case "cmd":
        return "var(--text-secondary)";
      default:
        return "var(--text-tertiary)";
    }
  };

  const statusConfig = {
    idle: { icon: "●", color: "var(--text-muted)", label: "Idle" },
    booting: { icon: "◉", color: "var(--accent-cyan)", label: "Booting..." },
    installing: { icon: "◉", color: "var(--accent-violet)", label: "Installing..." },
    running: { icon: "◉", color: "#f59e0b", label: "Starting..." },
    ready: { icon: "●", color: "var(--accent-emerald)", label: "Ready" },
    error: { icon: "●", color: "#ef4444", label: "Error" },
  };

  const s = statusConfig[status] || statusConfig.idle;

  return (
    <div className="sandbox-terminal">
      {/* Terminal Header */}
      <div className="sandbox-terminal-header">
        <div className="sandbox-terminal-header-left">
          <div className="sandbox-terminal-dots">
            <span className="sandbox-dot red" />
            <span className="sandbox-dot yellow" />
            <span className="sandbox-dot green" />
          </div>
          <span className="sandbox-terminal-title">Terminal</span>
        </div>
        <div className="sandbox-terminal-status">
          <span
            className="sandbox-status-dot"
            style={{ color: s.color }}
          >
            {s.icon}
          </span>
          <span style={{ color: s.color }}>{s.label}</span>
        </div>
      </div>

      {/* Terminal Body */}
      <div
        ref={containerRef}
        className="sandbox-terminal-body"
        onScroll={handleScroll}
      >
        {logs.length === 0 ? (
          <div className="sandbox-terminal-empty">
            <span style={{ opacity: 0.4 }}>
              Waiting for sandbox to start...
            </span>
          </div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="sandbox-terminal-line">
              <span
                className="sandbox-terminal-prefix"
                style={{ color: getLogColor(log.type) }}
              >
                {log.type === "system"
                  ? "→"
                  : log.type === "error"
                  ? "✕"
                  : log.type === "success"
                  ? "✓"
                  : log.type === "npm"
                  ? "◆"
                  : log.type === "server"
                  ? "▸"
                  : "│"}
              </span>
              <span
                className="sandbox-terminal-text"
                style={{ color: getLogColor(log.type) }}
              >
                {log.text}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
