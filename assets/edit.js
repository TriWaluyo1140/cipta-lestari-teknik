/* Mode edit langsung di halaman: klik "🔒 Admin" di footer → masukkan token GitHub →
   klik teks untuk mengetik, klik "📷 Ganti" untuk upload foto, lalu Simpan. */
(function () {
  const SECTION_LABELS = {
    hero: "Bagian Atas", about: "Tentang Kami", services: "Layanan", projects: "Proyek & Galeri",
    team: "Tim", clients: "Logo Klien", testimonials: "Testimoni", contact: "Kontak",
  };
  // Isi awal saat menekan "+ Tambah"
  const TEMPLATES = {
    stats: { value: "0", label: "Keterangan" },
    "about.paragraphs": "Paragraf baru.",
    "about.mission": "Misi baru.",
    "services.items": { icon: "⭐", title: "Layanan Baru", text: "Keterangan singkat layanan." },
    "projects.items": { images: [], title: "Proyek Baru", category: "Kategori" },
    "clients.logos": { image: "", name: "Klien" },
    "testimonials.items": { quote: "Isi testimoni.", name: "Nama Klien", company: "Perusahaan" },
  };

  let sha = null;
  let dirty = false;
  const editing = () => document.body.classList.contains("editing");

  /* ---------- Akses data lewat path "team.items.0.name" ---------- */
  const getPath = (path) => path.split(".").reduce((o, k) => o?.[k], window.SITE);
  function setPath(path, val) {
    const keys = path.split(".");
    const last = keys.pop();
    keys.reduce((o, k) => o[k], window.SITE)[last] = val;
  }
  const splitLast = (path) => { const i = path.lastIndexOf("."); return [path.slice(0, i), +path.slice(i + 1)]; };

  /* ---------- Elemen antarmuka ---------- */
  document.body.insertAdjacentHTML("beforeend", `
    <div class="edit-ui edit-modal" id="editModal" hidden>
      <form class="edit-card" id="editForm" autocomplete="off">
        <button type="button" class="edit-x" id="editClose" aria-label="Tutup">×</button>
        <div class="edit-lock">🔒</div>
        <h2>Mode Edit</h2>
        <p class="edit-muted">Masukkan token GitHub untuk mengubah isi website langsung di halaman ini.</p>
        <label>Token GitHub<input type="password" id="editToken" placeholder="github_pat_…" required></label>
        <div class="edit-repo" id="editRepo">
          <label>Pemilik / akun<input id="editOwner"></label>
          <label>Nama repo<input id="editRepoName"></label>
        </div>
        <label class="edit-check"><input type="checkbox" id="editRemember"> Ingat di perangkat ini</label>
        <button class="edit-btn" id="editGo">Buka Kunci</button>
        <p class="edit-err" id="editErr"></p>
        <a class="edit-muted" href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">Belum punya token? Buat di GitHub ↗</a>
      </form>
    </div>
    <div class="edit-ui edit-bar" id="editBar" hidden>
      <span class="edit-bar-title"><i></i>Mode Edit <small>klik teks / foto untuk mengubah</small></span>
      <a class="edit-btn-sm" href="admin.html" target="_blank" title="Logo, warna, link tombol, media sosial, peta">⚙️ <span>Pengaturan</span></a>
      <button class="edit-btn-sm" id="editExit">Keluar</button>
      <button class="edit-btn" id="editSave" disabled>Simpan</button>
    </div>
    <div class="edit-ui edit-toast" id="editToast" hidden></div>`);

  const $ = (id) => document.getElementById(id);
  const modal = $("editModal");
  const bar = $("editBar");

  let toastTimer;
  function toast(msg, isErr) {
    const t = $("editToast");
    t.textContent = msg;
    t.classList.toggle("err", !!isErr);
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.hidden = true), isErr ? 7000 : 4000);
  }
  function setDirty(v) {
    dirty = v;
    $("editSave").disabled = !v;
  }
  const rerender = () => window.renderSite();

  /* ---------- Buka kunci ---------- */
  function showModal(err = "") {
    $("editErr").textContent = err;
    $("editOwner").value = GH.cfg.owner;
    $("editRepoName").value = GH.cfg.repo;
    $("editRepo").hidden = !!(GH.cfg.owner && GH.cfg.repo);
    modal.hidden = false;
    $("editToken").focus();
  }
  async function start() {
    if (editing()) return;
    if (!GH.hasToken) return showModal();
    try { await GH.unlock({}); await enter(); }
    catch (e) { showModal(GH.errorText(e)); }
  }
  async function enter() {
    const { site, sha: s } = await GH.loadContent(); // ambil versi terbaru langsung dari GitHub
    window.SITE = site;
    sha = s;
    document.body.classList.add("editing");
    modal.hidden = true;
    bar.hidden = false;
    setDirty(false);
    rerender();
    toast("Mode edit aktif. Klik teks mana saja untuk mengubahnya.");
  }
  $("editForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("editGo");
    btn.disabled = true;
    btn.textContent = "Memeriksa…";
    try {
      await GH.unlock({ token: $("editToken").value.trim(), owner: $("editOwner").value.trim(), repo: $("editRepoName").value.trim(), remember: $("editRemember").checked });
      await enter();
      $("editToken").value = "";
    } catch (err) {
      $("editErr").textContent = GH.errorText(err);
    } finally {
      btn.disabled = false;
      btn.textContent = "Buka Kunci";
    }
  });
  $("editClose").onclick = () => (modal.hidden = true);

  /* ---------- Simpan & keluar ---------- */
  async function save() {
    const btn = $("editSave");
    btn.disabled = true;
    btn.textContent = "Menyimpan…";
    try {
      sha = await GH.saveContent(window.SITE, sha);
      setDirty(false);
      toast("Tersimpan ✓ Pengunjung melihat perubahan dalam ±1 menit.");
    } catch (e) {
      toast(`Gagal menyimpan: ${GH.errorText(e)}`, true);
      btn.disabled = false;
    } finally {
      btn.textContent = "Simpan";
    }
  }
  $("editSave").onclick = save;
  $("editExit").onclick = () => {
    if (dirty) {
      if (!confirm("Ada perubahan yang belum disimpan. Buang perubahan dan keluar?")) return;
      dirty = false;
      location.hash = "";
      return location.reload();
    }
    document.body.classList.remove("editing");
    bar.hidden = true;
    rerender();
  };
  addEventListener("beforeunload", (e) => { if (dirty) e.preventDefault(); });
  addEventListener("keydown", (e) => { if (editing() && (e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); if (dirty) save(); } });

  // Tombol "🔒 Admin" di footer (dibuat ulang setiap render, jadi pakai delegasi)
  document.addEventListener("click", (e) => {
    if (e.target.closest("#adminLink")) { e.preventDefault(); start(); return; }
    if (!editing() || e.target.closest(".edit-ui")) return;
    // Saat mengedit, link tidak berpindah halaman (kecuali menu navigasi ke bagian lain)
    const a = e.target.closest("a");
    if (a && (a.hasAttribute("data-edit") || a.querySelector("[data-edit]") || !a.getAttribute("href")?.startsWith("#"))) e.preventDefault();
  }, true);

  /* ---------- Pasang alat edit setiap kali halaman dirender ---------- */
  document.addEventListener("site:rendered", () => {
    if (!editing()) return;

    document.querySelectorAll("[data-edit]").forEach((el) => {
      try { el.contentEditable = "plaintext-only"; } catch { el.contentEditable = "true"; }
      el.spellcheck = false;
      el.addEventListener("input", () => { setPath(el.dataset.edit, el.textContent); setDirty(true); });
      el.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); el.blur(); } });
    });

    document.querySelectorAll("[data-img]").forEach((box) => {
      const btn = make("button", "edit-ui edit-img-btn", "📷 Ganti foto");
      btn.type = "button";
      btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); pickImage(box.dataset.img, btn); };
      box.appendChild(btn);
    });

    document.querySelectorAll("[data-item]").forEach((item) => {
      const [listPath, i] = splitLast(item.dataset.item);
      const arr = getPath(listPath);
      const tools = make("div", "edit-ui edit-item-tools");
      const tool = (txt, title, fn, cls = "") => {
        const b = make("button", cls, txt);
        b.type = "button";
        b.title = title;
        b.onclick = (e) => { e.preventDefault(); e.stopPropagation(); if (fn() !== false) { setDirty(true); rerender(); } };
        tools.appendChild(b);
      };
      if (i > 0) tool("◀", "Pindah ke depan", () => arr.splice(i - 1, 0, arr.splice(i, 1)[0]));
      if (i < arr.length - 1) tool("▶", "Pindah ke belakang", () => arr.splice(i + 1, 0, arr.splice(i, 1)[0]));
      tool("✕", "Hapus", () => (confirm("Hapus item ini?") ? arr.splice(i, 1) : false), "danger");
      item.appendChild(tools);
    });

    document.querySelectorAll("[data-list]").forEach((list) => {
      const path = list.dataset.list;
      const btn = make("button", "edit-ui edit-add", "+ Tambah");
      btn.type = "button";
      btn.onclick = () => {
        const arr = getPath(path);
        const last = arr[arr.length - 1];
        const tpl = TEMPLATES[path] ?? (last && typeof last === "object" ? Object.fromEntries(Object.keys(last).map((k) => [k, ""])) : "");
        arr.push(typeof tpl === "object" ? structuredClone(tpl) : tpl);
        setDirty(true);
        rerender();
      };
      list.insertAdjacentElement("afterend", btn);
    });

    // Galeri proyek: daftar foto kecil + tambah banyak foto sekaligus
    document.querySelectorAll("[data-photos]").forEach((box) => {
      const path = box.dataset.photos;
      const arr = getPath(path) || [];
      const strip = make("div", "edit-ui edit-photos");
      arr.forEach((src, j) => {
        const t = make("div", "edit-thumb");
        const im = document.createElement("img");
        im.src = GH.previews[src] || src;
        im.onerror = () => (im.style.visibility = "hidden");
        t.appendChild(im);
        const tool = (txt, title, fn, cls = "") => {
          const b = make("button", cls, txt);
          b.type = "button";
          b.title = title;
          b.onclick = (e) => { e.preventDefault(); e.stopPropagation(); if (fn() !== false) { setDirty(true); rerender(); } };
          t.appendChild(b);
        };
        if (j > 0) tool("◀", "Jadikan lebih awal", () => arr.splice(j - 1, 0, arr.splice(j, 1)[0]), "mv");
        tool("✕", "Hapus foto ini", () => (confirm("Hapus foto ini dari proyek?") ? arr.splice(j, 1) : false), "del");
        strip.appendChild(t);
      });
      const add = make("button", "edit-thumb edit-thumb-add", "📷 Tambah foto");
      add.type = "button";
      add.title = "Bisa pilih banyak foto sekaligus";
      add.onclick = (e) => { e.preventDefault(); e.stopPropagation(); pickImages(path, add); };
      strip.appendChild(add);
      box.insertAdjacentElement("afterend", strip);
    });

    // Struktur organisasi: tambah bawahan di bawah setiap kotak
    document.querySelectorAll("[data-children]").forEach((node) => {
      const b = make("button", "edit-ui edit-add-child", "+ Bawahan");
      b.type = "button";
      b.onclick = (e) => {
        e.preventDefault();
        const p = node.dataset.children;
        if (!Array.isArray(getPath(p))) setPath(p, []);
        getPath(p).push({ photo: "", name: "Nama Lengkap", role: "Jabatan", children: [] });
        setDirty(true);
        rerender();
      };
      node.appendChild(b);
    });

    document.querySelectorAll("[data-section]").forEach((sec) => {
      const key = sec.dataset.section;
      const obj = window.SITE[key];
      const b = make("div", "edit-ui edit-sec-bar");
      b.innerHTML = `<span>${SECTION_LABELS[key] || key}</span><label class="edit-toggle"><input type="checkbox" ${obj.hidden ? "" : "checked"}><i></i>${obj.hidden ? "Disembunyikan" : "Tampil"}</label>`;
      b.querySelector("input").onchange = (e) => {
        if (e.target.checked) delete obj.hidden; else obj.hidden = true;
        setDirty(true);
        rerender();
      };
      sec.prepend(b);
    });
  });

  function pickImage(path, btn) {
    const input = Object.assign(document.createElement("input"), { type: "file", accept: "image/*" });
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      btn.disabled = true;
      btn.textContent = "Mengupload…";
      try {
        const newPath = await GH.uploadImage(file, getPath(path), path.split(".").pop());
        setPath(path, newPath);
        setDirty(true);
        rerender();
        toast("Foto terupload ✓ Klik Simpan untuk menerapkan.");
      } catch (e) {
        toast(`Upload gagal: ${GH.errorText(e)}`, true);
        btn.disabled = false;
        btn.textContent = "📷 Ganti foto";
      }
    };
    input.click();
  }

  function pickImages(path, btn) {
    const input = Object.assign(document.createElement("input"), { type: "file", accept: "image/*", multiple: true });
    input.onchange = async () => {
      const files = [...input.files];
      if (!files.length) return;
      if (!Array.isArray(getPath(path))) setPath(path, []);
      btn.disabled = true;
      let done = 0;
      try {
        for (const file of files) {
          btn.textContent = `Mengupload ${done + 1}/${files.length}…`;
          getPath(path).push(await GH.uploadImage(file, "", "image"));
          done++;
        }
        toast(`${done} foto terupload ✓ Klik Simpan untuk menerapkan.`);
      } catch (e) {
        toast(`Upload gagal${done ? ` setelah ${done} foto` : ""}: ${GH.errorText(e)}`, true);
      }
      if (done) setDirty(true);
      rerender();
    };
    input.click();
  }

  function make(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  if (location.hash === "#edit") start();
})();
