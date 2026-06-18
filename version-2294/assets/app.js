(() => {
  const mobileToggle = document.querySelector('[data-mobile-toggle]');
  const mobilePanel = document.querySelector('[data-mobile-panel]');
  if (mobileToggle && mobilePanel) {
    mobileToggle.addEventListener('click', () => {
      mobilePanel.classList.toggle('open');
    });
  }

  const hero = document.querySelector('[data-hero]');
  if (hero) {
    const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
    const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
    const prev = hero.querySelector('[data-hero-prev]');
    const next = hero.querySelector('[data-hero-next]');
    let active = 0;
    const show = (index) => {
      active = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle('active', i === active));
      dots.forEach((dot, i) => dot.classList.toggle('active', i === active));
    };
    if (prev) {
      prev.addEventListener('click', () => show(active - 1));
    }
    if (next) {
      next.addEventListener('click', () => show(active + 1));
    }
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => show(index));
    });
    setInterval(() => show(active + 1), 5000);
  }

  const params = new URLSearchParams(window.location.search);
  const query = (params.get('q') || '').trim();
  const queryInput = document.querySelector('[data-query-input]');
  const filterInput = document.querySelector('[data-search-input]');
  const list = document.querySelector('[data-search-list]');
  const emptyState = document.querySelector('[data-empty-state]');
  const title = document.querySelector('[data-search-title]');

  if (queryInput && query) {
    queryInput.value = query;
  }
  if (filterInput && query) {
    filterInput.value = query;
  }

  const applyFilter = (value) => {
    if (!list) {
      return;
    }
    const normalized = value.trim().toLowerCase();
    const cards = Array.from(list.querySelectorAll('.searchable-card'));
    let visible = 0;
    cards.forEach((card) => {
      const haystack = (card.getAttribute('data-search') || '').toLowerCase();
      const match = !normalized || haystack.includes(normalized);
      card.style.display = match ? '' : 'none';
      if (match) {
        visible += 1;
      }
    });
    if (emptyState) {
      emptyState.classList.toggle('show', visible === 0);
    }
    if (title) {
      title.textContent = normalized ? `搜索结果：${value.trim()}` : '影片列表';
    }
  };

  if (filterInput) {
    filterInput.addEventListener('input', () => applyFilter(filterInput.value));
    applyFilter(filterInput.value);
  }
})();

function initMoviePlayer(videoId, overlayId, sourceUrl) {
  const video = document.getElementById(videoId);
  const overlay = document.getElementById(overlayId);
  if (!video || !overlay || !sourceUrl) {
    return;
  }
  let ready = false;
  const load = () => {
    if (!ready) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = sourceUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        const hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(sourceUrl);
        hls.attachMedia(video);
      } else {
        video.src = sourceUrl;
      }
      ready = true;
    }
    overlay.classList.add('hidden');
    const attempt = video.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(() => {
        overlay.classList.remove('hidden');
      });
    }
  };
  overlay.addEventListener('click', load);
  video.addEventListener('click', () => {
    if (video.paused) {
      load();
    }
  });
}
