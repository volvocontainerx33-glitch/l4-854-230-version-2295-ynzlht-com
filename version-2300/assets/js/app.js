(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
            return;
        }
        callback();
    }

    function initHeroCarousel() {
        var root = document.querySelector(".js-hero-carousel");
        if (!root) {
            return;
        }

        var slides = Array.prototype.slice.call(root.querySelectorAll(".hero-slide"));
        var dots = Array.prototype.slice.call(root.querySelectorAll(".hero-dot"));
        var prev = root.querySelector(".js-hero-prev");
        var next = root.querySelector(".js-hero-next");
        var current = 0;
        var timer = null;

        function show(index) {
            if (!slides.length) {
                return;
            }
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("active", slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("active", dotIndex === current);
            });
        }

        function restart() {
            if (timer) {
                window.clearInterval(timer);
            }
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5200);
        }

        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                show(Number(dot.getAttribute("data-slide")) || 0);
                restart();
            });
        });

        if (prev) {
            prev.addEventListener("click", function () {
                show(current - 1);
                restart();
            });
        }

        if (next) {
            next.addEventListener("click", function () {
                show(current + 1);
                restart();
            });
        }

        show(0);
        restart();
    }

    function normalize(value) {
        return String(value || "").toLowerCase().trim();
    }

    function initFilters() {
        var panels = Array.prototype.slice.call(document.querySelectorAll(".js-filter-panel"));
        panels.forEach(function (panel) {
            var section = panel.closest("section") || document;
            var list = section.querySelector("[data-filter-list]");
            if (!list) {
                return;
            }

            var cards = Array.prototype.slice.call(list.children);
            var input = panel.querySelector(".js-search-input");
            var buttons = Array.prototype.slice.call(panel.querySelectorAll(".js-filter-button"));
            var sort = panel.querySelector(".js-sort-select");
            var region = panel.querySelector(".js-region-select");
            var counter = panel.querySelector(".js-result-count");
            var activeType = "all";

            function cardText(card) {
                return [
                    card.getAttribute("data-title"),
                    card.getAttribute("data-region"),
                    card.getAttribute("data-type"),
                    card.getAttribute("data-year"),
                    card.getAttribute("data-tags")
                ].map(normalize).join(" ");
            }

            function applySort(visibleCards) {
                var mode = sort ? sort.value : "default";
                var sorted = cards.slice();
                if (mode === "rating") {
                    sorted.sort(function (a, b) {
                        return Number(b.getAttribute("data-rating")) - Number(a.getAttribute("data-rating"));
                    });
                } else if (mode === "year") {
                    sorted.sort(function (a, b) {
                        return Number(b.getAttribute("data-year")) - Number(a.getAttribute("data-year"));
                    });
                } else if (mode === "views") {
                    sorted.sort(function (a, b) {
                        return Number(b.getAttribute("data-views")) - Number(a.getAttribute("data-views"));
                    });
                } else {
                    sorted.sort(function (a, b) {
                        return Number(a.getAttribute("data-order")) - Number(b.getAttribute("data-order"));
                    });
                }
                sorted.forEach(function (card) {
                    list.appendChild(card);
                });
            }

            function applyFilter() {
                var query = input ? normalize(input.value) : "";
                var selectedRegion = region ? region.value : "all";
                var visible = 0;
                cards.forEach(function (card) {
                    var typeMatched = activeType === "all" || card.getAttribute("data-type") === activeType;
                    var regionMatched = selectedRegion === "all" || card.getAttribute("data-region") === selectedRegion;
                    var queryMatched = !query || cardText(card).indexOf(query) !== -1;
                    var shouldShow = typeMatched && regionMatched && queryMatched;
                    card.classList.toggle("is-hidden-card", !shouldShow);
                    if (shouldShow) {
                        visible += 1;
                    }
                });
                if (counter) {
                    counter.textContent = "共 " + visible + " 部影片";
                }
                applySort();
            }

            buttons.forEach(function (button) {
                button.addEventListener("click", function () {
                    activeType = button.getAttribute("data-filter") || "all";
                    buttons.forEach(function (item) {
                        item.classList.toggle("active", item === button);
                    });
                    applyFilter();
                });
            });

            if (input) {
                input.addEventListener("input", applyFilter);
            }
            if (sort) {
                sort.addEventListener("change", applyFilter);
            }
            if (region) {
                region.addEventListener("change", applyFilter);
            }
            applyFilter();
        });
    }

    function loadStream(video, stream) {
        if (video.getAttribute("data-ready") === "1") {
            return;
        }

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = stream;
            video.setAttribute("data-ready", "1");
            return;
        }

        if (window.Hls && window.Hls.isSupported()) {
            var hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
            hls.loadSource(stream);
            hls.attachMedia(video);
            video.hlsPlayer = hls;
            video.setAttribute("data-ready", "1");
            return;
        }

        video.src = stream;
        video.setAttribute("data-ready", "1");
    }

    function initPlayers() {
        var players = Array.prototype.slice.call(document.querySelectorAll(".js-player"));
        players.forEach(function (player) {
            var video = player.querySelector("video");
            var button = player.querySelector(".js-play-button");
            if (!video) {
                return;
            }

            function start() {
                var stream = video.getAttribute("data-stream");
                if (!stream) {
                    return;
                }
                loadStream(video, stream);
                if (button) {
                    button.classList.add("is-hidden");
                }
                var playAction = video.play();
                if (playAction && typeof playAction.catch === "function") {
                    playAction.catch(function () {});
                }
            }

            if (button) {
                button.addEventListener("click", start);
            }
            video.addEventListener("click", function () {
                if (video.paused) {
                    start();
                }
            });
            video.addEventListener("play", function () {
                if (button) {
                    button.classList.add("is-hidden");
                }
            });
        });
    }

    ready(function () {
        initHeroCarousel();
        initFilters();
        initPlayers();
    });
})();
