// Omor Project Hub - Official GitHub REST API Client
(function() {
  function utf8ToBase64(str) {
    return window.btoa(unescape(encodeURIComponent(str)));
  }

  function base64ToUtf8(b64) {
    // Remove newlines and whitespace if any
    const cleanB64 = b64.replace(/\s/g, "");
    return decodeURIComponent(escape(window.atob(cleanB64)));
  }

  const GitHubApi = {
    baseUrl: "https://api.github.com",
    token: null,
    owner: "",
    repo: "",
    branch: "main",

    init(credentials) {
      if (!credentials || !credentials.token) {
        throw new Error("Missing GitHub token.");
      }
      this.token = credentials.token.trim();
      this.owner = credentials.owner.trim();
      this.repo = credentials.repo.trim();
      this.branch = (credentials.branch || "main").trim();
    },

    getHeaders() {
      const headers = {
        "Accept": "application/vnd.github.v3+json",
        "X-GitHub-Api-Version": "2022-11-28"
      };
      if (this.token) {
        headers["Authorization"] = `Bearer ${this.token}`;
      }
      return headers;
    },

    async request(endpoint, options = {}) {
      const url = endpoint.startsWith("https://") ? endpoint : `${this.baseUrl}${endpoint}`;
      const defaultHeaders = this.getHeaders();
      const headers = { ...defaultHeaders, ...(options.headers || {}) };

      const res = await fetch(url, {
        ...options,
        headers
      });

      const contentType = res.headers.get("content-type") || "";
      let data = null;
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      if (!res.ok) {
        const error = new Error((data && data.message) ? data.message : `GitHub API HTTP ${res.status}`);
        error.status = res.status;
        error.data = data;
        throw error;
      }

      return data;
    },

    // Verify authentication and repo access
    async verifyRepo() {
      const repoData = await this.request(`/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repo)}`);
      // Check permissions
      const canPush = repoData.permissions && (repoData.permissions.push === true || repoData.permissions.admin === true);
      return {
        valid: true,
        canPush,
        repo: repoData,
        defaultBranch: repoData.default_branch
      };
    },

    // Get current authenticated user
    async getCurrentUser() {
      return await this.request("/user");
    },

    // Get contents of a directory or metadata of a file
    async getContents(path = "") {
      const cleanPath = path.replace(/^\/+/, "");
      const branchParam = this.branch ? `?ref=${encodeURIComponent(this.branch)}` : "";
      return await this.request(`/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repo)}/contents/${cleanPath}${branchParam}`);
    },

    // Read full text content of a file
    async readFileText(path) {
      const fileData = await this.getContents(path);
      if (Array.isArray(fileData)) {
        throw new Error(`Path '${path}' is a directory, not a file.`);
      }
      if (fileData.encoding === "base64" && fileData.content) {
        return {
          content: base64ToUtf8(fileData.content),
          sha: fileData.sha,
          size: fileData.size,
          path: fileData.path,
          name: fileData.name,
          downloadUrl: fileData.download_url
        };
      }
      throw new Error("Unsupported file encoding: " + fileData.encoding);
    },

    // Create or update a file
    async saveFile(path, textContent, commitMessage, currentSha = null) {
      const cleanPath = path.replace(/^\/+/, "");
      const b64 = utf8ToBase64(textContent);
      const payload = {
        message: commitMessage || `Update ${cleanPath} via Omor Admin CMS`,
        content: b64,
        branch: this.branch
      };
      if (currentSha) {
        payload.sha = currentSha;
      }

      return await this.request(`/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repo)}/contents/${cleanPath}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    },

    // Upload raw base64 binary file (e.g. image, asset)
    async uploadBinary(path, base64Content, commitMessage, currentSha = null) {
      const cleanPath = path.replace(/^\/+/, "");
      const payload = {
        message: commitMessage || `Upload ${cleanPath} via Omor Admin CMS`,
        content: base64Content,
        branch: this.branch
      };
      if (currentSha) {
        payload.sha = currentSha;
      }

      return await this.request(`/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repo)}/contents/${cleanPath}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    },

    // Delete a file using its current SHA
    async deleteFile(path, sha, commitMessage) {
      const cleanPath = path.replace(/^\/+/, "");
      const payload = {
        message: commitMessage || `Delete ${cleanPath} via Omor Admin CMS`,
        sha: sha,
        branch: this.branch
      };

      return await this.request(`/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repo)}/contents/${cleanPath}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    },

    // Move or Rename a file safely (Read -> Write New -> Delete Old)
    async renameFile(oldPath, newPath, commitMessage) {
      const orig = await this.readFileText(oldPath);
      // Write to new path
      const writeResult = await this.saveFile(
        newPath,
        orig.content,
        commitMessage || `Move ${oldPath} to ${newPath}`
      );
      // Delete old path only after write succeeds
      await this.deleteFile(
        oldPath,
        orig.sha,
        `Remove old file after moving to ${newPath}`
      );
      return writeResult;
    },

    // Get recent commits
    async getCommits(path = "", perPage = 15) {
      const cleanPath = path.replace(/^\/+/, "");
      let q = `?per_page=${perPage}&sha=${encodeURIComponent(this.branch)}`;
      if (cleanPath) {
        q += `&path=${encodeURIComponent(cleanPath)}`;
      }
      return await this.request(`/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repo)}/commits${q}`);
    }
  };

  window.GitHubApi = GitHubApi;
  window.utf8ToBase64 = utf8ToBase64;
  window.base64ToUtf8 = base64ToUtf8;
})();
