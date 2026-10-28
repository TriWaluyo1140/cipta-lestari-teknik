/* Halaman admin (pengaturan lengkap dalam bentuk form). Koneksi GitHub ada di github.js */

const $ = (id) => document.getElementById(id);
const cfg = GH.cfg;

let data = null;         // objek window.SITE yang sedang diedit
let contentSha = null;   // sha content.js terakhir (untuk mencegah tabrakan)
let dirty = false;
let activeTab = null;

/* ---------- Label bahasa Indonesia ---------- */
const SECTION_LABELS = {
  company: "Identitas", theme: "Warna", hero: "Bagian Atas", stats: "Angka Pencapaian",
  about: "Tentang Kami", services: "Layanan", projects: "Proyek & Galeri", team: "Tim",
  clients: "Logo Klien", customers: "Pelanggan Kami", testimonials: "Testimoni", contact: "Kontak", social: "Media Sosial",
};
const LABELS = {
  name: "Nama", shortName: "Singkatan (tampil jika logo kosong)", logo: "Logo", tagline: "Tagline",
  description: "Deskripsi untuk Google (maks. 160 karakter)", primary: "Warna utama", accent: "Warna aksen", nameColor: "Warna nama perusahaan",
  title: "Judul", subtitle: "Subjudul", image: "Foto", photo: "Foto", buttons: "Tombol", label: "Teks tombol",
  href: "Link", value: "Angka", paragraphs: "Paragraf", vision: "Visi", mission: "Misi", items: "Daftar",
  icon: "Ikon (emoji)", text: "Keterangan", category: "Kategori", role: "Jabatan", logos: "Logo", id: "Bahasa Indonesia", en: "English", images: "Foto-foto", chart: "Struktur Organisasi", children: "Bawahan",
  quote: "Isi testimoni", company: "Perusahaan", address: "Alamat", phone: "Telepon", email: "Email",
  whatsapp: "Nomor WhatsApp (format 62…)", hours: "Jam operasional", mapEmbed: "Link embed Google Maps", url: "Link",
};
const IMAGE_KEYS = ["image", "images", "photo", "logo"];
const COLOR_KEYS = ["primary", "accent", "nameColor"];
const LONG_KEYS = ["description", "subtitle", "text", "quote", "vision", "address", "paragraphs", "mission"];
const ALWAYS_ON = ["company", "theme"];

/* ---------- Login ---------- */
function initLogin() {
  $("owner").value = cfg.owner;
  $("repo").value = cfg.repo;
  $("branch").value = cfg.branch;
  const updateLabel = () => { $("repoLabel").textContent = $("owner").value && $("repo").value ? `${$("owner").value}/${$("repo").value}` : "belum diisi"; };
  ["owner", "repo"].forEach((id) => $(id).addEventListener("input", updateLabel));
  updateLabel();
  if (!$("owner").value || !$("repo").value) $("repoBox").open = true;

  $("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    unlock({ token: $("token").value.trim(), owner: $("owner").value.trim(), repo: $("repo").value.trim(), branch: $("branch").value.trim() || "main", remember: $("remember").checked });
  });

  // Sudah buka kunci di halaman website / sebelumnya → langsung masuk
  if (GH.hasToken && cfg.owner && cfg.repo) unlock({});
}
async function unlock(opts) {
  $("loginError").textContent = "";
  $("loginBtn").disabled = true;
  $("loginBtn").textContent = "Memeriksa…";
  try {
    await GH.unlock(opts);
    const { site, sha } = await GH.loadContent();
    contentSha = sha;
    startEditor(site);
    $("login").hidden = true;
    $("editor").hidden = false;
    $("repoInfo").textContent = `${cfg.owner}/${cfg.repo} · ${cfg.branch}`;
  } catch (e) {
    $("loginError").textContent = GH.errorText(e);
  } finally {
    $("loginBtn").disabled = false;
    $("loginBtn").textContent = "Buka Kunci";
  }
}

/* ---------- Simpan content.js ---------- */
async function save() {
  $("saveBtn").disabled = true;
  $("saveBtn").textContent = "Menyimpan…";
  try {
    contentSha = await GH.saveContent(data, contentSha);
    setDirty(false);
    toast("Tersimpan ✓ Website ter-update dalam ±1 menit.");
  } catch (e) {
    toast(`Gagal menyimpan: ${GH.errorText(e)}`, true);
    $("saveBtn").disabled = false;
  } finally {
    $("saveBtn").textContent = "Simpan";
  }
}
function setDirty(v) {
  dirty = v;
  $("saveBtn").disabled = !v;
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
    code.textContent = p ? p.split("?")[0] : "(belum ada foto)";
    thumb.innerHTML = "";
    if (!p) { thumb.textContent = "Belum ada"; return; }
    const img = document.createElement("img");
    const raw = `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${cfg.branch}/${p.split("?")[0]}`;
    img.src = GH.previews[p] || p;
    img.onerror = () => { if (img.src !== raw) img.src = raw; else thumb.textContent = "Belum diupload"; };
    thumb.appendChild(img);
  };
  file.onchange = async () => {
    const f = file.files[0];
    if (!f) return;
    upBtn.disabled = true;
    upBtn.textContent = "Mengupload…";
    try {
      const path = await GH.uploadImage(f, parent[key], k);
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
        const txt = (v) => (v && typeof v === "object" ? v.id : v) || "";
        h.append(el("b", "", `#${i + 1} ${txt(item.title) || txt(item.name) || txt(item.label)}`), tools);
        const grid = el("div", "item-grid");
        Object.keys(item).forEach((k) => {
          if (item[k] && typeof item[k] === "object") {
            const sub = el("div");
            sub.style.gridColumn = "1 / -1";
            renderValue(sub, item, k, `${path}.${k}`);
            return grid.appendChild(sub);
          }
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
    const blank = (o) => Object.fromEntries(Object.keys(o).map((k) => [k, Array.isArray(o[k]) ? [] : ""]));
    arr.push(tpl && typeof tpl === "object" ? blank(tpl) : key === "children" ? { photo: "", name: "", role: "", children: [] } : "");
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
  GH.forget();
  location.reload();
};
addEventListener("beforeunload", (e) => { if (dirty) e.preventDefault(); });
addEventListener("keydown", (e) => { if ((e.ctrlKey || e.metaKey) && e.key === "s" && dirty) { e.preventDefault(); save(); } });

initLogin();
