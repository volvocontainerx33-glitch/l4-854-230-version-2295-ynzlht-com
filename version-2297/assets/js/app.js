(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function setupMenu() {
    var toggle = document.querySelector(".menu-toggle");
    var panel = document.querySelector(".mobile-panel");
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener("click", function () {
      var open = panel.hasAttribute("hidden");
      if (open) {
        panel.removeAttribute("hidden");
      } else {
        panel.setAttribute("hidden", "");
      }
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  function setupCarousel() {
    var carousel = document.querySelector("[data-carousel]");
    if (!carousel) {
      return;
    }
    var slides = Array.prototype.slice.call(
      carousel.querySelectorAll(".hero-slide"),
    );
    var dots = Array.prototype.slice.call(
      carousel.querySelectorAll("[data-carousel-dot]"),
    );
    var prev = carousel.querySelector("[data-carousel-prev]");
    var next = carousel.querySelector("[data-carousel-next]");
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5600);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
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
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        start();
      });
    });
    carousel.addEventListener("mouseenter", stop);
    carousel.addEventListener("mouseleave", start);
    start();
  }

  function setupFilters() {
    var scopes = document.querySelectorAll("[data-filter-scope]");
    scopes.forEach(function (scope) {
      var root = scope.parentElement || document;
      var list = root.querySelector("[data-card-list]");
      if (!list) {
        return;
      }
      var textInput = scope.querySelector("[data-list-filter]");
      var yearSelect = scope.querySelector("[data-year-filter]");
      var genreSelect = scope.querySelector("[data-genre-filter]");
      var cards = Array.prototype.slice.call(list.children);
      var params = new URLSearchParams(window.location.search);
      var q = params.get("q") || "";
      if (textInput && q) {
        textInput.value = q;
      }

      function apply() {
        var term = textInput ? textInput.value.trim().toLowerCase() : "";
        var year = yearSelect ? yearSelect.value : "";
        var genre = genreSelect ? genreSelect.value : "";
        cards.forEach(function (card) {
          var haystack =
            card.textContent.toLowerCase() +
            " " +
            (card.dataset.title || "").toLowerCase() +
            " " +
            (card.dataset.genre || "").toLowerCase() +
            " " +
            (card.dataset.region || "").toLowerCase();
          var matchesText = !term || haystack.indexOf(term) !== -1;
          var matchesYear = !year || card.dataset.year === year;
          var matchesGenre =
            !genre || (card.dataset.genre || "").indexOf(genre) !== -1;
          card.classList.toggle(
            "is-hidden",
            !(matchesText && matchesYear && matchesGenre),
          );
        });
      }

      [textInput, yearSelect, genreSelect].forEach(function (control) {
        if (control) {
          control.addEventListener("input", apply);
          control.addEventListener("change", apply);
        }
      });
      apply();
    });
  }

  function setupPlayers() {
    var videos = document.querySelectorAll(".movie-player");
    videos.forEach(function (video) {
      var box = video.closest(".player-box");
      var button = box ? box.querySelector(".play-overlay") : null;
      var stream = video.getAttribute("data-stream");
      var hls = null;

      function prepare() {
        if (!stream || video.dataset.ready === "1") {
          return;
        }
        if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({
            maxBufferLength: 30,
            enableWorker: true,
          });
          hls.loadSource(stream);
          hls.attachMedia(video);
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = stream;
        }
        video.dataset.ready = "1";
      }

      function play() {
        prepare();
        var task = video.play();
        if (task && typeof task.then === "function") {
          task.catch(function () {});
        }
      }

      if (button) {
        button.addEventListener("click", play);
      }
      video.addEventListener("click", function () {
        if (video.paused) {
          play();
        } else {
          video.pause();
        }
      });
      video.addEventListener("play", function () {
        if (box) {
          box.classList.add("is-playing");
        }
        video.setAttribute("controls", "controls");
      });
      video.addEventListener("pause", function () {
        if (box) {
          box.classList.remove("is-playing");
        }
      });
      window.addEventListener("beforeunload", function () {
        if (hls) {
          hls.destroy();
        }
      });
    });
  }

  ready(function () {
    setupMenu();
    setupCarousel();
    setupFilters();
    setupPlayers();
  });
})();
