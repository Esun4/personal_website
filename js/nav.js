(() => {
    const getCurrentPath = () => {
        const raw = window.location.pathname.split("/").pop();
        return raw || "index.html";
    };

    const setActiveTab = () => {
        const tabs = document.querySelectorAll(".mode-tab");
        if (!tabs.length) {
            return;
        }

        const currentPath = getCurrentPath();
        const currentHash = window.location.hash;
        let matched = false;

        tabs.forEach((tab) => {
            tab.classList.remove("active");
            const href = tab.getAttribute("href");
            if (!href) {
                return;
            }

            if (href.includes("#")) {
                const [pathPart, hashPart] = href.split("#");
                const path = pathPart || "index.html";
                const hash = `#${hashPart}`;
                if (path === currentPath && hash === currentHash) {
                    tab.classList.add("active");
                    matched = true;
                }
            } else if (href === currentPath) {
                tab.classList.add("active");
                matched = true;
            }
        });

        if (!matched && currentPath === "index.html") {
            const fallback = document.querySelector('.mode-tab[href="index.html#about-section"]');
            if (fallback) {
                fallback.classList.add("active");
            }
        }
    };

    const bindNavTabs = () => {
        if (window.__navTabsBound) {
            setActiveTab();
            return;
        }

        window.__navTabsBound = true;
        document.addEventListener("click", (event) => {
            if (!event.target.closest(".mode-tab")) {
                return;
            }
            setTimeout(setActiveTab, 0);
        });
        window.addEventListener("hashchange", setActiveTab);
        window.addEventListener("popstate", setActiveTab);
        setActiveTab();
    };

    window.initNavTabs = bindNavTabs;
})();
