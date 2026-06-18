(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }
    callback();
  }

  function initMobileNav() {
    var button = document.querySelector("[data-mobile-menu-button]");
    var nav = document.querySelector("[data-mobile-nav]");
    if (!button || !nav) {
      return;
    }
    button.addEventListener("click", function () {
      nav.classList.toggle("is-open");
    });
  }

  function initHero() {
    var root = document.querySelector("[data-hero]");
    if (!root) {
      return;
    }

    var slides = Array.prototype.slice.call(root.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(root.querySelectorAll("[data-hero-dot]"));
    var prev = root.querySelector("[data-hero-prev]");
    var next = root.querySelector("[data-hero-next]");
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    }

    function play() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-hero-dot")) || 0);
        play();
      });
    });

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        play();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        play();
      });
    }

    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", play);
    show(0);
    play();
  }

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  function initSearch() {
    var lists = Array.prototype.slice.call(document.querySelectorAll("[data-search-list]"));
    if (!lists.length) {
      return;
    }

    var input = document.querySelector("[data-search-input]");
    var filters = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
    var status = document.querySelector("[data-search-status]");
    var params = new URLSearchParams(window.location.search);
    var query = params.get("q") || "";

    if (input && query) {
      input.value = query;
    }

    function matches(card) {
      var words = normalize([
        card.getAttribute("data-title"),
        card.getAttribute("data-region"),
        card.getAttribute("data-year"),
        card.getAttribute("data-type"),
        card.getAttribute("data-genre"),
        card.getAttribute("data-tags"),
        card.getAttribute("data-category")
      ].join(" "));
      var term = input ? normalize(input.value) : "";

      if (term && words.indexOf(term) === -1) {
        return false;
      }

      return filters.every(function (filter) {
        var key = filter.getAttribute("data-filter");
        var value = normalize(filter.value);
        if (!value) {
          return true;
        }
        return normalize(card.getAttribute("data-" + key)) === value;
      });
    }

    function apply() {
      var total = 0;
      var visible = 0;
      lists.forEach(function (list) {
        var cards = Array.prototype.slice.call(list.querySelectorAll("[data-card]"));
        cards.forEach(function (card) {
          total += 1;
          var ok = matches(card);
          card.classList.toggle("is-hidden", !ok);
          if (ok) {
            visible += 1;
          }
        });
      });
      if (status && total) {
        status.textContent = visible ? "找到 " + visible + " 部相关影片" : "没有匹配的影片";
      }
    }

    if (input) {
      input.addEventListener("input", apply);
    }
    filters.forEach(function (filter) {
      filter.addEventListener("change", apply);
    });
    apply();
  }

  ready(function () {
    initMobileNav();
    initHero();
    initSearch();
  });
})();
