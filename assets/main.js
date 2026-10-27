/* Mesin tampilan website — tidak perlu diubah. Konten ada di content.js */
(function () {
  const S = window.SITE || {};
  const app = document.getElementById("app");
  // Bagian dengan hidden: true (diatur dari admin) dianggap tidak ada
  Object.keys(S).forEach((k) => { if (S[k]?.hidden === true) S[k] = null; });

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Gambar yang belum diupload diganti kotak petunjuk berisi nama file
  const img = (src, alt, cls = "") =>
    `<div class="img ${cls}" data-src="${esc(src)}"><img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" onerror="this.parentNode.classList.add('missing')"><span class="img-hint">Upload foto:<br><code>${esc(src)}</code></span></div>`;

  const head = (t, sub) => `<div class="section-head reveal"><h2>${esc(t)}</h2>${sub ? `<p>${esc(sub)}</p>` : ""}</div>`;

  /* ---------- Tema & meta ---------- */
  const root = document.documentElement.style;
  if (S.theme?.primary) root.setProperty("--primary", S.theme.primary);
  if (S.theme?.accent) root.setProperty("--accent", S.theme.accent);
  const c = S.company || {};
  document.title = c.tagline ? `${c.name} — ${c.tagline}` : c.name || "Website";
  document.querySelector('meta[name="description"]').content = c.description || "";

  /* ---------- Brand ---------- */
  document.getElementById("brand").innerHTML =
    `<span class="brand-logo">${c.logo ? `<img src="${esc(c.logo)}" alt="" onerror="this.parentNode.classList.add('nologo');this.remove()">` : ""}<b>${esc(c.shortName || (c.name || "").slice(0, 2))}</b></span><span class="brand-name">${esc(c.name)}</span>`;
  if (!c.logo) document.querySelector(".brand-logo").classList.add("nologo");

  /* ---------- Bagian-bagian ---------- */
  const sections = [];
  const add = (id, label, html) => { if (html) sections.push({ id, label, html }); };

  if (S.hero) {
    const h = S.hero;
    add("beranda", "Beranda", `
      <section id="beranda" class="hero">
        ${img(h.image, c.name, "hero-bg")}
        <div class="hero-overlay"></div>
        <div class="container hero-content">
          <p class="eyebrow">${esc(c.name)}</p>
          <h1>${esc(h.title)}</h1>
          <p class="lead">${esc(h.subtitle)}</p>
          <div class="btn-row">${(h.buttons || []).map((b, i) => `<a class="btn ${i ? "btn-ghost" : ""}" href="${esc(b.href)}">${esc(b.label)}</a>`).join("")}</div>
        </div>
      </section>
      ${S.stats?.length ? `<div class="container"><div class="stats">${S.stats.map((s) => `<div class="stat"><strong>${esc(s.value)}</strong><span>${esc(s.label)}</span></div>`).join("")}</div></div>` : ""}`);
  }

  if (S.about) {
    const a = S.about;
    add("tentang", "Tentang", `
      <section id="tentang" class="section">
        <div class="container about">
          <div class="reveal">${img(a.image, a.title, "about-img")}</div>
          <div class="reveal">
            <h2>${esc(a.title)}</h2>
            ${(a.paragraphs || []).map((p) => `<p>${esc(p)}</p>`).join("")}
            ${a.vision ? `<div class="vm"><h3>Visi</h3><p>${esc(a.vision)}</p></div>` : ""}
            ${a.mission?.length ? `<div class="vm"><h3>Misi</h3><ul>${a.mission.map((m) => `<li>${esc(m)}</li>`).join("")}</ul></div>` : ""}
          </div>
        </div>
      </section>`);
  }

  if (S.services?.items?.length) {
    const s = S.services;
    add("layanan", "Layanan", `
      <section id="layanan" class="section alt">
        <div class="container">
          ${head(s.title, s.subtitle)}
          <div class="grid cards">${s.items.map((it) => `
            <article class="card reveal"><div class="card-icon">${esc(it.icon)}</div><h3>${esc(it.title)}</h3><p>${esc(it.text)}</p></article>`).join("")}
          </div>
        </div>
      </section>`);
  }

  if (S.projects?.items?.length) {
    const p = S.projects;
    add("proyek", "Proyek", `
      <section id="proyek" class="section">
        <div class="container">
          ${head(p.title, p.subtitle)}
          <div class="grid gallery">${p.items.map((it) => `
            <figure class="gallery-item reveal" data-title="${esc(it.title)}">
              ${img(it.image, it.title)}
              <figcaption><span>${esc(it.category)}</span><strong>${esc(it.title)}</strong></figcaption>
            </figure>`).join("")}
          </div>
        </div>
      </section>`);
  }

  if (S.team?.items?.length) {
    const t = S.team;
    add("tim", "Tim", `
      <section id="tim" class="section alt">
        <div class="container">
          ${head(t.title, t.subtitle)}
          <div class="grid team">${t.items.map((m) => `
            <div class="member reveal">${img(m.photo, m.name, "member-img")}<h3>${esc(m.name)}</h3><p>${esc(m.role)}</p></div>`).join("")}
          </div>
        </div>
      </section>`);
  }

  if (S.clients?.logos?.length) {
    add("klien", null, `
      <section class="section clients">
        <div class="container">
          <p class="clients-title">${esc(S.clients.title)}</p>
          <div class="logos">${S.clients.logos.map((l) => `<div class="logo-item" title="${esc(l.name)}">${img(l.image, l.name, "logo-img")}</div>`).join("")}</div>
        </div>
      </section>`);
  }

  if (S.testimonials?.items?.length) {
    const t = S.testimonials;
    add("testimoni", null, `
      <section class="section alt">
        <div class="container">
          ${head(t.title)}
          <div class="grid quotes">${t.items.map((q) => `
            <blockquote class="quote reveal"><p>“${esc(q.quote)}”</p><footer><strong>${esc(q.name)}</strong><span>${esc(q.company)}</span></footer></blockquote>`).join("")}
          </div>
        </div>
      </section>`);
  }

  const k = S.contact;
  if (k) {
    const wa = k.whatsapp ? `https://wa.me/${String(k.whatsapp).replace(/\D/g, "")}` : "";
    const rows = [
      ["📍", "Alamat", esc(k.address)],
      ["📞", "Telepon", k.phone && `<a href="tel:${esc(k.phone.replace(/[^\d+]/g, ""))}">${esc(k.phone)}</a>`],
      ["✉️", "Email", k.email && `<a href="mailto:${esc(k.email)}">${esc(k.email)}</a>`],
      ["💬", "WhatsApp", wa && `<a href="${wa}" target="_blank" rel="noopener">Chat sekarang</a>`],
      ["🕘", "Jam Operasional", esc(k.hours)],
    ].filter((r) => r[2]);
    add("kontak", "Kontak", `
      <section id="kontak" class="section">
        <div class="container">
          ${head(k.title, k.subtitle)}
          <div class="contact">
            <div class="contact-info reveal">
              ${rows.map((r) => `<div class="contact-row"><span class="ci">${r[0]}</span><div><small>${r[1]}</small><p>${r[2]}</p></div></div>`).join("")}
              ${wa ? `<a class="btn" href="${wa}" target="_blank" rel="noopener">Kirim Pesan via WhatsApp</a>` : ""}
            </div>
            ${k.mapEmbed ? `<div class="map reveal"><iframe src="${esc(k.mapEmbed)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Lokasi kantor"></iframe></div>` : ""}
          </div>
        </div>
      </section>`);
    if (wa) { const f = document.getElementById("waFloat"); f.href = wa; f.hidden = false; }
  }

  app.innerHTML = sections.map((s) => s.html).join("");

  /* ---------- Navigasi ---------- */
  const navLinks = document.getElementById("navLinks");
  navLinks.innerHTML = sections.filter((s) => s.label).map((s) => `<a href="#${s.id}">${s.label}</a>`).join("");
  const nav = document.getElementById("nav");
  document.getElementById("navToggle").onclick = () => nav.classList.toggle("open");
  navLinks.onclick = (e) => { if (e.target.tagName === "A") nav.classList.remove("open"); };
  const onScroll = () => nav.classList.toggle("scrolled", scrollY > 40);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------- Footer ---------- */
  document.getElementById("footer").innerHTML = `
    <div class="container footer-inner">
      <div><strong>${esc(c.name)}</strong><p>${esc(c.tagline)}</p></div>
      <div class="footer-links">${navLinks.innerHTML}</div>
      ${S.social?.length ? `<div class="social">${S.social.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a>`).join("")}</div>` : ""}
    </div>
    <div class="container copyright"><a class="admin-link" href="admin.html" title="Edit website (admin)" aria-label="Edit website">🔒</a><span>© ${new Date().getFullYear()} ${esc(c.name)}. Hak cipta dilindungi.</span></div>`;

  /* ---------- Animasi muncul saat scroll ---------- */
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  /* ---------- Lightbox galeri ---------- */
  const lb = document.getElementById("lightbox");
  document.querySelectorAll(".gallery-item").forEach((g) => g.addEventListener("click", () => {
    if (g.querySelector(".img.missing")) return;
    lb.querySelector("img").src = g.querySelector("img").src;
    lb.querySelector(".lightbox-caption").textContent = g.dataset.title;
    lb.hidden = false;
  }));
  lb.addEventListener("click", (e) => { if (e.target !== lb.querySelector("img")) lb.hidden = true; });
  addEventListener("keydown", (e) => { if (e.key === "Escape") lb.hidden = true; });
})();
