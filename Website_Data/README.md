# RAKTechSoftHub — Website Data & Archive Repository

This dedicated folder (`Website_Data/`) contains all non-deployable source materials, technical documentation, high-resolution master media, 3D asset archives, and branding backups separated from the live `Website/` directory.

---

## 🎯 Purpose & Publishing Optimization Benefits

Previously, the live `Website/` directory contained over **57 MB** of assets, including raw 4K videos, heavy letterhead PDFs, 3D model archives, and duplicate logo backups. 

By segregating this data into `Website_Data/`:
1. **52%+ Lighter Publish Size**: The live `Website/` directory was reduced from **57.3 MB to ~27 MB**.
2. **Instant Deployments**: Firebase Hosting (`firebase deploy`), Netlify, Vercel, or GitHub Pages sync twice as fast without bandwidth lag or upload timeouts.
3. **Clean Codebase**: The live deployment bundle contains strictly what the user's browser needs to render the site.

---

## 📂 Directory Structure

| Folder | Contents |
| :--- | :--- |
| `Documentation/` | Technical & system architecture documents (`WEBSITE_TECHNICAL_DOCUMENTATION.docx`, `WEBSITE_TECHNICAL_DOCUMENTATION.md`). |
| `Documents/` | Official agency stationery & print assets (`RAK_Tech_Soft_Hub_Blank_Letterhead.pdf`). |
| `Raw_Media/` | Raw uncompressed video masters (`hero-network-4k.mp4` 24MB). |
| `3D_Models_Archive/` | 3D models and Three.js rendering scripts (`Astronaut.glb`, `3d-animations.js`). |
| `Logos_Backup/` | Legacy and alternative logo formats (`old_logos_backup/`, `logo.png`, `logo_emblem.jpg`, etc.). |
| `Site_Data/` | Structured JSON site data (`site_content.json`, `inquiries_schema.json`) for headless CMS or future API integrations. |
