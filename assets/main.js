/* Mesin tampilan website — tidak perlu diubah. Konten ada di content.js
   Atribut data-edit / data-img / data-item / data-list / data-section dipakai mode edit (edit.js). */
(function () {
  const app = document.getElementById("app");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const editing = () => document.body.classList.contains("editing");
  const get = (path) => path.split(".").reduce((o, k) => o?.[k], window.SITE);

  // Teks yang bisa diedit di mode edit
  const T = (path, tag = "span", cls = "") => `<${tag}${cls ? ` class="${cls}"` : ""} data-edit="${path}">${esc(get(path))}</${tag}>`;

  // Gambar; yang belum diupload diganti kotak petunjuk berisi nama file
  const img = (path, alt, cls = "") => {
    const src = get(path) || "";
    const shown = window.GH?.previews[src] || src;
    return `<div class="img ${cls}${src ? "" : " missing"}" data-img="${path}">${src ? `<img src="${esc(shown)}" alt="${esc(alt)}" loading="lazy" onerror="this.parentNode.classList.add('missing')">` : ""}<span class="img-hint">Upload foto${src ? `:<br><code>${esc(src.split("?")[0])}</code>` : ""}</span></div>`;
  };

  const head = (key, withSub = true) => `<div class="section-head reveal">${T(`${key}.title`, "h2")}${withSub && get(`${key}.subtitle`) != null ? T(`${key}.subtitle`, "p") : ""}</div>`;

  // Bagian ditampilkan jika ada & tidak disembunyikan (di mode edit, bagian tersembunyi tetap tampil redup)
  const on = (k) => { const v = window.SITE?.[k]; return v && (v.hidden !== true || editing()); };
  const secAttr = (k) => ` data-section="${k}"${window.SITE[k]?.hidden ? ' data-hidden="1"' : ""}`;

  function render() {
    const S = window.SITE || {};
    const c = S.company || {};

    /* ---------- Tema & meta ---------- */
    const root = document.documentElement.style;
    if (S.theme?.primary) root.setProperty("--primary", S.theme.primary);
    if (S.theme?.accent) root.setProperty("--accent", S.theme.accent);
    document.title = c.tagline ? `${c.name} — ${c.tagline}` : c.name || "Website";
    document.querySelector('meta[name="description"]').content = c.description || "";

    /* ---------- Brand ---------- */
    const logo = c.logo ? window.GH?.previews[c.logo] || c.logo : "";
    document.getElementById("brand").innerHTML =
      `<span class="brand-logo${logo ? "" : " nologo"}">${logo ? `<img src="${esc(logo)}" alt="" onerror="this.parentNode.classList.add('nologo');this.remove()">` : ""}<b>${esc(c.shortName || (c.name || "").slice(0, 2))}</b></span><span class="brand-name">${esc(c.name)}</span>`;

    /* ---------- Bagian-bagian ---------- */
    const sections = [];
    const add = (id, label, html) => sections.push({ id, label, html });

    if (on("hero")) {
      const h = S.hero;
      add("beranda", "Beranda", `
        <section id="beranda" class="hero"${secAttr("hero")}>
          ${img("hero.image", c.name, "hero-bg")}
          <div class="hero-overlay"></div>
          <div class="container hero-content">
            <p class="eyebrow">${esc(c.name)}</p>
            ${T("hero.title", "h1")}
            ${T("hero.subtitle", "p", "lead")}
            <div class="btn-row">${(h.buttons || []).map((b, i) => `<a class="btn ${i ? "btn-ghost" : ""}" href="${esc(b.href)}" data-edit="hero.buttons.${i}.label">${esc(b.label)}</a>`).join("")}</div>
          </div>
        </section>`);
    }
    if (S.stats?.length || (editing() && S.stats)) {
      add("stats", null, `<div class="container"><div class="stats" data-list="stats">${S.stats.map((s, i) => `
        <div class="stat" data-item="stats.${i}">${T(`stats.${i}.value`, "strong")}${T(`stats.${i}.label`)}</div>`).join("")}</div></div>`);
    }

    if (on("about")) {
      const a = S.about;
      add("tentang", "Tentang", `
        <section id="tentang" class="section"${secAttr("about")}>
          <div class="container about">
            <div class="reveal">${img("about.image", a.title, "about-img")}</div>
            <div class="reveal">
              ${T("about.title", "h2")}
              <div data-list="about.paragraphs">${(a.paragraphs || []).map((_, i) => `<div data-item="about.paragraphs.${i}">${T(`about.paragraphs.${i}`, "p")}</div>`).join("")}</div>
              ${a.vision != null ? `<div class="vm"><h3>Visi</h3>${T("about.vision", "p")}</div>` : ""}
              ${a.mission ? `<div class="vm"><h3>Misi</h3><ul data-list="about.mission">${a.mission.map((_, i) => `<li data-item="about.mission.${i}">${T(`about.mission.${i}`)}</li>`).join("")}</ul></div>` : ""}
            </div>
          </div>
        </section>`);
    }

    if (on("services")) {
      add("layanan", "Layanan", `
        <section id="layanan" class="section alt"${secAttr("services")}>
          <div class="container">
            ${head("services")}
            <div class="grid cards" data-list="services.items">${(S.services.items || []).map((_, i) => `
              <article class="card reveal" data-item="services.items.${i}">${T(`services.items.${i}.icon`, "div", "card-icon")}${T(`services.items.${i}.title`, "h3")}${T(`services.items.${i}.text`, "p")}</article>`).join("")}
            </div>
          </div>
        </section>`);
    }

    if (on("projects")) {
      add("proyek", "Proyek", `
        <section id="proyek" class="section"${secAttr("projects")}>
          <div class="container">
            ${head("projects")}
            <div class="grid gallery" data-list="projects.items">${(S.projects.items || []).map((it, i) => `
              <figure class="gallery-item reveal" data-item="projects.items.${i}" data-title="${esc(it.title)}">
                ${img(`projects.items.${i}.image`, it.title)}
                <figcaption>${T(`projects.items.${i}.category`)}${T(`projects.items.${i}.title`, "strong")}</figcaption>
              </figure>`).join("")}
            </div>
          </div>
        </section>`);
    }

    if (on("team")) {
      add("tim", "Tim", `
        <section id="tim" class="section alt"${secAttr("team")}>
          <div class="container">
            ${head("team")}
            <div class="grid team" data-list="team.items">${(S.team.items || []).map((m, i) => `
              <div class="member reveal" data-item="team.items.${i}">${img(`team.items.${i}.photo`, m.name, "member-img")}${T(`team.items.${i}.name`, "h3")}${T(`team.items.${i}.role`, "p")}</div>`).join("")}
            </div>
          </div>
        </section>`);
    }

    if (on("clients")) {
      add("klien", null, `
        <section class="section clients"${secAttr("clients")}>
          <div class="container">
            ${T("clients.title", "p", "clients-title")}
            <div class="logos" data-list="clients.logos">${(S.clients.logos || []).map((l, i) => `<div class="logo-item" data-item="clients.logos.${i}" title="${esc(l.name)}">${img(`clients.logos.${i}.image`, l.name, "logo-img")}</div>`).join("")}</div>
          </div>
        </section>`);
    }

    if (on("testimonials")) {
      add("testimoni", null, `
        <section class="section alt"${secAttr("testimonials")}>
          <div class="container">
            ${head("testimonials", false)}
            <div class="grid quotes" data-list="testimonials.items">${(S.testimonials.items || []).map((_, i) => `
              <blockquote class="quote reveal" data-item="testimonials.items.${i}"><p>“${T(`testimonials.items.${i}.quote`)}”</p><footer>${T(`testimonials.items.${i}.name`, "strong")}${T(`testimonials.items.${i}.company`)}</footer></blockquote>`).join("")}
            </div>
          </div>
        </section>`);
    }

    const k = S.contact;
    const wa = k?.whatsapp ? `https://wa.me/${String(k.whatsapp).replace(/\D/g, "")}` : "";
    if (on("contact")) {
      const ed = editing();
      const rows = [
        ["📍", "Alamat", "address", T("contact.address")],
        ["📞", "Telepon", "phone", `<a href="tel:${esc(String(k.phone || "").replace(/[^\d+]/g, ""))}">${T("contact.phone")}</a>`],
        ["✉️", "Email", "email", `<a href="mailto:${esc(k.email)}">${T("contact.email")}</a>`],
        ["💬", "WhatsApp", "whatsapp", ed ? T("contact.whatsapp") : `<a href="${wa}" target="_blank" rel="noopener">Chat sekarang</a>`],
        ["🕘", "Jam Operasional", "hours", T("contact.hours")],
      ].filter((r) => ed ? k[r[2]] != null : k[r[2]]);
      add("kontak", "Kontak", `
        <section id="kontak" class="section"${secAttr("contact")}>
          <div class="container">
            ${head("contact")}
            <div class="contact">
              <div class="contact-info reveal">
                ${rows.map((r) => `<div class="contact-row"><span class="ci">${r[0]}</span><div><small>${r[1]}</small><p>${r[3]}</p></div></div>`).join("")}
                ${wa ? `<a class="btn" href="${wa}" target="_blank" rel="noopener">Kirim Pesan via WhatsApp</a>` : ""}
              </div>
              ${k.mapEmbed ? `<div class="map reveal"><iframe src="${esc(k.mapEmbed)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Lokasi kantor"></iframe></div>` : ""}
            </div>
          </div>
        </section>`);
    }
    const f = document.getElementById("waFloat");
    f.href = wa;
    f.hidden = !wa || !on("contact");

    app.innerHTML = sections.map((s) => s.html).join("");

    /* ---------- Navigasi ---------- */
    navLinks.innerHTML = sections.filter((s) => s.label).map((s) => `<a href="#${s.id}">${s.label}</a>`).join("");

    /* ---------- Footer ---------- */
    document.getElementById("footer").innerHTML = `
      <div class="container footer-inner">
        <div><strong>${esc(c.name)}</strong><p>${esc(c.tagline)}</p></div>
        <div class="footer-links">${navLinks.innerHTML}</div>
        ${S.social?.length ? `<div class="social">${S.social.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a>`).join("")}</div>` : ""}
      </div>
      <div class="container copyright"><a class="admin-link" href="#edit" id="adminLink" title="Edit website" aria-label="Edit website">🔒 Admin</a><span>© ${new Date().getFullYear()} ${esc(c.name)}. Hak cipta dilindungi.</span></div>`;

    /* ---------- Animasi muncul saat scroll ---------- */
    document.querySelectorAll(".reveal").forEach((el) => (editing() ? el.classList.add("in") : io.observe(el)));

    /* ---------- Lightbox galeri ---------- */
    document.querySelectorAll(".gallery-item").forEach((g) => g.addEventListener("click", () => {
      if (editing() || g.querySelector(".img.missing")) return;
      lb.querySelector("img").src = g.querySelector("img").src;
      lb.querySelector(".lightbox-caption").textContent = g.dataset.title;
      lb.hidden = false;
    }));

    document.dispatchEvent(new Event("site:rendered"));
  }

  /* ---------- Bagian yang cukup dipasang sekali ---------- */
  const navLinks = document.getElementById("navLinks");
  const nav = document.getElementById("nav");
  document.getElementById("navToggle").onclick = () => nav.classList.toggle("open");
  navLinks.onclick = (e) => { if (e.target.tagName === "A") nav.classList.remove("open"); };
  const onScroll = () => nav.classList.toggle("scrolled", scrollY > 40);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12 });

  const lb = document.getElementById("lightbox");
  lb.addEventListener("click", (e) => { if (e.target !== lb.querySelector("img")) lb.hidden = true; });
  addEventListener("keydown", (e) => { if (e.key === "Escape") lb.hidden = true; });

  window.renderSite = render;
  render();
})();
