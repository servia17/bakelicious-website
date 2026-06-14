/* === BAKELICIOUS MAIN JS === */
/* Google Sheets sebagai database produk */

const WA_NUMBER = '6281298849597';
const WA_BASE = `https://wa.me/${WA_NUMBER}`;

// ─── GOOGLE SHEETS CONFIG ────────────────────────────────────────────────────
// Ganti SHEET_ID dengan ID Google Sheets kamu
// Cara dapat SHEET_ID: buka Google Sheets → lihat URL
// https://docs.google.com/spreadsheets/d/SHEET_ID_ADA_DI_SINI/edit
const SHEET_ID = 'GANTI_DENGAN_SHEET_ID_KAMU';
const SHEET_NAME = 'Produk'; // nama tab/sheet
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;

// ─── LOAD PRODUK DARI GOOGLE SHEETS ─────────────────────────────────────────
async function loadProduk() {
  const grid = document.getElementById('menuGrid');
  grid.innerHTML = '<div class="loading-state">Memuat menu...</div>';

  try {
    const res = await fetch(SHEET_URL);
    const text = await res.text();

    // Google Sheets bungkus JSON dengan /*O_o*/ ... format
    const json = JSON.parse(text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*?)\);/)[1]);
    const rows = json.table.rows;

    if (!rows || rows.length === 0) {
      grid.innerHTML = '<p class="menu-empty">Menu sedang diperbarui. Silakan hubungi kami via WhatsApp.</p>';
      return;
    }

    grid.innerHTML = '';

    rows.forEach((row, i) => {
      const c = row.c;
      // Kolom: A=Nama, B=Deskripsi, C=Harga, D=Emoji/Icon, E=Badge, F=Aktif, G=Pesan WA Text
      const nama      = c[0]?.v || '';
      const deskripsi = c[1]?.v || '';
      const harga     = c[2]?.v || '';
      const icon      = c[3]?.v || '🍰';
      const badge     = c[4]?.v || '';
      const aktif     = c[5]?.v;
      const waText    = c[6]?.v || `Halo Kak Hafshah, saya mau pesan ${nama}`;

      // Skip baris yang tidak aktif
      if (aktif === false || String(aktif).toLowerCase() === 'false' || String(aktif).toLowerCase() === 'tidak') return;

      const isFeatured = badge?.toLowerCase().includes('best') || badge?.toLowerCase().includes('seller');
      const isPremium  = badge?.toLowerCase().includes('premium');

      const cardClass = isFeatured ? 'menu-card featured' : isPremium ? 'menu-card hampers' : 'menu-card';
      const badgeHTML = badge ? `<div class="badge${isPremium ? ' premium' : ''}">${badge}</div>` : '';

      const hargaDisplay = typeof harga === 'number'
        ? 'Rp ' + harga.toLocaleString('id-ID')
        : harga;

      const waUrl = `${WA_BASE}?text=${encodeURIComponent(waText)}`;

      const card = document.createElement('div');
      card.className = cardClass;
      card.setAttribute('data-delay', i * 100);
      card.innerHTML = `
        ${badgeHTML}
        <div class="menu-card-icon">${icon}</div>
        <div class="menu-card-body">
          <h3>${nama}</h3>
          <p>${deskripsi}</p>
          <div class="menu-card-footer">
            <span class="price">${hargaDisplay}</span>
            <a href="${waUrl}" target="_blank" class="order-btn">Pesan</a>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    // Jalankan scroll reveal setelah card dimuat
    observeCards();

  } catch (err) {
    console.error('Gagal load produk:', err);
    grid.innerHTML = renderFallback();
    observeCards();
  }
}

// ─── FALLBACK (jika Sheets gagal dimuat) ────────────────────────────────────
function renderFallback() {
  const produk = [
    { nama: 'Signature Marble Cake', desc: 'Perpaduan vanilla & coklat yang perfectly marbled, lembut di setiap lapisan.', harga: 'Rp 140.000', icon: '🎂', badge: '', wa: 'Halo Kak Hafshah, saya mau pesan Signature Marble Cake 🎂' },
    { nama: 'Banana Cream Cheese Loaf', desc: 'Banana bread premium dengan cream cheese swirl — moist, rich, dan aromatic.', harga: 'Rp 110.000', icon: '🍌', badge: '', wa: 'Halo Kak Hafshah, saya mau pesan Banana Cream Cheese Loaf' },
    { nama: 'Premium Pineapple Nastar', desc: 'Nastar klasik dengan selai nanas homemade — renyah, buttery, dan tidak terlalu manis.', harga: 'Rp 120.000', icon: '🍍', badge: '', wa: 'Halo Kak Hafshah, saya mau pesan Premium Pineapple Nastar' },
    { nama: 'Signature Surabaya Layer Cake', desc: 'Lapis Surabaya premium dengan lapisan butter cake & selai jeruk — kue klasik yang tak lekang waktu.', harga: 'Rp 550.000', icon: '✨', badge: 'Best Seller', wa: 'Halo Kak Hafshah, saya mau pesan Signature Surabaya Layer Cake' },
    { nama: 'Premium Gift Hampers', desc: 'Hampers eksklusif untuk berbagai momen — lebaran, ulang tahun, pernikahan, & corporate gift.', harga: 'Rp 225.000 – 1.000.000', icon: '🎁', badge: 'Premium', wa: 'Halo Kak Hafshah, saya mau tanya soal Premium Gift Hampers 🎁' },
  ];
  return produk.map((p, i) => {
    const isFeatured = p.badge.toLowerCase().includes('best');
    const isPremium  = p.badge.toLowerCase().includes('premium');
    const badgeHTML  = p.badge ? `<div class="badge${isPremium ? ' premium' : ''}">${p.badge}</div>` : '';
    return `
      <div class="${isFeatured ? 'menu-card featured' : isPremium ? 'menu-card hampers' : 'menu-card'}" data-delay="${i*100}">
        ${badgeHTML}
        <div class="menu-card-icon">${p.icon}</div>
        <div class="menu-card-body">
          <h3>${p.nama}</h3>
          <p>${p.desc}</p>
          <div class="menu-card-footer">
            <span class="price">${p.harga}</span>
            <a href="${WA_BASE}?text=${encodeURIComponent(p.wa)}" target="_blank" class="order-btn">Pesan</a>
          </div>
        </div>
      </div>`;
  }).join('');
}

// ─── SCROLL REVEAL ───────────────────────────────────────────────────────────
function observeCards() {
  const cards = document.querySelectorAll('.menu-card');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = parseInt(entry.target.dataset.delay) || 0;
        setTimeout(() => entry.target.classList.add('visible'), delay);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  cards.forEach(card => observer.observe(card));
}

// ─── NAVBAR ──────────────────────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 40);
});

document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('mobileMenu').classList.toggle('open');
});

// ─── INIT ────────────────────────────────────────────────────────────────────
loadProduk();
