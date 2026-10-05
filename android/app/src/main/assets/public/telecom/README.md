# Telecom Company Logos Folder

To insert your custom telecom company logos using your code editor before hosting with cPanel:

1. Place or replace your image files directly in this `/public/telecom/` folder:
   - `mtn.png` (or `mtn.svg`, `mtn.webp`, `mtn.jpg`)
   - `airtel.png` (or `airtel.svg`, `airtel.webp`, `airtel.jpg`)
   - `glo.png` (or `glo.svg`, `glo.webp`, `glo.jpg`)
   - `9mobile.png` (or `9mobile.svg`, `9mobile.webp`, `9mobile.jpg`)

2. Supported formats:
   The app will automatically check for your custom files (`.png`, `.svg`, `.webp`, `.jpg`).
   If a custom file is not present, it will use the starter vector icon or typographic badge.

3. Deployment to cPanel:
   When you run `npm run build` in your project folder, Vite bundles all files in `/public/` straight into `/dist/`.
   Upload the contents of the `dist` folder to your cPanel `public_html` directory.
