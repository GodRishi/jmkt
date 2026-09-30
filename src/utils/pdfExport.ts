import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import confetti from 'canvas-confetti';

export async function exportToPdf(elementId: string, filename: string): Promise<boolean> {
  // 1. Locate source template element
  const sourceElement = document.getElementById(elementId);
  if (!sourceElement) {
    console.error('[PDF Export] Source element not found:', elementId);
    alert('Error: Invoice element not found.');
    return false;
  }

  // 2. Create temporary container positioned offscreen
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'fixed';
  tempContainer.style.left = '0';
  tempContainer.style.top = '0';
  tempContainer.style.width = '194mm';
  tempContainer.style.height = '281mm';
  tempContainer.style.zIndex = '-9999';
  tempContainer.style.opacity = '1';
  tempContainer.style.pointerEvents = 'none';
  tempContainer.style.backgroundColor = '#ffffff';
  tempContainer.style.overflow = 'hidden';

  // Deep clone source node so original DOM is left untouched
  const clone = sourceElement.cloneNode(true) as HTMLElement;
  tempContainer.appendChild(clone);
  document.body.appendChild(tempContainer);

  try {
    // Wait briefly for layout & fonts in clone
    await new Promise((resolve) => setTimeout(resolve, 250));

    // 3. Capture canvas with html2canvas, stripping oklch() color functions from cloned document stylesheets
    const canvas = await html2canvas(clone, {
      scale: 2, // High resolution (300 DPI equivalent)
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 1200,
      windowHeight: 1600,
      onclone: (clonedDoc) => {
        // Fix: html2canvas does not support CSS oklch() / oklab() color functions introduced in Tailwind v4.
        // We sanitize all <style> tags and stylesheets in the cloned document before html2canvas parses them.
        
        // 1. Sanitize all <style> tags
        const styleElements = Array.from(clonedDoc.querySelectorAll('style'));
        for (const style of styleElements) {
          if (style.textContent && (style.textContent.includes('oklch') || style.textContent.includes('oklab'))) {
            style.textContent = style.textContent
              .replace(/oklch\([^)]+\)/gi, '#0f172a')
              .replace(/oklab\([^)]+\)/gi, '#0f172a');
          }
        }

        // 2. Sanitize inline style attributes on all elements
        const allNodes = Array.from(clonedDoc.querySelectorAll('*'));
        for (const node of allNodes) {
          const el = node as HTMLElement;
          if (el.style && el.style.cssText && (el.style.cssText.includes('oklch') || el.style.cssText.includes('oklab'))) {
            el.style.cssText = el.style.cssText
              .replace(/oklch\([^)]+\)/gi, '#0f172a')
              .replace(/oklab\([^)]+\)/gi, '#0f172a');
          }
        }
      },
    });

    // 4. Create jsPDF A4 Document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4', // 210mm x 297mm
    });

    // Center 194mm x 281mm template inside 210mm x 297mm A4 page
    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const marginX = (210 - 194) / 2; // 8mm left/right margin
    const marginY = (297 - 281) / 2; // 8mm top/bottom margin

    pdf.addImage(imgData, 'JPEG', marginX, marginY, 194, 281);

    // 5. Trigger download directly via jsPDF
    const pdfFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(pdfFilename);

    // 6. Confetti celebration
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
    // Clean up temp container safely
    if (document.body.contains(tempContainer)) {
      document.body.removeChild(tempContainer);
    }
  }
}
