// ====== Referencias DOM ======
const appsGrid = document.getElementById("appsGrid");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const chips = document.querySelectorAll(".chip");
document.getElementById("year").textContent = new Date().getFullYear();

// Overlay detalle
const overlay = document.getElementById("detailOverlay");
const overlayBackdrop = document.getElementById("detailBackdrop");
const detailIcon = document.getElementById("detailIcon");
const detailName = document.getElementById("detailName");
const detailCategory = document.getElementById("detailCategory");
const detailSize = document.getElementById("detailSize");
const detailInternet = document.getElementById("detailInternet");
const detailStats = document.getElementById("detailStats");
const detailDesc = document.getElementById("detailDesc");
const detailScreens = document.getElementById("detailScreens");
const installBtn = document.getElementById("installBtn");
const likeBtn = document.getElementById("likeBtn");
const starsRow = document.getElementById("starsRow");
const ratingLabel = document.getElementById("ratingLabel");
const ratingBig = document.getElementById("ratingBig");
const ratingTotal = document.getElementById("ratingTotal");
const reviewsList = document.getElementById("reviewsList");
const sendReviewBtn = document.getElementById("sendReviewBtn");
const reviewText = document.getElementById("reviewText");
const reviewStarsContainer = document.getElementById("reviewStars");

// Botones extra
const playstoreBtn = document.getElementById("playstoreBtn");
const uptodownBtn = document.getElementById("uptodownBtn");
const megaBtn = document.getElementById("megaBtn");
const mediafireBtn = document.getElementById("mediafireBtn");
const shareBtn = document.getElementById("shareBtn");

// Info de la app
const infoIdioma = document.getElementById("infoIdioma");
const infoVersion = document.getElementById("infoVersion");
const infoTipo = document.getElementById("infoTipo");
const infoSO = document.getElementById("infoSO");
const infoReq = document.getElementById("infoReq");
const infoFechaAct = document.getElementById("infoFechaAct");
const infoEdad = document.getElementById("infoEdad");
const infoAnuncios = document.getElementById("infoAnuncios");
const infoPrivacidad = document.getElementById("infoPrivacidad");
const infoTamañoApk = document.getElementById("infoTamañoApk");
const infoDescargas = document.getElementById("infoDescargas");
const infoPackageName = document.getElementById("infoPackageName");

let allApps = [];
let currentCat = "all";
let currentApp = null;
let reviewStarsSelected = 0;

// ====== LocalStorage ======
const VOTES_KEY = "appsmart_votes";

function getVotes() {
  try { return JSON.parse(localStorage.getItem(VOTES_KEY) || "{}"); } 
  catch { return {}; }
}

function saveVotes(v) {
  localStorage.setItem(VOTES_KEY, JSON.stringify(v));
}

// ====== Cargar apps ======
db.collection("apps").orderBy("fecha", "desc").onSnapshot(
  snap => {
    allApps = snap.docs.map(d => ({ ...d.data(), id: d.id }));
    renderApps();
  },
  () => {
    emptyState.style.display = "block";
    emptyState.textContent = "Error cargando apps. Intenta más tarde.";
  }
);

