// Omor Project Hub - Admin Authentication Manager
(function() {
  const LoginManager = {
    init() {
      this.checkExistingSession();
      this.bindEvents();
    },

    checkExistingSession() {
      // Check sessionStorage first, then localStorage
      let raw = sessionStorage.getItem("omor_admin_creds");
      if (!raw) {
        raw = localStorage.getItem("omor_admin_creds");
      }

      if (raw) {
        try {
          const creds = JSON.parse(raw);
          if (creds && creds.token && creds.owner && creds.repo) {
            this.proceedToDashboard(creds, false);
            return;
          }
        } catch (e) {
          console.error("Invalid stored session", e);
        }
      }

      // Show login screen
      document.getElementById("loginView").style.display = "flex";
      document.getElementById("dashboardView").style.display = "none";
    },

    bindEvents() {
      const form = document.getElementById("loginForm");
      if (!form) return;

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.handleLogin();
      });

      // Quick demo filler for convenience
      const demoBtn = document.getElementById("demoConfigBtn");
      if (demoBtn) {
        demoBtn.addEventListener("click", () => {
          document.getElementById("repoOwnerInput").value = "muhammedomor";
          document.getElementById("repoNameInput").value = "omor-project-hub";
          document.getElementById("branchInput").value = "main";
          document.getElementById("usernameInput").value = "muhammedomor";
        });
      }
    },

    async handleLogin() {
      const username = document.getElementById("usernameInput").value.trim();
      const owner = document.getElementById("repoOwnerInput").value.trim();
      const repo = document.getElementById("repoNameInput").value.trim();
      const branch = document.getElementById("branchInput").value.trim() || "main";
      const token = document.getElementById("tokenInput").value.trim();
      const rememberMe = document.getElementById("rememberMeCheck").checked;

      const submitBtn = document.getElementById("loginSubmitBtn");
      const errorBox = document.getElementById("loginErrorBox");

      if (!token) {
        this.showError("Personal Access Token (PAT) is required to authenticate with GitHub API.");
        return;
      }
      if (!owner || !repo) {
        this.showError("Repository owner and repository name are required.");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Verifying with GitHub...";
      if (errorBox) errorBox.style.display = "none";

      const creds = { username, owner, repo, branch, token };

      try {
        window.GitHubApi.init(creds);
        const check = await window.GitHubApi.verifyRepo();

        if (!check.valid) {
          throw new Error("Repository could not be verified.");
        }

        if (!check.canPush) {
          console.warn("User has read-only access to this repository.");
        }

        // Save session safely
        const payload = JSON.stringify(creds);
        sessionStorage.setItem("omor_admin_creds", payload);
        if (rememberMe) {
          localStorage.setItem("omor_admin_creds", payload);
        } else {
          localStorage.removeItem("omor_admin_creds");
        }

        this.proceedToDashboard(creds, true);
      } catch (err) {
        console.error("Login verification failed", err);
        let msg = err.message || "Failed to connect to GitHub.";
        if (err.status === 401) {
          msg = "Invalid Personal Access Token. Please verify token permissions and expiration.";
        } else if (err.status === 404) {
          msg = `Repository '${owner}/${repo}' not found or token lacks access.`;
        }
        this.showError(msg);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Connect to Repository";
      }
    },

    showError(msg) {
      const errorBox = document.getElementById("loginErrorBox");
      if (errorBox) {
        errorBox.textContent = msg;
        errorBox.style.display = "block";
      } else {
        alert(msg);
      }
    },

    proceedToDashboard(creds, isNewLogin) {
      window.GitHubApi.init(creds);
      document.getElementById("loginView").style.display = "none";
      document.getElementById("dashboardView").style.display = "block";

      if (window.DashboardManager) {
        window.DashboardManager.init(creds);
      }
      if (window.FileManager) {
        window.FileManager.init();
      }

      if (isNewLogin && window.DashboardManager) {
        window.DashboardManager.showToast(`Connected to ${creds.owner}/${creds.repo} (${creds.branch})`, "success");
      }
    },

    logout() {
      sessionStorage.removeItem("omor_admin_creds");
      localStorage.removeItem("omor_admin_creds");
      window.location.reload();
    }
  };

  window.LoginManager = LoginManager;
  document.addEventListener("DOMContentLoaded", () => LoginManager.init());
})();
