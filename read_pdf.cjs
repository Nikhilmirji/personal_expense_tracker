const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function read() {
  try {
    const data = new Uint8Array(fs.readFileSync('gpay_statement_20260401_20260430.pdf'));
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    let fullText = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText.push(textContent.items.map(i => i.str).join(' | '));
    }
    console.log(fullText.join('\n').substring(0, 2000));
  } catch (e) {
    console.error(e);
  }
}
read();
