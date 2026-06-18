import { H as Hls } from './hls-dru42stk.js';

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

function setupMobileMenu() {
    const toggle = $('[data-menu-toggle]');
    const panel = $('[data-mobile-menu]');

    if (!toggle || !panel) {
        return;
    }

    toggle.addEventListener('click', () => {
        panel.classList.toggle('open');
    });
}

function setupHeroCarousel() {
    const slides = $$('[data-hero-slide]');
    const dots = $$('[data-hero-dot]');
    const previous = $('[data-hero-prev]');
    const next = $('[data-hero-next]');

    if (!slides.length) {
        return;
    }

    let active = 0;
    let timer = null;

    const show = (index) => {
        active = (index + slides.length) % slides.length;

        slides.forEach((slide, slideIndex) => {
            slide.classList.toggle('active', slideIndex === active);
        });

        dots.forEach((dot, dotIndex) => {
            dot.classList.toggle('active', dotIndex === active);
        });
    };

    const restart = () => {
        window.clearInterval(timer);
        timer = window.setInterval(() => show(active + 1), 5200);
    };

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            show(index);
            restart();
        });
    });

    if (previous) {
        previous.addEventListener('click', () => {
            show(active - 1);
            restart();
        });
    }

    if (next) {
        next.addEventListener('click', () => {
            show(active + 1);
            restart();
        });
    }

    restart();
}

function normalize(value) {
    return String(value || '').trim().toLowerCase();
}

function setupFilters() {
    const searchInput = $('#localSearch');
    const genreFilter = $('#genreFilter');
    const reset = $('#resetFilters');
    const result = $('[data-result-count]');
    const cards = $$('[data-card]');

    if (!cards.length) {
        return;
    }

    const url = new URL(window.location.href);
    const q = url.searchParams.get('q');

    if (q && searchInput) {
        searchInput.value = q;
        const anchor = $('#movie-grid');
        if (anchor) {
            setTimeout(() => anchor.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
        }
    }

    const apply = () => {
        const keyword = normalize(searchInput ? searchInput.value : '');
        const genre = normalize(genreFilter ? genreFilter.value : '');
        let visible = 0;

        cards.forEach((card) => {
            const haystack = normalize([
                card.dataset.title,
                card.dataset.genre,
                card.dataset.tags,
                card.dataset.category,
                card.dataset.year,
                card.textContent
            ].join(' '));
            const genreText = normalize(card.dataset.genre);
            const keywordMatch = !keyword || haystack.includes(keyword);
            const genreMatch = !genre || genreText.includes(genre) || haystack.includes(genre);
            const matched = keywordMatch && genreMatch;

            card.classList.toggle('is-hidden', !matched);
            if (matched) {
                visible += 1;
            }
        });

        if (result) {
            result.textContent = `当前显示 ${visible} 部影片`;
        }
    };

    if (searchInput) {
        searchInput.addEventListener('input', apply);
    }

    if (genreFilter) {
        genreFilter.addEventListener('change', apply);
    }

    if (reset) {
        reset.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
            }

            if (genreFilter) {
                genreFilter.value = '';
            }

            apply();
        });
    }

    apply();
}

function attachHls(video, source) {
    if (!video || !source) {
        return Promise.reject(new Error('播放器缺少视频源'));
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        return Promise.resolve();
    }

    if (Hls && Hls.isSupported && Hls.isSupported()) {
        if (video._hlsInstance) {
            video._hlsInstance.destroy();
        }

        const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
        });

        video._hlsInstance = hls;
        hls.loadSource(source);
        hls.attachMedia(video);

        return new Promise((resolve) => {
            hls.on(Hls.Events.MANIFEST_PARSED, () => resolve());
            hls.on(Hls.Events.ERROR, (_event, data) => {
                if (data && data.fatal) {
                    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                        hls.startLoad();
                    } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                        hls.recoverMediaError();
                    } else {
                        hls.destroy();
                    }
                }
            });
        });
    }

    video.src = source;
    return Promise.resolve();
}

function setupPlayers() {
    $$('[data-player]').forEach((player) => {
        const video = $('video', player);
        const overlay = $('[data-play]', player);

        if (!video || !overlay) {
            return;
        }

        const source = overlay.dataset.src || video.dataset.videoSrc;

        overlay.addEventListener('click', async () => {
            overlay.classList.add('hidden');

            try {
                await attachHls(video, source);
                await video.play();
            } catch (error) {
                overlay.classList.remove('hidden');
                overlay.innerHTML = '<span class="big-play">!</span><strong>播放源加载失败</strong><small>请检查网络后再次点击</small>';
                console.error(error);
            }
        });
    });
}

function markCurrentHeaderSearch() {
    const url = new URL(window.location.href);
    const q = url.searchParams.get('q');

    if (!q) {
        return;
    }

    $$('form[action="index.html"] input[name="q"]').forEach((input) => {
        input.value = q;
    });
}

setupMobileMenu();
setupHeroCarousel();
setupFilters();
setupPlayers();
markCurrentHeaderSearch();
