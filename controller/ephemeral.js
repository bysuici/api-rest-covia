import { getEphemeral, putEphemeral } from "../lib/ephemeral-store.js";
import { renderPdfBufferFromHtml } from "../services/ephemeral.js";
import { sanitizeName, withExt } from "../utils/filename-utils.js";
import { buildEphemeralUrl } from "../utils/url-utils.js";

export async function exportPdf(req, res) {
  try {
    const { html, filename, ttlSec } = req.body || {};
    if (!html || typeof html !== "string") {
      return res
        .status(400)
        .json({ ok: false, message: "html requerido (string)" });
    }
    if (html.length > 1_500_000) {
      return res
        .status(413)
        .json({ ok: false, message: "HTML demasiado grande" });
    }

    const baseName = withExt(sanitizeName(filename, "reporte"), ".pdf");
    const buffer = await renderPdfBufferFromHtml(html);
    const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

    const { token, expiresAt } = putEphemeral(buf, {
      mime: "application/pdf",
      filename: baseName,
      ttlSec: Number.isFinite(ttlSec) ? ttlSec : undefined,
    });

    return res.json({
      ok: true,
      filename: baseName,
      fileUrl: buildEphemeralUrl(req, token),
      mimeType: "application/pdf",
      expiresAt: new Date(expiresAt).toISOString(),
    });
  } catch (e) {
    const status = e.status || 500;
    return res
      .status(status)
      .json({ ok: false, message: e.message || "Error al exportar PDF" });
  }
}

export function downloadEphemeral(req, res) {
  try {
    const { token } = req.params || {};
    const item = getEphemeral(token);
    if (!item) return res.status(404).send("Not found or expired");

    res.setHeader("Content-Type", item.mime || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(item.filename || "archivo")}"`
    );
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("X-Expires-At", new Date(item.expiresAt).toISOString());

    return res.end(item.buffer);
  } catch {
    return res.status(500).send("Internal error");
  }
}
