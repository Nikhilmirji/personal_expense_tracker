import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function testAPIs() {
  try {
    console.log("Testing mfapi.in search...");
    const mfSearchRes = await fetch("https://api.mfapi.in/mf/search?q=Parag Parikh");
    const mfSearchData = await mfSearchRes.json();
    console.log("MF Search Match 1:", mfSearchData.slice(0, 1));

    console.log("\nTesting mfapi.in historical...");
    const mfNavRes = await fetch(`https://api.mfapi.in/mf/${mfSearchData[0].schemeCode}`);
    const mfNavData = await mfNavRes.json();
    console.log("MF Meta:", mfNavData.meta);
    console.log("MF Latest NAV:", mfNavData.data[0]);

    console.log("\nTesting Yahoo Finance stock quote via corsproxy.io (v7/finance/quote)...");
    const stockSymbol = "TATAMOTORS.NS";
    const stockRes = await fetch(`https://corsproxy.io/?https://query1.finance.yahoo.com/v7/finance/quote?symbols=${stockSymbol}`);
    const stockData = await stockRes.json();
    console.log("Raw Stock Data:", JSON.stringify(stockData).substring(0, 1000));
  } catch (e) {
    console.error("API test failed:", e);
  }
}
testAPIs();
