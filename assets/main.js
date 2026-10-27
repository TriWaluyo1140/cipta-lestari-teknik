/* Mesin tampilan website — tidak perlu diubah. Konten ada di content.js
   Setiap menu tampil sebagai halaman sendiri (#beranda, #tentang, #layanan, #proyek, #tim, #kontak).
   Atribut data-edit / data-img / data-item / data-list / data-section dipakai mode edit (edit.js). */
(function () {
  const app = document.getElementById("app");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const editing = () => document.body.classList.contains("editing");
  const get = (path) => path.split(".").reduce((o, k) => o?.[k], window.SITE);

  // Teks yang bisa diedit di mode edit
  const T = (path, tag = "span", cls = "") => `<${tag}${cls ? ` class="${cls}"` : ""} data-edit="${path}">${esc(get(path))}</${tag}>`;

  // Gambar; yang belum diupload diganti kotak petunjuk berisi nama file
  const shownSrc = (src) => window.GH?.previews[src] || src;
  const img = (path, alt, cls = "", editable = true) => {
    const src = get(path) || "";
    const shown = shownSrc(src);
    return `<div class="img ${cls}${src ? "" : " missing"}"${editable ? ` data-img="${path}"` : ""}>${src ? `<img src="${esc(shown)}" alt="${esc(alt)}" loading="lazy" onerror="this.parentNode.classList.add('missing')">` : ""}<span class="img-hint">Upload foto${src ? `:<br><code>${esc(src.split("?")[0])}</code>` : ""}</span></div>`;
  };

  const head = (key, withSub = true) => `<div class="section-head reveal">${T(`${key}.title`, "h2")}${withSub && get(`${key}.subtitle`) != null ? T(`${key}.subtitle`, "p") : ""}</div>`;

  // Bagian ditampilkan jika ada & tidak disembunyikan (di mode edit, bagian tersembunyi tetap tampil redup)
  const on = (k) => { const v = window.SITE?.[k]; return v && (v.hidden !== true || editing()); };
  const secAttr = (k) => ` data-section="${k}"${window.SITE[k]?.hidden ? ' data-hidden="1"' : ""}`;

  // Daftar halaman (urutan = urutan menu)
  const PAGES = [
    { id: "beranda", label: "Beranda" },
    { id: "tentang", label: "Tentang", key: "about" },
    { id: "layanan", label: "Layanan", key: "services" },
    { id: "proyek", label: "Proyek", key: "projects" },
    { id: "tim", label: "Tim", key: "team" },
    { id: "kontak", label: "Kontak", key: "contact" },
  ];
  const currentPage = () => {
    const id = location.hash.slice(1);
    const pg = PAGES.find((p) => p.id === id && (!p.key || on(p.key)));
    return pg ? pg.id : "beranda";
  };

  // Menyesuaikan format konten lama: 1 foto proyek → daftar foto, daftar tim → struktur organisasi
  function normalize(S) {
    if (S.about && !Array.isArray(S.about.images)) {
      S.about.images = S.about.image ? [S.about.image] : [];
      delete S.about.image;
    }
    (S.projects?.items || []).forEach((it) => {
      if (!Array.isArray(it.images)) it.images = it.image ? [it.image] : [];
      delete it.image;
    });
    const t = S.team;
    if (t && !t.chart) {
      const [root, ...rest] = t.items || [];
      t.chart = { photo: "", name: "Nama Lengkap", role: "Direktur Utama", ...root, children: rest.map((m) => ({ ...m, children: [] })) };
      delete t.items;
    }
  }

  /* ---------- Potongan tampilan ---------- */
  // Judul besar di atas setiap halaman (selain Beranda)
  const banner = (key, titlePath = `${key}.title`, subPath = `${key}.subtitle`) => `
    <section class="page-banner"${secAttr(key)}>
      <div class="container">
        ${T(titlePath, "h1")}
        ${get(subPath) != null ? T(subPath, "p", "lead") : ""}
      </div>
    </section>`;

  const more = (href, label) => `<div class="more reveal"><a class="btn btn-outline" href="${href}">${label} →</a></div>`;

  // Kumpulan foto yang berganti otomatis (dipakai Proyek & Tentang Kami)
  const slidesHTML = (listPath, cls = "") => {
    const photos = get(listPath) || [];
    return `<div class="slides ${cls}" data-photos="${listPath}">
      ${(photos.length ? photos : [""]).map((_, j) => `<div class="slide${j ? "" : " active"}">${img(`${listPath}.${j}`, "", "", false)}</div>`).join("")}
      ${photos.length > 1 ? `<span class="photo-count">📷 ${photos.length}</span><div class="dots">${photos.map((_, j) => `<i${j ? "" : ' class="on"'}></i>`).join("")}</div>` : ""}
    </div>`;
  };

  const serviceCards = (limit) => {
    const items = (window.SITE.services.items || []).slice(0, limit || undefined);
    return `<div class="grid cards"${limit ? "" : ' data-list="services.items"'}>${items.map((_, i) => `
      <article class="card reveal" data-item="services.items.${i}">${T(`services.items.${i}.icon`, "div", "card-icon")}${T(`services.items.${i}.title`, "h3")}${T(`services.items.${i}.text`, "p")}</article>`).join("")}
    </div>`;
  };

  const projectCards = (limit) => {
    const items = (window.SITE.projects.items || []).slice(0, limit || undefined);
    return `<div class="grid gallery"${limit ? "" : ' data-list="projects.items"'}>${items.map((it, i) => `
      <figure class="gallery-item reveal" data-item="projects.items.${i}" data-lightbox data-title="${esc(it.title)}">
        ${slidesHTML(`projects.items.${i}.images`)}
        <figcaption>${T(`projects.items.${i}.category`)}${T(`projects.items.${i}.title`, "strong")}</figcaption>
      </figure>`).join("")}
    </div>`;
  };

  // Satu kotak di bagan organisasi (beserta bawahannya)
  const orgNode = (node, p, isRoot) => `
    <li>
      <div class="org-node reveal"${isRoot ? "" : ` data-item="${p}"`} data-children="${p}.children">
        ${img(`${p}.photo`, node.name, "org-photo")}${T(`${p}.name`, "h3")}${T(`${p}.role`, "p")}
      </div>
      ${node.children?.length ? `<ul>${node.children.map((ch, i) => orgNode(ch, `${p}.children.${i}`)).join("")}</ul>` : ""}
    </li>`;

  /* ---------- Isi tiap halaman ---------- */
  const VIEWS = {
    beranda(S) {
      const c = S.company || {};
      let html = "";
      if (on("hero")) {
        html += `
          <section class="hero"${secAttr("hero")}>
            ${img("hero.image", c.name, "hero-bg")}
            <div class="hero-overlay"></div>
            <div class="container hero-content">
              <p class="eyebrow">${esc(c.name)}</p>
              ${T("hero.title", "h1")}
              ${T("hero.subtitle", "p", "lead")}
              <div class="btn-row">${(S.hero.buttons || []).map((b, i) => `<a class="btn ${i ? "btn-ghost" : ""}" href="${esc(b.href)}" data-edit="hero.buttons.${i}.label">${esc(b.label)}</a>`).join("")}</div>
            </div>
          </section>`;
      } else {
        html += `<div class="hero-spacer"></div>`;
      }
      if (S.stats?.length || (editing() && S.stats)) {
        html += `<div class="container"><div class="stats" data-list="stats">${S.stats.map((_, i) => `
          <div class="stat" data-item="stats.${i}">${T(`stats.${i}.value`, "strong")}${T(`stats.${i}.label`)}</div>`).join("")}</div></div>`;
      }
      if (on("services") && !S.services.hidden) {
        html += `<section class="section"><div class="container">${head("services")}${serviceCards(3)}${more("#layanan", "Lihat semua layanan")}</div></section>`;
      }
      if (on("projects") && !S.projects.hidden) {
        html += `<section class="section alt"><div class="container">${head("projects")}${projectCards(3)}${more("#proyek", "Lihat semua proyek")}</div></section>`;
      }
      if (on("clients")) {
        html += `
          <section class="section clients"${secAttr("clients")}>
            <div class="container">
              ${T("clients.title", "p", "clients-title")}
              <div class="logos" data-list="clients.logos">${(S.clients.logos || []).map((l, i) => `<div class="logo-item" data-item="clients.logos.${i}" title="${esc(l.name)}">${img(`clients.logos.${i}.image`, l.name, "logo-img")}</div>`).join("")}</div>
            </div>
          </section>`;
      }
      if (on("testimonials")) {
        html += `
          <section class="section alt"${secAttr("testimonials")}>
            <div class="container">
              ${head("testimonials", false)}
              <div class="grid quotes" data-list="testimonials.items">${(S.testimonials.items || []).map((_, i) => `
                <blockquote class="quote reveal" data-item="testimonials.items.${i}"><p>“${T(`testimonials.items.${i}.quote`)}”</p><footer>${T(`testimonials.items.${i}.name`, "strong")}${T(`testimonials.items.${i}.company`)}</footer></blockquote>`).join("")}
              </div>
            </div>
          </section>`;
      }
      if (on("contact") && !S.contact.hidden) {
        html += `
          <section class="section">
            <div class="container"><div class="cta reveal">
              <div>${T("contact.title", "h2")}${T("contact.subtitle", "p")}</div>
              <a class="btn" href="#kontak">Hubungi Kami</a>
            </div></div>
          </section>`;
      }
      return html;
    },

    tentang(S) {
      const a = S.about;
      return `${banner("about", "about.title", "about.subtitle")}
        <section class="section">
          <div class="container about">
            <div class="reveal about-media" data-lightbox data-title="${esc(a.title)}">${slidesHTML("about.images", "about-slides")}</div>
            <div class="reveal about-text">
              <div data-list="about.paragraphs">${(a.paragraphs || []).map((_, i) => `<div data-item="about.paragraphs.${i}">${T(`about.paragraphs.${i}`, "p")}</div>`).join("")}</div>
              <div class="vm-row">
                ${a.vision != null ? `<div class="vm"><h3>Visi</h3>${T("about.vision", "p")}</div>` : ""}
                ${a.mission ? `<div class="vm"><h3>Misi</h3><ul data-list="about.mission">${a.mission.map((_, i) => `<li data-item="about.mission.${i}">${T(`about.mission.${i}`)}</li>`).join("")}</ul></div>` : ""}
              </div>
            </div>
          </div>
        </section>`;
    },

    layanan: () => `${banner("services")}<section class="section"><div class="container">${serviceCards()}</div></section>`,

    proyek: () => `${banner("projects")}<section class="section"><div class="container">${projectCards()}</div></section>`,

    tim: (S) => `${banner("team")}<section class="section"><div class="container"><div class="org-wrap"><ul class="org-tree">${orgNode(S.team.chart, "team.chart", true)}</ul></div></div></section>`,

    kontak(S) {
      const k = S.contact;
      const ed = editing();
      const wa = k.whatsapp ? `https://wa.me/${String(k.whatsapp).replace(/\D/g, "")}` : "";
      const rows = [
        ["📍", "Alamat", "address", T("contact.address")],
        ["📞", "Telepon", "phone", `<a href="tel:${esc(String(k.phone || "").replace(/[^\d+]/g, ""))}">${T("contact.phone")}</a>`],
        ["✉️", "Email", "email", `<a href="mailto:${esc(k.email)}">${T("contact.email")}</a>`],
        ["💬", "WhatsApp", "whatsapp", ed ? T("contact.whatsapp") : `<a href="${wa}" target="_blank" rel="noopener">Chat sekarang</a>`],
        ["🕘", "Jam Operasional", "hours", T("contact.hours")],
      ].filter((r) => (ed ? k[r[2]] != null : k[r[2]]));
      // Peta mengikuti alamat; link "Sematkan peta" dari Google Maps (…/maps/embed…) dipakai bila diisi
      const map = /\/maps\/embed/.test(k.mapEmbed || "") ? k.mapEmbed
        : k.address ? `https://www.google.com/maps?q=${encodeURIComponent(k.address)}&output=embed` : "";
      return `${banner("contact")}
        <section class="section">
          <div class="container">
            <div class="contact">
              <div class="contact-info reveal">
                ${rows.map((r) => `<div class="contact-row"><span class="ci">${r[0]}</span><div><small>${r[1]}</small><p>${r[3]}</p></div></div>`).join("")}
              </div>
              ${map ? `<div class="map reveal"><iframe src="${esc(map)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Lokasi kantor"></iframe></div>` : ""}
            </div>
          </div>
        </section>`;
    },
  };

  function render() {
    const S = window.SITE || {};
    normalize(S);
    const c = S.company || {};
    const page = currentPage();
    const pages = PAGES.filter((p) => !p.key || on(p.key));

    /* ---------- Tema & meta ---------- */
    const root = document.documentElement.style;
    if (S.theme?.primary) root.setProperty("--primary", S.theme.primary);
    if (S.theme?.accent) root.setProperty("--accent", S.theme.accent);
    const label = PAGES.find((p) => p.id === page).label;
    document.title = page === "beranda" ? (c.tagline ? `${c.name} — ${c.tagline}` : c.name || "Website") : `${label} — ${c.name}`;
    document.querySelector('meta[name="description"]').content = c.description || "";
    document.body.dataset.page = page;

    /* ---------- Brand ---------- */
    const logo = c.logo ? shownSrc(c.logo) : "";
    document.getElementById("brand").innerHTML =
      `<span class="brand-logo${logo ? "" : " nologo"}">${logo ? `<img src="${esc(logo)}" alt="" onerror="this.parentNode.classList.add('nologo');this.remove()">` : ""}<b>${esc(c.shortName || (c.name || "").slice(0, 2))}</b></span><span class="brand-name">${esc(c.name)}</span>`;

    /* ---------- Isi halaman ---------- */
    app.innerHTML = VIEWS[page](S);

    /* ---------- Navigasi ---------- */
    const links = pages.map((p) => `<a href="#${p.id}"${p.id === page ? ' class="active"' : ""}>${p.label}</a>`).join("");
    navLinks.innerHTML = links;

    const k = S.contact;
    const wa = k?.whatsapp ? `https://wa.me/${String(k.whatsapp).replace(/\D/g, "")}` : "";
    const f = document.getElementById("waFloat");
    f.href = wa;
    f.hidden = !wa || !on("contact");

    /* ---------- Footer ---------- */
    document.getElementById("footer").innerHTML = `
      <div class="container footer-inner">
        <div><strong>${esc(c.name)}</strong><p>${esc(c.tagline)}</p></div>
        <div class="footer-links">${links}</div>
        ${S.social?.length ? `<div class="social">${S.social.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a>`).join("")}</div>` : ""}
      </div>
      <div class="container copyright"><a class="admin-link" href="#edit" id="adminLink" title="Edit website" aria-label="Edit website">🔒 Admin</a><span>© ${new Date().getFullYear()} ${esc(c.name)}. Hak cipta dilindungi.</span></div>`;

    /* ---------- Animasi muncul saat scroll ---------- */
    document.querySelectorAll(".reveal").forEach((el) => (editing() ? el.classList.add("in") : io.observe(el)));

    /* ---------- Klik foto untuk melihat semua foto (Proyek & Tentang Kami) ---------- */
    document.querySelectorAll("[data-lightbox]").forEach((g) => g.addEventListener("click", () => {
      if (editing()) return;
      const srcs = [...g.querySelectorAll(".slide .img:not(.missing) img")].map((im) => im.src);
      if (!srcs.length) return;
      const shown = [...g.querySelectorAll(".slide")].findIndex((s) => s.classList.contains("active"));
      openLightbox(srcs, Math.max(0, Math.min(shown, srcs.length - 1)), g.dataset.title || "");
    }));

    startSlides();
    onScroll();
    document.dispatchEvent(new Event("site:rendered"));
  }

  /* ---------- Slideshow foto proyek (berganti otomatis) ---------- */
  let slideTimers = [];
  function startSlides() {
    slideTimers.forEach((t) => { clearTimeout(t); clearInterval(t); });
    slideTimers = [];
    if (editing() || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.querySelectorAll(".slides").forEach((box, k) => {
      const slides = [...box.querySelectorAll(".slide")];
      const dots = [...box.querySelectorAll(".dots i")];
      if (slides.length < 2) return;
      let i = 0;
      const step = () => {
        for (let n = 1; n < slides.length; n++) {
          const j = (i + n) % slides.length;
          if (slides[j].querySelector(".img.missing")) continue;
          slides[i].classList.remove("active"); dots[i]?.classList.remove("on");
          i = j;
          slides[i].classList.add("active"); dots[i]?.classList.add("on");
          return;
        }
      };
      // Mulai bergiliran agar foto tidak berganti serempak
      slideTimers.push(setTimeout(() => slideTimers.push(setInterval(step, 3500)), 1200 + k * 600));
    });
  }

  /* ---------- Bagian yang cukup dipasang sekali ---------- */
  const navLinks = document.getElementById("navLinks");
  const nav = document.getElementById("nav");
  document.getElementById("navToggle").onclick = () => nav.classList.toggle("open");
  navLinks.onclick = (e) => { if (e.target.tagName === "A") nav.classList.remove("open"); };
  const onScroll = () => nav.classList.toggle("scrolled", scrollY > 40);
  addEventListener("scroll", onScroll, { passive: true });

  // Pindah halaman saat menu diklik
  addEventListener("hashchange", () => {
    if (location.hash === "#edit") return;
    render();
    scrollTo({ top: 0, behavior: "instant" });
  });

  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12 });

  /* ---------- Lightbox dengan tombol sebelumnya / berikutnya ---------- */
  const lb = document.getElementById("lightbox");
  let lbPhotos = [], lbIdx = 0, lbTitle = "";
  function openLightbox(srcs, idx, title) {
    lbPhotos = srcs; lbIdx = idx; lbTitle = title;
    showLightbox();
    lb.hidden = false;
  }
  function showLightbox() {
    const n = lbPhotos.length;
    lb.querySelector("img").src = lbPhotos[lbIdx];
    lb.querySelector(".lightbox-caption").textContent = n > 1 ? `${lbTitle} · ${lbIdx + 1} / ${n}` : lbTitle;
    lb.querySelectorAll(".lb-nav").forEach((b) => (b.hidden = n < 2));
  }
  const lbGo = (d) => { lbIdx = (lbIdx + d + lbPhotos.length) % lbPhotos.length; showLightbox(); };
  lb.addEventListener("click", (e) => {
    if (e.target.closest(".lb-prev")) return lbGo(-1);
    if (e.target.closest(".lb-next")) return lbGo(1);
    if (e.target !== lb.querySelector("img")) lb.hidden = true;
  });
  addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") lb.hidden = true;
    if (e.key === "ArrowLeft") lbGo(-1);
    if (e.key === "ArrowRight") lbGo(1);
  });
  let touchX = null;
  lb.addEventListener("touchstart", (e) => (touchX = e.touches[0].clientX), { passive: true });
  lb.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - (touchX ?? 0);
    if (Math.abs(dx) > 40 && lbPhotos.length > 1) lbGo(dx < 0 ? 1 : -1);
    touchX = null;
  });

  window.renderSite = render;
  render();
})();
