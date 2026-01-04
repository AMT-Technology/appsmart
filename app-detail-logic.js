// ====== Referencias DOM ======
const detailContent = document.getElementById("detailContent");
let currentApp = null;
let reviewStarsSelected = 0;

// ====== Obtener ID de la URL ======
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
      mostrarError("App no encontrada");
      return;
    }
    
    currentApp = { ...doc.data(), id: doc.id };
    renderAppDetails(currentApp);
    actualizarMetaTags(currentApp);
    
  } catch (error) {
    console.error("Error cargando app:", error);
    mostrarError("Error de conexión");
  }
}

function mostrarError(mensaje) {
  detailContent.innerHTML = `
    <div style="text-align: center; padding: 50px;">
      <h2>${mensaje}</h2>
      <button class="btn-back" onclick="window.location.href='index.html'">Volver al inicio</button>
    </div>
  `;
}

function actualizarMetaTags(app) {
  document.title = `${app.nombre} — Appser Store`;
  
  // Actualizar meta description
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.content = `Descarga ${app.nombre} para Android desde Appser Store. ${app.descripcion?.substring(0, 150) || ''}`;
  }
}

// ====== Renderizar detalles de la app ======
function renderAppDetails(app) {
  const votes = JSON.parse(localStorage.getItem("appsmart_votes") || "{}");
  const myVote = votes[app.id] || {};

  const ratingAvg = app.ratingAvg || 0;
  const ratingCount = app.ratingCount || 0;
  const descargas = app.descargasReales ?? app.descargas ?? 0;
  const likes = app.likes || 0;

  let breakdown = app.starsBreakdown || {1:0,2:0,3:0,4:0,5:0};
  let total = Object.values(breakdown).reduce((a,b)=>a+b,0);
  if (!total && ratingCount) { 
    breakdown = {1:0,2:0,3:0,4:0,5:ratingCount}; 
    total = ratingCount; 
  }

  // Función para estrellas estáticas
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

  // HTML del overlay
  const html = `
    <button id="detailClose" class="overlay-close" onclick="window.history.back()">✕</button>

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
      Likes: ${likes.toLocaleString("es-ES")}
    </p>

    <!-- Bloque estrellas + like -->
    <div class="rating-block">
      <p id="ratingLabel" class="rating-label">
        Valoración: ${ratingAvg.toFixed(1)} (${ratingCount} votos)
      </p>
      <div id="starsRow" class="stars-row">
        ${renderStarsStatic(ratingAvg)}
      </div>
      <button id="likeBtn" class="like-btn" ${myVote.liked ? 'disabled' : ''}>
        ${myVote.liked ? '❤️ Ya te gusta' : '❤️ Me gusta'} (${likes})
      </button>
    </div>

    <!-- Resumen valoraciones -->
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

    <!-- INFORMACIÓN DE LA APP -->
    <h2>Información de la app</h2>
    <div class="info-grid">
      <div class="info-box">
        <span class="info-icon">🌐</span>
        <div>
          <p class="info-title">Idioma</p>
          <p id="infoIdioma" class="info-value">${app.idioma || '—'}</p>
        </div>
      </div>

      <div class="info-box">
        <span class="info-icon">🔢</span>
        <div>
          <p class="info-title">Versión</p>
          <p id="infoVersion" class="info-value">${app.version || '—'}</p>
        </div>
      </div>

      <div class="info-box">
        <span class="info-icon">🏷️</span>
        <div>
          <p class="info-title">Licencia</p>
          <p id="infoTipo" class="info-value">${app.tipo || '—'}</p>
        </div>
      </div>

      <div class="info-box">
        <span class="info-icon">📱</span>
        <div>
          <p class="info-title">Sistema operativo</p>
          <p id="infoSO" class="info-value">${app.sistemaOperativo || '—'}</p>
        </div>
      </div>

      <div class="info-box">
        <span class="info-icon">⚙️</span>
        <div>
          <p class="info-title">Requisitos del sistema</p>
          <p id="infoReq" class="info-value">${app.requisitos || '—'}</p>
        </div>
      </div>

      <div class="info-box">
        <span class="info-icon">📅</span>
        <div>
          <p class="info-title">Actualización</p>
          <p id="infoFechaAct" class="info-value">${app.fechaActualizacion ? new Date(app.fechaActualizacion).toLocaleDateString('es-ES') : '—'}</p>
        </div>
      </div>

      <div class="info-box">
        <span class="info-icon">🔞</span>
        <div>
          <p class="info-title">Edad recomendada</p>
          <p id="infoEdad" class="info-value">${app.edad || '—'}</p>
        </div>
      </div>

      <div class="info-box">
        <span class="info-icon">📢</span>
        <div>
          <p class="info-title">Anuncios</p>
          <p id="infoAnuncios" class="info-value">${app.anuncios === 'si' ? 'Sí' : app.anuncios === 'no' ? 'No' : '—'}</p>
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
          <p id="infoTamañoApk" class="info-value">${app.size || '—'}</p>
        </div>
      </div>

      <div class="info-box">
        <span class="info-icon">🆔</span>
        <div>
          <p class="info-title">Package Name</p>
          <p id="infoPackageName" class="info-value">${app.packageName || '—'}</p>
        </div>
      </div>

      <div class="info-box">
        <span class="info-icon">⬇️</span>
        <div>
          <p class="info-title">Descargas</p>
          <p id="infoDescargas" class="info-value">${descargas.toLocaleString('es-ES')}</p>
        </div>
      </div>
    </div>

    <h2>Descripción</h2>
    <p id="detailDesc" class="detail-desc">${app.descripcion || ''}</p>

    ${app.imgSecundarias && app.imgSecundarias.length > 0 ? `
    <h2>Capturas de pantalla</h2>
    <div id="detailScreens" class="screenshots-row">
      ${app.imgSecundarias.map(img => `<img src="${img}" alt="Captura" loading="lazy">`).join('')}
    </div>
    ` : ''}

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

  detailContent.innerHTML = html;

  // Inicializar eventos
  inicializarEventos(app);
  renderReviewStars();
  loadReviews(app.id);
}

// ====== Inicializar eventos ======
function inicializarEventos(app) {
  // Botón de descarga principal
  const installBtn = document.getElementById('installBtn');
  if (installBtn) {
    installBtn.onclick = () => {
      if (!app.apk) {
        alert("🚫 No hay archivo disponible.");
        return;
      }
      
      installBtn.disabled = true;
      installBtn.innerHTML = '<img src="assets/icons/descargar.png" alt="Descargando...">';
      
      // Incrementar contador
      db.collection("apps").doc(app.id).update({
        descargasReales: firebase.firestore.FieldValue.increment(1)
      }).then(() => {
        window.open(app.apk, '_blank');
        setTimeout(() => {
          installBtn.disabled = false;
          installBtn.innerHTML = '<img src="assets/icons/descargar.png" alt="Descarga Directa">';
        }, 1000);
      });
    };
  }

  // Botones extra
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
  const shareBtn = document.getElementById('shareBtn');
  if (shareBtn) {
    shareBtn.onclick = () => {
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
  }

  // Like
  const likeBtn = document.getElementById('likeBtn');
  if (likeBtn) {
    likeBtn.onclick = () => {
      const votes = JSON.parse(localStorage.getItem("appsmart_votes") || "{}");
      if (votes[app.id] && votes[app.id].liked) return;
      
      db.collection("apps").doc(app.id).update({
        likes: firebase.firestore.FieldValue.increment(1)
      }).then(() => {
        votes[app.id] = { liked: true };
        localStorage.setItem("appsmart_votes", JSON.stringify(votes));
        
        likeBtn.textContent = `❤️ Ya te gusta (${(app.likes || 0) + 1})`;
        likeBtn.disabled = true;
      });
    };
  }
}

// ====== Reseñas ======
function renderReviewStars() {
  const container = document.getElementById('reviewStars');
  if (!container) return;
  
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
  if (!container) return;
  
  container.innerHTML = '<p>Cargando reseñas...</p>';
  
  db.collection("apps").doc(appId).collection("reviews")
    .orderBy("timestamp", "desc")
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
  
  const text = document.getElementById('reviewText')?.value.trim() || '';
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
    userId: 'anonymous'
  });
  
  batch.update(appRef, { 
    ratingAvg: newAvg, 
    ratingCount: newCount, 
    starsBreakdown: breakdown 
  });
  
  batch.commit().then(() => {
    // Limpiar formulario
    const reviewText = document.getElementById('reviewText');
    if (reviewText) reviewText.value = '';
    reviewStarsSelected = 0;
    renderReviewStars();
    
    // Recargar reviews
    loadReviews(app.id);
    
    alert("¡Tu reseña fue publicada!");
  }).catch(error => {
    console.error("Error enviando reseña:", error);
    alert("Error al enviar la reseña.");
  });
}

// ====== Inicializar ======
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('year').textContent = new Date().getFullYear();
  cargarApp();
});
