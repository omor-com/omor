// Omor Project Hub - Project Manager Engine
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

  const ProjectManager = {
    projects: [],
    activeCategory: "all",
    searchQuery: "",
    sortBy: "featured",

    async init() {
      await this.loadProjects();
      this.bindEvents();
      this.render();
    },

    async loadProjects() {
      // 1. Try fetching canonical projects.json
      try {
        const res = await fetch("projects.json");
        if (res.ok) {
          this.projects = await res.json();
          return;
        }
      } catch (err) {
        console.warn("fetch('projects.json') failed, checking window.OMOR_PROJECTS fallback", err);
      }

      // 2. Fallback to preloaded window.OMOR_PROJECTS
      if (window.OMOR_PROJECTS && Array.isArray(window.OMOR_PROJECTS)) {
        this.projects = window.OMOR_PROJECTS;
      } else {
        this.projects = [];
      }
    },

    bindEvents() {
      // Category pills
      document.querySelectorAll(".pill-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          document.querySelectorAll(".pill-btn").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          this.activeCategory = btn.getAttribute("data-category") || "all";
          this.render();
        });
      });

      // Search input
      const searchInput = document.getElementById("projectSearchInput");
      if (searchInput) {
        searchInput.addEventListener("input", (e) => {
          this.searchQuery = e.target.value.trim().toLowerCase();
          this.render();
        });
      }

      // Sort select
      const sortSelect = document.getElementById("projectSortSelect");
      if (sortSelect) {
        sortSelect.addEventListener("change", (e) => {
          this.sortBy = e.target.value;
          this.render();
        });
      }

      // Clear filters button
      const clearBtn = document.getElementById("clearFiltersBtn");
      if (clearBtn) {
        clearBtn.addEventListener("click", () => {
          this.resetFilters();
        });
      }

      // Listen to language changes
      window.addEventListener("omor_language_changed", () => {
        this.render();
      });
    },

    resetFilters() {
      this.activeCategory = "all";
      this.searchQuery = "";
      this.sortBy = "featured";

      const searchInput = document.getElementById("projectSearchInput");
      if (searchInput) searchInput.value = "";

      const sortSelect = document.getElementById("projectSortSelect");
      if (sortSelect) sortSelect.value = "featured";

      document.querySelectorAll(".pill-btn").forEach(b => {
        if (b.getAttribute("data-category") === "all") b.classList.add("active");
        else b.classList.remove("active");
      });

      this.render();
    },

    getFilteredProjects() {
      let list = this.projects.filter(p => p.status === "published");

      // Category filter
      if (this.activeCategory !== "all") {
        list = list.filter(p => (p.category || "").toLowerCase() === this.activeCategory.toLowerCase());
      }

      // Search filter
      if (this.searchQuery) {
        const q = this.searchQuery;
        list = list.filter(p => {
          const name = (p.name || "").toLowerCase();
          const descEn = (p.description && p.description.en ? p.description.en : "").toLowerCase();
          const descBn = (p.description && p.description.bn ? p.description.bn : "").toLowerCase();
          const tags = Array.isArray(p.tags) ? p.tags.join(" ").toLowerCase() : "";
          return name.includes(q) || descEn.includes(q) || descBn.includes(q) || tags.includes(q);
        });
      }

      // Sorting
      if (this.sortBy === "featured") {
        list.sort((a, b) => (b.featured === true ? 1 : 0) - (a.featured === true ? 1 : 0));
      } else if (this.sortBy === "recent") {
        list.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
      } else if (this.sortBy === "name") {
        list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      }

      return list;
    },

    render() {
      this.renderFeatured();
      this.renderAll();
    },

    renderFeatured() {
      const container = document.getElementById("featuredProjectsGrid");
      if (!container) return;

      const featured = this.projects.filter(p => p.status === "published" && p.featured === true);
      if (featured.length === 0) {
        container.innerHTML = `<p class="empty-desc" style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">${window.I18N.t("emptySub")}</p>`;
        return;
      }

      container.innerHTML = featured.map(p => this.createCardHtml(p)).join("");
      this.attachCardEvents(container);
    },

    renderAll() {
      const container = document.getElementById("allProjectsGrid");
      const emptyState = document.getElementById("emptyStateContainer");
      if (!container) return;

      const list = this.getFilteredProjects();

      if (list.length === 0) {
        container.innerHTML = "";
        if (emptyState) emptyState.style.display = "block";
      } else {
        if (emptyState) emptyState.style.display = "none";
        container.innerHTML = list.map(p => this.createCardHtml(p)).join("");
        this.attachCardEvents(container);
      }
    },

    createCardHtml(p) {
      const lang = window.I18N ? window.I18N.currentLang : "en";
      const desc = p.description && p.description[lang] ? p.description[lang] : (p.description && p.description.en ? p.description.en : "");
      const catKey = "cat_" + (p.category || "other");
      const catLabel = window.I18N ? window.I18N.t(catKey) : p.category;
      const tags = Array.isArray(p.tags) ? p.tags.slice(0, 3) : [];
      const landing = p.landingPage ? escapeHtml(p.landingPage) : "#";
      const icon = p.icon ? escapeHtml(p.icon) : "assets/images/logo.svg";

      return `
        <article class="project-card" data-project-id="${escapeHtml(p.id)}">
          <div>
            <div class="project-card-header">
              <div class="project-icon">
                <img src="${icon}" alt="${escapeHtml(p.name)} icon" loading="lazy" />
              </div>
              <div class="project-title-area">
                <h3 class="project-name" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</h3>
                <span class="project-category-badge">${escapeHtml(catLabel)}</span>
              </div>
            </div>
            <p class="project-desc">${escapeHtml(desc)}</p>
            <div class="project-tags">
              ${tags.map(t => `<span class="tag-badge">#${escapeHtml(t)}</span>`).join("")}
            </div>
          </div>
          <div class="project-actions">
            <a href="${landing}" class="btn btn-primary btn-sm" style="flex: 1;">
              ${escapeHtml(window.I18N.t("btnDetails"))}
            </a>
            ${p.downloadUrl ? `
              <a href="${escapeHtml(p.downloadUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" title="${escapeHtml(window.I18N.t("btnDownload"))}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </a>
            ` : ""}
            ${p.demoUrl ? `
              <a href="${escapeHtml(p.demoUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" title="${escapeHtml(window.I18N.t("btnDemo"))}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            ` : ""}
            ${p.githubUrl ? `
              <a href="${escapeHtml(p.githubUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" title="${escapeHtml(window.I18N.t("btnSource"))}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
              </a>
            ` : ""}
          </div>
        </article>
      `;
    },

    attachCardEvents(parent) {
      // Allow clicking on card title to open landing page
      parent.querySelectorAll(".project-name").forEach(title => {
        title.style.cursor = "pointer";
        title.addEventListener("click", (e) => {
          const card = e.target.closest(".project-card");
          const link = card ? card.querySelector(".btn-primary") : null;
          if (link) link.click();
        });
      });
    }
  };

  window.ProjectManager = ProjectManager;
})();
