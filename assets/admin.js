/* Halaman admin: edit content.js & upload foto langsung ke GitHub lewat API.
   Token hanya disimpan di browser (sessionStorage / localStorage), tidak pernah di-commit. */

const $ = (id) => document.getElementById(id);
const API = "https://api.github.com";
const CONTENT_PATH = "content.js";

const store = {
  get(k) { try { return sessionStorage.getItem(k) ?? localStorage.getItem(k); } catch { return null; } },
  set(k, v, persist) { try { (persist ? localStorage : sessionStorage).setItem(k, v); } catch {} },
  clear(k) { try { sessionStorage.removeItem(k); localStorage.removeItem(k); } catch {} },
};

let cfg = {};            // { token, owner, repo, branch }
let data = null;         // objek window.SITE yang sedang diedit
let contentSha = null;   // sha content.js terakhir (untuk mencegah tabrakan)
let dirty = false;
let activeTab = null;
const previews = {};     // path foto → objectURL foto yang baru diupload

/* ---------- Label bahasa Indonesia ---------- */
const SECTION_LABELS = {
  company: "Identitas", theme: "Warna", hero: "Bagian Atas", stats: "Angka Pencapaian",
  about: "Tentang Kami", services: "Layanan", projects: "Proyek & Galeri", team: "Tim",
  clients: "Logo Klien", testimonials: "Testimoni", contact: "Kontak", social: "Media Sosial",
};
const LABELS = {
  name: "Nama", shortName: "Singkatan (tampil jika logo kosong)", logo: "Logo", tagline: "Tagline",
  description: "Deskripsi untuk Google (maks. 160 karakter)", primary: "Warna utama", accent: "Warna aksen",
  title: "Judul", subtitle: "Subjudul", image: "Foto", photo: "Foto", buttons: "Tombol", label: "Teks tombol",
  href: "Link", value: "Angka", paragraphs: "Paragraf", vision: "Visi", mission: "Misi", items: "Daftar",
  icon: "Ikon (emoji)", text: "Keterangan", category: "Kategori", role: "Jabatan", logos: "Logo",
  quote: "Isi testimoni", company: "Perusahaan", address: "Alamat", phone: "Telepon", email: "Email",
  whatsapp: "Nomor WhatsApp (format 62…)", hours: "Jam operasional", mapEmbed: "Link embed Google Maps", url: "Link",
};
const IMAGE_KEYS = ["image", "photo", "logo"];
const COLOR_KEYS = ["primary", "accent"];
const LONG_KEYS = ["description", "subtitle", "text", "quote", "vision", "address", "paragraphs", "mission"];
const ALWAYS_ON = ["company", "theme"];

