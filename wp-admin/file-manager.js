// Omor Project Hub - File Manager & Code Editor
(function() {
  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  const FileManager = {
    currentPath: "",
    currentFile: null, // { path, sha, content, originalContent }
    items: [],

    init() {
      this.bindEvents();
    },

    async loadDirectory(path = "") {
      this.currentPath = path.replace(/^\/+|\/+$/g, "");
      this.renderBreadcrumbs();

      const listContainer = document.getElementById("fileListContainer");
      if (listContainer) {
        listContainer.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--admin-muted);">Loading repository contents...</div>`;
      }

      try {
        const contents = await window.GitHubApi.getContents(this.currentPath);
        if (Array.isArray(contents)) {
          // Sort folders first, then files
          this.items = contents.sort((a, b) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === "dir" ? -1 : 1;
          });
          this.renderFileList();
        } else {
          // It's a single file
          this.openEditor(contents.path);
        }
      } catch (err) {
        console.error("Failed to load directory", err);
        if (listContainer) {
          listContainer.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--admin-red);">Failed to load '${path}': ${escapeHtml(err.message)}</div>`;
        }
        window.DashboardManager.showToast(`Error reading directory: ${err.message}`, "error");
      }
    },

    renderBreadcrumbs() {
      const container = document.getElementById("fileBreadcrumbs");
      if (!container) return;

      const parts = this.currentPath ? this.currentPath.split("/") : [];
      let html = `<span class="breadcrumb-crumb" onclick="window.FileManager.loadDirectory('')">root</span>`;

      let accum = "";
      parts.forEach((p, idx) => {
        accum += (accum ? "/" : "") + p;
        const isLast = idx === parts.length - 1;
        html += ` <span style="color: var(--admin-dim);">/</span> `;
        if (isLast) {
          html += `<span style="color: var(--admin-text); font-weight: 700;">${escapeHtml(p)}</span>`;
        } else {
          const pathArg = accum;
          html += `<span class="breadcrumb-crumb" onclick="window.FileManager.loadDirectory('${escapeHtml(pathArg)}')">${escapeHtml(p)}</span>`;
        }
      });

      container.innerHTML = html;
    },

    renderFileList() {
      const listContainer = document.getElementById("fileListContainer");
      if (!listContainer) return;

      if (this.items.length === 0) {
        listContainer.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--admin-muted);">This folder is empty.</div>`;
        return;
      }

      let html = "";

      // Back to parent link if inside a subfolder
      if (this.currentPath) {
        const parent = this.currentPath.includes("/") ? this.currentPath.substring(0, this.currentPath.lastIndexOf("/")) : "";
        html += `
          <div class="file-row" onclick="window.FileManager.loadDirectory('${escapeHtml(parent)}')">
            <div class="file-info-col">
              <span style="font-size: 1.2rem;">📁</span>
              <span class="file-name" style="color: var(--admin-cyan);">.. (Parent Directory)</span>
            </div>
            <div class="file-actions-col"></div>
          </div>
        `;
      }

      this.items.forEach(item => {
        const isDir = item.type === "dir";
        const icon = isDir ? "📁" : this.getFileIcon(item.name);
        const sizeStr = isDir ? "" : formatBytes(item.size || 0);

        html += `
          <div class="file-row">
            <div class="file-info-col" onclick="${isDir ? `window.FileManager.loadDirectory('${escapeHtml(item.path)}')` : `window.FileManager.openEditor('${escapeHtml(item.path)}')`}">
              <span style="font-size: 1.2rem;">${icon}</span>
              <span class="file-name">${escapeHtml(item.name)}</span>
              ${sizeStr ? `<span style="font-size: 0.78rem; color: var(--admin-dim); margin-left: 0.5rem;">(${sizeStr})</span>` : ""}
            </div>
            <div class="file-actions-col">
              ${!isDir ? `
                <button class="btn btn-secondary btn-sm" onclick="window.FileManager.openEditor('${escapeHtml(item.path)}')" title="Edit File">
                  ✏️ Edit
                </button>
                <button class="btn btn-secondary btn-sm" onclick="window.FileManager.copyPublicUrl('${escapeHtml(item.path)}')" title="Copy Public URL">
                  🔗 Link
                </button>
                <button class="btn btn-secondary btn-sm" style="color: var(--admin-red);" onclick="window.FileManager.confirmDelete('${escapeHtml(item.path)}', '${escapeHtml(item.sha)}')" title="Delete File">
                  🗑️
                </button>
              ` : `
                <button class="btn btn-secondary btn-sm" onclick="window.FileManager.loadDirectory('${escapeHtml(item.path)}')">
                  Open ➔
                </button>
              `}
            </div>
          </div>
        `;
      });

      listContainer.innerHTML = html;
    },

    getFileIcon(name) {
      const ext = name.split(".").pop().toLowerCase();
      if (["html", "htm"].includes(ext)) return "🌐";
      if (["css"].includes(ext)) return "🎨";
      if (["js", "mjs"].includes(ext)) return "📜";
      if (["json"].includes(ext)) return "📦";
      if (["png", "jpg", "jpeg", "svg", "webp", "gif"].includes(ext)) return "🖼️";
      if (["md", "markdown", "txt"].includes(ext)) return "📝";
      return "📄";
    },

    async openEditor(path) {
      try {
        window.DashboardManager.showToast("Opening file for editing...", "info");
        const fileData = await window.GitHubApi.readFileText(path);
        this.currentFile = {
          path: fileData.path,
          sha: fileData.sha,
          content: fileData.content,
          originalContent: fileData.content
        };

        // Switch to editor tab
        window.DashboardManager.switchTab("editorTab");

        // Fill editor UI
        const pathDisplay = document.getElementById("editorCurrentPath");
        const textarea = document.getElementById("editorContentTextarea");
        const commitMsg = document.getElementById("editorCommitMessage");
        const statusBadge = document.getElementById("editorStatusBadge");

        if (pathDisplay) pathDisplay.textContent = fileData.path;
        if (textarea) textarea.value = fileData.content;
        if (commitMsg) commitMsg.value = `Update ${fileData.name}`;
        if (statusBadge) {
          statusBadge.textContent = "Saved";
          statusBadge.style.color = "var(--admin-green)";
        }
      } catch (err) {
        console.error("Failed to open file", err);
        window.DashboardManager.showToast(`Failed to open: ${err.message}`, "error");
      }
    },

    async saveCurrentFile() {
      if (!this.currentFile) {
        window.DashboardManager.showToast("No active file to save.", "error");
        return;
      }

      const textarea = document.getElementById("editorContentTextarea");
      const commitMsgInput = document.getElementById("editorCommitMessage");
      const saveBtn = document.getElementById("editorSaveBtn");

      const newContent = textarea.value;
      const message = (commitMsgInput ? commitMsgInput.value.trim() : "") || `Update ${this.currentFile.path} via Omor Admin CMS`;

      saveBtn.disabled = true;
      saveBtn.textContent = "Committing to GitHub...";

      try {
        const result = await window.GitHubApi.saveFile(
          this.currentFile.path,
          newContent,
          message,
          this.currentFile.sha
        );

        this.currentFile.sha = result.content ? result.content.sha : null;
        this.currentFile.content = newContent;
        this.currentFile.originalContent = newContent;

        const statusBadge = document.getElementById("editorStatusBadge");
        if (statusBadge) {
          statusBadge.textContent = "Saved & Committed";
          statusBadge.style.color = "var(--admin-green)";
        }

        window.DashboardManager.showToast(`Committed ${this.currentFile.path} successfully!`, "success");
      } catch (err) {
        console.error("Save failed", err);
        if (err.status === 409) {
          alert(`Conflict error (HTTP 409): The file '${this.currentFile.path}' has been modified on GitHub since you opened it. Please refresh and merge changes to prevent overwriting.`);
        } else {
          window.DashboardManager.showToast(`Save failed: ${err.message}`, "error");
        }
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = "Save & Commit";
      }
    },

    async confirmDelete(path, sha) {
      // Critical file protection
      const critical = ["CNAME", "index.html", ".nojekyll", "projects.json", "site-config.json"];
      if (critical.includes(path)) {
        const second = confirm(`⚠️ WARNING: '${path}' is a CRITICAL configuration file for GitHub Pages! Deleting it could break the website. Are you absolutely certain you want to proceed?`);
        if (!second) return;
      } else {
        const ok = confirm(`Are you sure you want to delete '${path}' from the repository?`);
        if (!ok) return;
      }

      const commitMsg = prompt(`Commit message for deleting '${path}':`, `Delete ${path} via Omor Admin CMS`);
      if (!commitMsg) return;

      try {
        window.DashboardManager.showToast("Deleting file...", "info");
        await window.GitHubApi.deleteFile(path, sha, commitMsg);
        window.DashboardManager.showToast(`Deleted '${path}' successfully.`, "success");
        await this.loadDirectory(this.currentPath);
      } catch (err) {
        console.error("Delete failed", err);
        window.DashboardManager.showToast(`Delete failed: ${err.message}`, "error");
      }
    },

    copyPublicUrl(path) {
      const url = window.DashboardManager.computePublicUrl(path);
      navigator.clipboard.writeText(url).then(() => {
        window.DashboardManager.showToast(`Copied: ${url}`, "success");
      }).catch(() => {
        prompt("Copy Public URL:", url);
      });
    },

    bindEvents() {
      // Create new file button
      const newFileBtn = document.getElementById("createNewFileBtn");
      if (newFileBtn) {
        newFileBtn.addEventListener("click", () => this.promptCreateFile());
      }

      // Create new folder button
      const newFolderBtn = document.getElementById("createNewFolderBtn");
      if (newFolderBtn) {
        newFolderBtn.addEventListener("click", () => this.promptCreateFolder());
      }

      // Save editor button
      const saveBtn = document.getElementById("editorSaveBtn");
      if (saveBtn) {
        saveBtn.addEventListener("click", () => this.saveCurrentFile());
      }

      // Unsaved changes detector
      const textarea = document.getElementById("editorContentTextarea");
      if (textarea) {
        textarea.addEventListener("input", () => {
          const statusBadge = document.getElementById("editorStatusBadge");
          if (!statusBadge) return;
          if (this.currentFile && textarea.value !== this.currentFile.originalContent) {
            statusBadge.textContent = "Unsaved changes*";
            statusBadge.style.color = "var(--admin-yellow)";
          } else {
            statusBadge.textContent = "Saved";
            statusBadge.style.color = "var(--admin-green)";
          }
        });
      }

      // Upload binary form
      const uploadForm = document.getElementById("uploadFileForm");
      if (uploadForm) {
        uploadForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          await this.handleFileUpload();
        });
      }
    },

    async promptCreateFile() {
      const defaultPath = this.currentPath ? `${this.currentPath}/new-file.html` : "new-file.html";
      const filePath = prompt("Enter new file path (e.g. 'landingpage/my-app.html' or 'notes.txt'):", defaultPath);
      if (!filePath) return;

      const cleanPath = filePath.trim().replace(/^\/+/, "");
      const commitMsg = prompt("Enter commit message:", `Create ${cleanPath}`);
      if (!commitMsg) return;

      try {
        window.DashboardManager.showToast(`Creating '${cleanPath}'...`, "info");
        await window.GitHubApi.saveFile(cleanPath, "", commitMsg);
        window.DashboardManager.showToast(`File '${cleanPath}' created!`, "success");
        await this.loadDirectory(this.currentPath);
        this.openEditor(cleanPath);
      } catch (err) {
        console.error("Create file failed", err);
        window.DashboardManager.showToast(`Failed: ${err.message}`, "error");
      }
    },

    async promptCreateFolder() {
      const folderName = prompt("Enter folder name (e.g. 'projects/awesome-tool'):");
      if (!folderName) return;

      const clean = folderName.trim().replace(/^\/+|\/+$/g, "");
      const placeholderPath = `${clean}/.gitkeep`;

      try {
        window.DashboardManager.showToast(`Creating folder '${clean}'...`, "info");
        await window.GitHubApi.saveFile(
          placeholderPath,
          "# Folder placeholder for Git\n",
          `Create directory ${clean}`
        );
        window.DashboardManager.showToast(`Folder '${clean}' created!`, "success");
        await this.loadDirectory(this.currentPath);
      } catch (err) {
        console.error("Create folder failed", err);
        window.DashboardManager.showToast(`Failed: ${err.message}`, "error");
      }
    },

    async handleFileUpload() {
      const fileInput = document.getElementById("uploadFileInput");
      const destPathInput = document.getElementById("uploadDestPathInput");
      const commitMsgInput = document.getElementById("uploadCommitMsgInput");
      const uploadBtn = document.getElementById("uploadSubmitBtn");

      if (!fileInput.files || fileInput.files.length === 0) {
        alert("Please choose a file to upload.");
        return;
      }

      const file = fileInput.files[0];
      const destPath = (destPathInput.value.trim() || `assets/images/${file.name}`).replace(/^\/+/, "");
      const commitMsg = commitMsgInput.value.trim() || `Upload ${destPath} via Omor Admin CMS`;

      // Read file as base64
      uploadBtn.disabled = true;
      uploadBtn.textContent = "Uploading to GitHub...";

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const rawResult = reader.result;
          // Base64 string is after the comma: data:image/png;base64,...
          const base64Content = rawResult.split(",")[1];

          await window.GitHubApi.uploadBinary(destPath, base64Content, commitMsg);
          window.DashboardManager.showToast(`Uploaded '${destPath}' successfully!`, "success");
          fileInput.value = "";
          uploadDestPathInput.value = "";
          window.DashboardManager.switchTab("filesTab");
          await this.loadDirectory(this.currentPath);
        } catch (err) {
          console.error("Upload failed", err);
          window.DashboardManager.showToast(`Upload failed: ${err.message}`, "error");
        } finally {
          uploadBtn.disabled = false;
          uploadBtn.textContent = "Upload File";
        }
      };

      reader.onerror = () => {
        window.DashboardManager.showToast("Failed reading file from disk.", "error");
        uploadBtn.disabled = false;
        uploadBtn.textContent = "Upload File";
      };

      reader.readAsDataURL(file);
    }
  };

  window.FileManager = FileManager;
})();
