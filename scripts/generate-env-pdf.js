import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function createEnvGuidePdf() {
  const pdfDoc = await PDFDocument.create();
  
  // Custom Color Palette
  const primaryBlue = rgb(0 / 255, 71 / 255, 204 / 255);      // #0047CC
  const navyDark = rgb(15 / 255, 23 / 255, 42 / 255);         // Slate 900
  const slateText = rgb(51 / 255, 65 / 255, 85 / 255);        // Slate 700
  const lightBg = rgb(248 / 255, 250 / 255, 252 / 255);       // Slate 50
  const borderGray = rgb(226 / 255, 232 / 255, 240 / 255);    // Slate 200
  const tagBg = rgb(238 / 255, 242 / 255, 255 / 255);         // Indigo 50
  const codeBg = rgb(241 / 255, 245 / 255, 249 / 255);        // Slate 100
  const greenText = rgb(22 / 255, 101 / 255, 52 / 255);       // Emerald 800

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);
  const fontMonoBold = await pdfDoc.embedFont(StandardFonts.CourierBold);

  // Helper to create a new page
  function addNewPage() {
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait
    // Top accent bar
    page.drawRectangle({
      x: 0,
      y: 835,
      width: 595.28,
      height: 7,
      color: primaryBlue,
    });
    return page;
  }

  // --- PAGE 1: TITLE & CORE ARCHITECTURE ---
  let page1 = addNewPage();
  let y = 800;

  // Header Title
  page1.drawText("AJDATASUB SERVICES", {
    x: 45,
    y: y,
    size: 11,
    font: fontBold,
    color: primaryBlue,
  });
  y -= 22;

  page1.drawText("Production .env & Credentials Deployment Guide", {
    x: 45,
    y: y,
    size: 18,
    font: fontBold,
    color: navyDark,
  });
  y -= 14;

  page1.drawText("Step-by-step instructions to configure API keys, payment gateways & cPanel MySQL", {
    x: 45,
    y: y,
    size: 10,
    font: fontRegular,
    color: slateText,
  });
  y -= 25;

  // Important Notice Box
  page1.drawRectangle({
    x: 45,
    y: y - 55,
    width: 505,
    height: 65,
    color: tagBg,
    borderColor: primaryBlue,
    borderWidth: 1,
  });
  page1.drawText("CRITICAL SECURITY & HOSTING NOTE", {
    x: 58,
    y: y - 8,
    size: 9.5,
    font: fontBold,
    color: primaryBlue,
  });
  page1.drawText("1. For Node.js / AI Studio: Fill in the .env file in the project root directory.", {
    x: 58,
    y: y - 24,
    size: 8.5,
    font: fontRegular,
    color: navyDark,
  });
  page1.drawText("2. For QServers cPanel (PHP): The equivalent configuration file is cpanel-backend/config.php.", {
    x: 58,
    y: y - 37,
    size: 8.5,
    font: fontRegular,
    color: navyDark,
  });
  page1.drawText("3. Never commit real keys to public GitHub repositories or share them over unsecured chats.", {
    x: 58,
    y: y - 50,
    size: 8.5,
    font: fontBold,
    color: greenText,
  });
  y -= 75;

  // Section 1: Upstream VTU Gateway
  page1.drawText("1. Upstream VTU Provider (ClubKonnect / HusmoData / VTPass)", {
    x: 45,
    y: y,
    size: 12,
    font: fontBold,
    color: navyDark,
  });
  y -= 16;

  page1.drawText("This provider delivers automated MTN, Airtel, Glo & 9mobile airtime, data and bill payments.", {
    x: 45,
    y: y,
    size: 9,
    font: fontRegular,
    color: slateText,
  });
  y -= 22;

  // Code Box for VTU
  const vtuLines = [
    "CLUBKONNECT_USER_ID=CK10982348",
    "CLUBKONNECT_API_KEY=94827103847291048291038472910482",
    "CLUBKONNECT_BASE_URL=https://www.clubkonnect.com/API",
    "VTU_PROVIDER_API_KEY=your_backup_provider_key_here",
    "VTU_PROVIDER_BASE_URL=https://husmodata.com/api"
  ];
  page1.drawRectangle({
    x: 45,
    y: y - 75,
    width: 505,
    height: 85,
    color: codeBg,
    borderColor: borderGray,
    borderWidth: 1,
  });
  let codeY = y - 5;
  for (const line of vtuLines) {
    page1.drawText(line, { x: 55, y: codeY, size: 8.5, font: fontMono, color: navyDark });
    codeY -= 15;
  }
  y -= 95;

  // Steps to obtain VTU Keys
  page1.drawText("How to obtain ClubKonnect credentials:", { x: 45, y: y, size: 9.5, font: fontBold, color: navyDark });
  y -= 14;
  const vtuSteps = [
    "Step A: Visit https://www.clubkonnect.com and register or login to your account.",
    "Step B: Go to Developer API or Integration settings on your dashboard.",
    "Step C: Copy your User ID (e.g. CK100...) and paste into CLUBKONNECT_USER_ID.",
    "Step D: Generate or copy your API Key and paste into CLUBKONNECT_API_KEY.",
    "Step E: Fund your ClubKonnect wallet so automated API airtime/data purchases succeed."
  ];
  for (const step of vtuSteps) {
    page1.drawText(step, { x: 55, y: y, size: 8.5, font: fontRegular, color: slateText });
    y -= 13;
  }
  y -= 15;

  // Section 2: Automated Virtual Accounts & Payment Gateways
  page1.drawText("2. Automated Bank Virtual Accounts (Monnify & PayVessel)", {
    x: 45,
    y: y,
    size: 12,
    font: fontBold,
    color: navyDark,
  });
  y -= 16;
  page1.drawText("Enables automated Wema, Sterling & Fidelity accounts for instant wallet funding.", {
    x: 45,
    y: y,
    size: 9,
    font: fontRegular,
    color: slateText,
  });
  y -= 22;

  // Code Box for Monnify & Payvessel
  const paymentLines = [
    "MONNIFY_API_KEY=MNFY_1098234871920384729104",
    "MONNIFY_SECRET_KEY=94820193847291048291038472910482",
    "MONNIFY_CONTRACT_CODE=3910482910",
    "PAYVESSEL_API_KEY=pv_live_sec_789102847291048291038472",
    "PAYVESSEL_SECRET_KEY=pv_live_pub_6291048291048291038472",
    "PAYVESSEL_BUSINESS_ID=pv_biz_3918274"
  ];
  page1.drawRectangle({
    x: 45,
    y: y - 90,
    width: 505,
    height: 100,
    color: codeBg,
    borderColor: borderGray,
    borderWidth: 1,
  });
  codeY = y - 5;
  for (const line of paymentLines) {
    page1.drawText(line, { x: 55, y: codeY, size: 8.5, font: fontMono, color: navyDark });
    codeY -= 15;
  }
  y -= 110;

  // Steps for Monnify
  page1.drawText("How to obtain Monnify credentials:", { x: 45, y: y, size: 9.5, font: fontBold, color: navyDark });
  y -= 14;
  const monnifySteps = [
    "Step A: Login to https://app.monnify.com (switch from Test to Live mode).",
    "Step B: Navigate to Developer / API Keys on the sidebar menu.",
    "Step C: Copy your API Key, Secret Key, and Contract Code into the matching variables.",
    "Step D: Under Webhook Settings, set the Webhook URL to: https://yourdomain.com.ng/api/webhooks/monnify"
  ];
  for (const step of monnifySteps) {
    page1.drawText(step, { x: 55, y: y, size: 8.5, font: fontRegular, color: slateText });
    y -= 13;
  }

  // Footer Page 1
  page1.drawText("Page 1 of 2 | AJDATASUB Services Deployment Guide", {
    x: 180,
    y: 25,
    size: 8,
    font: fontRegular,
    color: slateText,
  });

  // --- PAGE 2: APP SECURITY, CPANEL CONFIG.PHP & CHECKLIST ---
  let page2 = addNewPage();
  y = 800;

  page2.drawText("3. Application Security & App URL Variables", {
    x: 45,
    y: y,
    size: 12,
    font: fontBold,
    color: navyDark,
  });
  y -= 16;
  page2.drawText("Protects JWT session tokens, encrypted hashes, and client-side CORS routing.", {
    x: 45,
    y: y,
    size: 9,
    font: fontRegular,
    color: slateText,
  });
  y -= 22;

  // Code Box for Security
  const secLines = [
    "APP_URL=https://ajdatasub.com.ng",
    "APP_SECRET=alamin_super_secret_cryptographic_key_993847291",
    "VITE_API_BASE_URL=https://ajdatasub.com.ng/api",
    "GEMINI_API_KEY=your_gemini_api_key_here (optional for smart support)"
  ];
  page2.drawRectangle({
    x: 45,
    y: y - 62,
    width: 505,
    height: 72,
    color: codeBg,
    borderColor: borderGray,
    borderWidth: 1,
  });
  codeY = y - 5;
  for (const line of secLines) {
    page2.drawText(line, { x: 55, y: codeY, size: 8.5, font: fontMono, color: navyDark });
    codeY -= 15;
  }
  y -= 82;

  // Section 4: QServers cPanel PHP config.php Mapping
  page2.drawText("4. For QServers cPanel: Mapping to config.php", {
    x: 45,
    y: y,
    size: 12,
    font: fontBold,
    color: navyDark,
  });
  y -= 16;
  page2.drawText("When running on pure PHP/Apache on QServers, edit cpanel-backend/config.php directly:", {
    x: 45,
    y: y,
    size: 9,
    font: fontRegular,
    color: slateText,
  });
  y -= 22;

  const phpConfigLines = [
    "// Database Connection (created in cPanel > MySQL Databases)",
    "define('DB_HOST', 'localhost');",
    "define('DB_NAME', 'alaminja_vtu_db');",
    "define('DB_USER', 'alaminja_dbuser');",
    "define('DB_PASS', 'YourSecureDbPassword2026!');",
    "",
    "// Payment & VTU Credentials (matches your .env keys)",
    "define('CLUBKONNECT_USER_ID', 'CK10982348');",
    "define('CLUBKONNECT_API_KEY', '94827103847291048291038472910482');",
    "define('MONNIFY_API_KEY', 'MNFY_1098234871920384729104');",
    "define('MONNIFY_SECRET_KEY', '94820193847291048291038472910482');",
    "define('MONNIFY_CONTRACT_CODE', '3910482910');",
    "define('ADMIN_SECRET_PIN', '1234'); // Change to your custom 4-digit PIN"
  ];
  page2.drawRectangle({
    x: 45,
    y: y - 190,
    width: 505,
    height: 200,
    color: codeBg,
    borderColor: borderGray,
    borderWidth: 1,
  });
  codeY = y - 5;
  for (const line of phpConfigLines) {
    page2.drawText(line, { x: 55, y: codeY, size: 8, font: fontMono, color: navyDark });
    codeY -= 14;
  }
  y -= 210;

  // Section 5: Pre-Flight Verification Checklist
  page2.drawText("5. Pre-Flight Deployment Checklist", {
    x: 45,
    y: y,
    size: 12,
    font: fontBold,
    color: navyDark,
  });
  y -= 18;

  const checklist = [
    "[ ] 1. .env file is placed in root (for Node) OR config.php is placed in public_html/api/ (for PHP).",
    "[ ] 2. Database schema imported via phpMyAdmin (database.sql).",
    "[ ] 3. Monnify/PayVessel webhook URL saved on the gateway dashboard.",
    "[ ] 4. Upstream ClubKonnect wallet funded with test/production balance (e.g. NGN 2,000).",
    "[ ] 5. Admin Secret PIN updated to a unique 4-digit number of your choice.",
    "[ ] 6. Test registration performed: verify that Wema/Sterling dedicated bank accounts generate."
  ];
  for (const item of checklist) {
    page2.drawText(item, { x: 55, y: y, size: 8.5, font: fontRegular, color: navyDark });
    y -= 15;
  }
  y -= 20;

  // Support Box
  page2.drawRectangle({
    x: 45,
    y: y - 50,
    width: 505,
    height: 55,
    color: lightBg,
    borderColor: borderGray,
    borderWidth: 1,
  });
  page2.drawText("Need Help or Troubleshooting?", { x: 58, y: y - 5, size: 9.5, font: fontBold, color: primaryBlue });
  page2.drawText("Email: bashirabubakar650@gmail.com | Portal: ajdatasub.com.ng", {
    x: 58,
    y: y - 22,
    size: 8.5,
    font: fontRegular,
    color: slateText,
  });
  page2.drawText("All sensitive keys are hashed & protected. Double-check line breaks and quotes when editing.", {
    x: 58,
    y: y - 36,
    size: 8,
    font: fontBold,
    color: greenText,
  });

  // Footer Page 2
  page2.drawText("Page 2 of 2 | AJDATASUB Services Deployment Guide", {
    x: 180,
    y: 25,
    size: 8,
    font: fontRegular,
    color: slateText,
  });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(path.join(process.cwd(), 'public', 'Alamin_Jagora_ENV_Setup_Guide.pdf'), pdfBytes);
  console.log('PDF Guide generated successfully: public/Alamin_Jagora_ENV_Setup_Guide.pdf');
}

createEnvGuidePdf().catch(console.error);
