/**
 * Utility functions for Hotel Booking System
 */

(function () {
    const ICONS = {
        wifi: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`,
        ac: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v20"/><path d="m4.93 4.93 14.14 14.14"/><path d="M2 12h20"/><path d="m19.07 4.93-14.14 14.14"/><circle cx="12" cy="12" r="3"/></svg>`,
        breakfast: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`,
        dinner: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>`,
        guest: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
        phone: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
        check: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`,
        close: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
        warning: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
        trash: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
        edit: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
        block: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`,
        arrowRight: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
        bed: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>`,
        sparkle: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`
    };

    /**
     * Format a price number into localized currency string
     * e.g., 8 500 DZD
     */
    function formatPrice(amount) {
        if (typeof amount !== "number" || isNaN(amount)) return "0 DZD";
        const currency = (window.CONFIG && window.CONFIG.CURRENCY) || "DZD";
        try {
            return new Intl.NumberFormat("fr-DZ", {
                style: "currency",
                currency: currency,
                maximumFractionDigits: 0
            }).format(amount);
        } catch (e) {
            return `${Math.round(amount).toLocaleString()} ${currency}`;
        }
    }

    /**
     * Format a date string (ISO or YYYY-MM-DD) into readable text
     * e.g. "12 Nov 2026"
     */
    function formatDate(dateInput) {
        if (!dateInput) return "";
        let d;
        if (typeof dateInput === "string") {
            // handle YYYY-MM-DD or ISO
            const parts = dateInput.slice(0, 10).split("-");
            if (parts.length === 3) {
                d = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
            } else {
                d = new Date(dateInput);
            }
        } else {
            d = new Date(dateInput);
        }
        if (isNaN(d.getTime())) return String(dateInput);

        return d.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
            timeZone: "UTC"
        });
    }

    /**
     * Calculate nights between two YYYY-MM-DD date strings in UTC
     */
    function nightsBetween(checkInStr, checkOutStr) {
        if (!checkInStr || !checkOutStr) return 0;
        const [y1, m1, d1] = checkInStr.slice(0, 10).split("-").map(Number);
        const [y2, m2, d2] = checkOutStr.slice(0, 10).split("-").map(Number);
        if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) return 0;
        const utc1 = Date.UTC(y1, m1 - 1, d1);
        const utc2 = Date.UTC(y2, m2 - 1, d2);
        const diffMs = utc2 - utc1;
        return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    }

    /**
     * Return today's date in YYYY-MM-DD format (local/UTC aligned)
     */
    function todayISO() {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        const d = String(now.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }

    /**
     * Add days to a YYYY-MM-DD date string, returning YYYY-MM-DD
     */
    function addDaysISO(dateStr, days) {
        const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
        const date = new Date(Date.UTC(y, m - 1, d));
        date.setUTCDate(date.getUTCDate() + days);
        const resY = date.getUTCFullYear();
        const resM = String(date.getUTCMonth() + 1).padStart(2, "0");
        const resD = String(date.getUTCDate()).padStart(2, "0");
        return `${resY}-${resM}-${resD}`;
    }

    /**
     * Safely create a DOM Element with attributes and text or child nodes
     * strictly avoiding innerHTML injection for text.
     */
    function createSafeElement(tag, attrs = {}, children = []) {
        const el = document.createElement(tag);
        for (const [key, val] of Object.entries(attrs)) {
            if (key === "className" || key === "class") {
                el.className = val;
            } else if (key.startsWith("on") && typeof val === "function") {
                el.addEventListener(key.slice(2).toLowerCase(), val);
            } else if (key === "dataset" && typeof val === "object") {
                for (const [dKey, dVal] of Object.entries(val)) {
                    el.dataset[dKey] = dVal;
                }
            } else if (val !== null && val !== undefined) {
                el.setAttribute(key, val);
            }
        }

        const childArray = Array.isArray(children) ? children : [children];
        for (const child of childArray) {
            if (child === null || child === undefined) continue;
            if (typeof child === "string" || typeof child === "number") {
                el.appendChild(document.createTextNode(String(child)));
            } else if (child instanceof Node) {
                el.appendChild(child);
            }
        }
        return el;
    }

    /**
     * Helper to render an inline SVG icon inside a wrapper node
     */
    function createIconElement(iconName, extraClass = "") {
        const span = document.createElement("span");
        span.className = `icon-wrap ${extraClass}`.trim();
        span.setAttribute("aria-hidden", "true");
        span.innerHTML = ICONS[iconName] || ICONS.sparkle;
        return span;
    }

    /**
     * Match amenity name to standard icon
     */
    function getAmenityIcon(name) {
        const lower = (name || "").toLowerCase();
        if (lower.includes("wi-fi") || lower.includes("wifi") || lower.includes("internet")) return "wifi";
        if (lower.includes("air") || lower.includes("heat") || lower.includes("ac") || lower.includes("clim")) return "ac";
        if (lower.includes("breakfast") || lower.includes("petit-déjeuner")) return "breakfast";
        if (lower.includes("dinner") || lower.includes("dîner") || lower.includes("restaurant")) return "dinner";
        return "sparkle";
    }

    /**
     * Show accessible Toast notification
     */
    function showToast(message, type = "info", duration = 4000) {
        let container = document.getElementById("toast-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "toast-container";
            container.className = "toast-container";
            container.setAttribute("aria-live", "polite");
            container.setAttribute("aria-atomic", "true");
            document.body.appendChild(container);
        }

        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        
        const iconName = type === "success" ? "check" : type === "error" ? "warning" : "sparkle";
        toast.appendChild(createIconElement(iconName, "toast-icon"));

        const textSpan = document.createElement("span");
        textSpan.className = "toast-message";
        textSpan.textContent = message; // Safe textContent
        toast.appendChild(textSpan);

        const closeBtn = document.createElement("button");
        closeBtn.className = "toast-close-btn";
        closeBtn.setAttribute("type", "button");
        closeBtn.setAttribute("aria-label", "Close notification");
        closeBtn.appendChild(createIconElement("close"));
        closeBtn.addEventListener("click", () => {
            toast.classList.add("toast-hiding");
            setTimeout(() => toast.remove(), 250);
        });
        toast.appendChild(closeBtn);

        container.appendChild(toast);

        if (duration > 0) {
            setTimeout(() => {
                if (toast.isConnected) {
                    toast.classList.add("toast-hiding");
                    setTimeout(() => toast.remove(), 250);
                }
            }, duration);
        }
    }

    window.UTILS = {
        formatPrice,
        formatDate,
        nightsBetween,
        todayISO,
        addDaysISO,
        createSafeElement,
        createIconElement,
        getAmenityIcon,
        showToast
    };
})();
