"use strict";

document.addEventListener("DOMContentLoaded", function () {
    const cover = document.getElementById("cover");
    const mainSite = document.getElementById("mainSite");
    const openButton = document.getElementById("openInvitation");
    const music = document.getElementById("music");
    const musicToggle = document.getElementById("musicToggle");
    const coverVideos = Array.from(document.querySelectorAll(".cover-video"));
    const coverVideo = document.getElementById("video");
    let siteOpened = false;
    let musicStarting = false;

    function startMusic() {
        if (!music || musicStarting || !music.paused) return;
        musicStarting = true;
        music.volume = 0.52;
        const playPromise = music.play();
        if (playPromise && typeof playPromise.then === "function") {
            playPromise.then(function () {
                musicStarting = false;
                if (musicToggle) {
                    musicToggle.classList.remove("is-paused");
                    musicToggle.setAttribute("aria-label", "Музыканы токтотуу");
                }
            }).catch(function () {
                musicStarting = false;
                if (musicToggle) {
                    musicToggle.classList.add("is-paused");
                    musicToggle.setAttribute("aria-label", "Музыканы ойнотуу");
                }
            });
        } else {
            musicStarting = false;
        }
    }

    function ensureCoverVideo() {
        if (!coverVideo || siteOpened || document.hidden) return;
        coverVideo.muted = true;
        coverVideo.playsInline = true;
        const promise = coverVideo.play();
        if (promise && typeof promise.catch === "function") promise.catch(function () {});
    }

    function openWeddingSite() {
        if (siteOpened) return;
        siteOpened = true;
        if (openButton) openButton.disabled = true;
        document.body.classList.add("site-open");
        if (mainSite) {
            mainSite.classList.add("is-open");
            mainSite.setAttribute("aria-hidden", "false");
        }
        startMusic();
        updateBouquet(true);
        if (cover) {
            cover.classList.add("is-closing");
            window.setTimeout(function () {
                cover.hidden = true;
                coverVideos.forEach(function (item) { item.pause(); });
                window.scrollTo({ top: 0, left: 0, behavior: "auto" });
                updateBouquet(true);
            }, 500);
        }
    }

    if (openButton) {
        /* Start audio at the earliest user gesture on iPhone, then open on click. */
        openButton.addEventListener("pointerdown", startMusic, { passive: true });
        openButton.addEventListener("touchstart", startMusic, { passive: true });
        openButton.addEventListener("click", openWeddingSite);
    }

    window.addEventListener("pageshow", ensureCoverVideo);
    document.addEventListener("visibilitychange", function () {
        if (!document.hidden) ensureCoverVideo();
    });
    window.setTimeout(ensureCoverVideo, 0);

    if (musicToggle && music) {
        musicToggle.addEventListener("click", function () {
            if (music.paused) {
                music.play().then(function () {
                    musicToggle.classList.remove("is-paused");
                    musicToggle.setAttribute("aria-label", "Музыканы токтотуу");
                }).catch(function () {});
            } else {
                music.pause();
                musicToggle.classList.add("is-paused");
                musicToggle.setAttribute("aria-label", "Музыканы ойнотуу");
            }
        });
    }

    /* Calendar: generated from the same date as the countdown (June 20, 2027). */
    const eventYear = 2027;
    const eventMonth = 5; // June, zero-based
    const eventDay = 20;
    const calendarDays = document.querySelector(".calendar-days");
    if (calendarDays) {
        calendarDays.replaceChildren();
        const offsetMonday = (new Date(Date.UTC(eventYear, eventMonth, 1)).getUTCDay() + 6) % 7;
        const daysInMonth = new Date(Date.UTC(eventYear, eventMonth + 1, 0)).getUTCDate();
        for (let i = 0; i < offsetMonday; i++) {
            const empty = document.createElement("span");
            empty.className = "empty";
            calendarDays.appendChild(empty);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const cell = document.createElement("span");
            cell.textContent = String(day);
            if (day === eventDay) {
                cell.className = "wedding-day";
                cell.setAttribute("aria-label", "Той күнү — 20-июнь");
            }
            calendarDays.appendChild(cell);
        }
    }

    /* Countdown */
    const weddingDate = new Date("2027-06-20T18:00:00+06:00").getTime();
    const dayEl = document.getElementById("countdownDays");
    const hourEl = document.getElementById("countdownHours");
    const minuteEl = document.getElementById("countdownMinutes");
    const secondEl = document.getElementById("countdownSeconds");

    function updateCountdown() {
        if (!dayEl || !hourEl || !minuteEl || !secondEl) return;
        const distance = Math.max(0, weddingDate - Date.now());
        dayEl.textContent = String(Math.floor(distance / 86400000));
        hourEl.textContent = String(Math.floor((distance % 86400000) / 3600000)).padStart(2, "0");
        minuteEl.textContent = String(Math.floor((distance % 3600000) / 60000)).padStart(2, "0");
        secondEl.textContent = String(Math.floor((distance % 60000) / 1000)).padStart(2, "0");
    }
    updateCountdown();
    window.setInterval(updateCountdown, 1000);

    /* Reveal */
    const revealItems = document.querySelectorAll(".scroll-reveal");
    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.08, rootMargin: "0px 0px -4% 0px" });
        revealItems.forEach(function (item) { observer.observe(item); });
    } else {
        revealItems.forEach(function (item) { item.classList.add("is-visible"); });
    }

    /* Bouquet route */
    const scrollGuide = document.getElementById("scrollGuide");
    const journeySvg = document.getElementById("scrollJourneySvg");
    const journeyPath = document.getElementById("scrollJourneyPath");
    const bouquet = document.getElementById("scrollBouquet");
    const bouquetSections = Array.from(document.querySelectorAll(".bouquet-stop"));
    let bouquetFrame = 0;
    let routeStops = [];
    let sitePageTop = 0;

    function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
    function smoothStep(value) { return value * value * (3 - 2 * value); }

    function getSafeX(section, index, siteWidth) {
        const side = section.dataset.bouquetSide || (index % 2 ? "left" : "right");
        if (window.innerWidth <= 760) {
            /* Real snake route on phones: alternate left/right edges.
               The bouquet and dotted path sit below content, so cards stay readable. */
            const edge = clamp(siteWidth * 0.135, 42, 58);
            const nudge = (index % 3 === 1 ? 7 : index % 3 === 2 ? -4 : 0);
            return side === "left" ? edge + nudge : siteWidth - edge - nudge;
        }
        if (window.innerWidth <= 1120) {
            const edge = clamp(siteWidth * 0.055, 30, 48);
            return side === "left" ? edge : siteWidth - edge;
        }
        const contentWidth = Math.min(980, siteWidth - 180);
        const gutter = Math.max(100, (siteWidth - contentWidth) / 2);
        return side === "left" ? gutter * 0.48 : siteWidth - gutter * 0.48;
    }

    function makeRoutePath(stops) {
        if (!stops.length) return "";
        let d = "M " + stops[0].x.toFixed(1) + " " + stops[0].y.toFixed(1);
        for (let i = 1; i < stops.length; i += 1) {
            const a = stops[i - 1];
            const b = stops[i];
            const midY = (a.y + b.y) / 2;
            d += " C " + a.x.toFixed(1) + " " + midY.toFixed(1) + ", " + b.x.toFixed(1) + " " + midY.toFixed(1) + ", " + b.x.toFixed(1) + " " + b.y.toFixed(1);
        }
        return d;
    }

    function buildBouquetRoute() {
        if (!mainSite || !scrollGuide || !journeySvg || !journeyPath || !bouquetSections.length) return;
        const siteRect = mainSite.getBoundingClientRect();
        sitePageTop = window.scrollY + siteRect.top;
        const siteWidth = mainSite.clientWidth;
        const siteHeight = Math.max(mainSite.scrollHeight, mainSite.offsetHeight);
        routeStops = bouquetSections.map(function (section, index) {
            const rect = section.getBoundingClientRect();
            const sectionTop = window.scrollY + rect.top - sitePageTop;
            const yRatio = clamp(Number(section.dataset.bouquetY || 0.5), 0.2, 0.8);
            return {
                center: window.scrollY + rect.top + rect.height / 2,
                x: getSafeX(section, index, siteWidth),
                y: clamp(sectionTop + rect.height * yRatio, 60, siteHeight - 60)
            };
        });
        scrollGuide.style.height = siteHeight + "px";
        journeySvg.setAttribute("viewBox", "0 0 " + siteWidth + " " + siteHeight);
        journeySvg.setAttribute("width", String(siteWidth));
        journeySvg.setAttribute("height", String(siteHeight));
        journeyPath.setAttribute("d", makeRoutePath(routeStops));
    }

    function currentBouquetPoint() {
        if (!routeStops.length) return null;
        const viewportMarker = window.scrollY + window.innerHeight * 0.53;
        if (viewportMarker <= routeStops[0].center) return routeStops[0];
        if (viewportMarker >= routeStops[routeStops.length - 1].center) return routeStops[routeStops.length - 1];
        for (let i = 0; i < routeStops.length - 1; i += 1) {
            const a = routeStops[i];
            const b = routeStops[i + 1];
            if (viewportMarker >= a.center && viewportMarker <= b.center) {
                const raw = (viewportMarker - a.center) / Math.max(1, b.center - a.center);
                const t = smoothStep(clamp(raw, 0, 1));
                const midY = (a.y + b.y) / 2;
                const inv = 1 - t;
                return {
                    x: inv * inv * inv * a.x + 3 * inv * inv * t * a.x + 3 * inv * t * t * b.x + t * t * t * b.x,
                    y: inv * inv * inv * a.y + 3 * inv * inv * t * midY + 3 * inv * t * t * midY + t * t * t * b.y,
                    angle: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI
                };
            }
        }
        return routeStops[0];
    }

    function updateBouquet(force) {
        if (!bouquet || (!siteOpened && !force)) return;
        window.cancelAnimationFrame(bouquetFrame);
        bouquetFrame = window.requestAnimationFrame(function () {
            if (!routeStops.length || force) buildBouquetRoute();
            const point = currentBouquetPoint();
            if (!point) return;
            const mobileScale = window.innerWidth <= 760 ? 0.96 : 1;
            const angleFactor = window.innerWidth <= 760 ? 0.28 : 0.19;
            const angleLimit = window.innerWidth <= 760 ? 22 : 16;
            const angle = Number.isFinite(point.angle) ? clamp(point.angle * angleFactor, -angleLimit, angleLimit) : 0;
            bouquet.style.left = point.x + "px";
            bouquet.style.top = point.y + "px";
            bouquet.style.transform = "translate(-50%, -50%) rotate(" + angle + "deg) scale(" + mobileScale + ")";
        });
    }

    window.addEventListener("scroll", function () { updateBouquet(false); }, { passive: true });
    window.addEventListener("resize", function () { updateBouquet(true); });
    window.addEventListener("orientationchange", function () { window.setTimeout(function () { updateBouquet(true); }, 240); });
    window.addEventListener("load", function () { updateBouquet(true); });
    if ("ResizeObserver" in window && mainSite) {
        const resizeObserver = new ResizeObserver(function () { if (siteOpened) updateBouquet(true); });
        resizeObserver.observe(mainSite);
    }

    /* Album */
    const albumPhotos = [
        { src: "album-01.jpg", alt: "Бекнур жана Бермет — романтикалык көз ирмем" },
        { src: "album-02.jpg", alt: "Бекнур жана Бермет — бирге" },
        { src: "album-03.jpg", alt: "Бекнур жана Бермет — саякатта" },
        { src: "album-04.jpg", alt: "Бекнур жана Бермет — шаардагы кеч" }
    ];
    const albumModal = document.getElementById("albumModal");
    const openAlbum = document.getElementById("openAlbum");
    const closeAlbum = document.getElementById("closeAlbum");
    const previousPhoto = document.getElementById("previousPhoto");
    const nextPhoto = document.getElementById("nextPhoto");
    const albumPhoto = document.getElementById("albumPhoto");
    const albumCaption = document.getElementById("albumCaption");
    const albumDots = document.getElementById("albumDots");
    const albumFrame = document.querySelector(".album-photo-frame");
    let albumIndex = 0;
    let lastFocus = null;
    let touchStartX = 0;
    let touchStartY = 0;

    function renderDots() {
        if (!albumDots) return;
        albumDots.innerHTML = "";
        albumPhotos.forEach(function (_, index) {
            const dot = document.createElement("button");
            dot.type = "button";
            dot.className = "album-dot" + (index === albumIndex ? " is-active" : "");
            dot.setAttribute("aria-label", (index + 1) + "-сүрөттү ачуу");
            dot.addEventListener("click", function () { showPhoto(index); });
            albumDots.appendChild(dot);
        });
    }

    function showPhoto(index) {
        if (!albumPhoto || !albumCaption) return;
        albumIndex = (index + albumPhotos.length) % albumPhotos.length;
        const item = albumPhotos[albumIndex];
        if (albumFrame) albumFrame.classList.add("is-changing");
        const preload = new Image();
        preload.onload = function () {
            const ratio = clamp(preload.naturalWidth / Math.max(1, preload.naturalHeight), 0.48, 2.1);
            if (albumFrame) albumFrame.style.setProperty("--photo-ratio", ratio.toFixed(4));
            albumPhoto.src = item.src;
            albumPhoto.alt = item.alt;
            albumCaption.textContent = (albumIndex + 1) + " / " + albumPhotos.length;
            renderDots();
            window.requestAnimationFrame(function () {
                if (albumFrame) albumFrame.classList.remove("is-changing");
            });
        };
        preload.onerror = function () {
            albumPhoto.src = item.src;
            albumCaption.textContent = (albumIndex + 1) + " / " + albumPhotos.length;
            renderDots();
            if (albumFrame) albumFrame.classList.remove("is-changing");
        };
        preload.src = item.src;
    }

    function openAlbumModal() {
        if (!albumModal) return;
        lastFocus = document.activeElement;
        albumModal.hidden = false;
        albumModal.setAttribute("aria-hidden", "false");
        document.body.classList.add("album-open");
        showPhoto(albumIndex);
        window.setTimeout(function () { if (closeAlbum) closeAlbum.focus(); }, 40);
    }

    function closeAlbumModal() {
        if (!albumModal) return;
        albumModal.hidden = true;
        albumModal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("album-open");
        if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    }

    if (openAlbum) openAlbum.addEventListener("click", openAlbumModal);
    if (closeAlbum) closeAlbum.addEventListener("click", closeAlbumModal);
    if (previousPhoto) previousPhoto.addEventListener("click", function () { showPhoto(albumIndex - 1); });
    if (nextPhoto) nextPhoto.addEventListener("click", function () { showPhoto(albumIndex + 1); });
    document.querySelectorAll("[data-close-album]").forEach(function (button) { button.addEventListener("click", closeAlbumModal); });
    document.addEventListener("keydown", function (event) {
        if (!albumModal || albumModal.hidden) return;
        if (event.key === "Escape") closeAlbumModal();
        if (event.key === "ArrowLeft") showPhoto(albumIndex - 1);
        if (event.key === "ArrowRight") showPhoto(albumIndex + 1);
    });
    if (albumFrame) {
        albumFrame.addEventListener("touchstart", function (event) {
            const touch = event.changedTouches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        }, { passive: true });
        albumFrame.addEventListener("touchend", function (event) {
            const touch = event.changedTouches[0];
            const dx = touch.clientX - touchStartX;
            const dy = touch.clientY - touchStartY;
            if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.15) {
                showPhoto(albumIndex + (dx < 0 ? 1 : -1));
            }
        }, { passive: true });
    }
    renderDots();

    /* RSVP — credentials are NEVER stored in public client code. */
    const rsvpForm = document.getElementById("weddingRsvpForm");
    const rsvpStatus = document.getElementById("rsvpSuccess");

    async function sendWithTimeout(url, options, ms) {
        const controller = new AbortController();
        const timer = window.setTimeout(function () { controller.abort(); }, ms);
        try {
            return await fetch(url, Object.assign({}, options, { signal: controller.signal }));
        } finally {
            window.clearTimeout(timer);
        }
    }

    async function sendRsvp(payload) {
        const host = window.location.hostname;

        if (host.endsWith("netlify.app")) {
            const response = await sendWithTimeout("/.netlify/functions/rsvp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            }, 15000);
            const result = await response.json().catch(function () { return {}; });
            if (!response.ok || !result.ok) throw new Error(result.error || "send_failed");
            return;
        }

        if (host.endsWith("vercel.app")) {
            const response = await sendWithTimeout("/api/rsvp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            }, 15000);
            const result = await response.json().catch(function () { return {}; });
            if (!response.ok || !result.ok) throw new Error(result.error || "send_failed");
            return;
        }

        // GitHub Pages is static. A Telegram bot token must never be exposed here.
        throw new Error("telegram_backend_required");
    }

    if (rsvpForm) {
        rsvpForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            if (!rsvpForm.reportValidity()) return;
            const submit = rsvpForm.querySelector(".rsvp-submit");
            const data = new FormData(rsvpForm);
            const payload = {
                name: String(data.get("name") || "").trim(),
                companion: String(data.get("companion") || "").trim(),
                attendance: String(data.get("attendance") || "").trim(),
                website: String(data.get("website") || "").trim()
            };
            if (payload.website) return;
            if (submit) {
                submit.disabled = true;
                submit.textContent = "Жөнөтүлүүдө…";
            }
            if (rsvpStatus) {
                rsvpStatus.textContent = "";
                rsvpStatus.className = "rsvp-status";
            }
            try {
                await sendRsvp(payload);
                if (rsvpStatus) {
                    rsvpStatus.textContent = "Рахмат! Жообуңуз Telegram'га жөнөтүлдү.";
                    rsvpStatus.classList.add("is-success");
                }
                rsvpForm.reset();
            } catch (error) {
                if (rsvpStatus) {
                    rsvpStatus.textContent = window.location.hostname.endsWith("github.io")
                        ? "Анкета үчүн коопсуз Telegram байланышын кошуу керек."
                        : "Жооп жөнөтүлгөн жок. Интернетти текшерип, кайра басыңыз.";
                    rsvpStatus.classList.add("is-error");
                }
            } finally {
                if (submit) {
                    submit.disabled = false;
                    submit.textContent = "Жоопту жөнөтүү";
                }
            }
        });
    }
});