// ====== Render lista ======
function renderApps() {
  const q = (searchInput.value || "").toLowerCase();
  appsGrid.innerHTML = "";

  let list = [...allApps];
  if (currentCat !== "all") list = list.filter(a => a.categoria === currentCat);
  if (q) list = list.filter(a =>
    (a.nombre || "").toLowerCase().includes(q) ||
    (a.descripcion || "").toLowerCase().includes(q)
  );

  list.sort((a, b) => {
    const ra = a.ratingAvg || 0;
    const rb = b.ratingAvg || 0;
    if (rb !== ra) return rb - ra;
    return (b.ratingCount || 0) - (a.ratingCount || 0);
  });

  if (!list.length) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  list.forEach(app => {
    const card = document.createElement("article");
    card.className = "play-card";

    const ratingAvg = app.ratingAvg || 0;
    const ratingCount = app.ratingCount || 0;
    const starsText = ratingCount ? `⭐ ${ratingAvg.toFixed(1)} (${ratingCount})` : "⭐ Sin valoraciones";
    const internet = app.internet === "offline" ? "📴 Sin Internet" : "🌐 Con Internet";
    const descargas = app.descargasReales ?? app.descargas ?? 0;
    const size = app.size || "—";
    const likes = app.likes || 0;

    card.innerHTML = `
      <img class="play-icon" src="${app.imagen}" alt="${app.nombre}">
      <div class="play-info">
        <h3 class="play-name">${app.nombre}</h3>
        <p class="play-line1">${internet}</p>
        <p class="play-line2">${starsText} • 👍 ${likes} • ${size} </p>
        <p class="play-line3">⬇️${descargas} Descargas</p>
      </div>
    `;

    card.onclick = () => openDetails(app);
    appsGrid.appendChild(card);
  });
}

// ====== Eventos ======
searchInput.addEventListener("input", renderApps);
chips.forEach(chip => {
  chip.onclick = () => {
    document.querySelector(".chip.active")?.classList.remove("active");
    chip.classList.add("active");
    currentCat = chip.dataset.cat;
    renderApps();
  };
});

