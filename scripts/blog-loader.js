/* blog-loader.js
 * Loads blog content from content/<BLOG_NAME>.docx  (rendered as HTML via mammoth)
 *                        or content/<BLOG_NAME>.pages (PDF preview extracted via JSZip)
 *
 * Usage: set  window.BLOG_NAME = 'blog5'  before this script runs.
 */

(async () => {
    const name      = window.BLOG_NAME;
    const container = document.getElementById('blog-content');
    if (!name || !container) return;

    // ── 1. Try .docx ─────────────────────────────────────────────────────────
    try {
        const res = await fetch(`content/${name}.docx`);
        if (res.ok) {
            const buf    = await res.arrayBuffer();
            const result = await mammoth.convertToHtml({ arrayBuffer: buf });
            container.innerHTML = result.value;
            return;
        }
    } catch (_) {}

    // ── 2. Try .pages (ZIP → QuickLook/Preview.pdf) ──────────────────────────
    try {
        const res = await fetch(`content/${name}.pages`);
        if (res.ok) {
            const buf  = await res.arrayBuffer();
            const zip  = await JSZip.loadAsync(buf);
            const pdf  = zip.file('QuickLook/Preview.pdf');
            if (pdf) {
                const blob = await pdf.async('blob');
                const url  = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
                container.innerHTML =
                    `<embed src="${url}" type="application/pdf" width="100%" style="height:80vh;border:none;">`;
                return;
            }
        }
    } catch (_) {}

    // ── 3. Nothing found ─────────────────────────────────────────────────────
    container.innerHTML = `
        <p class="blog-content-loading">
            blog content not found — place
            <code>content/${name}.docx</code> or
            <code>content/${name}.pages</code>
            in <code>pages/blogs/content/</code> to load it here.
        </p>`;
})();