/* ---------- GitHub API ---------- */
async function gh(path, opts = {}) {
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
const textToB64 = (txt) => bytesToB64(new TextEncoder().encode(txt));
function bytesToB64(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
async function getSha(path) {
  try { return (await gh(`/contents/${encodeURI(path)}?ref=${encodeURIComponent(cfg.branch)}`)).sha; }
  catch (e) { if (e.status === 404) return undefined; throw e; }
}
async function putFile(path, b64, message, sha) {
  return gh(`/contents/${encodeURI(path)}`, { method: "PUT", body: JSON.stringify({ message, content: b64, branch: cfg.branch, ...(sha ? { sha } : {}) }) });
}

/* ---------- Login ---------- */
function guessRepo() {
  const host = location.hostname;
  if (!host.endsWith(".github.io")) return {};
  const owner = host.split(".")[0];
  const seg = location.pathname.split("/").filter(Boolean)[0];
  return { owner, repo: seg && !seg.endsWith(".html") ? seg : `${owner}.github.io` };
}
function initLogin() {
  const g = guessRepo();
  $("owner").value = store.get("gh_owner") || g.owner || "";
  $("repo").value = store.get("gh_repo") || g.repo || "";
  $("branch").value = store.get("gh_branch") || "main";
  const updateLabel = () => { $("repoLabel").textContent = $("owner").value && $("repo").value ? `${$("owner").value}/${$("repo").value}` : "belum diisi"; };
  ["owner", "repo"].forEach((id) => $(id).addEventListener("input", updateLabel));
  updateLabel();
  if (!$("owner").value || !$("repo").value) $("repoBox").open = true;

  $("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    cfg = { token: $("token").value.trim(), owner: $("owner").value.trim(), repo: $("repo").value.trim(), branch: $("branch").value.trim() || "main" };
    await unlock($("remember").checked);
  });

  const saved = store.get("gh_token");
  if (saved && $("owner").value && $("repo").value) {
    cfg = { token: saved, owner: $("owner").value, repo: $("repo").value, branch: $("branch").value };
    unlock(!!localStorage.getItem("gh_token"));
  }
}
async function unlock(remember) {
  $("loginError").textContent = "";
  $("loginBtn").disabled = true;
  $("loginBtn").textContent = "Memeriksa…";
  try {
    const repo = await gh("");
    if (!repo.permissions?.push) throw Object.assign(new Error("Token ini tidak punya izin menulis ke repository."), { status: 403 });
    await loadContent();
    store.clear("gh_token");
    store.set("gh_token", cfg.token, remember);
    ["owner", "repo", "branch"].forEach((k) => store.set(`gh_${k}`, cfg[k], true));
    $("login").hidden = true;
    $("editor").hidden = false;
    $("repoInfo").textContent = `${cfg.owner}/${cfg.repo} · ${cfg.branch}`;
  } catch (e) {
    store.clear("gh_token");
    $("loginError").textContent =
      e.status === 401 ? "Token salah atau sudah kedaluwarsa." :
      e.status === 404 ? "Repository/file tidak ditemukan, atau token tidak diberi akses ke repository ini." :
      e.message;
  } finally {
    $("loginBtn").disabled = false;
    $("loginBtn").textContent = "Buka Kunci";
  }
}

/* ---------- Muat & simpan content.js ---------- */
async function loadContent() {
  const file = await gh(`/contents/${CONTENT_PATH}?ref=${encodeURIComponent(cfg.branch)}`);
  contentSha = file.sha;
  const sandbox = {};
  try { new Function("window", b64ToText(file.content))(sandbox); }
  catch (e) { throw new Error(`content.js tidak bisa dibaca (ada tanda baca yang rusak): ${e.message}`); }
  if (!sandbox.SITE) throw new Error("content.js tidak berisi window.SITE.");
  startEditor(sandbox.SITE);
}
function serialize(obj) {
  return `/* =====================================================================
   KONTEN WEBSITE
   Edit lewat halaman admin.html (disarankan), atau langsung di file ini.
   Foto ada di folder images/. Bagian dengan "hidden": true tidak ditampilkan.
   ===================================================================== */

window.SITE = ${JSON.stringify(obj, null, 2)};
`;
}
async function save() {
  $("saveBtn").disabled = true;
  $("saveBtn").textContent = "Menyimpan…";
  try {
    const res = await putFile(CONTENT_PATH, textToB64(serialize(data)), "Update konten website via admin", contentSha);
    contentSha = res.content.sha;
    setDirty(false);
    toast("Tersimpan ✓ Website ter-update dalam ±1 menit.");
  } catch (e) {
    toast(e.status === 409 ? "Konten diubah di tempat lain. Muat ulang halaman ini lalu ulangi." : `Gagal menyimpan: ${e.message}`, true);
    $("saveBtn").disabled = false;
  } finally {
    $("saveBtn").textContent = "Simpan";
  }
}
function setDirty(v) {
  dirty = v;
  $("saveBtn").disabled = !v;
}

/* ---------- Upload foto ---------- */
const slug = (s) => s.toLowerCase().replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "foto";
async function compress(file, wantPng) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return { blob: file, ext: file.name.split(".").pop().toLowerCase() };
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1920 / Math.max(bmp.width, bmp.height));
  const canvas = Object.assign(document.createElement("canvas"), { width: Math.round(bmp.width * scale), height: Math.round(bmp.height * scale) });
  canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const type = wantPng ? "image/png" : "image/jpeg";
  const blob = await new Promise((r) => canvas.toBlob(r, type, 0.85));
  return { blob, ext: wantPng ? "png" : "jpg" };
}
async function uploadImage(file, currentPath, key) {
  // Logo tetap PNG agar latar transparan tidak hilang
  const wantPng = key === "logo" || /\.png$/i.test(currentPath || "") || (file.type === "image/png" && !currentPath);
  const { blob, ext } = await compress(file, wantPng);
  let path = currentPath && currentPath.startsWith("images/") ? currentPath : `images/${slug(file.name)}.${ext}`;
  path = path.replace(/\.[^./]+$/, `.${ext}`);
  const b64 = bytesToB64(new Uint8Array(await blob.arrayBuffer()));
  await putFile(path, b64, `Upload foto ${path} via admin`, await getSha(path));
  previews[path] = URL.createObjectURL(blob);
  return path;
}

/* ---------- Form editor ---------- */
const labelOf = (key) => LABELS[key] || key;
const isImageKey = (k) => IMAGE_KEYS.includes(k);

