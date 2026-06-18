(function () {
    function ready(fn) {
        if (document.readyState !== "loading") {
            fn();
        } else {
            document.addEventListener("DOMContentLoaded", fn);
        }
    }

    function normalize(value) {
        return String(value || "").toLowerCase().trim();
    }

    function initMobileMenu() {
        var button = document.querySelector("[data-menu-button]");
        var panel = document.querySelector("[data-mobile-panel]");
        if (!button || !panel) {
            return;
        }
        button.addEventListener("click", function () {
            panel.classList.toggle("is-open");
        });
    }

    function initHeaderSearch() {
        document.querySelectorAll(".js-header-search").forEach(function (form) {
            form.addEventListener("submit", function (event) {
                var input = form.querySelector("input[name='q']");
                var value = input ? input.value.trim() : "";
                if (!value) {
                    event.preventDefault();
                    if (input) {
                        input.focus();
                    }
                }
            });
        });
    }

    function applySearch(root, value) {
        var query = normalize(value);
        var cards = root.querySelectorAll("[data-card]");
        cards.forEach(function (card) {
            var haystack = normalize(card.getAttribute("data-search"));
            card.hidden = query && haystack.indexOf(query) === -1;
        });
    }

    function initCardSearch() {
        document.querySelectorAll("[data-card-search]").forEach(function (form) {
            var input = form.querySelector("input");
            var scope = form.closest("main") || document;
            var params = new URLSearchParams(window.location.search);
            var initial = params.get("q") || "";
            if (input && initial) {
                input.value = initial;
                applySearch(scope, initial);
            }
            form.addEventListener("submit", function (event) {
                event.preventDefault();
                applySearch(scope, input ? input.value : "");
            });
            if (input) {
                input.addEventListener("input", function () {
                    applySearch(scope, input.value);
                });
            }
        });
    }

    function initChipFilters() {
        document.querySelectorAll("[data-chip-filter]").forEach(function (group) {
            var scope = group.closest("main") || document;
            var buttons = group.querySelectorAll("button[data-filter]");
            buttons.forEach(function (button) {
                button.addEventListener("click", function () {
                    buttons.forEach(function (item) {
                        item.classList.remove("is-active");
                    });
                    button.classList.add("is-active");
                    var filter = normalize(button.getAttribute("data-filter"));
                    scope.querySelectorAll("[data-card]").forEach(function (card) {
                        var text = normalize(card.getAttribute("data-search"));
                        card.hidden = filter !== "all" && text.indexOf(filter) === -1;
                    });
                });
            });
        });
    }

    function initHero() {
        var hero = document.querySelector("[data-hero]");
        if (!hero) {
            return;
        }
        var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
        var next = hero.querySelector("[data-hero-next]");
        var prev = hero.querySelector("[data-hero-prev]");
        var current = 0;
        var timer = null;

        function show(index) {
            if (!slides.length) {
                return;
            }
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, idx) {
                slide.classList.toggle("is-active", idx === current);
            });
            dots.forEach(function (dot, idx) {
                dot.classList.toggle("is-active", idx === current);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5000);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
            }
        }

        dots.forEach(function (dot, idx) {
            dot.addEventListener("click", function () {
                show(idx);
                start();
            });
        });

        if (next) {
            next.addEventListener("click", function () {
                show(current + 1);
                start();
            });
        }

        if (prev) {
            prev.addEventListener("click", function () {
                show(current - 1);
                start();
            });
        }

        hero.addEventListener("mouseenter", stop);
        hero.addEventListener("mouseleave", start);
        show(0);
        start();
    }

    ready(function () {
        initMobileMenu();
        initHeaderSearch();
        initCardSearch();
        initChipFilters();
        initHero();
    });
})();

function setupMoviePlayer(streamUrl) {
    var shell = document.querySelector("[data-player]");
    if (!shell) {
        return;
    }
    var video = shell.querySelector("video");
    var cover = shell.querySelector(".player-cover");
    var playButton = shell.querySelector(".player-play");
    var toggleButton = shell.querySelector(".player-toggle");
    var muteButton = shell.querySelector(".player-mute");
    var fullscreenButton = shell.querySelector(".player-fullscreen");
    var loading = shell.querySelector(".player-loading");
    var error = shell.querySelector(".player-error");
    var hlsInstance = null;
    var loadPromise = null;

    function show(node, visible) {
        if (node) {
            node.hidden = !visible;
        }
    }

    function setPlayingState(isPlaying) {
        if (toggleButton) {
            toggleButton.textContent = isPlaying ? "暂停" : "▶";
        }
        if (cover) {
            cover.classList.toggle("is-hidden", isPlaying);
        }
    }

    function showError() {
        show(loading, false);
        show(error, true);
    }

    function prepare() {
        if (!video || !streamUrl) {
            showError();
            return Promise.reject(new Error("missing video"));
        }
        if (loadPromise) {
            return loadPromise;
        }
        show(error, false);
        show(loading, true);
        loadPromise = new Promise(function (resolve, reject) {
            if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hlsInstance.loadSource(streamUrl);
                hlsInstance.attachMedia(video);
                hlsInstance.on(Hls.Events.MANIFEST_PARSED, function () {
                    show(loading, false);
                    resolve();
                });
                hlsInstance.on(Hls.Events.ERROR, function (event, data) {
                    if (data && data.fatal) {
                        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                            hlsInstance.startLoad();
                        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                            hlsInstance.recoverMediaError();
                        } else {
                            showError();
                            reject(new Error("fatal"));
                        }
                    }
                });
            } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = streamUrl;
                video.addEventListener("loadedmetadata", function () {
                    show(loading, false);
                    resolve();
                }, { once: true });
                video.addEventListener("error", function () {
                    showError();
                    reject(new Error("media"));
                }, { once: true });
            } else {
                showError();
                reject(new Error("unsupported"));
            }
        });
        return loadPromise;
    }

    function play() {
        prepare().then(function () {
            return video.play();
        }).then(function () {
            setPlayingState(true);
        }).catch(function () {
            showError();
        });
    }

    function toggle() {
        if (!video) {
            return;
        }
        if (video.paused) {
            play();
        } else {
            video.pause();
            setPlayingState(false);
        }
    }

    if (playButton) {
        playButton.addEventListener("click", play);
    }
    if (cover) {
        cover.addEventListener("click", play);
    }
    if (toggleButton) {
        toggleButton.addEventListener("click", toggle);
    }
    if (video) {
        video.addEventListener("click", toggle);
        video.addEventListener("play", function () {
            setPlayingState(true);
        });
        video.addEventListener("pause", function () {
            setPlayingState(false);
        });
        video.addEventListener("ended", function () {
            setPlayingState(false);
        });
    }
    if (muteButton && video) {
        muteButton.addEventListener("click", function () {
            video.muted = !video.muted;
            muteButton.textContent = video.muted ? "已静音" : "音量";
        });
    }
    if (fullscreenButton && video) {
        fullscreenButton.addEventListener("click", function () {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else if (shell.requestFullscreen) {
                shell.requestFullscreen();
            }
        });
    }
    document.querySelectorAll("[data-player-start]").forEach(function (button) {
        button.addEventListener("click", function (event) {
            event.preventDefault();
            play();
            shell.scrollIntoView({ behavior: "smooth", block: "center" });
        });
    });
    window.addEventListener("pagehide", function () {
        if (hlsInstance) {
            hlsInstance.destroy();
        }
    });
}
