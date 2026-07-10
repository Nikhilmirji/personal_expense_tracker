import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const data = new Uint8Array(fs.readFileSync('gpay_statement_20260401_20260430.pdf'));
const pdf = await pdfjsLib.getDocument({ data }).promise;
const page = await pdf.getPage(1);
const textContent = await page.getTextContent();
console.log(textContent.items.map(i => i.str).join('\n'));
