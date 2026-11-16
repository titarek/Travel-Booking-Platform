/**
 * Triggers an isolated print of the specified element (e.g. #printable-e-ticket)
 * using a hidden iframe to prevent white screens or style leakage from modals.
 *
 * @param {string} elementId - ID of the container to print (defaults to 'printable-e-ticket')
 * @param {string} title - Window/print document title
 */
export const printTicket = (elementId = 'printable-e-ticket', title = 'Travel Official E-Ticket Voucher') => {
  const element = document.getElementById(elementId);
  if (!element) {
    window.print();
    return;
  }

  // Create an isolated hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();

  // Collect all stylesheets and inline style tags from current page
  const headStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((el) => el.outerHTML)
    .join('\n');

  doc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
        ${headStyles}
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          *, *::before, *::after {
            box-sizing: border-box;
          }
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          #${elementId} {
            max-height: none !important;
            overflow: visible !important;
            padding: 12px !important;
            margin: 0 auto !important;
            width: 100% !important;
            display: block !important;
          }
        </style>
      </head>
      <body>
        <div id="${elementId}" class="p-6 sm:p-8 bg-white text-slate-900 space-y-6">
          ${element.innerHTML}
        </div>
      </body>
    </html>
  `);
  doc.close();

  const doPrint = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch {
      window.print();
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }
  };

  if (iframe.contentWindow.document.readyState === 'complete') {
    setTimeout(doPrint, 200);
  } else {
    iframe.contentWindow.onload = () => setTimeout(doPrint, 200);
  }
};
