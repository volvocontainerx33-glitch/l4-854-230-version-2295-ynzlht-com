(function() {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function bindMobileMenu() {
    var toggle = document.querySelector("[data-mobile-toggle]");
    var panel = document.querySelector("[data-mobile-panel]");
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener("click", function() {
      panel.classList.toggle("is-open");
    });
  }

  function bindHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var index = 0;
    var timer = null;

    function setSlide(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function(slide, i) {
        slide.classList.toggle("is-active", i === index);
      });
      dots.forEach(function(dot, i) {
        dot.classList.toggle("is-active", i === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function() {
        setSlide(index + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    dots.forEach(function(dot, i) {
      dot.addEventListener("click", function() {
        setSlide(i);
        start();
      });
    });

    if (prev) {
      prev.addEventListener("click", function() {
        setSlide(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener("click", function() {
        setSlide(index + 1);
        start();
      });
    }

    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    setSlide(0);
    start();
  }

  function getQueryValue(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name) || "";
  }

  function bindMovieFilter() {
    var form = document.querySelector("[data-movie-filter]");
    if (!form) {
      return;
    }
    var input = form.querySelector("input[name='q']");
    var category = form.querySelector("select[name='category']");
    var type = form.querySelector("select[name='type']");
    var cards = Array.prototype.slice.call(document.querySelectorAll(".movie-card"));
    var empty = document.querySelector("[data-empty-state]");
    var initialQuery = getQueryValue("q");

    if (input && initialQuery) {
      input.value = initialQuery;
    }

    function normalize(value) {
      return String(value || "").trim().toLowerCase();
    }

    function apply() {
      var keyword = normalize(input ? input.value : "");
      var categoryValue = normalize(category ? category.value : "");
      var typeValue = normalize(type ? type.value : "");
      var visible = 0;

      cards.forEach(function(card) {
        var haystack = normalize([
          card.getAttribute("data-title"),
          card.getAttribute("data-region"),
          card.getAttribute("data-type"),
          card.getAttribute("data-year"),
          card.getAttribute("data-genre"),
          card.getAttribute("data-category"),
          card.getAttribute("data-tags")
        ].join(" "));
        var matchesKeyword = !keyword || haystack.indexOf(keyword) !== -1;
        var matchesCategory = !categoryValue || normalize(card.getAttribute("data-category")) === categoryValue;
        var matchesType = !typeValue || normalize(card.getAttribute("data-type")) === typeValue;
        var shouldShow = matchesKeyword && matchesCategory && matchesType;
        card.style.display = shouldShow ? "" : "none";
        if (shouldShow) {
          visible += 1;
        }
      });

      if (empty) {
        empty.classList.toggle("is-visible", visible === 0);
      }
    }

    form.addEventListener("submit", function(event) {
      event.preventDefault();
      apply();
    });

    [input, category, type].forEach(function(control) {
      if (control) {
        control.addEventListener("input", apply);
        control.addEventListener("change", apply);
      }
    });

    apply();
  }

  window.initPlayer = function(videoId, coverId, source) {
    var video = document.getElementById(videoId);
    var cover = document.getElementById(coverId);
    var started = false;
    var hls = null;

    if (!video || !source) {
      return;
    }

    function begin() {
      if (started) {
        video.play().catch(function() {});
        return;
      }
      started = true;
      if (cover) {
        cover.classList.add("is-hidden");
      }

      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(source);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, function() {
          video.play().catch(function() {});
        });
        hls.on(window.Hls.Events.ERROR, function(event, data) {
          if (!data || !data.fatal) {
            return;
          }
          if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            hls.destroy();
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
        video.addEventListener("loadedmetadata", function onLoaded() {
          video.removeEventListener("loadedmetadata", onLoaded);
          video.play().catch(function() {});
        });
        video.load();
      } else {
        video.src = source;
        video.load();
        video.play().catch(function() {});
      }
    }

    if (cover) {
      cover.addEventListener("click", begin);
    }

    video.addEventListener("click", function() {
      if (!started) {
        begin();
      }
    });

    window.addEventListener("pagehide", function() {
      if (hls) {
        hls.destroy();
      }
    });
  };

  ready(function() {
    bindMobileMenu();
    bindHero();
    bindMovieFilter();
  });
})();
