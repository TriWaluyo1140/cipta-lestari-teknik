/* Koneksi ke GitHub (dipakai mode edit di halaman & admin.html).
   Token hanya disimpan di browser (sessionStorage / localStorage), tidak pernah di-commit. */
window.GH = (() => {
  const API = "https://api.github.com";
  const CONTENT_PATH = "content.js";

  const store = {
    get(k) { try { return sessionStorage.getItem(k) ?? localStorage.getItem(k); } catch { return null; } },
    set(k, v, persist) { try { (persist ? localStorage : sessionStorage).setItem(k, v); } catch {} },
    clear(k) { try { sessionStorage.removeItem(k); localStorage.removeItem(k); } catch {} },
    persisted(k) { try { return localStorage.getItem(k) != null; } catch { return false; } },
  };

  const cfg = { token: null, owner: "", repo: "", branch: "main" };
  const previews = {}; // path foto → objectURL foto yang baru diupload (Pages belum selesai build)

  function guessRepo() {
    const host = location.hostname;
    if (!host.endsWith(".github.io")) return {};
    const owner = host.split(".")[0];
    const seg = location.pathname.split("/").filter(Boolean)[0];
    return { owner, repo: seg && !seg.endsWith(".html") ? seg : `${owner}.github.io` };
  }
  const g = guessRepo();
  cfg.owner = store.get("gh_owner") || g.owner || "";
  cfg.repo = store.get("gh_repo") || g.repo || "";
  cfg.branch = store.get("gh_branch") || "main";
  cfg.token = store.get("gh_token");

  async function api(path, opts = {}) {
    const res = await fetch(`${API}/repos/${cfg.owner}/${cfg.repo}${path}`, {
      ...opts,
      headers: { Authorization: `Bearer ${cfg.token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", ...(opts.headers || {}) },
    });
    if (!res.ok) {
      const err = new Error((await res.json().catch(() => ({}))).message || res.statusText);
      err.status = res.status;
      throw err;
    }
    return res.json();
  }

  const b64ToText = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, "")), (c) => c.charCodeAt(0)));
  function bytesToB64(bytes) {
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  const ref = () => `?ref=${encodeURIComponent(cfg.branch)}`;
  async function getSha(path) {
    try { return (await api(`/contents/${encodeURI(path)}${ref()}`)).sha; }
    catch (e) { if (e.status === 404) return undefined; throw e; }
  }
  const putFile = (path, b64, message, sha) =>
    api(`/contents/${encodeURI(path)}`, { method: "PUT", body: JSON.stringify({ message, content: b64, branch: cfg.branch, ...(sha ? { sha } : {}) }) });

  /* ---------- Login ---------- */
  async function unlock({ token, owner, repo, branch, remember }) {
    Object.assign(cfg, { token: token ?? cfg.token, owner: owner || cfg.owner, repo: repo || cfg.repo, branch: branch || cfg.branch });
    try {
      const r = await api("");
      if (!r.permissions?.push) throw Object.assign(new Error("Token ini tidak punya izin menulis ke repository."), { status: 403 });
    } catch (e) {
      forget();
      throw e;
    }
    if (token) { store.clear("gh_token"); store.set("gh_token", token, remember); }
    ["owner", "repo", "branch"].forEach((k) => store.set(`gh_${k}`, cfg[k], true));
  }
  function forget() { store.clear("gh_token"); cfg.token = null; }
  const errorText = (e) =>
    e.status === 401 ? "Token salah atau sudah kedaluwarsa." :
    e.status === 404 ? "Repository/file tidak ditemukan, atau token tidak diberi akses ke repository ini." :
    e.status === 409 ? "Konten diubah di tempat lain. Muat ulang halaman lalu ulangi." :
    e.message;

  /* ---------- content.js ---------- */
  async function loadContent() {
    const file = await api(`/contents/${CONTENT_PATH}${ref()}`);
    const sandbox = {};
    try { new Function("window", b64ToText(file.content))(sandbox); }
    catch (e) { throw new Error(`content.js tidak bisa dibaca (ada tanda baca yang rusak): ${e.message}`); }
    if (!sandbox.SITE) throw new Error("content.js tidak berisi window.SITE.");
    return { site: sandbox.SITE, sha: file.sha };
  }
  const serialize = (site) => `/* =====================================================================
   KONTEN WEBSITE
   Cara termudah: buka website → klik "🔒 Admin" di footer → edit langsung.
   Foto ada di folder images/. Bagian dengan "hidden": true tidak ditampilkan.
   ===================================================================== */

window.SITE = ${JSON.stringify(site, null, 2)};
`;
  async function saveContent(site, sha) {
    const res = await putFile(CONTENT_PATH, bytesToB64(new TextEncoder().encode(serialize(site))), "Update konten website", sha);
    return res.content.sha;
  }

  /* ---------- Foto ---------- */
  const slug = (s) => s.toLowerCase().replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "foto";
  async function compress(file, wantPng) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return { blob: file, ext: file.name.split(".").pop().toLowerCase() };
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1920 / Math.max(bmp.width, bmp.height));
    const canvas = Object.assign(document.createElement("canvas"), { width: Math.round(bmp.width * scale), height: Math.round(bmp.height * scale) });
    canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((r) => canvas.toBlob(r, wantPng ? "image/png" : "image/jpeg", 0.85));
    return { blob, ext: wantPng ? "png" : "jpg" };
  }
  // Mengembalikan path baru, mis. "images/tim-1.jpg?v=lq3x9" (?v= agar browser tidak memakai foto lama)
  async function uploadImage(file, currentPath, key) {
    const current = (currentPath || "").split("?")[0];
    const wantPng = key === "logo" || key === "icon" || /\.png$/i.test(current) || (file.type === "image/png" && !current);
    const { blob, ext } = await compress(file, wantPng);
    let path = current.startsWith("images/") ? current : `images/${slug(file.name)}-${Date.now().toString(36)}.${ext}`;
    path = path.replace(/\.[^./]+$/, `.${ext}`);
    await putFile(path, bytesToB64(new Uint8Array(await blob.arrayBuffer())), `Upload foto ${path}`, await getSha(path));
    const versioned = `${path}?v=${Date.now().toString(36)}`;
    previews[versioned] = URL.createObjectURL(blob);
    return versioned;
  }

  return { cfg, store, previews, unlock, forget, errorText, loadContent, saveContent, uploadImage, get hasToken() { return !!cfg.token; } };
})();
