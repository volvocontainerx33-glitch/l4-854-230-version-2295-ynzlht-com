(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function initNavigation() {
    var button = document.querySelector("[data-nav-toggle]");
    var nav = document.querySelector("[data-site-nav]");
    if (!button || !nav) {
      return;
    }
    button.addEventListener("click", function () {
      nav.classList.toggle("is-open");
    });
  }

  function initHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var index = 0;
    var timer;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("active", dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        start();
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        start();
      });
    }
    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-hero-dot")) || 0);
        start();
      });
    });
    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function initLocalFilters() {
    var grids = Array.prototype.slice.call(document.querySelectorAll("[data-filter-grid]"));
    if (!grids.length) {
      return;
    }
    var input = document.querySelector("[data-filter-input]");
    var region = document.querySelector("[data-filter-region]");
    var type = document.querySelector("[data-filter-type]");

    function apply() {
      var q = input ? input.value.trim().toLowerCase() : "";
      var regionValue = region ? region.value.trim().toLowerCase() : "";
      var typeValue = type ? type.value.trim().toLowerCase() : "";
      grids.forEach(function (grid) {
        var cards = Array.prototype.slice.call(grid.querySelectorAll("[data-movie-card]"));
        cards.forEach(function (card) {
          var text = (card.getAttribute("data-filter") || "").toLowerCase();
          var matched = (!q || text.indexOf(q) !== -1) && (!regionValue || text.indexOf(regionValue) !== -1) && (!typeValue || text.indexOf(typeValue) !== -1);
          card.classList.toggle("is-hidden", !matched);
        });
      });
    }

    [input, region, type].forEach(function (node) {
      if (node) {
        node.addEventListener("input", apply);
        node.addEventListener("change", apply);
      }
    });
  }

  function cardTemplate(movie) {
    return [
      '<a class="movie-card" href="' + escapeHtml(movie.url) + '">',
      '  <span class="card-poster">',
      '    <img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
      '    <span class="type-badge">' + escapeHtml(movie.type) + '</span>',
      '  </span>',
      '  <span class="card-body">',
      '    <strong>' + escapeHtml(movie.title) + '</strong>',
      '    <span class="card-meta">',
      '      <span>' + escapeHtml(movie.region) + '</span>',
      '      <span>' + escapeHtml(movie.year) + '</span>',
      '    </span>',
      '  </span>',
      '</a>'
    ].join("");
  }

  function initSearchPage() {
    var results = document.querySelector("[data-search-results]");
    var form = document.querySelector("[data-search-form]");
    var input = document.querySelector("[data-search-input]");
    var region = document.querySelector("[data-search-region]");
    var type = document.querySelector("[data-search-type]");
    var status = document.querySelector("[data-search-status]");
    var data = window.MOVIE_SEARCH_DATA || [];
    if (!results || !form || !input || !data.length) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var initial = params.get("q") || "";
    input.value = initial;

    function run() {
      var q = input.value.trim().toLowerCase();
      var regionValue = region ? region.value.trim().toLowerCase() : "";
      var typeValue = type ? type.value.trim().toLowerCase() : "";
      var matched = data.filter(function (movie) {
        var text = movie.searchText || "";
        return (!q || text.indexOf(q) !== -1) && (!regionValue || text.indexOf(regionValue) !== -1) && (!typeValue || text.indexOf(typeValue) !== -1);
      }).slice(0, 120);
      results.innerHTML = matched.map(cardTemplate).join("");
      if (status) {
        status.textContent = q || regionValue || typeValue ? "已找到 " + matched.length + " 个匹配内容" : "输入关键词即可开始查找。";
      }
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      run();
    });
    [input, region, type].forEach(function (node) {
      if (node) {
        node.addEventListener("input", run);
        node.addEventListener("change", run);
      }
    });
    run();
  }

  window.initMoviePlayer = function (src) {
    var video = document.getElementById("movie-video");
    var button = document.querySelector(".player-overlay");
    if (!video || !src) {
      return;
    }
    var attached = false;
    var hlsInstance = null;

    function attach() {
      if (attached) {
        return;
      }
      attached = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        return;
      }
      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({ enableWorker: true });
        hlsInstance.loadSource(src);
        hlsInstance.attachMedia(video);
        return;
      }
      video.src = src;
    }

    function play() {
      attach();
      if (button) {
        button.classList.add("is-hidden");
      }
      var promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(function () {
          if (button) {
            button.classList.remove("is-hidden");
          }
        });
      }
    }

    if (button) {
      button.addEventListener("click", play);
    }
    video.addEventListener("click", function () {
      if (video.paused) {
        play();
      }
    });
    video.addEventListener("play", function () {
      if (button) {
        button.classList.add("is-hidden");
      }
    });
    window.addEventListener("beforeunload", function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  };

  ready(function () {
    initNavigation();
    initHero();
    initLocalFilters();
    initSearchPage();
  });
})();