function startEditor(obj) {
  data = obj;
  setDirty(false);
  const keys = Object.keys(data);
  activeTab = activeTab && keys.includes(activeTab) ? activeTab : keys[0];
  renderTabs();
  renderPanel();
}
function renderTabs() {
  $("tabs").innerHTML = "";
  Object.keys(data).forEach((key) => {
    const b = document.createElement("button");
    b.className = "tab" + (key === activeTab ? " active" : "");
    b.innerHTML = `<span>${SECTION_LABELS[key] || key}</span>${isHidden(key) ? '<span class="off">off</span>' : ""}`;
    b.onclick = () => { activeTab = key; renderTabs(); renderPanel(); };
    $("tabs").appendChild(b);
  });
}
const isHidden = (key) => data[key] === null || data[key]?.hidden === true;

function renderPanel() {
  const key = activeTab;
  const val = data[key];
  const panel = $("panel");
  panel.innerHTML = "";
  const head = el("div", "panel-head");
  head.appendChild(el("h2", "", SECTION_LABELS[key] || key));

  const body = el("div", "fields");
  if (val && typeof val === "object" && !Array.isArray(val) && !ALWAYS_ON.includes(key)) {
    const t = el("label", "toggle");
    t.innerHTML = `<input type="checkbox" ${val.hidden ? "" : "checked"}><i></i> Tampilkan di website`;
    t.querySelector("input").onchange = (e) => {
      if (e.target.checked) delete val.hidden; else val.hidden = true;
      body.classList.toggle("section-off", !!val.hidden);
      setDirty(true);
      renderTabs();
    };
    head.appendChild(t);
    body.classList.toggle("section-off", !!val.hidden);
  }
  panel.appendChild(head);

  if (val === null) {
    body.appendChild(el("p", "muted", 'Bagian ini dimatikan (null) di content.js. Untuk mengaktifkannya kembali, isi strukturnya di content.js — atau lain kali gunakan tombol "Tampilkan di website".'));
  } else {
    renderValue(body, data, key, key, true);
  }
  panel.appendChild(body);
}

// Render satu nilai (string / array / objek) yang tersimpan di parent[key]
function renderValue(container, parent, key, path, isRoot) {
  const v = parent[key];
  if (Array.isArray(v)) container.appendChild(renderArray(parent, key, path, isRoot));
  else if (v && typeof v === "object") {
    if (isRoot) Object.keys(v).forEach((k) => k !== "hidden" && renderValue(container, v, k, `${path}.${k}`));
    else {
      const g = el("div", "group");
      g.appendChild(el("div", "group-title", labelOf(key)));
      Object.keys(v).forEach((k) => renderValue(g, v, k, `${path}.${k}`));
      container.appendChild(g);
    }
  } else container.appendChild(renderField(parent, key, labelOf(key)));
}

