import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import confetti from 'canvas-confetti';

const INVOICE_STANDALONE_CSS = `
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  html, body {
    margin: 0;
    padding: 0;
    background-color: #ffffff;
    color: #000000;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-size: 11px;
    -webkit-font-smoothing: antialiased;
  }
  .text-center { text-align: center; }
  .text-left { text-align: left; }
  .text-right { text-align: right; }
  .flex { display: flex; }
  .justify-center { justify-content: center; }
  .items-start { align-items: flex-start; }

  .invoice-template-wrapper {
    background-color: #ffffff;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-size: 11px;
    color: #000000;
    box-sizing: border-box;
    width: 194mm;
    margin: 0 auto;
  }

  .invoice-container {
    width: 194mm;
    height: 281mm;
    max-height: 281mm;
    margin: 0 auto;
    border: 1.5px solid #000000;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    page-break-inside: avoid;
    break-inside: avoid;
    background: #ffffff;
    color: #000000;
  }

  .invoice-table {
    width: 100%;
    height: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-variant-numeric: tabular-nums;
    font-feature-settings: "tnum";
  }

  .invoice-table td,
  .invoice-table th {
    border: 1px solid #000000;
    padding: 6px 8px;
    vertical-align: middle;
    word-wrap: break-word;
  }

  .header-cell {
    text-align: center;
    padding: 14px 10px 10px;
    position: relative;
    border-top: none !important;
    border-left: none !important;
    border-right: none !important;
    border-bottom: 1.5px solid #000000 !important;
  }

  .copy-badge {
    position: absolute;
    right: 12px;
    top: 12px;
    font-size: 9px;
    font-weight: 800;
    border: 1.5px solid #000000;
    padding: 3px 8px;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    background-color: #ffffff;
    border-radius: 2px;
  }

  .title-main { font-size: 14px; letter-spacing: 3.5px; font-weight: 800; margin: 0; text-transform: uppercase; color: #0f172a; }
  .title-company { font-size: 22px; font-weight: 900; letter-spacing: 0.8px; margin: 4px 0 2px; text-transform: uppercase; color: #000000; }
  .header-subtext { font-size: 10px; font-weight: 700; letter-spacing: 0.6px; margin: 2px 0 3px; text-transform: uppercase; color: #1e293b; }
  .header-contact { font-size: 10.5px; line-height: 1.5; color: #111111; }

  .meta-cell { vertical-align: top !important; padding: 10px 12px; line-height: 1.6; font-size: 11px; border-top: none !important; }
  .field-row { display: flex; margin-bottom: 3px; }
  .field-label { font-weight: 700; min-width: 110px; display: inline-block; color: #1e293b; }
  .field-val { flex: 1; color: #000000; }

  .item-header {
    background-color: #f8fafc;
    font-weight: 800;
    text-align: center;
    font-size: 10px;
    padding: 8px 4px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    border-top: 1.5px solid #000000 !important;
    border-bottom: 1.5px solid #000000 !important;
  }

  .item-row td {
    border-top: 1px solid #d0d0d0;
    border-bottom: 1px solid #d0d0d0;
    padding: 8px 8px;
    font-size: 10.5px;
    line-height: 1.35;
  }

  .desc-title { font-weight: 700; display: block; font-size: 11px; color: #000000; }
  .desc-sub { font-size: 9.5px; color: #475569; display: block; margin-top: 2px; font-weight: 500; }

  .qty-total-row td {
    border-top: 1.5px solid #000000;
    border-bottom: 1.5px solid #000000;
    font-weight: 800;
    font-size: 11px;
    padding: 7px 8px;
    background-color: #f8fafc;
    letter-spacing: 0.3px;
  }

  .words-cell { vertical-align: top !important; padding: 8px 10px !important; border-left: none !important; border-bottom: none !important; height: 100%; }
  .words-box { line-height: 1.4; }
  .signatory-box { margin-top: 24px; text-align: right; font-size: 10px; }
  .signature-name { font-family: 'Brush Script MT', 'Great Vibes', 'Caveat', cursive, sans-serif; font-size: 22px; display: block; margin-bottom: 2px; color: #0f172a; }

  .calc-label-cell { font-weight: 700; text-align: left; font-size: 10px; padding: 5px 8px; letter-spacing: 0.3px; }
  .calc-val-cell { text-align: right; font-size: 10.5px; padding: 5px 8px; white-space: nowrap; font-weight: 600; }

  .grand-total-label, .grand-total-val {
    font-size: 11.5px !important;
    font-weight: 900 !important;
    background-color: #f1f5f9;
    border-top: 1.5px solid #000000 !important;
    border-bottom: 1.5px solid #000000 !important;
    padding: 7px 8px !important;
    letter-spacing: 0.5px;
  }

  .legal-bar {
    text-align: center;
    font-size: 9px;
    padding: 4px 4px;
    background: #f8fafc;
    border-top: 1.5px solid #000000 !important;
    border-left: none !important;
    border-right: none !important;
    border-bottom: none !important;
    letter-spacing: 0.4px;
    font-weight: 600;
    line-height: 1.2;
  }
`;

export async function exportToPdf(elementId: string, filename: string): Promise<boolean> {
  const sourceElement = document.getElementById(elementId);
  if (!sourceElement) {
    console.error('[PDF Export] Source element not found:', elementId);
    alert('Error: Invoice element not found.');
    return false;
  }

  // Create isolated iframe to prevent html2canvas from scanning main window's Tailwind v4 oklch() styles
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '-9999px';
  iframe.style.width = '194mm';
  iframe.style.height = '281mm';
  iframe.style.border = 'none';

  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    if (document.body.contains(iframe)) document.body.removeChild(iframe);
    alert('Error initializing PDF canvas.');
    return false;
  }

  // Populate iframe document with standalone pure CSS (zero oklch functions!)
  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>${INVOICE_STANDALONE_CSS}</style>
      </head>
      <body></body>
    </html>
  `);
  iframeDoc.close();

  // Clone source invoice node into isolated iframe body
  const clone = sourceElement.cloneNode(true) as HTMLElement;
  iframeDoc.body.appendChild(clone);

  try {
    // Wait for iframe rendering
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Capture the clone inside the isolated iframe
    const canvas = await html2canvas(clone, {
      scale: 2, // High resolution (300 DPI equivalent)
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: clone.offsetWidth || 733,
      height: clone.offsetHeight || 1062,
    });

    // Create A4 PDF with jsPDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4', // 210mm x 297mm
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const marginX = (210 - 194) / 2; // 8mm left/right margin
    const marginY = 6; // 6mm top margin ensures bottom legal bar fits with margin at bottom

    pdf.addImage(imgData, 'JPEG', marginX, marginY, 194, 281);

    const pdfFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(pdfFilename);

    // Confetti celebration
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.8 },
      colors: ['#10b981', '#3b82f6', '#f59e0b'],
    });

    return true;
  } catch (err) {
    console.error('[PDF Export] Failed:', err);
    alert('PDF generation failed: ' + (err instanceof Error ? err.message : String(err)));
    return false;
  } finally {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  }
}
