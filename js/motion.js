/* motion.js
 * Drives:
 *   1. Hero card parallax tilt + portrait depth
 *   2. Lobby boot sequence (one play per session, gated by sessionStorage)
 *   3. Scroll reveals + project / photography card hover language
 * Additive — no inline event handlers, no jQuery dependency, safe to drop in.
 */
(function () {
    'use strict';

    var html = document.documentElement;
    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isCoarse       = window.matchMedia('(hover: none)').matches;
    var isNarrow       = window.matchMedia('(max-width: 900px)').matches;

    /* -------------------------------------------------------------
     * 1. Boot sequence
     * ----------------------------------------------------------- */
    function runBoot() {
        // Mark <html> so motion.css owns the choreography (kills the
        // generic rise-in animation in style.css).
        html.classList.add('boot-controlled');

        // Inject the scanline element (fixed, full-viewport)
        var scan = document.createElement('div');
        scan.className = 'boot-scanline';
        document.body.appendChild(scan);

        // Skip the show entirely under reduced-motion: just snap to final.
        if (prefersReduced) {
            html.classList.add('boot-step-1', 'boot-step-2');
            html.removeAttribute('data-boot');
            return;
        }

        // Frame 1: reveal body, kick scan
        requestAnimationFrame(function () {
            html.removeAttribute('data-boot'); // body fades from 0
            scan.classList.add('is-active');

            // Step 1: nav drops, status types
            setTimeout(function () { html.classList.add('boot-step-1'); }, 60);

            // Step 2: hero card assembles
            setTimeout(function () { html.classList.add('boot-step-2'); }, 320);

            // Cleanup scanline element after sweep
            setTimeout(function () {
                if (scan.parentNode) scan.parentNode.removeChild(scan);
            }, 1100);
        });
    }

    function skipBoot() {
        // Used on subsequent navigations — no full intro, just settle in.
        html.classList.add('boot-controlled', 'boot-step-1', 'boot-step-2');
        html.removeAttribute('data-boot');
    }

    function initBoot() {
        var key = 'esun-boot-played';
        var played = false;
        try { played = sessionStorage.getItem(key) === '1'; } catch (e) {}

        if (played) {
            skipBoot();
        } else {
            runBoot();
            try { sessionStorage.setItem(key, '1'); } catch (e) {}
        }
    }

    /* -------------------------------------------------------------
     * 2. Hero parallax tilt + portrait depth
     * ----------------------------------------------------------- */
    function initTilt() {
        if (prefersReduced || isCoarse || isNarrow) return;

        var card = document.querySelector('.hero-card');
        if (!card) return;

        // Inject portrait depth layers if not already in markup.
        // (We patch index.html to include them, but keep this idempotent
        //  so a repo that lacks the markup still gets the glow + scrim.)
        var portrait = card.querySelector('.hero-portrait');
        if (portrait && !portrait.querySelector('.portrait-glow')) {
            var glow  = document.createElement('div'); glow.className  = 'portrait-glow';
            var scrim = document.createElement('div'); scrim.className = 'portrait-scrim';
            portrait.insertBefore(glow, portrait.firstChild);
            portrait.appendChild(scrim);

            ['tl','tr','bl','br'].forEach(function (pos) {
                var c = document.createElement('div');
                c.className = 'portrait-corner ' + pos;
                portrait.appendChild(c);
            });
        }

        var rect = null;
        var raf  = 0;
        var pendingX = 0, pendingY = 0;

        function refreshRect() { rect = card.getBoundingClientRect(); }

        function apply() {
            raf = 0;
            if (!rect) return;
            var nx = (pendingX - rect.left) / rect.width;   // 0..1
            var ny = (pendingY - rect.top)  / rect.height;  // 0..1
            // Clamp + recenter to -0.5..0.5
            nx = Math.max(0, Math.min(1, nx)) - 0.5;
            ny = Math.max(0, Math.min(1, ny)) - 0.5;

            // Max ~7deg tilt; invert Y so cursor down tilts card forward
            var ry = (nx *  10).toFixed(2) + 'deg';
            var rx = (ny * -8 ).toFixed(2) + 'deg';

            card.style.setProperty('--ry', ry);
            card.style.setProperty('--rx', rx);
            card.style.setProperty('--mx', (nx + 0.5) * 100 + '%');
            card.style.setProperty('--my', (ny + 0.5) * 100 + '%');
        }

        function onMove(e) {
            pendingX = e.clientX;
            pendingY = e.clientY;
            if (!raf) raf = requestAnimationFrame(apply);
        }

        function onEnter() {
            refreshRect();
            card.classList.add('is-tilting');
        }

        function onLeave() {
            card.classList.remove('is-tilting');
            card.style.setProperty('--rx', '0deg');
            card.style.setProperty('--ry', '0deg');
            card.style.setProperty('--mx', '50%');
            card.style.setProperty('--my', '50%');
        }

        card.addEventListener('mouseenter', onEnter);
        card.addEventListener('mousemove',  onMove);
        card.addEventListener('mouseleave', onLeave);
        window.addEventListener('resize', refreshRect, { passive: true });
        window.addEventListener('scroll', refreshRect, { passive: true });
    }

    /* -------------------------------------------------------------
     * 3. Scroll reveals
     * ----------------------------------------------------------- */
    function initReveals() {
        // Auto-tag obvious candidates so users dropping this in get reveals
        // even without editing markup.
        var auto = [
            '#projects-section .section-header',
            '#projects-section .card',
            '#resumes-section',
            '.category-card',
            '.photo-card'
        ];
        auto.forEach(function (sel) {
            document.querySelectorAll(sel).forEach(function (el) {
                if (!el.hasAttribute('data-reveal')) el.setAttribute('data-reveal', '');
            });
        });

        // Number siblings inside [data-reveal-children] for staggered delay.
        document.querySelectorAll('[data-reveal-children]').forEach(function (parent) {
            var i = 0;
            parent.querySelectorAll(':scope > [data-reveal]').forEach(function (kid) {
                kid.style.setProperty('--reveal-i', i++);
            });
        });
        // Also stagger common grids automatically.
        ['.lobby-grid', '.category-container', '.gallery-prom', '.gallery-robotics'].forEach(function (sel) {
            document.querySelectorAll(sel).forEach(function (parent) {
                var i = 0;
                parent.querySelectorAll('[data-reveal]').forEach(function (kid) {
                    kid.style.setProperty('--reveal-i', i++);
                });
            });
        });

        var targets = document.querySelectorAll('[data-reveal]');
        if (!('IntersectionObserver' in window) || prefersReduced) {
            targets.forEach(function (el) { el.classList.add('is-visible'); });
            return;
        }

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    io.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });

        targets.forEach(function (el) { io.observe(el); });
    }

    /* -------------------------------------------------------------
     * 4. Add bracket spans to project + category cards (hover)
     * ----------------------------------------------------------- */
    function initCorners() {
        var sels = ['#projects-section .card', '.category-card'];
        sels.forEach(function (sel) {
            document.querySelectorAll(sel).forEach(function (card) {
                if (card.querySelector('.corner')) return;
                ['tl','tr','bl','br'].forEach(function (pos) {
                    var c = document.createElement('span');
                    c.className = 'corner ' + pos;
                    card.appendChild(c);
                });
            });
        });
    }

    /* -------------------------------------------------------------
     * Boot order
     * ----------------------------------------------------------- */
    // Boot needs to happen ASAP — body is hidden via [data-boot="pending"].
    // Run on DOMContentLoaded so the navbar (loaded async by jQuery) can
    // catch up; we re-init the bits that depend on it once it lands.
    function ready(fn) {
        if (document.readyState !== 'loading') fn();
        else document.addEventListener('DOMContentLoaded', fn);
    }

    ready(function () {
        initBoot();
        initTilt();
        initCorners();
        initReveals();
    });

    // Nav is loaded by the page's own jQuery $.load() callback — re-init
    // bits that depend on it whenever the navbar fires its tab init.
    var observer = new MutationObserver(function () {
        if (document.querySelector('.topbar') && !html.dataset.navHooked) {
            html.dataset.navHooked = '1';
            // If nav arrived after boot kicked, re-apply step classes so
            // its drop-in animation runs.
            if (!html.classList.contains('boot-step-1')) {
                requestAnimationFrame(function () { html.classList.add('boot-step-1'); });
            }
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();
