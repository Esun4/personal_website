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
                return;
            }

            if (!currentHash && href === currentPath) {
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

    const bindSkillsModal = () => {
        const modal = document.getElementById("skills-modal");
        const trigger = document.querySelector(".skills-trigger");
        if (!modal || !trigger) {
            return;
        }

        const closeModal = () => {
            modal.classList.remove("is-open");
            modal.setAttribute("aria-hidden", "true");
            document.body.classList.remove("modal-open");
        };

        const openModal = () => {
            modal.classList.add("is-open");
            modal.setAttribute("aria-hidden", "false");
            document.body.classList.add("modal-open");
        };

        trigger.addEventListener("click", openModal);
        modal.addEventListener("click", (event) => {
            if (event.target.matches("[data-close='true']")) {
                closeModal();
            }
        });
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && modal.classList.contains("is-open")) {
                closeModal();
            }
        });
    };

    const bindContactModal = () => {
        const modal = document.getElementById("contact-modal");
        const triggers = document.querySelectorAll(".contact-trigger");
        if (!modal || !triggers.length) {
            return;
        }

        const closeModal = () => {
            modal.classList.remove("is-open");
            modal.setAttribute("aria-hidden", "true");
            document.body.classList.remove("modal-open");
        };

        const openModal = () => {
            modal.classList.add("is-open");
            modal.setAttribute("aria-hidden", "false");
            document.body.classList.add("modal-open");
        };

        triggers.forEach((trigger) => {
            trigger.addEventListener("click", openModal);
        });
        modal.addEventListener("click", (event) => {
            if (event.target.matches("[data-close='true']")) {
                closeModal();
            }
        });
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && modal.classList.contains("is-open")) {
                closeModal();
            }
        });
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
        bindSkillsModal();
        bindContactModal();
    };

    window.initNavTabs = bindNavTabs;
})();
