import { Transaction } from '../types';

/**
 * Generate a high-resolution, executive-styled PNG receipt image using HTML5 canvas.
 * This guarantees 100% cross-browser reliability without remote CSS or font inspection errors.
 */
export async function generateReceiptCanvasImage(transaction: Transaction): Promise<{ dataUrl: string; blob: Blob }> {
  return new Promise((resolve, reject) => {
    try {
      const scale = 2; // 2x retina resolution
      const width = 440 * scale;
      const hasToken = Boolean(transaction.token);
      const height = (hasToken ? 690 : 630) * scale;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Background - Crisp Pristine White
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Top decorative header bar (Royal Blue gradient)
      const grad = ctx.createLinearGradient(0, 0, width, 0);
      grad.addColorStop(0, '#003bb3');
      grad.addColorStop(0.5, '#0047cc');
      grad.addColorStop(1, '#1e60ff');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, 14 * scale);

      // Outer border
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1 * scale;
      ctx.strokeRect(0, 0, width, height);

      // Header Brand Area
      const headerY = 42 * scale;

      // Logo Icon (Rounded square with AJ initials)
      ctx.fillStyle = '#0047cc';
      ctx.beginPath();
      ctx.roundRect(28 * scale, headerY - 14 * scale, 42 * scale, 42 * scale, 10 * scale);
      ctx.fill();

      // Inner logo glow/accent
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5 * scale;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${19 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('AJ', 49 * scale, headerY + 13 * scale);

      // Brand Title
      ctx.fillStyle = '#0f172a';
      ctx.font = `bold ${16 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText("AL'AMIN JAGORA DATA", 80 * scale, headerY + 2 * scale);

      // Brand Tagline
      ctx.fillStyle = '#64748b';
      ctx.font = `500 ${10.5 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText('Premier Telecom & Utility VTU Services', 80 * scale, headerY + 18 * scale);

      // Status Badge (Top Right)
      const badgeW = 104 * scale;
      const badgeH = 24 * scale;
      const badgeX = width - 28 * scale - badgeW;
      const badgeY = headerY - 6 * scale;

      ctx.fillStyle = '#ecfdf5';
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 12 * scale);
      ctx.fill();
      ctx.strokeStyle = '#a7f3d0';
      ctx.lineWidth = 1 * scale;
      ctx.stroke();

      ctx.fillStyle = '#059669';
      ctx.font = `bold ${10 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('✓ SUCCESSFUL', badgeX + badgeW / 2, badgeY + 16 * scale);

      // Hairline divider
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      ctx.moveTo(28 * scale, 88 * scale);
      ctx.lineTo(width - 28 * scale, 88 * scale);
      ctx.stroke();

      // Amount & Title Section
      ctx.fillStyle = '#64748b';
      ctx.font = `600 ${11 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('TOTAL AMOUNT PAID', width / 2, 118 * scale);

      const amountStr = `₦${transaction.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
      ctx.fillStyle = '#0f172a';
      ctx.font = `bold ${34 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText(amountStr, width / 2, 154 * scale);

      ctx.fillStyle = '#0047cc';
      ctx.font = `600 ${13 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText(transaction.title, width / 2, 178 * scale);

      // Ticket Perforation (Notches + Dashed Line)
      const notchY = 200 * scale;
      const notchRadius = 10 * scale;

      // Left notch cutout (drawn as white circle cutting into side)
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(0, notchY, notchRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.stroke();

      // Right notch cutout
      ctx.beginPath();
      ctx.arc(width, notchY, notchRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Dashed line across
      ctx.setLineDash([6 * scale, 5 * scale]);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      ctx.moveTo(notchRadius + 4 * scale, notchY);
      ctx.lineTo(width - notchRadius - 4 * scale, notchY);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      // Transaction Ledger Card Box
      const ledgerY = 222 * scale;
      const ledgerH = (hasToken ? 284 : 236) * scale;
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(24 * scale, ledgerY, width - 48 * scale, ledgerH, 14 * scale);
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1 * scale;
      ctx.stroke();

      // Ledger Rows
      const leftX = 40 * scale;
      const rightX = width - 40 * scale;
      let curY = ledgerY + 30 * scale;
      const rowGap = 32 * scale;

      const drawLedgerRow = (label: string, value: string, isMono = false, isBold = false) => {
        ctx.fillStyle = '#64748b';
        ctx.font = `500 ${11 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(label, leftX, curY);

        ctx.fillStyle = '#0f172a';
        ctx.font = `${isBold ? 'bold' : '500'} ${12 * scale}px ${isMono ? 'monospace, "Courier New"' : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'}`;
        ctx.textAlign = 'right';
        ctx.fillText(value, rightX, curY);

        curY += rowGap;
      };

      const txIdSafe = String(transaction.id || transaction.reference || 'AJD-TX').toUpperCase();
      const txCategorySafe = String(transaction.category || 'Transaction').toUpperCase();

      drawLedgerRow('Transaction Ref', txIdSafe, true, true);
      drawLedgerRow('Date & Time', transaction.date || 'Today', true, false);

      if (transaction.recipient) {
        drawLedgerRow('Recipient / Beneficiary', String(transaction.recipient), true, true);
      }

      drawLedgerRow('Category', txCategorySafe, false, true);
      drawLedgerRow('Payment Channel', 'AJD Virtual Wallet', false, false);

      // Token Highlight Box if present
      if (transaction.token) {
        ctx.fillStyle = '#ecfdf5';
        ctx.beginPath();
        ctx.roundRect(leftX, curY - 14 * scale, width - 80 * scale, 34 * scale, 8 * scale);
        ctx.fill();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1 * scale;
        ctx.stroke();

        ctx.fillStyle = '#047857';
        ctx.font = `bold ${10 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText('PIN / TOKEN:', leftX + 10 * scale, curY + 8 * scale);

        ctx.fillStyle = '#065f46';
        ctx.font = `bold ${13 * scale}px monospace, "Courier New"`;
        ctx.textAlign = 'right';
        ctx.fillText(transaction.token, rightX - 10 * scale, curY + 8 * scale);

        curY += rowGap + 8 * scale;
      }

      drawLedgerRow('Status', 'COMPLETED / DELIVERED', false, true);

      // Footer Security & Barcode Section
      const footerY = ledgerY + ledgerH + 20 * scale;

      // Barcode simulation
      ctx.fillStyle = '#0f172a';
      const bars = [3, 1, 2, 4, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 3, 1, 2, 1, 3, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 4];
      let barX = 28 * scale;
      for (const b of bars) {
        ctx.fillRect(barX, footerY, b * scale, 24 * scale);
        barX += (b + 2.5) * scale;
      }

      // Security Seal Text
      ctx.fillStyle = '#475569';
      ctx.font = `bold ${9 * scale}px monospace, "Courier New"`;
      ctx.textAlign = 'right';
      ctx.fillText('DIGITALLY CERTIFIED RECEIPT', width - 28 * scale, footerY + 10 * scale);
      ctx.fillStyle = '#64748b';
      ctx.font = `500 ${8.5 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText('AJD Central Switch • jagora.ng', width - 28 * scale, footerY + 22 * scale);

      // Legal & support line
      ctx.fillStyle = '#94a3b8';
      ctx.font = `500 ${9.5 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(
        "Official digital proof of transaction • Support: support@jagora.ng | 08123456789",
        width / 2,
        height - 18 * scale
      );

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create image blob'));
          return;
        }
        const dataUrl = canvas.toDataURL('image/png');
        resolve({ dataUrl, blob });
      }, 'image/png');
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Capture receipt as high-res PNG image.
 * Uses the canvas generator for crisp, instantaneous rendering without stylesheet access errors.
 */
export async function captureReceiptAsImage(
  _receiptElement: HTMLElement | null,
  transaction: Transaction
): Promise<{ dataUrl: string; blob: Blob }> {
  return generateReceiptCanvasImage(transaction);
}


