# OMOR PROJECT HUB — DEPLOYMENT & OPERATION MANUAL

**Website:** [https://omor.asf.sale/](https://omor.asf.sale/)  
**Admin CMS:** [https://omor.asf.sale/wp-admin/](https://omor.asf.sale/wp-admin/)  
**Creator Support:** [https://www.supportkori.com/muhammedomor](https://www.supportkori.com/muhammedomor)  
**AniLog Landing Page:** [https://omor.asf.sale/landingpage/anilog.html](https://omor.asf.sale/landingpage/anilog.html)  

---

## 1. Architecture Overview

Omor Project Hub is built as an ultra-fast, static web application published via **GitHub Pages**, paired with a **client-side administration application** located at `/wp-admin/` that interfaces directly with GitHub's REST API.

- **Zero Paid Backend:** Operates with no database costs, server maintenance, or hosting fees.
- **Client-Side Security:** Tokens and credentials stay strictly in the browser/app and communicate only with `https://api.github.com`.
- **Mobile First:** Designed so Muhammed Omor can manage repository files, update projects, and publish landing pages directly from an Android phone or tablet.
- **Android Companion App:** The included Android app embeds the entire project hub with offline local assets, live domain switching, and native file upload support.

---

## 2. GitHub Pages Deployment Steps

### Step A: Repository Setup
1. Create a GitHub repository (e.g., `muhammedomor/omor-project-hub` or `muhammedomor/muhammedomor.github.io`).
2. Clone or push the website files to the `main` branch.
3. Verify the root contains:
   - `index.html` (Main website)
   - `CNAME` (Containing `omor.asf.sale`)
   - `.nojekyll` (Ensures static asset folders are served without Jekyll processing)
   - `projects.json` (Canonical project registry)
   - `site-config.json` (Canonical site settings)
   - `landingpage/anilog.html` (Dedicated AniLog page)
   - `wp-admin/index.html` (Admin CMS)
   - `assets/` (CSS, JS, and image assets)

### Step B: GitHub Pages Settings
1. On GitHub, navigate to **Settings** → **Pages**.
2. Under **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: **main** / (root)
3. Under **Custom domain**:
   - Enter `omor.asf.sale`
   - Check **Enforce HTTPS** (GitHub will provision a free Let's Encrypt SSL certificate).

### Step C: DNS Configuration for `omor.asf.sale`
At your DNS provider (e.g. Cloudflare, Namecheap, GoDaddy):
- Add a **CNAME** record:
  - **Host / Name:** `omor`
  - **Target / Value:** `<your-github-username>.github.io` (e.g. `muhammedomor.github.io`)
  - **TTL:** Auto or 300 seconds

---

## 3. GitHub Personal Access Token (PAT) Setup for `/wp-admin/`

To use the client-side Admin CMS on Android or desktop:

1. Log in to GitHub and open:  
   **Settings → Developer Settings → Personal access tokens → Fine-grained tokens**  
   *(or Classic Tokens if preferred)*.
2. Click **Generate new token**.
3. Configure:
   - **Token Name:** `Omor Hub Admin CMS`
   - **Repository access:** Selected repositories → Choose `omor-project-hub`
   - **Permissions:**
     - **Contents:** Read and write
     - **Metadata:** Read-only (mandatory)
4. Generate and copy your token.
5. Open `https://omor.asf.sale/wp-admin/` (or the Admin CMS tab in the Android app).
6. Enter:
   - Repository Owner: `muhammedomor`
   - Repository Name: `omor-project-hub` (or your repo name)
   - Publishing Branch: `main`
   - Token: Paste your generated token.
7. Click **Connect to Repository**.

---

## 4. Preserved Resources Checklist

- [x] **CNAME File:** Configured with `omor.asf.sale`.
- [x] **AniLog Route:** Preserved at `https://omor.asf.sale/landingpage/anilog.html`.
- [x] **SupportKori Link:** Pointed to `https://www.supportkori.com/muhammedomor`.
- [x] **Zero External CDN Dependencies:** No Tailwind CDN, No Bootstrap CDN, No Google Fonts CDN, No Font Awesome CDN.
- [x] **Bilingual Support:** Complete English & Bengali (বাংলা) interface and descriptions.
- [x] **Dark-Neon Aesthetic:** High contrast #0a0914 dark theme + crisp light theme.
- [x] **Android Companion:** Native Jetpack Compose app with offline WebView and live domain switcher.
