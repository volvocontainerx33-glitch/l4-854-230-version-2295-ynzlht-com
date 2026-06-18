const header = document.querySelector(".site-header");
const menuToggle = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.querySelector("[data-mobile-menu]");

function updateHeader() {
  if (!header) {
    return;
  }
  header.classList.toggle("is-scrolled", window.scrollY > 16);
}

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

if (menuToggle && mobileMenu) {
  menuToggle.addEventListener("click", () => {
    mobileMenu.classList.toggle("is-open");
  });
}

const slider = document.querySelector("[data-hero-slider]");

if (slider) {
  const slides = Array.from(slider.querySelectorAll("[data-hero-slide]"));
  const dots = Array.from(slider.querySelectorAll("[data-hero-dot]"));
  const prev = slider.querySelector("[data-hero-prev]");
  const next = slider.querySelector("[data-hero-next]");
  let active = 0;
  let timer;

  const showSlide = (index) => {
    if (!slides.length) {
      return;
    }
    active = (index + slides.length) % slides.length;
    slides.forEach((slide, current) => {
      slide.classList.toggle("is-active", current === active);
    });
    dots.forEach((dot, current) => {
      dot.classList.toggle("is-active", current === active);
    });
  };

  const restart = () => {
    window.clearInterval(timer);
    timer = window.setInterval(() => showSlide(active + 1), 5000);
  };

  if (prev) {
    prev.addEventListener("click", () => {
      showSlide(active - 1);
      restart();
    });
  }

  if (next) {
    next.addEventListener("click", () => {
      showSlide(active + 1);
      restart();
    });
  }

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      showSlide(Number(dot.dataset.heroDot || 0));
      restart();
    });
  });

  restart();
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .trim();
}

function setupFilters() {
  const list = document.querySelector("[data-filter-list]");
  const input = document.querySelector("[data-filter-input]");
  const yearSelect = document.querySelector("[data-filter-year]");
  const count = document.querySelector("[data-filter-count]");

  if (!list || !input) {
    return;
  }

  const items = Array.from(list.querySelectorAll(".movie-card"));
  const years = Array.from(
    new Set(items.map((item) => item.dataset.year).filter(Boolean)),
  ).sort((a, b) => Number(b) - Number(a));

  if (yearSelect) {
    years.forEach((year) => {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year;
      yearSelect.appendChild(option);
    });
  }

  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get("q");

  if (initialQuery) {
    input.value = initialQuery;
  }

  const applyFilter = () => {
    const query = normalizeText(input.value);
    const selectedYear = yearSelect ? yearSelect.value : "";
    let visible = 0;

    items.forEach((item) => {
      const haystack = normalizeText(
        [
          item.dataset.title,
          item.dataset.year,
          item.dataset.region,
          item.dataset.type,
          item.dataset.genre,
          item.dataset.tags,
          item.dataset.category,
          item.textContent,
        ].join(" "),
      );
      const yearMatched = !selectedYear || item.dataset.year === selectedYear;
      const queryMatched = !query || haystack.includes(query);
      const matched = yearMatched && queryMatched;
      item.hidden = !matched;
      if (matched) {
        visible += 1;
      }
    });

    if (count) {
      count.textContent = `${visible} 部`;
    }
  };

  input.addEventListener("input", applyFilter);

  if (yearSelect) {
    yearSelect.addEventListener("change", applyFilter);
  }

  applyFilter();
}

setupFilters();

async function loadHlsClass() {
  const module = await import("./hls-dru42stk.js");
  return module.H;
}

function setupPlayers() {
  const players = Array.from(document.querySelectorAll("[data-player]"));

  players.forEach((player) => {
    const video = player.querySelector("video");
    const cover = player.querySelector(".player-cover");
    const message = player.querySelector("[data-player-message]");

    if (!video || !cover) {
      return;
    }

    let ready = false;
    let hls;

    const showMessage = (text) => {
      if (!message) {
        return;
      }
      message.textContent = text;
      message.classList.toggle("is-visible", Boolean(text));
    };

    const startVideo = async () => {
      cover.classList.add("is-hidden");
      showMessage("加载中...");

      if (!ready) {
        const src = video.dataset.hls;

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = src;
          video.load();
          ready = true;
        } else {
          try {
            const Hls = await loadHlsClass();

            if (Hls.isSupported()) {
              hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
              });
              hls.loadSource(src);
              hls.attachMedia(video);
              ready = true;
            } else {
              showMessage("暂时无法播放，请稍后重试");
              return;
            }
          } catch (error) {
            showMessage("暂时无法播放，请稍后重试");
            return;
          }
        }
      }

      const playNow = () => {
        video
          .play()
          .then(() => {
            showMessage("");
          })
          .catch(() => {
            showMessage("请再次点击播放");
          });
      };

      if (video.readyState >= 2) {
        playNow();
      } else {
        video.addEventListener("canplay", playNow, { once: true });
        window.setTimeout(playNow, 1200);
      }
    };

    cover.addEventListener("click", startVideo);

    video.addEventListener("error", () => {
      showMessage("暂时无法播放，请稍后重试");
    });

    window.addEventListener("beforeunload", () => {
      if (hls) {
        hls.destroy();
      }
    });
  });
}

setupPlayers();
