(function () {
  'use strict';

  function selectAll(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function setupMobileMenu() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var nav = document.querySelector('[data-main-nav]');

    if (!toggle || !nav) {
      return;
    }

    toggle.addEventListener('click', function () {
      nav.classList.toggle('is-open');
    });
  }

  function setupHeroCarousel() {
    var carousel = document.querySelector('[data-hero-carousel]');

    if (!carousel) {
      return;
    }

    var slides = selectAll('[data-hero-slide]', carousel);
    var dots = selectAll('[data-hero-dot]', carousel);
    var prev = carousel.querySelector('[data-hero-prev]');
    var next = carousel.querySelector('[data-hero-next]');
    var activeIndex = 0;
    var timer = null;

    function showSlide(index) {
      activeIndex = (index + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === activeIndex);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === activeIndex);
      });
    }

    function startAutoPlay() {
      stopAutoPlay();
      timer = window.setInterval(function () {
        showSlide(activeIndex + 1);
      }, 5000);
    }

    function stopAutoPlay() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        showSlide(Number(dot.getAttribute('data-hero-dot')) || 0);
        startAutoPlay();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        showSlide(activeIndex - 1);
        startAutoPlay();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        showSlide(activeIndex + 1);
        startAutoPlay();
      });
    }

    carousel.addEventListener('mouseenter', stopAutoPlay);
    carousel.addEventListener('mouseleave', startAutoPlay);
    showSlide(0);
    startAutoPlay();
  }

  function normalize(text) {
    return String(text || '').trim().toLowerCase();
  }

  function setupCardFilters() {
    selectAll('[data-filter-panel]').forEach(function (panel) {
      var root = panel.parentElement || document;
      var keywordInput = panel.querySelector('[data-card-search]');
      var yearInput = panel.querySelector('[data-card-year]');
      var countNode = panel.querySelector('[data-filter-count]');
      var cards = selectAll('[data-video-card]', root);

      function applyFilter() {
        var keyword = normalize(keywordInput && keywordInput.value);
        var year = normalize(yearInput && yearInput.value);
        var visibleCount = 0;

        cards.forEach(function (card) {
          var text = normalize([
            card.getAttribute('data-title'),
            card.getAttribute('data-region'),
            card.getAttribute('data-tags'),
            card.getAttribute('data-genre')
          ].join(' '));
          var cardYear = normalize(card.getAttribute('data-year'));
          var matchesKeyword = !keyword || text.indexOf(keyword) !== -1;
          var matchesYear = !year || cardYear.indexOf(year) !== -1;
          var visible = matchesKeyword && matchesYear;

          card.classList.toggle('is-hidden', !visible);

          if (visible) {
            visibleCount += 1;
          }
        });

        if (countNode) {
          countNode.textContent = String(visibleCount);
        }
      }

      if (keywordInput) {
        keywordInput.addEventListener('input', applyFilter);
      }

      if (yearInput) {
        yearInput.addEventListener('input', applyFilter);
      }

      applyFilter();
    });
  }

  function getQueryValue(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name) || '';
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderSearchCard(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return '<span>' + escapeHtml(tag) + '</span>';
    }).join('');

    return [
      '<a class="video-card" href="' + escapeHtml(movie.url) + '">',
      '  <div class="video-thumb">',
      '    <img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
      '    <span class="score-badge">' + escapeHtml(movie.score) + '</span>',
      '    <span class="duration-badge">' + escapeHtml(movie.duration) + '</span>',
      '    <span class="play-badge">▶</span>',
      '  </div>',
      '  <div class="video-card-body">',
      '    <h3>' + escapeHtml(movie.title) + '</h3>',
      '    <p>' + escapeHtml(movie.one_line) + '</p>',
      '    <div class="video-meta">',
      '      <span>' + escapeHtml(movie.year) + '</span>',
      '      <span>' + escapeHtml(movie.region) + '</span>',
      '      <span>' + escapeHtml(movie.type) + '</span>',
      '    </div>',
      '    <div class="tag-row">' + tags + '</div>',
      '  </div>',
      '</a>'
    ].join('\n');
  }

  function setupSearchPage() {
    var page = document.querySelector('[data-search-page]');

    if (!page || !window.SITE_MOVIES) {
      return;
    }

    var input = page.querySelector('[data-search-input]');
    var results = page.querySelector('[data-search-results]');
    var countNode = page.querySelector('[data-search-count]');

    if (!input || !results) {
      return;
    }

    function applySearch() {
      var query = normalize(input.value);
      var matched = window.SITE_MOVIES.filter(function (movie) {
        var haystack = normalize([
          movie.title,
          movie.region,
          movie.year,
          movie.type,
          movie.genre,
          (movie.tags || []).join(' '),
          movie.one_line
        ].join(' '));
        return !query || haystack.indexOf(query) !== -1;
      }).slice(0, 240);

      results.innerHTML = matched.map(renderSearchCard).join('\n');

      if (countNode) {
        countNode.textContent = String(matched.length);
      }
    }

    input.value = getQueryValue('q');
    input.addEventListener('input', applySearch);
    applySearch();
  }

  function setupCopyLink() {
    selectAll('[data-copy-link]').forEach(function (button) {
      button.addEventListener('click', function () {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(window.location.href);
          button.textContent = '已复制';
          window.setTimeout(function () {
            button.textContent = '分享';
          }, 1600);
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupMobileMenu();
    setupHeroCarousel();
    setupCardFilters();
    setupSearchPage();
    setupCopyLink();
  });
})();
