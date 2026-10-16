"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Folder,
  FileCode,
  FileText,
  File,
  ChevronRight,
  Plus,
  Trash2,
  Save,
  X,
  RefreshCw,
  FolderPlus,
  ArrowLeft,
  Check,
  AlertCircle,
} from "lucide-react";

interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  sizeBytes: number;
  permissions: string;
}

interface FileManagerProps {
  instanceId: string;
  botStatus: "ONLINE" | "OFFLINE";
}

export function FileManager({ instanceId, botStatus }: FileManagerProps) {
  const [currentPath, setCurrentPath] = useState<string>("/app");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Editor State
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // New File/Folder Modal
  const [showNewModal, setShowNewModal] = useState<"file" | "folder" | null>(null);
  const [newItemName, setNewItemName] = useState<string>("");

  const loadFiles = useCallback(async (dirPath: string) => {
    if (botStatus !== "ONLINE") {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch(`/api/instances/${instanceId}/files?path=${encodeURIComponent(dirPath)}`);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.files)) {
        // Sort: directories first, then alphabetical
        const sorted = data.files.sort((a: FileItem, b: FileItem) => {
          if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
          return a.isDirectory ? -1 : 1;
        });
        setFiles(sorted);
        setCurrentPath(dirPath);
      } else {
        setErrorMessage(data.error || "Gagal memuat berkas.");
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Gagal terhubung ke host.");
    } finally {
      setIsLoading(false);
    }
  }, [instanceId, botStatus]);

  useEffect(() => {
    loadFiles(currentPath);
  }, [loadFiles, currentPath]);

  const handleOpenFile = async (filePath: string) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch(`/api/instances/${instanceId}/files/content?path=${encodeURIComponent(filePath)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setEditingFile(filePath);
        setFileContent(data.content);
      } else {
        setErrorMessage(data.error || "Gagal membaca berkas.");
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Gagal membuka berkas.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFile = async () => {
    if (!editingFile) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch(`/api/instances/${instanceId}/files/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: editingFile, content: fileContent }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      } else {
        alert(data.error || "Gagal menyimpan berkas.");
      }
    } catch {
      alert("Gagal menyimpan berkas.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (targetPath: string) => {
    if (!confirm(`Hapus ${targetPath}?`)) return;
    try {
      const res = await fetch(`/api/instances/${instanceId}/files?path=${encodeURIComponent(targetPath)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadFiles(currentPath);
        if (editingFile === targetPath) {
          setEditingFile(null);
        }
      }
    } catch {
      alert("Gagal menghapus.");
    }
  };

  const handleCreateNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const targetPath = `${currentPath.replace(/\/$/, "")}/${newItemName.trim()}`;

    try {
      if (showNewModal === "file") {
        await fetch(`/api/instances/${instanceId}/files/content`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: targetPath, content: "" }),
        });
      } else {
        await fetch(`/api/instances/${instanceId}/files/directory`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: targetPath }),
        });
      }
      setShowNewModal(null);
      setNewItemName("");
      loadFiles(currentPath);
    } catch {
      alert("Gagal membuat berkas/folder baru.");
    }
  };

  const navigateUp = () => {
    if (currentPath === "/app") return;
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    const parent = "/" + parts.join("/");
    loadFiles(parent || "/app");
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileName: string, isDirectory: boolean) => {
    if (isDirectory) return <Folder className="w-4 h-4 text-amber-400" />;
    if (fileName.endsWith(".js") || fileName.endsWith(".ts") || fileName.endsWith(".py") || fileName.endsWith(".json")) {
      return <FileCode className="w-4 h-4 text-accent" />;
    }
    if (fileName.endsWith(".txt") || fileName.endsWith(".md") || fileName.endsWith(".env")) {
      return <FileText className="w-4 h-4 text-zinc-300" />;
    }
    return <File className="w-4 h-4 text-muted-foreground" />;
  };

  if (botStatus !== "ONLINE") {
    return (
      <div className="p-8 text-center bg-card border border-border rounded-xl space-y-2">
        <Folder className="w-8 h-8 text-zinc-600 mx-auto" />
        <h4 className="text-sm font-semibold text-foreground">File Manager Tidak Aktif</h4>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Nyalakan bot kamu untuk mengakses sistem berkas, mengedit config.json, atau mengunggah source code.
        </p>
      </div>
    );
  }

  // Active Code Editor View
  if (editingFile) {
    return (
      <div className="bg-card border border-border rounded-xl flex flex-col overflow-hidden">
        {/* Editor Toolbar */}
        <div className="px-4 py-2.5 bg-background border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditingFile(null)}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Kembali ke File List"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <FileCode className="w-4 h-4 text-accent" />
            <span className="font-mono text-xs font-semibold text-foreground">{editingFile}</span>
          </div>

          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="text-xs text-accent flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Tersimpan
              </span>
            )}
            <button
              onClick={handleSaveFile}
              disabled={isSaving}
              className="px-3 py-1.5 rounded-lg bg-accent text-black text-xs font-semibold hover:bg-emerald-400 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Menyimpan..." : "Simpan (Ctrl+S)"}</span>
            </button>
            <button
              onClick={() => setEditingFile(null)}
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Textarea Code Editor */}
        <div className="relative">
          <textarea
            value={fileContent}
            onChange={(e) => setFileContent(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                handleSaveFile();
              }
            }}
            spellCheck={false}
            className="w-full h-96 p-4 bg-[#050507] text-zinc-100 font-mono text-xs focus:outline-none resize-none leading-relaxed selection:bg-accent selection:text-black"
          />
        </div>
      </div>
    );
  }

  // File Explorer Table View
  const breadcrumbParts = currentPath.split("/").filter(Boolean);

  return (
    <div className="bg-card border border-border rounded-xl flex flex-col overflow-hidden">
      {/* Action & Path Bar */}
      <div className="px-4 py-3 bg-background border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground overflow-x-auto">
          <span
            onClick={() => loadFiles("/app")}
            className="hover:text-accent cursor-pointer text-foreground font-semibold"
          >
            /app
          </span>
          {breadcrumbParts.slice(1).map((part, index) => {
            const subPath = "/app/" + breadcrumbParts.slice(1, index + 2).join("/");
            return (
              <React.Fragment key={subPath}>
                <ChevronRight className="w-3 h-3 text-zinc-600 flex-shrink-0" />
                <span
                  onClick={() => loadFiles(subPath)}
                  className="hover:text-accent cursor-pointer text-foreground"
                >
                  {part}
                </span>
              </React.Fragment>
            );
          })}
        </div>

        {/* Toolbar Buttons */}
        <div className="flex items-center gap-2">
          {currentPath !== "/app" && (
            <button
              onClick={navigateUp}
              className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-foreground text-xs hover:bg-muted transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Naik</span>
            </button>
          )}
          <button
            onClick={() => loadFiles(currentPath)}
            className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground text-xs transition-colors"
            title="Muat Ulang"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setNewItemName("");
              setShowNewModal("folder");
            }}
            className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-foreground text-xs font-medium hover:bg-muted transition-colors flex items-center gap-1.5"
          >
            <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
            <span>Folder Baru</span>
          </button>
          <button
            onClick={() => {
              setNewItemName("");
              setShowNewModal("file");
            }}
            className="px-2.5 py-1.5 rounded-lg bg-accent text-black text-xs font-semibold hover:bg-emerald-400 transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Berkas Baru</span>
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="p-3 bg-rose-950/40 border-b border-rose-900/60 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* File List */}
      <div className="divide-y divide-border">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-accent" />
            <div>Membaca berkas container...</div>
          </div>
        ) : files.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            Direktori ini kosong.
          </div>
        ) : (
          files.map((file) => (
            <div
              key={file.path}
              className="px-4 py-2.5 flex items-center justify-between hover:bg-muted/50 transition-colors text-xs"
            >
              <div
                onClick={() => (file.isDirectory ? loadFiles(file.path) : handleOpenFile(file.path))}
                className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
              >
                {getFileIcon(file.name, file.isDirectory)}
                <span className="font-mono text-foreground hover:text-accent truncate font-medium">
                  {file.name}
                </span>
              </div>

              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="font-mono text-[11px] hidden sm:inline">
                  {file.isDirectory ? "Folder" : formatSize(file.sizeBytes)}
                </span>
                <span className="font-mono text-[11px] hidden md:inline text-zinc-500">
                  {file.permissions}
                </span>
                <button
                  onClick={() => handleDelete(file.path)}
                  className="p-1 hover:text-rose-400 transition-colors"
                  title="Hapus"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Buat File/Folder Baru */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-sm w-full p-5 shadow-xl relative">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-foreground">
                {showNewModal === "file" ? "Buat Berkas Baru" : "Buat Folder Baru"}
              </h4>
              <button
                onClick={() => setShowNewModal(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewItem} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Nama {showNewModal === "file" ? "Berkas (misal: config.json)" : "Folder"}
                </label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder={showNewModal === "file" ? "config.json" : "subfolder"}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-mono text-foreground focus:border-accent focus:outline-none"
                  required
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNewModal(null)}
                  className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs hover:text-foreground"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-accent text-black text-xs font-semibold hover:bg-emerald-400"
                >
                  Buat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
