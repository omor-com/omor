// Omor Project Hub - Dashboard, Project CMS & Settings Manager
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

  const DashboardManager = {
    creds: null,
    domain: "https://omor.asf.sale/",
    projects: [],
    projectsSha: null,
    siteConfig: null,
    siteConfigSha: null,

    init(creds) {
      this.creds = creds;
      this.bindEvents();
      this.updateHeaderInfo();
      this.switchTab("dashboardTab");
      this.loadDashboardData();
    },

    updateHeaderInfo() {
      if (!this.creds) return;
      const repoBadge = document.getElementById("adminRepoBadge");
      if (repoBadge) {
        repoBadge.textContent = `${this.creds.owner}/${this.creds.repo}`;
      }
      const branchBadge = document.getElementById("adminBranchBadge");
      if (branchBadge) {
        branchBadge.textContent = this.creds.branch;
      }
    },

    bindEvents() {
      // Tab navigation
      document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const tabId = btn.getAttribute("data-tab");
          this.switchTab(tabId);
        });
      });

      // Logout button
      const logoutBtn = document.getElementById("adminLogoutBtn");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
          if (confirm("Are you sure you want to log out from Omor Admin CMS?")) {
            window.LoginManager.logout();
          }
        });
      }

      // Add Project Modal / Form
      const addProjectBtn = document.getElementById("openAddProjectModalBtn");
      if (addProjectBtn) {
        addProjectBtn.addEventListener("click", () => this.openProjectModal());
      }

      const projectForm = document.getElementById("projectCmsForm");
      if (projectForm) {
        projectForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          await this.saveProjectFromForm();
        });
      }

      // Landing Page Generator Form
      const landingForm = document.getElementById("landingBuilderForm");
      if (landingForm) {
        landingForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          await this.generateLandingPage();
        });
      }

      // Settings Form
      const settingsForm = document.getElementById("siteSettingsForm");
      if (settingsForm) {
        settingsForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          await this.saveSiteSettings();
        });
      }

      // URL Generator test input
      const urlInput = document.getElementById("urlGenInput");
      if (urlInput) {
        urlInput.addEventListener("input", () => this.updateUrlGenResult());
      }
    },

    switchTab(tabId) {
      document.querySelectorAll(".tab-btn").forEach(b => {
        if (b.getAttribute("data-tab") === tabId) b.classList.add("active");
        else b.classList.remove("active");
      });

      document.querySelectorAll(".tab-panel").forEach(p => {
        if (p.id === tabId) p.classList.add("active");
        else p.classList.remove("active");
      });

      // Lazy loads
      if (tabId === "filesTab" && window.FileManager) {
        window.FileManager.loadDirectory(window.FileManager.currentPath);
      } else if (tabId === "projectCmsTab") {
        this.loadProjectRegistry();
      } else if (tabId === "settingsTab") {
        this.loadSiteSettings();
      } else if (tabId === "historyTab") {
        this.loadCommitHistory();
      }
    },

    async loadDashboardData() {
      try {
        const repo = await window.GitHubApi.verifyRepo();
        document.getElementById("dashRepoDesc").textContent = repo.repo.description || "Personal Project Hub Repository";
        document.getElementById("dashVisibility").textContent = repo.repo.private ? "Private" : "Public";
        document.getElementById("dashDefaultBranch").textContent = repo.defaultBranch;

        // Load commits for overview
        const commits = await window.GitHubApi.getCommits("", 5);
        this.renderRecentCommits(commits, "dashRecentCommits");
      } catch (e) {
        console.error("Dashboard overview load failed", e);
      }
    },

    computePublicUrl(repoPath) {
      let clean = repoPath.replace(/^\/+/, "");
      if (clean === "index.html") return this.domain;
      if (clean.endsWith("/index.html")) {
        return `${this.domain}${clean.replace(/\/index\.html$/, "/")}`;
      }
      return `${this.domain}${clean}`;
    },

    updateUrlGenResult() {
      const input = document.getElementById("urlGenInput");
      const result = document.getElementById("urlGenResult");
      if (!input || !result) return;
      const clean = input.value.trim();
      const url = this.computePublicUrl(clean || "example/name.html");
      result.textContent = url;
    },

    // --- Project CMS ---
    async loadProjectRegistry() {
      const listContainer = document.getElementById("projectCmsList");
      if (listContainer) {
        listContainer.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--admin-muted);">Loading projects.json...</div>`;
      }

      try {
        const file = await window.GitHubApi.readFileText("projects.json");
        this.projectsSha = file.sha;
        this.projects = JSON.parse(file.content);
        this.renderProjectCms();
      } catch (err) {
        console.error("Failed to load projects.json", err);
        if (listContainer) {
          listContainer.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--admin-red);">Failed to read projects.json: ${escapeHtml(err.message)}</div>`;
        }
      }
    },

    renderProjectCms() {
      const listContainer = document.getElementById("projectCmsList");
      if (!listContainer) return;

      if (!this.projects || this.projects.length === 0) {
        listContainer.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--admin-muted);">No projects found in registry.</div>`;
        return;
      }

      let html = "";
      this.projects.forEach(p => {
        const isFeatured = p.featured === true;
        const isPublished = p.status === "published";
        const descEn = p.description && p.description.en ? p.description.en : "";

        html += `
          <div class="file-row" style="align-items: center;">
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <strong style="font-size: 1.05rem; color: var(--admin-text);">${escapeHtml(p.name)}</strong>
                <span class="repo-pill" style="font-size: 0.72rem;">${escapeHtml(p.category)}</span>
                ${isFeatured ? `<span style="color: #eab308; font-size: 0.8rem;">★ Featured</span>` : ""}
                <span style="font-size: 0.75rem; color: ${isPublished ? "var(--admin-green)" : "var(--admin-dim)"};">
                  ● ${isPublished ? "Published" : "Draft"}
                </span>
              </div>
              <p style="font-size: 0.85rem; color: var(--admin-muted); margin-top: 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${escapeHtml(descEn)}
              </p>
            </div>
            <div style="display: flex; gap: 0.4rem; flex-shrink: 0;">
              <button class="btn btn-secondary btn-sm" onclick="window.DashboardManager.editProject('${escapeHtml(p.id)}')">
                ✏️ Edit
              </button>
              <button class="btn btn-secondary btn-sm" onclick="window.DashboardManager.toggleFeatured('${escapeHtml(p.id)}')">
                ${isFeatured ? "Unfeature" : "★ Feature"}
              </button>
              <button class="btn btn-secondary btn-sm" style="color: var(--admin-red);" onclick="window.DashboardManager.deleteProject('${escapeHtml(p.id)}')">
                🗑️
              </button>
            </div>
          </div>
        `;
      });

      listContainer.innerHTML = html;
    },

    openProjectModal(existing = null) {
      const modal = document.getElementById("projectModal");
      const title = document.getElementById("projectModalTitle");
      if (!modal) return;

      document.getElementById("projectIdInput").value = existing ? existing.id : "";
      document.getElementById("projectSlugInput").value = existing ? existing.slug : "";
      document.getElementById("projectNameInput").value = existing ? existing.name : "";
      document.getElementById("projectCategorySelect").value = existing ? existing.category : "android";
      document.getElementById("projectDescEnInput").value = existing && existing.description ? (existing.description.en || "") : "";
      document.getElementById("projectDescBnInput").value = existing && existing.description ? (existing.description.bn || "") : "";
      document.getElementById("projectLandingInput").value = existing ? (existing.landingPage || "") : "";
      document.getElementById("projectDownloadInput").value = existing ? (existing.downloadUrl || "") : "";
      document.getElementById("projectDemoInput").value = existing ? (existing.demoUrl || "") : "";
      document.getElementById("projectGithubInput").value = existing ? (existing.githubUrl || "") : "";
      document.getElementById("projectVersionInput").value = existing ? (existing.version || "1.0.0") : "1.0.0";
      document.getElementById("projectTagsInput").value = existing && Array.isArray(existing.tags) ? existing.tags.join(", ") : "";
      document.getElementById("projectFeaturedCheck").checked = existing ? existing.featured === true : false;
      document.getElementById("projectStatusSelect").value = existing ? (existing.status || "published") : "published";

      if (title) {
        title.textContent = existing ? `Edit Project: ${existing.name}` : "Add New Project to Registry";
      }

      modal.style.display = "flex";
      modal.classList.add("open");
    },

    closeProjectModal() {
      const modal = document.getElementById("projectModal");
      if (modal) {
        modal.style.display = "none";
        modal.classList.remove("open");
      }
    },

    editProject(id) {
      const found = this.projects.find(p => p.id === id);
      if (found) this.openProjectModal(found);
    },

    async toggleFeatured(id) {
      const found = this.projects.find(p => p.id === id);
      if (!found) return;

      found.featured = !found.featured;
      found.updatedAt = new Date().toISOString().split("T")[0];

      await this.commitProjectRegistry(`Toggle featured for ${found.name}`);
    },

    async deleteProject(id) {
      const found = this.projects.find(p => p.id === id);
      if (!found) return;

      if (!confirm(`Are you sure you want to remove '${found.name}' from projects.json?`)) return;

      this.projects = this.projects.filter(p => p.id !== id);
      await this.commitProjectRegistry(`Remove ${found.name} from registry`);
    },

    async saveProjectFromForm() {
      const id = document.getElementById("projectIdInput").value.trim() || document.getElementById("projectSlugInput").value.trim();
      const slug = document.getElementById("projectSlugInput").value.trim() || id;
      const name = document.getElementById("projectNameInput").value.trim();
      const category = document.getElementById("projectCategorySelect").value;
      const descEn = document.getElementById("projectDescEnInput").value.trim();
      const descBn = document.getElementById("projectDescBnInput").value.trim();
      const landingPage = document.getElementById("projectLandingInput").value.trim() || `landingpage/${slug}.html`;
      const downloadUrl = document.getElementById("projectDownloadInput").value.trim();
      const demoUrl = document.getElementById("projectDemoInput").value.trim();
      const githubUrl = document.getElementById("projectGithubInput").value.trim();
      const version = document.getElementById("projectVersionInput").value.trim() || "1.0.0";
      const tagsRaw = document.getElementById("projectTagsInput").value.trim();
      const featured = document.getElementById("projectFeaturedCheck").checked;
      const status = document.getElementById("projectStatusSelect").value;

      if (!id || !name) {
        alert("Project ID and Project Name are required.");
        return;
      }

      const tags = tagsRaw ? tagsRaw.split(",").map(t => t.trim()).filter(Boolean) : [];
      const now = new Date().toISOString().split("T")[0];

      const record = {
        id,
        slug,
        name,
        category,
        description: {
          bn: descBn,
          en: descEn
        },
        icon: "assets/images/logo.svg",
        landingPage,
        demoUrl,
        downloadUrl,
        githubUrl,
        status,
        featured,
        version,
        tags,
        updatedAt: now
      };

      const existingIndex = this.projects.findIndex(p => p.id === id);
      if (existingIndex >= 0) {
        record.createdAt = this.projects[existingIndex].createdAt || now;
        this.projects[existingIndex] = record;
      } else {
        record.createdAt = now;
        this.projects.push(record);
      }

      this.closeProjectModal();
      await this.commitProjectRegistry(`Update ${name} in projects.json`);
    },

    async commitProjectRegistry(message) {
      try {
        this.showToast("Committing projects.json to GitHub...", "info");
        const jsonStr = JSON.stringify(this.projects, null, 2);
        const res = await window.GitHubApi.saveFile(
          "projects.json",
          jsonStr,
          message,
          this.projectsSha
        );
        this.projectsSha = res.content ? res.content.sha : null;
        this.renderProjectCms();
        this.showToast("projects.json updated successfully!", "success");
      } catch (err) {
        console.error("Registry commit failed", err);
        this.showToast(`Failed to update projects.json: ${err.message}`, "error");
      }
    },

    // --- Landing Page Generator ---
    async generateLandingPage() {
      const title = document.getElementById("genPageTitle").value.trim();
      const slug = document.getElementById("genPageSlug").value.trim();
      const badge = document.getElementById("genPageBadge").value.trim() || "Application";
      const intro = document.getElementById("genPageIntro").value.trim();
      const f1Title = document.getElementById("genFeature1Title").value.trim() || "Fast & Intuitive";
      const f1Desc = document.getElementById("genFeature1Desc").value.trim() || "Designed with minimal latency and modern ergonomics.";
      const f2Title = document.getElementById("genFeature2Title").value.trim() || "Privacy First";
      const f2Desc = document.getElementById("genFeature2Desc").value.trim() || "Zero unwanted telemetry or server dependencies.";
      const download = document.getElementById("genDownloadUrl").value.trim();
      const github = document.getElementById("genGithubUrl").value.trim();
      const addToRegistry = document.getElementById("genAddToRegistryCheck").checked;

      if (!title || !slug) {
        alert("Page Title and Slug are required.");
        return;
      }

      const filePath = `landingpage/${slug}.html`;

      const htmlContent = `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} — Omor Project Hub</title>
  <meta name="description" content="${escapeHtml(intro)}">
  <link rel="icon" type="image/svg+xml" href="../assets/images/logo.svg">
  <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
  <header class="site-header">
    <div class="container header-inner">
      <a href="../index.html" class="brand">
        <img src="../assets/images/logo.svg" alt="Omor Logo" class="brand-logo" width="38" height="38">
        <span>OMOR <span class="brand-text-accent">HUB</span></span>
      </a>
      <div class="header-actions">
        <a href="../index.html" class="btn btn-secondary btn-sm">← Back to Hub</a>
        <a href="https://www.supportkori.com/muhammedomor" target="_blank" rel="noopener noreferrer" class="btn btn-support btn-sm">Support</a>
      </div>
    </div>
  </header>
  <main>
    <section class="hero" style="text-align: center; padding: 4rem 0 3rem;">
      <div class="container" style="max-width: 800px;">
        <span class="hero-badge">${escapeHtml(badge)}</span>
        <h1 class="hero-title">${escapeHtml(title)}</h1>
        <p class="hero-intro" style="margin: 0 auto 2rem;">${escapeHtml(intro)}</p>
        <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
          ${download ? `<a href="${escapeHtml(download)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Download / Access</a>` : ""}
          ${github ? `<a href="${escapeHtml(github)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">View GitHub Source</a>` : ""}
        </div>
      </div>
    </section>
    <section class="section" style="padding-top: 1rem;">
      <div class="container">
        <div class="projects-grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
          <div class="project-card">
            <h3 style="font-size: 1.2rem; margin-bottom: 0.5rem; color: var(--text-main);">${escapeHtml(f1Title)}</h3>
            <p style="color: var(--text-muted); font-size: 0.95rem;">${escapeHtml(f1Desc)}</p>
          </div>
          <div class="project-card">
            <h3 style="font-size: 1.2rem; margin-bottom: 0.5rem; color: var(--text-main);">${escapeHtml(f2Title)}</h3>
            <p style="color: var(--text-muted); font-size: 0.95rem;">${escapeHtml(f2Desc)}</p>
          </div>
        </div>
      </div>
    </section>
  </main>
  <footer class="site-footer">
    <div class="container" style="text-align: center;">
      <p style="color: var(--text-muted); font-size: 0.9rem;">Part of <a href="../index.html">Omor Project Hub</a>. Developed by Muhammed Omor.</p>
    </div>
  </footer>
</body>
</html>`;

      try {
        this.showToast(`Creating '${filePath}' on GitHub...`, "info");
        await window.GitHubApi.saveFile(
          filePath,
          htmlContent,
          `Create landing page for ${title}`
        );

        if (addToRegistry) {
          // Also append to projects registry
          try {
            const regFile = await window.GitHubApi.readFileText("projects.json");
            const reg = JSON.parse(regFile.content);
            const now = new Date().toISOString().split("T")[0];
            reg.push({
              id: slug,
              slug: slug,
              name: title,
              category: "web",
              description: { en: intro, bn: intro },
              icon: "assets/images/logo.svg",
              landingPage: filePath,
              downloadUrl: download,
              githubUrl: github,
              status: "published",
              featured: false,
              version: "1.0.0",
              tags: ["New", "Project"],
              createdAt: now,
              updatedAt: now
            });
            await window.GitHubApi.saveFile(
              "projects.json",
              JSON.stringify(reg, null, 2),
              `Register ${title} in projects.json`,
              regFile.sha
            );
          } catch (e) {
            console.warn("Could not auto-add to registry", e);
          }
        }

        const pubUrl = this.computePublicUrl(filePath);
        this.showToast(`Landing page created! Available at ${pubUrl}`, "success");
        prompt("Landing page generated! Public URL:", pubUrl);
      } catch (err) {
        console.error("Failed to generate landing page", err);
        this.showToast(`Generation failed: ${err.message}`, "error");
      }
    },

    // --- Site Settings ---
    async loadSiteSettings() {
      try {
        const file = await window.GitHubApi.readFileText("site-config.json");
        this.siteConfigSha = file.sha;
        this.siteConfig = JSON.parse(file.content);

        document.getElementById("settingsSiteName").value = this.siteConfig.siteName || "";
        document.getElementById("settingsOwnerName").value = this.siteConfig.ownerName || "";
        document.getElementById("settingsTaglineEn").value = this.siteConfig.tagline && this.siteConfig.tagline.en ? this.siteConfig.tagline.en : "";
        document.getElementById("settingsTaglineBn").value = this.siteConfig.tagline && this.siteConfig.tagline.bn ? this.siteConfig.tagline.bn : "";
        document.getElementById("settingsIntroEn").value = this.siteConfig.intro && this.siteConfig.intro.en ? this.siteConfig.intro.en : "";
        document.getElementById("settingsIntroBn").value = this.siteConfig.intro && this.siteConfig.intro.bn ? this.siteConfig.intro.bn : "";
        document.getElementById("settingsAboutEn").value = this.siteConfig.aboutText && this.siteConfig.aboutText.en ? this.siteConfig.aboutText.en : "";
        document.getElementById("settingsAboutBn").value = this.siteConfig.aboutText && this.siteConfig.aboutText.bn ? this.siteConfig.aboutText.bn : "";
        document.getElementById("settingsSupportKori").value = this.siteConfig.supportKoriUrl || "https://www.supportkori.com/muhammedomor";
        document.getElementById("settingsGithub").value = this.siteConfig.githubUrl || "";
        document.getElementById("settingsEmail").value = this.siteConfig.contactEmail || "";
      } catch (err) {
        console.error("Failed to load site-config.json", err);
        this.showToast(`Could not load site-config.json: ${err.message}`, "error");
      }
    },

    async saveSiteSettings() {
      if (!this.siteConfig) this.siteConfig = {};

      this.siteConfig.siteName = document.getElementById("settingsSiteName").value.trim();
      this.siteConfig.ownerName = document.getElementById("settingsOwnerName").value.trim();
      this.siteConfig.tagline = {
        en: document.getElementById("settingsTaglineEn").value.trim(),
        bn: document.getElementById("settingsTaglineBn").value.trim()
      };
      this.siteConfig.intro = {
        en: document.getElementById("settingsIntroEn").value.trim(),
        bn: document.getElementById("settingsIntroBn").value.trim()
      };
      this.siteConfig.aboutText = {
        en: document.getElementById("settingsAboutEn").value.trim(),
        bn: document.getElementById("settingsAboutBn").value.trim()
      };
      this.siteConfig.supportKoriUrl = document.getElementById("settingsSupportKori").value.trim();
      this.siteConfig.githubUrl = document.getElementById("settingsGithub").value.trim();
      this.siteConfig.contactEmail = document.getElementById("settingsEmail").value.trim();

      try {
        this.showToast("Saving site-config.json to GitHub...", "info");
        const res = await window.GitHubApi.saveFile(
          "site-config.json",
          JSON.stringify(this.siteConfig, null, 2),
          "Update site configuration via Omor Admin CMS",
          this.siteConfigSha
        );
        this.siteConfigSha = res.content ? res.content.sha : null;
        this.showToast("Site settings saved successfully!", "success");
      } catch (err) {
        console.error("Settings save failed", err);
        this.showToast(`Failed to save settings: ${err.message}`, "error");
      }
    },

    // --- Commit History ---
    async loadCommitHistory() {
      const container = document.getElementById("commitHistoryList");
      if (!container) return;

      container.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--admin-muted);">Loading commits...</div>`;

      try {
        const commits = await window.GitHubApi.getCommits("", 20);
        this.renderRecentCommits(commits, "commitHistoryList");
      } catch (err) {
        console.error("Failed to load commits", err);
        container.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--admin-red);">Failed to load commits: ${escapeHtml(err.message)}</div>`;
      }
    },

    renderRecentCommits(commits, containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;

      if (!commits || commits.length === 0) {
        container.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: var(--admin-muted);">No commits found.</div>`;
        return;
      }

      let html = "";
      commits.forEach(c => {
        const msg = c.commit ? c.commit.message : "";
        const author = c.commit && c.commit.author ? c.commit.author.name : (c.author ? c.author.login : "Unknown");
        const date = c.commit && c.commit.author ? new Date(c.commit.author.date).toLocaleString() : "";
        const shortSha = c.sha ? c.sha.substring(0, 7) : "";
        const htmlUrl = c.html_url || "#";

        html += `
          <div class="commit-item">
            <div class="commit-msg">${escapeHtml(msg)}</div>
            <div class="commit-meta">
              <span class="commit-sha">${escapeHtml(shortSha)}</span>
              <span>by <strong>${escapeHtml(author)}</strong></span>
              <span>📅 ${escapeHtml(date)}</span>
              <a href="${escapeHtml(htmlUrl)}" target="_blank" rel="noopener noreferrer" style="color: var(--admin-purple); margin-left: auto;">
                View on GitHub ↗
              </a>
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
    },

    // --- Toasts ---
    showToast(message, type = "info") {
      let container = document.getElementById("adminToastContainer");
      if (!container) {
        container = document.createElement("div");
        container.id = "adminToastContainer";
        container.className = "toast-container";
        document.body.appendChild(container);
      }

      const toast = document.createElement("div");
      toast.className = `toast toast-${type}`;
      toast.textContent = message;
      container.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
      }, 4000);
    }
  };

  window.DashboardManager = DashboardManager;
})();
