import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function generateManual() {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);
  const fontMonoBold = await pdfDoc.embedFont(StandardFonts.CourierBold);

  // Palette
  const colorPrimary = rgb(0.0, 0.28, 0.8); // #0047cc
  const colorSecondary = rgb(0.04, 0.07, 0.17); // #0b132b
  const colorText = rgb(0.12, 0.16, 0.22); // #1e293b
  const colorMuted = rgb(0.4, 0.45, 0.55); // #64748b
  const colorAccent = rgb(0.05, 0.65, 0.4); // #10b981
  const colorBgLight = rgb(0.96, 0.97, 0.99); // #f8fafc
  const colorBorder = rgb(0.85, 0.88, 0.92);

  const pageWidth = 595.28; // A4 width
  const pageHeight = 841.89; // A4 height
  const margin = 45;
  const contentWidth = pageWidth - margin * 2;

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;
  let pageNumber = 1;

  function drawFooter(page: any, num: number) {
    page.drawLine({
      start: { x: margin, y: 35 },
      end: { x: pageWidth - margin, y: 35 },
      thickness: 0.5,
      color: colorBorder,
    });
    page.drawText("AJDATASUB - Official API Integration & Deployment Manual", {
      x: margin,
      y: 22,
      size: 8,
      font: fontRegular,
      color: colorMuted,
    });
    page.drawText(`Page ${num}`, {
      x: pageWidth - margin - 35,
      y: 22,
      size: 8,
      font: fontRegular,
      color: colorMuted,
    });
  }

  function checkNewPage(neededSpace: number = 60) {
    if (y - neededSpace < 50) {
      drawFooter(currentPage, pageNumber);
      pageNumber++;
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  }

  // ==========================================
  // COVER / HEADER SECTION
  // ==========================================
  currentPage.drawRectangle({
    x: margin,
    y: y - 110,
    width: contentWidth,
    height: 110,
    color: colorSecondary,
  });

  currentPage.drawText("AJDATASUB", {
    x: margin + 20,
    y: y - 35,
    size: 20,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  currentPage.drawText("VTU & BILL PAYMENTS API INTEGRATION MANUAL", {
    x: margin + 20,
    y: y - 55,
    size: 11,
    font: fontBold,
    color: rgb(0.4, 0.7, 1),
  });

  currentPage.drawText("Comprehensive Guide: Environment Setup, Telecom Providers, Monnify, Custom PHP API & Webhooks", {
    x: margin + 20,
    y: y - 75,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.85, 0.9, 0.95),
  });

  currentPage.drawText(`Document Version: 2.4.0 • Updated: September 2026 • Environment: Full-Stack Production Engine`, {
    x: margin + 20,
    y: y - 95,
    size: 7.5,
    font: fontMono,
    color: rgb(0.65, 0.75, 0.85),
  });

  y -= 130;

  // Helper functions for content
  function addSectionHeading(title: string, subtitle?: string) {
    checkNewPage(50);
    y -= 10;
    currentPage.drawRectangle({
      x: margin,
      y: y - 22,
      width: contentWidth,
      height: 24,
      color: rgb(0.92, 0.95, 1),
    });
    currentPage.drawRectangle({
      x: margin,
      y: y - 22,
      width: 4,
      height: 24,
      color: colorPrimary,
    });
    currentPage.drawText(title, {
      x: margin + 12,
      y: y - 16,
      size: 11,
      font: fontBold,
      color: colorPrimary,
    });
    y -= 30;
    if (subtitle) {
      currentPage.drawText(subtitle, {
        x: margin + 4,
        y: y,
        size: 8.5,
        font: fontRegular,
        color: colorMuted,
      });
      y -= 15;
    }
  }

  function addSubHeading(title: string) {
    checkNewPage(30);
    currentPage.drawText(title, {
      x: margin,
      y: y,
      size: 9.5,
      font: fontBold,
      color: colorSecondary,
    });
    y -= 14;
  }

  function addParagraph(text: string) {
    checkNewPage(24);
    const words = text.split(' ');
    let line = '';
    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const width = fontRegular.widthOfTextAtSize(testLine, 8.5);
      if (width > contentWidth - 8) {
        currentPage.drawText(line, { x: margin + 4, y, size: 8.5, font: fontRegular, color: colorText });
        y -= 12;
        checkNewPage(16);
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) {
      currentPage.drawText(line, { x: margin + 4, y, size: 8.5, font: fontRegular, color: colorText });
      y -= 14;
    }
  }

  function addBullet(bulletTitle: string, text: string) {
    checkNewPage(20);
    currentPage.drawText('•', { x: margin + 6, y, size: 10, font: fontBold, color: colorPrimary });
    const fullPrefix = `  ${bulletTitle}: `;
    const prefixWidth = fontBold.widthOfTextAtSize(fullPrefix, 8.5);
    currentPage.drawText(fullPrefix, { x: margin + 6, y, size: 8.5, font: fontBold, color: colorSecondary });
    
    // Remaining text wrap
    const words = text.split(' ');
    let line = '';
    let isFirstLine = true;
    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const startX = isFirstLine ? margin + 6 + prefixWidth : margin + 20;
      const maxW = pageWidth - margin - startX;
      const w = fontRegular.widthOfTextAtSize(testLine, 8.5);
      if (w > maxW) {
        currentPage.drawText(line, { x: startX, y, size: 8.5, font: fontRegular, color: colorText });
        y -= 12;
        checkNewPage(16);
        isFirstLine = false;
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) {
      const startX = isFirstLine ? margin + 6 + prefixWidth : margin + 20;
      currentPage.drawText(line, { x: startX, y, size: 8.5, font: fontRegular, color: colorText });
      y -= 13;
    }
  }

  function addCodeBlock(lines: string[]) {
    const blockHeight = lines.length * 11 + 14;
    checkNewPage(blockHeight + 10);
    currentPage.drawRectangle({
      x: margin,
      y: y - blockHeight + 4,
      width: contentWidth,
      height: blockHeight,
      color: rgb(0.08, 0.1, 0.14),
    });
    let codeY = y - 10;
    for (const l of lines) {
      currentPage.drawText(l, {
        x: margin + 10,
        y: codeY,
        size: 7.5,
        font: fontMono,
        color: rgb(0.85, 0.92, 1),
      });
      codeY -= 11;
    }
    y -= blockHeight + 8;
  }

  // =========================================================================
  // SECTION 1: ARCHITECTURE OVERVIEW
  // =========================================================================
  addSectionHeading('1. SYSTEM ARCHITECTURE & INTEGRATION MODES');
  addParagraph("The AJDATASUB platform is designed with a full-stack architecture running a React single-page frontend on the client side and an authoritative TypeScript/Express API gateway on the backend. You can operate the app in three distinct integration modes depending on your business infrastructure:");

  addBullet('Mode A: Built-in Express Backend (Default & Recommended)', 'Directly uses the bundled Node.js server (server.ts) which acts as a secure middleware bridge to upstream VTU gateways (ClubKonnect, Monnify, Payvessel) without exposing secret credentials to client browsers.');
  addBullet('Mode B: External Custom PHP / MySQL API (cPanel / XAMPP)', 'Allows you to point the web app to an external PHP backend by changing the API Base URL in Settings. All REST requests adapt automatically to standard PHP endpoints (e.g., buy_data.php).');
  addBullet('Mode C: Third-Party Developer API Consumer', 'Other websites, mobile applications, or WhatsApp bots can consume your AJDATASUB REST API using Bearer Token authorization.');

  // =========================================================================
  // SECTION 2: ENVIRONMENT CONFIGURATION (.env)
  // =========================================================================
  addSectionHeading('2. ENVIRONMENT VARIABLES CONFIGURATION (.env)');
  addParagraph('To enable live dispensing of airtime, data, cable TV, and automated bank funding, configure the following keys in your root .env file on your hosting server (e.g. Cloud Run, VPS, or cPanel Node environment):');

  addCodeBlock([
    '# =========================================================',
    '# AL\'AMIN JAGORA DATA - PRODUCTION ENVIRONMENT CONFIGURATION',
    '# =========================================================',
    'PORT=3000',
    'NODE_ENV=production',
    'ADMIN_SECRET_KEY=JagoraAdmin@2026_SecureKey',
    '',
    '# --- 1. UPSTREAM TELECOM GATEWAY (CLUBKONNECT) ---',
    'CLUBKONNECT_USER_ID=CK100123456           # Your ClubKonnect Registered UserID',
    'CLUBKONNECT_API_KEY=ck_live_9988223344aa55  # Your Secret API Key from clubkonnect.com',
    'CLUBKONNECT_BASE_URL=https://www.clubkonnect.com/API',
    '',
    '# --- 2. AUTOMATED DEPOSITS & VIRTUAL ACCOUNTS (MONNIFY) ---',
    'MONNIFY_API_KEY=MK_PROD_ABC123XYZ        # Monnify Live/Sandbox API Key',
    'MONNIFY_SECRET_KEY=SEC_PROD_99887766     # Monnify Secret Key',
    'MONNIFY_CONTRACT_CODE=1234567890         # Your 10-digit Monnify Contract Code',
    '',
    '# --- 3. ALTERNATIVE PAYMENT INGRESS (PAYVESSEL) ---',
    'PAYVESSEL_API_KEY=pv_live_apikey_xyz',
    'PAYVESSEL_SECRET_KEY=pv_live_sec_123',
    'PAYVESSEL_BUSINESS_ID=65abcd1234ef'
  ]);

  addParagraph('Note: When CLUBKONNECT_API_KEY is not set or left empty, the server operates in safe SIMULATION MODE, generating instant realistic order references (e.g., SIM-CK-...) and debiting test wallet balances safely without losing real funds.');

  // =========================================================================
  // SECTION 3: UPSTREAM VTU DISPATCH SPECIFICATION
  // =========================================================================
  addSectionHeading('3. UPSTREAM VTU DISPATCH ENGINE & NETWORK CODES');
  addParagraph('The server handles requests by debiting the user wallet in integer Kobo with atomic concurrency locking, and then immediately dispatches the transaction to ClubKonnect or your chosen provider.');

  addSubHeading('A. Nigerian Telecom Network ID Mapping:');
  addBullet('MTN Nigeria', 'Network Code: "01" • Supported: SME, Corporate Gifting, Gifting, Direct VTU');
  addBullet('Globacom (Glo)', 'Network Code: "02" • Supported: SME, Gifting, Corporate Gifting');
  addBullet('9mobile (Etisalat)', 'Network Code: "03" • Supported: SME, Gifting, Corporate');
  addBullet('Airtel Nigeria', 'Network Code: "04" • Supported: Corporate Gifting, Direct VTU');

  addSubHeading('B. Automatic Compensation & Rollback Guarantee:');
  addParagraph('If the upstream telecom switch is under scheduled maintenance or rejects the vending transaction, the AJDATASUB backend automatically executes a compensation refund to the user wallet in under 200ms and flags the ledger transaction as REFUNDED.');

  // =========================================================================
  // SECTION 4: REST API ENDPOINTS SPECIFICATION
  // =========================================================================
  addSectionHeading('4. CORE REST API ENDPOINTS (FOR CLIENTS & APPS)');
  addParagraph('All endpoints accept JSON bodies (Content-Type: application/json) and return structured JSON responses. The backend supports standard REST routes and legacy PHP alias routes simultaneously:');

  addSubHeading('1. Purchase Data Bundle');
  addCodeBlock([
    'POST /api/vtu/buy-data   (Alias: /vtu/buy_data.php)',
    'Headers: Authorization: Bearer <TOKEN> | Idempotency-Key: <UUID>',
    'Payload:',
    '{',
    '  "network": "mtn",',
    '  "planId": "mtn_sme_1gb",',
    '  "size": "1.0GB",',
    '  "phone": "08012345678",',
    '  "amount": 290',
    '}',
    'Success Response (200 OK):',
    '{',
    '  "status": "success",',
    '  "success": true,',
    '  "reference": "AJD-DAT-1741700000-1234",',
    '  "message": "MTN 1.0GB (SME) delivered successfully to 08012345678.",',
    '  "newBalance": 4710',
    '}'
  ]);

  addSubHeading('2. Buy Instant Airtime');
  addCodeBlock([
    'POST /api/vtu/buy-airtime   (Alias: /vtu/buy_airtime.php)',
    'Payload: { "network": "airtel", "amount": 1000, "phone": "09012345678" }',
    'Discount / Rebate: The server automatically applies the user discount (e.g. 2% off).'
  ]);

  addSubHeading('3. Cable TV Subscription');
  addCodeBlock([
    'POST /api/vtu/cable-tv   (Alias: /vtu/buy_cable.php)',
    'Payload: { "service": "dstv", "planId": "dstv-padi", "smartcardNumber": "1023456789", "phone": "08012345678" }'
  ]);

  addSubHeading('4. Electricity Token Vending');
  addCodeBlock([
    'POST /api/vtu/electricity   (Alias: /vtu/buy_electricity.php)',
    'Payload: { "disco": "ikedc", "meterNumber": "01234567891", "meterType": "prepaid", "amount": 3000 }'
  ]);

  addSubHeading('5. Exam PINs & Scratch Cards');
  addCodeBlock([
    'POST /api/vtu/exam-pin   (Alias: /vtu/buy_exam.php)',
    'Payload: { "examType": "waec", "quantity": 1 }',
    'Response includes: Instant PIN code, Serial Number, and Candidate Instructions.'
  ]);

  // =========================================================================
  // SECTION 5: CUSTOM PHP / CPANEL INTEGRATION
  // =========================================================================
  addSectionHeading('5. CONNECTING TO A CUSTOM PHP / MYSQL BACKEND');
  addParagraph('If you prefer to host your backend on cPanel, Apache, or XAMPP with PHP & MySQL, follow these steps to connect the React application seamlessly:');

  addBullet('Step 1: Set Up MySQL Database', 'Import the users, transactions, data_plans, and virtual_accounts tables into your MySQL database.');
  addBullet('Step 2: Enable CORS in PHP Scripts', 'Every PHP script must emit proper headers before outputting JSON:');

  addCodeBlock([
    '<?php',
    'header("Access-Control-Allow-Origin: *");',
    'header("Access-Control-Allow-Methods: GET, POST, OPTIONS");',
    'header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Idempotency-Key");',
    'if ($_SERVER[\'REQUEST_METHOD\'] === \'OPTIONS\') { http_response_code(200); exit(); }',
    'header("Content-Type: application/json; charset=UTF-8");',
    '// Your database query & telecom provider curl logic here...',
    '?>'
  ]);

  addBullet('Step 3: Update API Base URL in App', 'In the web app, open the API Connection Settings modal (or press the API badge) and set your URL:');
  addCodeBlock([
    'Development (XAMPP): http://localhost/jagora_backend',
    'Production (cPanel):  https://api.yourdomain.com/vtu'
  ]);

  // =========================================================================
  // SECTION 6: WEBHOOKS FOR AUTOMATED FUNDING
  // =========================================================================
  addSectionHeading('6. WEBHOOKS & MONNIFY / PAYVESSEL SETUP');
  addParagraph('To enable instant, zero-touch wallet crediting when customers pay via bank transfer to dedicated virtual accounts:');

  addBullet('Monnify Webhook URL', 'Configure this in your Monnify Developer Dashboard -> Settings -> Webhooks:');
  addCodeBlock(['https://your-domain.com/api/webhooks/monnify']);
  addParagraph('Security: The webhook automatically computes an HMAC SHA512 hash of the raw JSON body using your MONNIFY_SECRET_KEY and compares it with the "monnify-signature" request header to prevent spoofing.');

  addBullet('Payvessel Webhook URL', 'Configure in your Payvessel Business Dashboard:');
  addCodeBlock(['https://your-domain.com/api/webhooks/payvessel']);

  // =========================================================================
  // SECTION 7: TESTING CHECKLIST & GO-LIVE VERIFICATION
  // =========================================================================
  addSectionHeading('7. GO-LIVE CHECKLIST & TROUBLESHOOTING');
  
  addBullet('1. Health Check Test', 'Navigate to https://your-domain.com/api/health in browser or curl. Verify that clubkonnect.active is true and live status confirms keys are loaded.');
  addBullet('2. Live Wallet Test', 'Perform a test wallet deposit of N100 via Monnify transfer or Admin credit, then vend an N100 airtime or 500MB SME data bundle to your own phone number.');
  addBullet('3. Verify Status Code', 'Ensure upstream returns statuscode 100 or ORDER_RECEIVED. Check the Transactions page in the app to view the official e-receipt.');
  addBullet('4. Error Code 409', 'Occurs if an identical transaction is submitted within 10 seconds. This is the built-in idempotency guard preventing double-charging on spotty connections.');
  addBullet('5. Error Code 401', 'Session token expired. Simply re-authenticate or verify that the Authorization Bearer header is intact.');

  y -= 15;
  checkNewPage(40);
  currentPage.drawRectangle({
    x: margin,
    y: y - 35,
    width: contentWidth,
    height: 35,
    color: rgb(0.95, 0.98, 0.95),
  });
  currentPage.drawText("Support & Technical Assistance:", {
    x: margin + 12,
    y: y - 14,
    size: 9,
    font: fontBold,
    color: colorAccent,
  });
  currentPage.drawText("AJDATASUB Developer Support • Email: support@jagoradata.com • WhatsApp: +234 800 123 4567", {
    x: margin + 12,
    y: y - 27,
    size: 8,
    font: fontRegular,
    color: colorText,
  });

  // Finish last page footer
  drawFooter(currentPage, pageNumber);

  const pdfBytes = await pdfDoc.save();
  
  // Ensure public folder exists
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const outputPath1 = path.join(publicDir, 'Alamin_Jagora_Data_API_Integration_Manual.pdf');
  const outputPath2 = path.join(publicDir, 'Jagora_Data_API_Integration_Guide.pdf');

  fs.writeFileSync(outputPath1, pdfBytes);
  fs.writeFileSync(outputPath2, pdfBytes);

  console.log(`PDF Manual generated successfully!`);
  console.log(`Path 1: ${outputPath1} (${pdfBytes.length} bytes, ${pageNumber} pages)`);
  console.log(`Path 2: ${outputPath2}`);
}

generateManual().catch(console.error);