function renderField(parent, key, label, contextKey) {
  const k = contextKey || key;
  const wrap = el("label");
  wrap.append(label || "");
  const set = (val) => { parent[key] = val; setDirty(true); };

  if (isImageKey(k)) {
    wrap.appendChild(renderImage(parent, key, k));
  } else if (COLOR_KEYS.includes(k)) {
    const row = el("div", "color-field");
    const picker = Object.assign(document.createElement("input"), { type: "color", value: /^#[0-9a-f]{6}$/i.test(parent[key]) ? parent[key] : "#ff7a00" });
    const text = Object.assign(document.createElement("input"), { value: parent[key] ?? "" });
    picker.oninput = () => { text.value = picker.value.toUpperCase(); set(text.value); };
    text.oninput = () => { if (/^#[0-9a-f]{6}$/i.test(text.value)) picker.value = text.value; set(text.value); };
    row.append(picker, text);
    wrap.appendChild(row);
  } else {
    const long = LONG_KEYS.includes(k);
    const input = document.createElement(long ? "textarea" : "input");
    input.value = parent[key] ?? "";
    if (long) input.rows = 3;
    input.oninput = () => set(input.value);
    wrap.appendChild(input);
  }
  return wrap;
}

function renderImage(parent, key, k) {
  const box = el("div", "image-field");
  const thumb = el("div", "thumb");
  const meta = el("div", "image-meta");
  const code = el("code");
  const btns = el("div", "btns");
  const file = Object.assign(document.createElement("input"), { type: "file", accept: "image/*", hidden: true });
  const upBtn = el("button", "btn-sm", "📷 Upload / ganti foto");
  upBtn.type = "button";
  upBtn.onclick = (e) => { e.preventDefault(); file.click(); };

  const draw = () => {
    const p = parent[key];
    code.textContent = p || "(belum ada foto)";
    thumb.innerHTML = "";
    if (!p) { thumb.textContent = "Belum ada"; return; }
    const img = document.createElement("img");
    const raw = `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${cfg.branch}/${p}`;
    img.src = previews[p] || `${p}?t=${Date.now()}`;
    img.onerror = () => { if (img.src !== raw) img.src = raw; else thumb.textContent = "Belum diupload"; };
    thumb.appendChild(img);
  };
  file.onchange = async () => {
    const f = file.files[0];
    if (!f) return;
    upBtn.disabled = true;
    upBtn.textContent = "Mengupload…";
    try {
      const path = await uploadImage(f, parent[key], k);
      if (parent[key] !== path) { parent[key] = path; setDirty(true); }
      draw();
      toast(dirty ? "Foto terupload ✓ Klik Simpan untuk menerapkan." : "Foto terupload ✓ Website ter-update dalam ±1 menit.");
    } catch (e) {
      toast(`Upload gagal: ${e.message}`, true);
    } finally {
      upBtn.disabled = false;
      upBtn.textContent = "📷 Upload / ganti foto";
      file.value = "";
    }
  };
  btns.append(upBtn, file);
  meta.append(code, btns);
  box.append(thumb, meta);
  draw();
  return box;
}

function renderArray(parent, key, path, isRoot) {
  const arr = parent[key];
  const wrap = el("div", isRoot ? "fields" : "group");
  if (!isRoot) wrap.appendChild(el("div", "group-title", labelOf(key)));
  const list = el("div", "list");
  wrap.appendChild(list);

  const redraw = () => {
    list.innerHTML = "";
    arr.forEach((item, i) => {
      const tools = el("div", "item-tools");
      const mk = (txt, title, fn, cls = "") => {
        const b = el("button", "icon-btn " + cls, txt);
        b.type = "button"; b.title = title;
        b.onclick = (e) => { e.preventDefault(); fn(); setDirty(true); redraw(); };
        tools.appendChild(b);
      };
      if (i > 0) mk("↑", "Naikkan", () => arr.splice(i - 1, 0, arr.splice(i, 1)[0]));
      if (i < arr.length - 1) mk("↓", "Turunkan", () => arr.splice(i + 1, 0, arr.splice(i, 1)[0]));
      mk("✕", "Hapus", () => { if (confirm("Hapus item ini?")) arr.splice(i, 1); }, "danger");

      if (item && typeof item === "object") {
        const card = el("div", "item");
        const h = el("div", "item-head");
        h.append(el("b", "", `#${i + 1} ${item.title || item.name || item.label || ""}`), tools);
        const grid = el("div", "item-grid");
        Object.keys(item).forEach((k) => {
          const f = renderField(item, k, labelOf(k));
          if (LONG_KEYS.includes(k) || isImageKey(k)) f.style.gridColumn = "1 / -1";
          grid.appendChild(f);
        });
        card.append(h, grid);
        list.appendChild(card);
      } else {
        const card = el("div", "item simple");
        card.append(renderField(arr, i, "", key), tools);
        list.appendChild(card);
      }
    });
  };
  redraw();

  const add = el("button", "btn-sm", "+ Tambah");
  add.type = "button";
  add.onclick = (e) => {
    e.preventDefault();
    const tpl = arr[arr.length - 1];
    arr.push(tpl && typeof tpl === "object" ? Object.fromEntries(Object.keys(tpl).map((k) => [k, ""])) : "");
    setDirty(true);
    redraw();
  };
  const addRow = el("div");
  addRow.appendChild(add);
  wrap.appendChild(addRow);
  return wrap;
}

/* ---------- Util ---------- */
function el(tag, cls = "", text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}
let toastTimer;
function toast(msg, isErr) {
  const t = $("toast");
  t.textContent = msg;
  t.className = "toast" + (isErr ? " err" : "");
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), isErr ? 7000 : 4000);
}

$("saveBtn").onclick = save;
$("logoutBtn").onclick = () => {
  if (dirty && !confirm("Ada perubahan yang belum disimpan. Tetap kunci?")) return;
  store.clear("gh_token");
  location.reload();
};
addEventListener("beforeunload", (e) => { if (dirty) e.preventDefault(); });
addEventListener("keydown", (e) => { if ((e.ctrlKey || e.metaKey) && e.key === "s" && dirty) { e.preventDefault(); save(); } });

initLogin();
