import puppeteer from "puppeteer";

export async function renderPdfBufferFromHtml(html) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: ["load", "domcontentloaded", "networkidle0"] });
    return await page.pdf({
      printBackground: true,
      format: "A4",
      margin: { top: "16mm", right: "12mm", bottom: "16mm", left: "12mm" },
    });
  } finally {
    await browser.close();
  }
}
