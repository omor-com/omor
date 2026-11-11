// Omor Project Hub - Main Application Script
(function() {
  const App = {
    config: null,

    async init() {
      this.initTheme();
      this.initLanguage();
      await this.loadConfig();
      this.bindUiEvents();
      if (window.ProjectManager) {
        window.ProjectManager.init();
      }
    },

    initTheme() {
      const savedTheme = localStorage.getItem("omor_theme") || "dark";
      this.setTheme(savedTheme);
    },

    setTheme(theme) {
      if (theme !== "dark" && theme !== "light") theme = "dark";
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("omor_theme", theme);

      const themeBtn = document.getElementById("themeToggleBtn");
      if (themeBtn) {
        themeBtn.setAttribute("title", theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Neon");
      }
    },

    toggleTheme() {
      const current = document.documentElement.getAttribute("data-theme") || "dark";
      const next = current === "dark" ? "light" : "dark";
      this.setTheme(next);
    },

    initLanguage() {
      if (window.I18N) {
        window.I18N.setLang(window.I18N.currentLang);
      }
    },

    async loadConfig() {
      try {
        const res = await fetch("site-config.json");
        if (res.ok) {
          this.config = await res.json();
          this.applyConfig();
          return;
        }
      } catch (e) {
        console.warn("Could not fetch site-config.json, using defaults", e);
      }

      this.config = {
        siteName: "Omor Project Hub",
        ownerName: "Muhammed Omor",
        supportKoriUrl: "https://www.supportkori.com/muhammedomor"
      };
      this.applyConfig();
    },

    applyConfig() {
      if (!this.config) return;
      const lang = window.I18N ? window.I18N.currentLang : "en";

      // Owner Name
      document.querySelectorAll(".dyn-owner-name").forEach(el => {
        el.textContent = this.config.ownerName || "Muhammed Omor";
      });

      // Intro
      const introText = this.config.intro && this.config.intro[lang] ? this.config.intro[lang] : (this.config.intro && this.config.intro.en ? this.config.intro.en : "");
      if (introText) {
        document.querySelectorAll(".dyn-intro").forEach(el => el.textContent = introText);
      }

      // About Text
      const aboutText = this.config.aboutText && this.config.aboutText[lang] ? this.config.aboutText[lang] : (this.config.aboutText && this.config.aboutText.en ? this.config.aboutText.en : "");
      if (aboutText) {
        document.querySelectorAll(".dyn-about").forEach(el => el.textContent = aboutText);
      }

      // SupportKori Links
      const supportUrl = this.config.supportKoriUrl || "https://www.supportkori.com/muhammedomor";
      document.querySelectorAll(".supportkori-link").forEach(a => {
        a.setAttribute("href", supportUrl);
      });

      // GitHub Link
      if (this.config.githubUrl) {
        document.querySelectorAll(".github-link").forEach(a => {
          a.setAttribute("href", this.config.githubUrl);
        });
      }
    },

    bindUiEvents() {
      // Theme Toggle
      const themeBtn = document.getElementById("themeToggleBtn");
      if (themeBtn) {
        themeBtn.addEventListener("click", () => this.toggleTheme());
      }

      // Language Toggle
      const langBtn = document.getElementById("langToggleBtn");
      if (langBtn) {
        langBtn.addEventListener("click", () => {
          if (window.I18N) {
            window.I18N.toggleLang();
            this.applyConfig();
          }
        });
      }

      // Mobile Menu
      const menuBtn = document.getElementById("mobileMenuBtn");
      const drawer = document.getElementById("mobileDrawer");
      if (menuBtn && drawer) {
        menuBtn.addEventListener("click", () => {
          drawer.classList.toggle("open");
          const isOpen = drawer.classList.contains("open");
          menuBtn.setAttribute("aria-expanded", isOpen);
        });

        // Close when clicking link in drawer
        drawer.querySelectorAll("a").forEach(link => {
          link.addEventListener("click", () => {
            drawer.classList.remove("open");
            menuBtn.setAttribute("aria-expanded", "false");
          });
        });
      }

      // Back to top
      const backTopBtn = document.getElementById("backToTopBtn");
      if (backTopBtn) {
        window.addEventListener("scroll", () => {
          if (window.scrollY > 400) {
            backTopBtn.style.opacity = "1";
            backTopBtn.style.pointerEvents = "auto";
          } else {
            backTopBtn.style.opacity = "0";
            backTopBtn.style.pointerEvents = "none";
          }
        });
        backTopBtn.addEventListener("click", () => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
      }
    }
  };

  window.App = App;
  document.addEventListener("DOMContentLoaded", () => App.init());
})();
