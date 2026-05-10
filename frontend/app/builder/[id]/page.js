"use client";

import { useState, useEffect, useRef, useCallback, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SandboxPreview from "@/components/SandboxPreview";
import { htmlToProject, createViteReactProject, createNextJsProject } from "@/lib/webcontainer/projectBuilder";
import JSZip from "jszip";
import { saveAs } from "file-saver";

/* ── Helpers ──────────────────────────────────── */
function extractAllCodeBlocks(fullText) {
  const blocks = [];
  const regex = /```([\w./-]+)\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(fullText)) !== null) {
    blocks.push({ name: match[1].trim(), content: match[2].trim() });
  }
  return blocks;
}

function extractLiveCode(fullText) {
  // Finds the last matched block or incomplete block
  const match = fullText.match(/```([\w./-]+)\n([\s\S]*?)(?:```|$)/g);
  if (match && match.length > 0) {
    const last = match[match.length - 1];
    return last.replace(/```([\w./-]+)\n/, "").replace(/```$/, "").trim();
  }
  return null;
}

function splitCodeIntoFiles(fullText, techStack) {
  const blocks = extractAllCodeBlocks(fullText);
  if (techStack === "html") {
    // Legacy HTML single file fallback
    const htmlBlock = blocks.find(b => b.name === "html") || { content: fullText };
    const files = [{ name: "index.html", content: htmlBlock.content, type: "html" }];
    const styleMatch = htmlBlock.content.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    if (styleMatch) files.push({ name: "styles.css", content: styleMatch[1].trim(), type: "css" });
    const scriptMatch = htmlBlock.content.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
    if (scriptMatch) files.push({ name: "script.js", content: scriptMatch[1].trim(), type: "js" });
    return files;
  }
  
  // React / Next.js output
  return blocks.map(b => ({
    name: b.name.includes(".") ? b.name : b.name === "jsx" || b.name === "react" ? (techStack === "nextjs" ? "app/page.jsx" : "src/App.jsx") : "index.html",
    content: b.content,
    type: b.name.includes("css") ? "css" : b.name.includes("jsx") ? "js" : "html"
  }));
}

/* ── SSE Parser ──────────────────────────────── */
function createSSEParser(onEvent) {
  let buffer = "";
  return function push(text) {
    buffer += text;
    const parts = buffer.split("\n\n");
    buffer = parts.pop() || "";
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const dataLines = trimmed
        .split("\n")
        .filter((l) => l.startsWith("data: "))
        .map((l) => l.slice(6));
      if (dataLines.length === 0) continue;
      const dataStr = dataLines.join("");
      try {
        const data = JSON.parse(dataStr);
        onEvent(data);
      } catch {
        // skip
      }
    }
  };
}

/* ── Resume Upload Component ─────────────────── */
function ResumeUpload({ onSubmit, isGenerating }) {
  const [file, setFile] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [techStack, setTechStack] = useState("html");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState(null);
  const [previewText, setPreviewText] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = async (selectedFile) => {
    setFile(selectedFile);
    setParseError(null);
    setPreviewText(null);

    // Auto-parse file to show preview
    setParsing(true);
    try {
      const formData = new FormData();
      formData.append("resume", selectedFile);

      const res = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPreviewText(data.text);
    } catch (err) {
      setParseError(err.message);
      setFile(null);
    } finally {
      setParsing(false);
    }
  };

  const handleInputChange = (e) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const handleGenerate = () => {
    if (previewText) {
      onSubmit({ resumeText: previewText, theme, techStack, fileName: file?.name });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <div className="resume-form-container">
      <div className="resume-form-wrapper" style={{ maxWidth: 640 }}>
        {/* Header */}
        <div className="resume-form-header">
          <h1 className="resume-form-title">
            <span className="resume-form-title-icon">✦</span>
            Build Your Portfolio
          </h1>
          <p className="resume-form-subtitle">
            Upload your resume and let AI craft a stunning portfolio website in seconds.
          </p>
        </div>

        <div className="resume-form-body" style={{ maxHeight: "65vh" }}>
          {/* Upload Area */}
          <div
            className={`upload-dropzone ${dragActive ? "drag-active" : ""} ${file && previewText ? "has-file" : ""}`}
            onClick={() => !file && fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            id="upload-dropzone"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              onChange={handleInputChange}
              style={{ display: "none" }}
              id="resume-file-input"
            />

            {parsing ? (
              <div className="upload-status">
                <div className="upload-spinner" />
                <p className="upload-status-text">Parsing your resume...</p>
              </div>
            ) : file && previewText ? (
              <div className="upload-success">
                <div className="upload-success-icon">✓</div>
                <div className="upload-file-info">
                  <span className="upload-file-name">{file.name}</span>
                  <span className="upload-file-meta">
                    {formatFileSize(file.size)} • {previewText.length.toLocaleString()} characters extracted
                  </span>
                </div>
                <button
                  className="upload-change-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setPreviewText(null);
                    fileInputRef.current.value = "";
                  }}
                  type="button"
                >
                  Change file
                </button>
              </div>
            ) : (
              <>
                <div className="upload-icon">📄</div>
                <p className="upload-text">
                  <span className="upload-text-accent">Click to upload</span> or drag & drop your resume
                </p>
                <p className="upload-hint">PDF, DOCX, TXT, or MD — Max 10 MB</p>
              </>
            )}
          </div>

          {parseError && (
            <div className="error-message" style={{ marginTop: 12 }}>⚠ {parseError}</div>
          )}

          {/* Extracted Text Preview */}
          {previewText && (
            <div className="resume-preview">
              <div className="resume-preview-header">
                <span className="resume-preview-label">📋 Extracted Content</span>
                <span className="resume-preview-count">{previewText.length.toLocaleString()} chars</span>
              </div>
              <pre className="resume-preview-text">{previewText.slice(0, 1500)}{previewText.length > 1500 ? "\n\n... (more content)" : ""}</pre>
            </div>
          )}

          {/* Theme Selector */}
          <div className="form-group" style={{ marginTop: 20 }}>
            <label className="form-label">Theme Preference</label>
            <div className="theme-selector">
              {[
                { value: "dark", label: "🌙 Dark", desc: "Sleek & modern" },
                { value: "light", label: "☀️ Light", desc: "Clean & minimal" },
                { value: "vibrant", label: "🎨 Vibrant", desc: "Bold & creative" },
              ].map((t) => (
                <button
                  key={t.value}
                  className={`theme-option ${theme === t.value ? "active" : ""}`}
                  onClick={() => setTheme(t.value)}
                  type="button"
                >
                  <span className="theme-option-label">{t.label}</span>
                  <span className="theme-option-desc">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tech Stack Selector */}
          <div className="form-group" style={{ marginTop: 20 }}>
            <label className="form-label">Tech Stack</label>
            <div className="theme-selector">
              {[
                { value: "html", label: "📄 HTML/JS", desc: "Plain & fast" },
                { value: "react", label: "⚛️ React", desc: "Vite + React" },
                { value: "nextjs", label: "▲ Next.js", desc: "App Router" },
              ].map((t) => (
                <button
                  key={t.value}
                  className={`theme-option ${techStack === t.value ? "active" : ""}`}
                  onClick={() => setTechStack(t.value)}
                  type="button"
                >
                  <span className="theme-option-label">{t.label}</span>
                  <span className="theme-option-desc">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="resume-form-actions">
          <div style={{ flex: 1 }} />
          <button
            className="form-btn-generate"
            onClick={handleGenerate}
            disabled={isGenerating || !previewText}
            type="button"
            id="generate-portfolio-btn"
          >
            {isGenerating ? (
              <>
                <span className="btn-spinner" />
                Generating...
              </>
            ) : (
              <>✦ Generate Portfolio</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Builder Component ──────────────────── */
export default function BuilderPage({ params }) {
  const resolvedParams = use(params);
  const conversationId = resolvedParams.id;
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialPrompt = searchParams.get("prompt");

  // Route protection
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  // State
  const [phase, setPhase] = useState("upload"); // upload | workspace
  const [messages, setMessages] = useState([]);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [activeView, setActiveView] = useState("preview");
  const [viewportMode, setViewportMode] = useState("desktop");
  const [activeFile, setActiveFile] = useState("index.html");
  const [files, setFiles] = useState([]);
  const [showChat, setShowChat] = useState(true);
  const [showFiles, setShowFiles] = useState(true);
  const [error, setError] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [resumeInfo, setResumeInfo] = useState(null);
  const [techStackConfig, setTechStackConfig] = useState("html");
  const [sandboxFiles, setSandboxFiles] = useState(null);
  const [sandboxStatus, setSandboxStatus] = useState("idle");

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const hasInitiated = useRef(false);
  const streamCodeRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, scrollToBottom]);

  const handleTextareaResize = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, []);

  // Generate portfolio via streaming API
  const generatePortfolio = useCallback(
    async ({ resumeText = null, resumeData = null, editPrompt = null, existingCode = null, theme = "dark", techStack = "html" } = {}) => {
      setIsGenerating(true);
      setStreamingText("");
      setError(null);
      setLoadingStatus("Connecting to Gemini AI...");
      streamCodeRef.current = null;
      setActiveView("code");
      setActiveFile("index.html");

      try {
        const body = { conversationId };
        if (resumeText) body.resumeText = resumeText;
        if (resumeData) body.resumeData = resumeData;
        if (editPrompt) body.prompt = editPrompt;
        if (existingCode) body.currentCode = existingCode;
        if (theme) body.theme = theme;
        if (techStack) body.techStack = techStack;

        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`API error ${response.status}: ${errText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";

        const parser = createSSEParser((eventData) => {
          switch (eventData.type) {
            case "status":
              setLoadingStatus(
                eventData.status === "generating"
                  ? "✦ Gemini is crafting your portfolio..."
                  : eventData.status
              );
              break;

            case "chunk":
              fullResponse += eventData.content;
              setStreamingText(fullResponse);
              const liveCode = extractLiveCode(fullResponse);
              if (liveCode) {
                streamCodeRef.current = liveCode;
              }
              setLoadingStatus("✦ Streaming portfolio code...");
              break;

            case "complete":
              if (eventData.code) {
                setGeneratedCode(eventData.code);
                const fileList = splitCodeIntoFiles(eventData.code, techStack);

                const fileMap = {};
                fileList.forEach((f) => { fileMap[f.name] = f.content; });

                let projectFiles;
                if (techStack === "react") projectFiles = createViteReactProject(fileMap);
                else if (techStack === "nextjs") projectFiles = createNextJsProject(fileMap);
                else projectFiles = htmlToProject(eventData.code);

                if (projectFiles) {
                  setSandboxFiles(projectFiles);
                  const fullFileList = Object.entries(projectFiles).map(([name, content]) => {
                    let type = "html";
                    if (name.endsWith(".js") || name.endsWith(".jsx")) type = "js";
                    else if (name.endsWith(".css")) type = "css";
                    else if (name.endsWith(".json")) type = "json";
                    return { name, content, type };
                  });
                  setFiles(fullFileList);
                }
                setActiveView("preview");
              }
              setMessages((prev) => [
                ...prev,
                {
                  role: "assistant",
                  content: eventData.description || "Here's your generated portfolio!",
                },
              ]);
              break;

            case "error":
              setError(eventData.error);
              break;
          }
        });

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          parser(text);
        }

        if (!generatedCode && fullResponse) {
          const blocks = extractAllCodeBlocks(fullResponse);
          if (blocks.length > 0) {
            setGeneratedCode(fullResponse);
            const fileList = splitCodeIntoFiles(fullResponse, techStack);
            const fileMap = {};
            fileList.forEach((f) => { fileMap[f.name] = f.content; });

            let projectFiles;
            if (techStack === "react") projectFiles = createViteReactProject(fileMap);
            else if (techStack === "nextjs") projectFiles = createNextJsProject(fileMap);
            else projectFiles = htmlToProject(fullResponse);

            if (projectFiles) {
              setSandboxFiles(projectFiles);
              const fullFileList = Object.entries(projectFiles).map(([name, content]) => {
                let type = "html";
                if (name.endsWith(".js") || name.endsWith(".jsx")) type = "js";
                else if (name.endsWith(".css")) type = "css";
                else if (name.endsWith(".json")) type = "json";
                return { name, content, type };
              });
              setFiles(fullFileList);
            }
            setActiveView("preview");
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: "Here's your portfolio website!" },
            ]);
          }
        }
      } catch (err) {
        console.error("Generation error:", err);
        setError(err.message);
      } finally {
        setIsGenerating(false);
        setStreamingText("");
        setLoadingStatus("");
        streamCodeRef.current = null;
      }
    },
    [conversationId, generatedCode]
  );

  // Handle resume upload submission
  const handleResumeUpload = async ({ resumeText, theme, techStack, fileName }) => {
    setResumeInfo({ fileName, theme });
    setTechStackConfig(techStack);
    setPhase("workspace");
    setMessages([
      { role: "user", content: `Generate a ${theme} ${techStack} portfolio from my resume (${fileName})` },
    ]);
    await generatePortfolio({ resumeText, theme, techStack });
  };

  // Handle initial prompt (query param)
  useEffect(() => {
    if (initialPrompt && !hasInitiated.current) {
      hasInitiated.current = true;
      setPhase("workspace");
      setMessages([{ role: "user", content: initialPrompt }]);
      generatePortfolio({ editPrompt: initialPrompt });
    }
  }, [initialPrompt, generatePortfolio]);

  // Handle send message (edit flow)
  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isGenerating) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInputValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    await generatePortfolio({ editPrompt: trimmed, existingCode: generatedCode, techStack: techStackConfig });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getActiveFileContent = () => {
    if (isGenerating && streamingText) return streamingText;
    const file = files.find((f) => f.name === activeFile);
    return file?.content || "";
  };

  const downloadProjectZip = async () => {
    if (!sandboxFiles) return;
    try {
      const zip = new JSZip();
      for (const [path, content] of Object.entries(sandboxFiles)) {
        zip.file(path, content);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, "portfolio-project.zip");
    } catch (err) {
      console.error("Failed to generate zip:", err);
    }
  };

  /* ── RENDER: Upload Phase ───────────────────── */
  if (phase === "upload") {
    return <ResumeUpload onSubmit={handleResumeUpload} isGenerating={isGenerating} />;
  }

  /* ── RENDER: Workspace Phase ────────────────── */
  return (
    <div className="builder-layout">
      {/* Mobile chat toggle */}
      <button
        className="mobile-chat-toggle"
        onClick={() => setShowChat(!showChat)}
        aria-label="Toggle chat"
        id="mobile-chat-toggle"
      >
        💬
      </button>

      {/* Chat Panel */}
      <aside className={`chat-panel ${showChat ? "open" : ""}`}>
        <div className="chat-header">
          <div className="chat-header-left">
            <button
              className="chat-back-btn"
              onClick={() => router.push("/")}
              aria-label="Back to home"
              id="back-btn"
            >
              ←
            </button>
            <div>
              <div className="chat-header-title">PortfolioCraft AI</div>
              <div className="chat-header-subtitle">
                {isGenerating ? "Generating..." : sandboxStatus === "installing" ? "Installing..." : sandboxStatus === "ready" ? "Sandbox Ready" : "Ready"}
              </div>
            </div>
          </div>
        </div>

        <button
          className="new-chat-btn"
          onClick={() => router.push("/")}
          id="new-chat-btn"
        >
          ✦ New Portfolio
        </button>

        {/* Messages */}
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.role}`}>
              <div className={`chat-message-avatar ${msg.role}`}>
                {msg.role === "user" ? "U" : "✦"}
              </div>
              <div className="chat-message-content">{msg.content}</div>
            </div>
          ))}

          {isGenerating && (
            <div className="chat-message assistant">
              <div className="chat-message-avatar assistant">✦</div>
              <div className="chat-message-content">
                {streamingText ? (
                  <div className="stream-chat-content">
                    <div className="streaming-indicator" style={{ marginBottom: 8 }}>
                      <span className="streaming-dot" />
                      {loadingStatus || "Generating..."}
                    </div>
                    <div className="stream-stats">
                      {streamingText.length.toLocaleString()} characters generated
                    </div>
                  </div>
                ) : (
                  <div className="streaming-indicator">
                    <span className="streaming-dot" />
                    {loadingStatus || "Starting up..."}
                  </div>
                )}
              </div>
            </div>
          )}

          {error && <div className="error-message">⚠ {error}</div>}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="chat-input-container">
          <div className="chat-input-box">
            <textarea
              ref={textareaRef}
              className="chat-textarea"
              placeholder={
                generatedCode
                  ? "Describe changes to your portfolio..."
                  : "Describe your dream portfolio..."
              }
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                handleTextareaResize();
              }}
              onKeyDown={handleKeyDown}
              disabled={isGenerating}
              rows={1}
              id="chat-input"
            />
            <button
              className="chat-send-btn"
              onClick={handleSend}
              disabled={!inputValue.trim() || isGenerating}
              aria-label="Send"
              id="send-btn"
            >
              ↑
            </button>
          </div>
        </div>
      </aside>

      {/* Workspace */}
      <div className="workspace">
        <div className="toolbar">
          <div className="toolbar-left">
            {isGenerating && (
              <div className="streaming-indicator">
                <span className="streaming-dot" />
                {loadingStatus || "Generating"}
              </div>
            )}
            {!isGenerating && sandboxStatus !== "idle" && (
              <div className="sandbox-status-indicator">
                <span
                  className="sandbox-status-circle"
                  style={{
                    background:
                      sandboxStatus === "ready"
                        ? "var(--accent-emerald)"
                        : sandboxStatus === "error"
                        ? "#ef4444"
                        : "var(--accent-violet)",
                  }}
                />
                <span style={{ fontSize: "0.78rem", color: "var(--text-tertiary)" }}>
                  {sandboxStatus === "ready"
                    ? "Sandbox Ready"
                    : sandboxStatus === "installing"
                    ? "Installing..."
                    : sandboxStatus === "booting"
                    ? "Booting..."
                    : sandboxStatus === "running"
                    ? "Starting..."
                    : sandboxStatus === "error"
                    ? "Sandbox Error"
                    : resumeInfo
                    ? `From: ${resumeInfo.fileName}`
                    : ""}
                </span>
              </div>
            )}
          </div>

          <div className="toolbar-center">
            <button
              className={`toolbar-tab ${activeView === "preview" ? "active" : ""}`}
              onClick={() => setActiveView("preview")}
              id="preview-tab"
            >
              👁️ Preview
            </button>
            <button
              className={`toolbar-tab ${activeView === "code" ? "active" : ""}`}
              onClick={() => setActiveView("code")}
              id="code-tab"
            >
              📄 Code
            </button>
          </div>

          <div className="toolbar-right">
            {activeView === "preview" && (
              <>
                <button
                  className={`toolbar-btn ${viewportMode === "desktop" ? "active" : ""}`}
                  onClick={() => setViewportMode("desktop")}
                  id="viewport-desktop"
                >
                  🖥️
                </button>
                <button
                  className={`toolbar-btn ${viewportMode === "tablet" ? "active" : ""}`}
                  onClick={() => setViewportMode("tablet")}
                  id="viewport-tablet"
                >
                  📱
                </button>
                <button
                  className={`toolbar-btn ${viewportMode === "mobile" ? "active" : ""}`}
                  onClick={() => setViewportMode("mobile")}
                  id="viewport-mobile"
                >
                  📲
                </button>
              </>
            )}
            <button
              className="toolbar-btn"
              onClick={downloadProjectZip}
              id="download-zip"
              title="Download Project"
            >
              ⬇️
            </button>
            <button
              className="toolbar-btn"
              onClick={() => setShowFiles(!showFiles)}
              id="toggle-files"
            >
              📂 Files
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="preview-container">
          {activeView === "preview" ? (
            <SandboxPreview
              files={sandboxFiles}
              viewportMode={viewportMode}
              onStatusChange={setSandboxStatus}
            />
          ) : (
            <div className="code-view-container">
              {isGenerating && streamingText ? (
                <div className="streaming-code-wrapper">
                  <div className="streaming-code-header">
                    <div className="streaming-indicator">
                      <span className="streaming-dot" />
                      Live streaming from Gemini AI
                    </div>
                    <span className="streaming-char-count">
                      {streamingText.length.toLocaleString()} chars
                    </span>
                  </div>
                  <pre className="code-block streaming-code">
                    {streamingText.split("\n").map((line, i) => (
                      <span key={i} className="code-line">
                        <span className="code-line-number">{i + 1}</span>
                        {line}
                        {"\n"}
                      </span>
                    ))}
                  </pre>
                </div>
              ) : (
                <pre className="code-block">
                  {getActiveFileContent()
                    .split("\n")
                    .map((line, i) => (
                      <span key={i} className="code-line">
                        <span className="code-line-number">{i + 1}</span>
                        {line}
                        {"\n"}
                      </span>
                    ))}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>

      {/* File Explorer */}
      {showFiles && files.length > 0 && (
        <aside className="file-explorer">
          <div className="file-explorer-header">
            <span className="file-explorer-title">Files</span>
            <button
              className="chat-back-btn"
              onClick={() => setShowFiles(false)}
              aria-label="Close file explorer"
            >
              ✕
            </button>
          </div>
          <div className="file-explorer-content">
            {files.map((file) => (
              <div
                key={file.name}
                className={`file-item ${activeFile === file.name ? "active" : ""}`}
                onClick={() => {
                  setActiveFile(file.name);
                  setActiveView("code");
                }}
                id={`file-${file.name}`}
              >
                <span className="file-item-icon">
                  {file.type === "html" ? "🌐" : file.type === "css" ? "🎨" : "⚡"}
                </span>
                <span className="file-item-name">{file.name}</span>
              </div>
            ))}
          </div>

          {activeView === "code" && !isGenerating && (
            <div className="code-viewer">
              <pre
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.72rem",
                  lineHeight: 1.7,
                  color: "var(--text-tertiary)",
                }}
              >
                {getActiveFileContent().slice(0, 2000)}
                {getActiveFileContent().length > 2000 && "\n\n... (truncated)"}
              </pre>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}
