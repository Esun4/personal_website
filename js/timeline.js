(function () {
    'use strict';

    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var timeline = document.getElementById('timeline');
    var progress = document.getElementById('timelineProgress');
    var spark    = document.getElementById('timelineSpark');
    var rows     = Array.prototype.slice.call(document.querySelectorAll('.tl-row'));

    if (!timeline) return;

    /* Scroll reveal — toggle is-visible when node crosses activation line */
    function activate(row) {
        if (!row.classList.contains('is-visible')) {
            row.classList.add('is-visible');
        }
    }

    function deactivate(row) {
        row.classList.remove('is-visible');
    }

    if (prefersReduced) {
        rows.forEach(function (r) { r.classList.add('is-visible'); });
    } else {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    activate(entry.target);
                } else if (entry.boundingClientRect.top > 0) {
                    deactivate(entry.target);
                }
            });
        }, {
            rootMargin: '0px 0px -25% 0px',
            threshold: 0.15
        });
        rows.forEach(function (r) { io.observe(r); });
    }

    /* Rail fill + travelling spark */
    function updateRail() {
        var rect = timeline.getBoundingClientRect();
        var vh = window.innerHeight;

        var startY = vh * 0.7;
        var endY   = vh * 0.3;

        var topProgress = (startY - rect.top) / (rect.height + (startY - endY));
        topProgress = Math.max(0, Math.min(1, topProgress));

        var filledPx = topProgress * rect.height;
        progress.style.height = filledPx + 'px';

        if (topProgress > 0 && topProgress < 1) {
            timeline.classList.add('is-active');
            spark.style.top = filledPx + 'px';
        } else {
            timeline.classList.remove('is-active');
        }
    }

    var rafId = 0;
    function onScroll() {
        if (rafId) return;
        rafId = requestAnimationFrame(function () {
            updateRail();
            rafId = 0;
        });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    updateRail();
})();