// ====== Abrir detalles ======
function openDetails(app) {
  currentApp = app;
  const votes = getVotes();
  const myVote = votes[app.id] || {};

  overlay.classList.remove("hidden");

  detailIcon.src = app.imagen;
  detailName.textContent = app.nombre;
  detailCategory.textContent = app.categoria || "";
  detailSize.textContent = app.size ? `📦 Tamaño: ${app.size}` : "📦 Tamaño: —";
  detailInternet.textContent = app.internet === "offline" ? "📴 Funciona sin Internet" : "🌐 Requiere Internet";
  detailDesc.textContent = app.descripcion || "";

  const ratingAvg = app.ratingAvg || 0;
  const ratingCount = app.ratingCount || 0;
  ratingLabel.textContent = ratingCount ? `Valoración: ${ratingAvg.toFixed(1)} (${ratingCount} votos)` : "Sin valoraciones todavía";

  const descReal = app.descargasReales ?? app.descargas ?? 0;
  detailStats.textContent = `Descargas: ${descReal.toLocaleString("es-ES")} • Likes: ${(app.likes || 0).toLocaleString("es-ES")}`;

  let breakdown = app.starsBreakdown || {1:0,2:0,3:0,4:0,5:0};
  let total = Object.values(breakdown).reduce((a,b)=>a+b,0);
  if (!total && ratingCount) { breakdown = {1:0,2:0,3:0,4:0,5:ratingCount}; total = ratingCount; }

  ratingBig.textContent = ratingAvg.toFixed(1);
  ratingTotal.textContent = `${total} reseñas`;
  [5,4,3,2,1].forEach(star => {
    const percent = total ? (breakdown[star] / total) * 100 : 0;
    document.getElementById(`bar${star}`).style.width = percent + "%";
  });

  // info
  infoIdioma.textContent = app.idioma || "—";
  infoVersion.textContent = app.version || "—";
  infoTipo.textContent = app.tipo || "—";
  infoSO.textContent = app.sistemaOperativo || "—";
  infoReq.textContent = app.requisitos || "—";
  const ts = app.fechaActualizacion || app.fecha;
  infoFechaAct.textContent = ts ? new Date(ts).toLocaleDateString("es-ES") : "—";
  infoEdad.textContent = app.edad || "—";
  infoAnuncios.textContent = app.anuncios === "si" ? "Sí" : app.anuncios === "no" ? "No" : "—";
  infoPrivacidad.textContent = app.privacidadUrl ? "Ver" : "No disponible";
  infoPrivacidad.href = app.privacidadUrl || "#";
  infoTamañoApk.textContent = app.size || "—";
  infoDescargas.textContent = descReal.toLocaleString("es-ES");
infoPackageName.textContent = app.packageName || "—";

  // ===== Función genérica para descargar =====
  function downloadAndIncrement(url, button) {
    if (!url) { alert("🚫 No hay archivo disponible."); return; }
    button.textContent = "Descargando...";
    button.disabled = true;

    db.collection("apps").doc(currentApp.id)
      .update({ descargasReales: firebase.firestore.FieldValue.increment(1) })
      .then(() => {
        currentApp.descargasReales = (currentApp.descargasReales || 0) + 1;
        infoDescargas.textContent = currentApp.descargasReales.toLocaleString("es-ES");
        detailStats.textContent = `Descargas: ${currentApp.descargasReales.toLocaleString("es-ES")} • Likes: ${(currentApp.likes || 0).toLocaleString("es-ES")}`;
        renderApps();

        window.location.href = url;

        setTimeout(() => { button.disabled = false; button.textContent = "Descargar"; }, 1000);
      });
  }

  // ===== Descargar APK =====
  installBtn.onclick = () => downloadAndIncrement(app.apk, installBtn);

  // ===== Botones extra dinámicos =====
  const botones = [
    {btn: playstoreBtn, url: app.playstoreUrl},
    {btn: uptodownBtn, url: app.uptodownUrl},
    {btn: megaBtn, url: app.megaUrl},
    {btn: mediafireBtn, url: app.mediafireUrl},
  ];

  botones.forEach(({btn, url}) => {
    if (url && url.trim() !== "") {
      btn.style.display = "inline-block";
      btn.onclick = () => downloadAndIncrement(url, btn);
    } else {
      btn.style.display = "none";
    }
  });

  // compartir
  shareBtn.onclick = () => {
    const url = window.location.origin + window.location.pathname + "?app=" + encodeURIComponent(app.id);
    const shareData = { title: app.nombre, text: app.descripcion || "", url };
    if (navigator.share) navigator.share(shareData).catch(()=>{});
    else navigator.clipboard?.writeText(url);
  };

  // Screenshots
  detailScreens.innerHTML = "";
  (app.imgSecundarias || []).forEach(url => {
    const img = document.createElement("img");
    img.src = url;
    img.loading = "lazy";
    detailScreens.appendChild(img);
  });

  // Likes
  likeBtn.textContent = myVote.liked ? `👍 Ya te gusta (${app.likes || 0})` : `👍 Me gusta (${app.likes || 0})`;
  likeBtn.disabled = !!myVote.liked;
  likeBtn.onclick = () => handleLike(app);

  renderStars(app);
  renderReviewStars();
  reviewText.value = "";
  reviewStarsSelected = 0;
  loadReviews(app.id);
  sendReviewBtn.onclick = handleSendReview;
}

// ===== Cerrar overlay =====
function closeDetails() { overlay.classList.add("hidden"); }
overlayBackdrop.onclick = closeDetails;
document.getElementById("detailClose").onclick = closeDetails;

// ===== Likes ======
function handleLike(app) {
  const votes = getVotes();
  const myVote = votes[app.id] || {};
  if (myVote.liked) return;

  db.collection("apps").doc(app.id)
    .update({ likes: firebase.firestore.FieldValue.increment(1) })
    .then(() => {
      myVote.liked = true;
      votes[app.id] = myVote;
      saveVotes(votes);

      currentApp.likes = (currentApp.likes || 0) + 1;
      const descReal = currentApp.descargasReales ?? currentApp.descargas ?? 0;
      detailStats.textContent = `Descargas: ${descReal.toLocaleString("es-ES")} • Likes: ${currentApp.likes.toLocaleString("es-ES")}`;

      likeBtn.textContent = `👍 Ya te gusta (${currentApp.likes})`;
      likeBtn.disabled = true;
      renderApps();
    });
}

