// app-detail.js - Lógica para la página dinámica de detalles de app

// ====== Referencias DOM ======
const appContainer = document.getElementById("appContainer");
let currentApp = null;
let reviewStarsSelected = 0;

// ====== LocalStorage ======
const VOTES_KEY = "appser_votes";

function getVotes() {
  try { return JSON.parse(localStorage.getItem(VOTES_KEY) || "{}"); } 
  catch { return {}; }
}

function saveVotes(v) {
  localStorage.setItem(VOTES_KEY, JSON.stringify(v));
}

// ====== Obtener ID de la app de la URL ======
function getAppIdFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('id');
}

// ====== Cargar datos de la app ======
async function cargarApp() {
  const appId = getAppIdFromURL();
  
  if (!appId) {
    window.location.href = 'index.html';
    return;
  }
  
  try {
    const doc = await db.collection("apps").doc(appId).get();
    
    if (!doc.exists) {
      appContainer.innerHTML = `
        <div class="error-container">
          <h2>App no encontrada</h2>
          <p>La aplicación que buscas no existe o ha sido eliminada.</p>
          <button class="btn-back" onclick="window.location.href='index.html'">← Volver al inicio</button>
        </div>
      `;
      return;
    }
    
    currentApp = { ...doc.data(), id: doc.id };
    renderizarApp(currentApp);
    
    // Actualizar título y meta tags dinámicamente
    actualizarMetaTags(currentApp);
    
  } catch (error) {
    console.error("Error cargando app:", error);
    appContainer.innerHTML = `
      <div class="error-container">
        <h2>Error al cargar la app</h2>
        <p>Hubo un problema al cargar la información. Intenta nuevamente.</p>
        <button class="btn-back" onclick="window.location.href='index.html'">← Volver al inicio</button>
      </div>
    `;
  }
}

// ====== Actualizar meta tags para SEO ======
function actualizarMetaTags(app) {
  document.title = `${app.nombre} — Appser Store | Descarga ${app.nombre} para Android`;
  
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.content = `Descarga ${app.nombre} para Android desde Appser Store. ${app.descripcion?.substring(0, 150) || ''}`;
  }
  
  // Open Graph
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDesc = document.querySelector('meta[property="og:description"]');
  const ogImage = document.querySelector('meta[property="og:image"]');
  const ogUrl = document.querySelector('meta[property="og:url"]');
  
  if (ogTitle) ogTitle.content = `${app.nombre} — Appser Store`;
  if (ogDesc) ogDesc.content = app.descripcion?.substring(0, 200) || '';
  if (ogImage) ogImage.content = app.imagen || 'https://appsem.rap-infinite.online/logo.webp';
  if (ogUrl) ogUrl.content = window.location.href;
}

