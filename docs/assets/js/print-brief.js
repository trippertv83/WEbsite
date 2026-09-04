/**
 * PDF-Druck ohne GitHub-Kopfzeile: eigenes about:blank-Dokument mit Briefkopf.
 */
export function printWithLetterhead(bodyHtml) {
  const kopf = new URL('assets/briefpapier-kopf.png', document.baseURI).href;
  const styles = [
    ...[...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => `<link rel="stylesheet" href="${l.href}">`),
    ...[...document.querySelectorAll('style')].map((s) => s.outerHTML),
    `<style>
      @page {
        size: A4;
        margin: 10mm 12mm 12mm 12mm;
        @top-left { content: none; }
        @top-center { content: none; }
        @top-right { content: none; }
        @bottom-left { content: none; }
        @bottom-center { content: none; }
        @bottom-right { content: none; }
      }
      html, body {
        background: #fff !important;
        margin: 0 !important;
        padding: 0 !important;
        color: #1c222b !important;
        font-family: 'Segoe UI', system-ui, sans-serif;
      }
      .page, .screen-ui, header.app, #explain, #print-root, #spaderna-print-frame {
        display: none !important;
      }
      table.print-sheet {
        width: 100%;
        border-collapse: collapse;
      }
      table.print-sheet > thead { display: table-header-group; }
      table.print-sheet > tbody { display: table-row-group; }
      table.print-sheet > thead > tr > td,
      table.print-sheet > tbody > tr > td {
        border: 0 !important;
        padding: 0 !important;
        vertical-align: top;
      }
      img.print-kopf {
        position: static !important;
        top: auto !important;
        left: auto !important;
        width: 100% !important;
        height: auto !important;
        max-height: 30mm;
        display: block;
        margin: 0 0 5mm;
        object-fit: contain;
        object-position: left top;
      }
      .print-body { color: #1c222b; }
      .print-best-head { display: block !important; }
      .print-cover, .print-best { page-break-after: always; break-after: page; }
      .path-row { display: none !important; }
      .tile, .tiles, .card {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    </style>`,
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>Ingenieurbüro Spaderna</title>
${styles}
</head>
<body>
<table class="print-sheet">
<thead><tr><td><img class="print-kopf" src="${kopf}" alt=""></td></tr></thead>
<tbody><tr><td class="print-body">${bodyHtml}</td></tr></tbody>
</table>
</body>
</html>`;

  let iframe = document.getElementById('spaderna-print-frame');
  if (iframe) iframe.remove();
  iframe = document.createElement('iframe');
  iframe.id = 'spaderna-print-frame';
  iframe.title = 'Druckansicht';
  iframe.style.cssText = 'position:absolute;width:1024px;height:800px;left:-12000px;top:0;border:0;';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  doc.open();
  doc.write(html);
  doc.close();

  const run = () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  };
  const img = doc.querySelector('.print-kopf');
  if (img && !img.complete) {
    img.addEventListener('load', () => setTimeout(run, 80), { once: true });
    img.addEventListener('error', () => setTimeout(run, 80), { once: true });
  } else {
    setTimeout(run, 120);
  }
}