// ===== Estrellas no votables ======
function renderStars(app) {
  starsRow.innerHTML = "";
  const avg = app.ratingAvg || 0;
  const full = Math.floor(avg);
  const half = avg % 1 >= 0.25 && avg % 1 < 0.75 ? 1 : 0;
  const empty = 5 - full - half;
  for (let i = 0; i < full; i++) { const s = document.createElement("span"); s.className = "star-static"; s.textContent = "★"; starsRow.appendChild(s); }
  if (half) { const s = document.createElement("span"); s.className = "star-static"; s.textContent = "⯨"; starsRow.appendChild(s); }
  for (let i = 0; i < empty; i++) { const s = document.createElement("span"); s.className = "star-static"; s.textContent = "☆"; starsRow.appendChild(s); }
}

// ===== Reseñas ======
function renderReviewStars() {
  reviewStarsContainer.innerHTML = "";
  for (let i = 1; i <= 5; i++) {
    const btn = document.createElement("button");
    btn.textContent = "☆";
    btn.className = "star-btn";
    btn.onclick = () => setReviewStars(i);
    reviewStarsContainer.appendChild(btn);
  }
}

function setReviewStars(n) {
  reviewStarsSelected = n;
  reviewStarsContainer.querySelectorAll(".star-btn").forEach((b, i) => b.textContent = (i < n) ? "★" : "☆");
}

function loadReviews(appId) {
  reviewsList.innerHTML = "<p>Cargando reseñas...</p>";
  db.collection("apps").doc(appId).collection("reviews").orderBy("timestamp", "desc").get()
    .then(snap => {
      reviewsList.innerHTML = "";
      if (snap.empty) { reviewsList.innerHTML = "<p>No hay reseñas todavía. Sé el primero en comentar.</p>"; return; }
      snap.forEach(doc => {
        const r = doc.data();
        const item = document.createElement("div");
        item.className = "review-item";
        const starsStr = "★".repeat(r.stars) + "☆".repeat(5 - r.stars);
        item.innerHTML = `<div class="review-stars">${starsStr}</div><div class="review-text">${r.comment}</div><div class="review-time">${new Date(r.timestamp).toLocaleDateString()}</div>`;
        reviewsList.appendChild(item);
      });
    })
    .catch(()=> { reviewsList.innerHTML = "<p>Error cargando reseñas.</p>"; });
}

function handleSendReview() {
  if (!currentApp) return;
  const text = reviewText.value.trim();
  if (reviewStarsSelected === 0) return alert("Selecciona una puntuación.");
  if (text.length < 5) return alert("Escribe un comentario más largo.");

  const app = currentApp;
  const prevAvg = app.ratingAvg || 0;
  const prevCount = app.ratingCount || 0;
  const newCount = prevCount + 1;
  const newAvg = (prevAvg * prevCount + reviewStarsSelected) / newCount;
  const breakdown = app.starsBreakdown || {1:0,2:0,3:0,4:0,5:0};
  breakdown[reviewStarsSelected]++;

  const appRef = db.collection("apps").doc(app.id);
  const reviewRef = appRef.collection("reviews").doc();
  const batch = db.batch();
  batch.set(reviewRef, { stars: reviewStarsSelected, comment: text, timestamp: Date.now() });
  batch.update(appRef, { ratingAvg: newAvg, ratingCount: newCount, starsBreakdown: breakdown });

  batch.commit().then(() => {
    reviewText.value = "";
    reviewStarsSelected = 0;
    renderReviewStars();
    currentApp.ratingAvg = newAvg;
    currentApp.ratingCount = newCount;
    currentApp.starsBreakdown = breakdown;
    ratingLabel.textContent = `Valoración: ${newAvg.toFixed(1)} (${newCount} votos)`;
    renderStars(app);
    loadReviews(app.id);
    renderApps();
    openDetails(currentApp);
    alert("¡Tu reseña fue publicada!");
  });
}