// ====== Renderizar app ======
function renderizarApp(app) {
  const votes = getVotes();
  const myVote = votes[app.id] || {};
  
  const ratingAvg = app.ratingAvg || 0;
  const ratingCount = app.ratingCount || 0;
  const descargas = app.descargasReales ?? app.descargas ?? 0;
  
  let breakdown = app.starsBreakdown || {1:0,2:0,3:0,4:0,5:0};
  let total = Object.values(breakdown).reduce((a,b)=>a+b,0);
  if (!total && ratingCount) { breakdown = {1:0,2:0,3:0,4:0,5:ratingCount}; total = ratingCount; }
  
  const screenshotsHTML = app.imgSecundarias && app.imgSecundarias.length > 0 ? `
    <h2>Capturas de pantalla</h2>
    <div class="screenshots-row">
      ${app.imgSecundarias.map(img => `<img src="${img}" alt="Captura de ${app.nombre}" loading="lazy">`).join('')}
    </div>
  ` : '';
  
  appContainer.innerHTML = `
    <div class="overlay-header">
      <img id="detailIcon" class="overlay-icon" src="${app.imagen}" alt="${app.nombre}" loading="lazy">
      <div>
        <h1 id="detailName">${app.nombre}</h1>
        <p id="detailCategory">${app.categoria}</p>
        <p id="detailSize">📦 Tamaño: ${app.size || '—'}</p>
        <p id="detailInternet">${app.internet === 'offline' ? '📴 Funciona sin Internet' : '🌐 Requiere Internet'}</p>
      </div>
    </div>

    <div class="install-share-row">
      <button id="installBtn" class="install-btn">
        <img src="assets/icons/descargar.png" alt="Descarga Directa">
      </button>
      
      ${app.playstoreUrl ? `<button id="playstoreBtn" class="playstore-btn">
        <img src="assets/icons/playstore.png" alt="Play Store">
      </button>` : ''}
      
      ${app.uptodownUrl ? `<button id="uptodownBtn" class="uptodown-btn">
        <img src="assets/icons/uptodown.png" alt="Uptodown">
      </button>` : ''}
      
      ${app.megaUrl ? `<button id="megaBtn" class="mega-btn">
        <img src="assets/icons/mega.png" alt="Mega">
      </button>` : ''}
      
      ${app.mediafireUrl ? `<button id="mediafireBtn" class="mediafire-btn">
        <img src="assets/icons/mediafire.png" alt="Mediafire">
      </button>` : ''}
      
      <button id="shareBtn" class="share-btn">
        <img src="assets/icons/compartir.png" alt="Compartir">
      </button>
    </div>

    <p id="detailStats" class="detail-stats">
      Descargas: ${descargas.toLocaleString("es-ES")} • 
      Likes: ${(app.likes || 0).toLocaleString("es-ES")}
    </p>

    <!-- Rating -->
    <div class="rating-block">
      <p id="ratingLabel" class="rating-label">
        Valoración: ${ratingAvg.toFixed(1)} (${ratingCount} votos)
      </p>
      <div id="starsRow" class="stars-row">
        ${renderStarsStatic(ratingAvg)}
      </div>
      <button id="likeBtn" class="like-btn" ${myVote.liked ? 'disabled' : ''}>
        ${myVote.liked ? '❤️ Ya te gusta' : '❤️ Me gusta'} (${app.likes || 0})
      </button>
    </div>

    <!-- Gráfico de valoraciones -->
    <h2>Valoraciones y reseñas</h2>
    <div class="stars-graph">
      <div class="stars-left">
        <div id="ratingBig" class="rating-big">${ratingAvg.toFixed(1)}</div>
        <div id="ratingTotal" class="rating-total">${total} reseñas</div>
      </div>
      
      <div class="stars-bars">
        ${[5,4,3,2,1].map(star => `
          <div class="bar-row">
            <span>${star}</span>
            <div class="bar"><div id="bar${star}" class="bar-fill" style="width: ${total ? (breakdown[star] / total) * 100 : 0}%"></div></div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Información de la App -->
    <h2>Información de la app</h2>
    <div class="info-grid">
      <div class="info-box">
        <span class="info-icon">🌐</span>
        <div>
          <p class="info-title">Idioma</p>
          <p class="info-value">${app.idioma || '—'}</p>
        </div>
      </div>
      
      <div class="info-box">
        <span class="info-icon">🔢</span>
        <div>
          <p class="info-title">Versión</p>
          <p class="info-value">${app.version || '—'}</p>
        </div>
      </div>
      
      <div class="info-box">
        <span class="info-icon">🏷️</span>
        <div>
          <p class="info-title">Licencia</p>
          <p class="info-value">${app.tipo || '—'}</p>
        </div>
      </div>
      
      <div class="info-box">
        <span class="info-icon">📱</span>
        <div>
          <p class="info-title">Sistema operativo</p>
          <p class="info-value">${app.sistemaOperativo || '—'}</p>
        </div>
      </div>
      
      <div class="info-box">
        <span class="info-icon">⚙️</span>
        <div>
          <p class="info-title">Requisitos del sistema</p>
          <p class="info-value">${app.requisitos || '—'}</p>
        </div>
      </div>
      
      <div class="info-box">
        <span class="info-icon">📅</span>
        <div>
          <p class="info-title">Actualización</p>
          <p class="info-value">${app.fechaActualizacion ? new Date(app.fechaActualizacion).toLocaleDateString('es-ES') : '—'}</p>
        </div>
      </div>
      
      <div class="info-box">
        <span class="info-icon">🔞</span>
        <div>
          <p class="info-title">Edad recomendada</p>
          <p class="info-value">${app.edad || '—'}</p>
        </div>
      </div>
      
      <div class="info-box">
        <span class="info-icon">📢</span>
        <div>
          <p class="info-title">Anuncios</p>
          <p class="info-value">${app.anuncios === 'si' ? 'Sí' : app.anuncios === 'no' ? 'No' : '—'}</p>
        </div>
      </div>
      
      <div class="info-box">
        <span class="info-icon">🔗</span>
        <div>
          <p class="info-title">Política de privacidad</p>
          <p class="info-value">
            ${app.privacidadUrl ? `<a href="${app.privacidadUrl}" target="_blank">Ver política</a>` : 'No disponible'}
          </p>
        </div>
      </div>
      
      <div class="info-box">
        <span class="info-icon">📦</span>
        <div>
          <p class="info-title">Tamaño del APK</p>
          <p class="info-value">${app.size || '—'}</p>
        </div>
      </div>
      
      <div class="info-box">
        <span class="info-icon">🆔</span>
        <div>
          <p class="info-title">Package Name</p>
          <p class="info-value">${app.packageName || '—'}</p>
        </div>
      </div>
      
      <div class="info-box">
        <span class="info-icon">⬇️</span>
        <div>
          <p class="info-title">Descargas</p>
          <p class="info-value">${descargas.toLocaleString('es-ES')}</p>
        </div>
      </div>
    </div>

    <h2>Descripción</h2>
    <p id="detailDesc" class="detail-desc">${app.descripcion || ''}</p>

    ${screenshotsHTML}

    <h2>Reseñas de usuarios</h2>
    
    <!-- Formulario reseña -->
    <div class="review-form">
      <h3>Escribe una reseña</h3>
      <label>Tu puntuación:</label>
      <div id="reviewStars" class="stars-row"></div>
      <textarea id="reviewText" placeholder="Escribe tu comentario..." maxlength="280"></textarea>
      <button id="sendReviewBtn" class="install-btn" style="margin-top:10px;">
        Enviar reseña
      </button>
    </div>
    
    <!-- Lista reseñas -->
    <div id="reviewsList" class="reviews-list"></div>
  `;
  
  // Inicializar eventos
  inicializarEventos(app);
  renderReviewStars();
  loadReviews(app.id);
}

// ====== Render estrellas estáticas ======
function renderStarsStatic(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.25 && rating % 1 < 0.75 ? 1 : 0;
  const empty = 5 - full - half;
  let stars = '';
  
  for (let i = 0; i < full; i++) stars += '<span class="star-static">★</span>';
  if (half) stars += '<span class="star-static">⯨</span>';
  for (let i = 0; i < empty; i++) stars += '<span class="star-static">☆</span>';
  
  return stars;
}

// ====== Inicializar eventos ======
function inicializarEventos(app) {
  // Descargar APK
  document.getElementById('installBtn').onclick = () => {
    if (!app.apk) {
      alert("🚫 No hay archivo disponible.");
      return;
    }
    
    const btn = document.getElementById('installBtn');
    btn.disabled = true;
    btn.innerHTML = '<img src="assets/icons/descargar.png" alt="Descargando...">';
    
    // Incrementar contador de descargas
    db.collection("apps").doc(app.id)
      .update({ descargasReales: firebase.firestore.FieldValue.increment(1) })
      .then(() => {
        // Actualizar localmente
        app.descargasReales = (app.descargasReales || 0) + 1;
        document.getElementById('detailStats').textContent = 
          `Descargas: ${app.descargasReales.toLocaleString("es-ES")} • Likes: ${(app.likes || 0).toLocaleString("es-ES")}`;
        
        // Abrir enlace de descarga
        window.open(app.apk, '_blank');
        
        setTimeout(() => {
          btn.disabled = false;
          btn.innerHTML = '<img src="assets/icons/descargar.png" alt="Descarga Directa">';
        }, 1000);
      });
  };
  
  // Botones adicionales
  const botones = [
    {id: 'playstoreBtn', url: app.playstoreUrl},
    {id: 'uptodownBtn', url: app.uptodownUrl},
    {id: 'megaBtn', url: app.megaUrl},
    {id: 'mediafireBtn', url: app.mediafireUrl},
  ];
  
  botones.forEach(({id, url}) => {
    const btn = document.getElementById(id);
    if (btn && url) {
      btn.style.display = 'inline-block';
      btn.onclick = () => window.open(url, '_blank');
    } else if (btn) {
      btn.style.display = 'none';
    }
  });
  
  // Compartir
  document.getElementById('shareBtn').onclick = () => {
    const url = window.location.href;
    const title = app.nombre;
    const text = app.descripcion?.substring(0, 100) || '';
    
    if (navigator.share) {
      navigator.share({ title, text, url });
    } else {
      navigator.clipboard.writeText(url);
      alert('¡Enlace copiado al portapapeles!');
    }
  };
  
  // Like
  document.getElementById('likeBtn').onclick = () => handleLike(app);
}

// ====== Likes ======
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
      
      app.likes = (app.likes || 0) + 1;
      const btn = document.getElementById('likeBtn');
      btn.textContent = `❤️ Ya te gusta (${app.likes})`;
      btn.disabled = true;
      
      document.getElementById('detailStats').textContent = 
        `Descargas: ${(app.descargasReales || 0).toLocaleString("es-ES")} • Likes: ${app.likes.toLocaleString("es-ES")}`;
    });
}

// ====== Reseñas ======
function renderReviewStars() {
  const container = document.getElementById('reviewStars');
  container.innerHTML = '';
  
  for (let i = 1; i <= 5; i++) {
    const btn = document.createElement('button');
    btn.textContent = '☆';
    btn.className = 'star-btn';
    btn.onclick = () => setReviewStars(i);
    container.appendChild(btn);
  }
}

function setReviewStars(n) {
  reviewStarsSelected = n;
  const stars = document.querySelectorAll('#reviewStars .star-btn');
  stars.forEach((star, index) => {
    star.textContent = index < n ? '★' : '☆';
  });
}

function loadReviews(appId) {
  const container = document.getElementById('reviewsList');
  container.innerHTML = '<p>Cargando reseñas...</p>';
  
  db.collection("apps").doc(appId).collection("reviews")
    .orderBy("timestamp", "desc")
    .limit(50)
    .get()
    .then(snap => {
      container.innerHTML = '';
      
      if (snap.empty) {
        container.innerHTML = '<p>No hay reseñas todavía. Sé el primero en comentar.</p>';
        return;
      }
      
      snap.forEach(doc => {
        const r = doc.data();
        const item = document.createElement('div');
        item.className = 'review-item';
        const starsStr = '★'.repeat(r.stars) + '☆'.repeat(5 - r.stars);
        item.innerHTML = `
          <div class="review-stars">${starsStr}</div>
          <div class="review-text">${r.comment}</div>
          <div class="review-time">${new Date(r.timestamp).toLocaleDateString('es-ES')}</div>
        `;
        container.appendChild(item);
      });
    })
    .catch(() => {
      container.innerHTML = '<p>Error cargando reseñas.</p>';
    });
}

// ====== Enviar reseña ======
document.addEventListener('click', function(e) {
  if (e.target.id === 'sendReviewBtn' || e.target.closest('#sendReviewBtn')) {
    handleSendReview();
  }
});

function handleSendReview() {
  if (!currentApp) return;
  
  const text = document.getElementById('reviewText').value.trim();
  if (reviewStarsSelected === 0) {
    alert("Selecciona una puntuación.");
    return;
  }
  if (text.length < 5) {
    alert("Escribe un comentario más largo (mínimo 5 caracteres).");
    return;
  }
  
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
  
  batch.set(reviewRef, { 
    stars: reviewStarsSelected, 
    comment: text, 
    timestamp: Date.now(),
    userId: 'anonymous' // Podrías implementar autenticación después
  });
  
  batch.update(appRef, { 
    ratingAvg: newAvg, 
    ratingCount: newCount, 
    starsBreakdown: breakdown 
  });
  
  batch.commit().then(() => {
    // Limpiar formulario
    document.getElementById('reviewText').value = '';
    reviewStarsSelected = 0;
    renderReviewStars();
    
    // Actualizar datos locales
    currentApp.ratingAvg = newAvg;
    currentApp.ratingCount = newCount;
    currentApp.starsBreakdown = breakdown;
    
    // Recargar reviews
    loadReviews(app.id);
    
    // Actualizar UI
    document.getElementById('ratingLabel').textContent = 
      `Valoración: ${newAvg.toFixed(1)} (${newCount} votos)`;
    document.getElementById('ratingBig').textContent = newAvg.toFixed(1);
    document.getElementById('ratingTotal').textContent = `${newCount} reseñas`;
    
    // Actualizar barras
    [5,4,3,2,1].forEach(star => {
      const percent = newCount ? (breakdown[star] / newCount) * 100 : 0;
      document.getElementById(`bar${star}`).style.width = percent + "%";
    });
    
    alert("¡Tu reseña fue publicada!");
  }).catch(error => {
    console.error("Error enviando reseña:", error);
    alert("Error al enviar la reseña. Intenta nuevamente.");
  });
}

// ====== Inicializar cuando el DOM esté listo ======
document.addEventListener('DOMContentLoaded', () => {
  cargarApp();
});
