/**
 * Admin Bookings Management Logic
 */

(function () {
    const { formatDate, nightsBetween, createSafeElement, createIconElement, showToast } = window.UTILS;

    // Check authentication
    if (!window.API.getToken()) {
        window.location.href = "/admin/login.html";
        return;
    }

    // DOM Elements
    const hotelNameEl = document.getElementById("admin-nav-hotel-name");
    const logoutBtn = document.getElementById("admin-logout-btn");
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tableBody = document.getElementById("bookings-table-body");
    const cardsList = document.getElementById("bookings-cards-list");
    const tableWrap = document.getElementById("bookings-table-wrap");

    // Modal Elements
    const confirmModal = document.getElementById("action-confirm-modal");
    const confirmModalTitle = document.getElementById("confirm-modal-title");
    const confirmModalMessage = document.getElementById("confirm-modal-message");
    const confirmModalWarning = document.getElementById("confirm-modal-warning");
    const confirmModalWarningText = document.getElementById("confirm-modal-warning-text");
    const confirmModalClose = document.getElementById("confirm-modal-close");
    const confirmModalCancelBtn = document.getElementById("confirm-modal-cancel-btn");
    const confirmModalProceedBtn = document.getElementById("confirm-modal-proceed-btn");

    // State
    let currentFilter = "all";
    let bookingsCache = [];
    let pendingAction = null; // { bookingId, action: 'cancel' }

    function init() {
        if (hotelNameEl && window.CONFIG) {
            hotelNameEl.textContent = window.CONFIG.HOTEL_NAME;
        }

        logoutBtn.addEventListener("click", () => {
            window.API.clearToken();
            window.location.href = "/admin/login.html";
        });

        // Parse query params for initial status
        const urlParams = new URLSearchParams(window.location.search);
        const statusParam = urlParams.get("status");
        if (statusParam && ["pending", "confirmed", "cancelled"].includes(statusParam.toLowerCase())) {
            currentFilter = statusParam.toLowerCase();
        }

        // Tab click listeners
        tabButtons.forEach((btn) => {
            if (btn.dataset.status === currentFilter) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }

            btn.addEventListener("click", () => {
                tabButtons.forEach((b) => b.classList.remove("active"));
                btn.classList.add("active");
                currentFilter = btn.dataset.status;

                // Update URL without full reload
                const newUrl = currentFilter === "all" ? "/admin/bookings.html" : `/admin/bookings.html?status=${currentFilter}`;
                window.history.pushState({ status: currentFilter }, "", newUrl);

                loadBookings();
            });
        });

        // Modal listeners
        confirmModalClose.addEventListener("click", closeConfirmModal);
        confirmModalCancelBtn.addEventListener("click", closeConfirmModal);
        confirmModal.addEventListener("click", (e) => {
            if (e.target === confirmModal) closeConfirmModal();
        });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && confirmModal.classList.contains("is-open")) {
                closeConfirmModal();
            }
        });

        confirmModalProceedBtn.addEventListener("click", handleProceedAction);

        loadBookings();
    }

    async function loadBookings() {
        renderLoading();

        try {
            const bookings = await window.API.getBookings(currentFilter);
            bookingsCache = Array.isArray(bookings) ? bookings : [];
            renderBookings(bookingsCache);
        } catch (err) {
            renderError(err.message || "Failed to load bookings");
            showToast(err.message || "Failed to load bookings", "error");
        }
    }

    function renderFilteredBookings() {
        let list = bookingsCache;
        if (currentFilter && currentFilter !== "all") {
            list = bookingsCache.filter((b) => (b.status || "").toLowerCase() === currentFilter);
        }
        renderBookings(list);
    }

    function renderLoading() {
        tableBody.innerHTML = "";
        cardsList.innerHTML = "";

        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 9;
        td.style.textAlign = "center";
        td.style.padding = "2.5rem";
        td.appendChild(createSafeElement("span", { className: "text-muted" }, ["Loading bookings..."]));
        tr.appendChild(td);
        tableBody.appendChild(tr);

        cardsList.appendChild(createSafeElement("div", {
            className: "admin-booking-card",
            style: "text-align: center; color: var(--text-muted); padding: 2rem;"
        }, ["Loading bookings..."]));
    }

    function renderError(msg) {
        tableBody.innerHTML = "";
        cardsList.innerHTML = "";

        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 9;
        td.style.textAlign = "center";
        td.style.padding = "2.5rem";
        td.appendChild(createSafeElement("span", { style: "color: #991b1b;" }, [msg]));
        tr.appendChild(td);
        tableBody.appendChild(tr);

        cardsList.appendChild(createSafeElement("div", {
            className: "admin-booking-card",
            style: "text-align: center; color: #991b1b; padding: 2rem;"
        }, [msg]));
    }

    function renderBookings(bookings) {
        tableBody.innerHTML = "";
        cardsList.innerHTML = "";

        if (!bookings || bookings.length === 0) {
            const filterLabel = currentFilter === "all" ? "" : ` with status "${currentFilter}"`;
            const emptyText = `No bookings found${filterLabel}.`;

            const tr = document.createElement("tr");
            const td = document.createElement("td");
            td.colSpan = 9;
            td.style.textAlign = "center";
            td.style.padding = "3rem 1.5rem";
            td.appendChild(createSafeElement("div", { className: "text-muted font-medium" }, [emptyText]));
            tr.appendChild(td);
            tableBody.appendChild(tr);

            cardsList.appendChild(createSafeElement("div", {
                className: "admin-booking-card",
                style: "text-align: center; color: var(--text-muted); padding: 2.5rem;"
            }, [emptyText]));
            return;
        }

        bookings.forEach((booking) => {
            // Desktop Table Row
            const tr = createTableRow(booking);
            tableBody.appendChild(tr);

            // Mobile Card
            const card = createMobileCard(booking);
            cardsList.appendChild(card);
        });
    }

    function getRoomDisplay(room) {
        if (!room) return "Room (Deleted)";
        const num = room.roomNumber || "N/A";
        const floor = room.floor ? `Floor ${room.floor}` : "";
        return floor ? `Room ${num} (${floor})` : `Room ${num}`;
    }

    function createStatusBadge(status) {
        const badge = document.createElement("span");
        const s = (status || "pending").toLowerCase();
        badge.className = `status-badge status-${s}`;

        const iconName = s === "confirmed" ? "check" : s === "cancelled" ? "close" : "warning";
        badge.appendChild(createIconElement(iconName));
        badge.appendChild(document.createTextNode(s));
        return badge;
    }

    function createTableRow(booking) {
        const tr = document.createElement("tr");

        // 1. Room & Floor
        const tdRoom = document.createElement("td");
        tdRoom.className = "font-semibold";
        tdRoom.textContent = getRoomDisplay(booking.room);
        tr.appendChild(tdRoom);

        // 2. Guest Name (safe textContent)
        const tdName = document.createElement("td");
        tdName.textContent = booking.guestName;
        tr.appendChild(tdName);

        // 3. Phone (safe clickable tel: link)
        const tdPhone = document.createElement("td");
        const telLink = document.createElement("a");
        telLink.href = `tel:${booking.phone}`;
        telLink.className = "text-primary font-medium";
        telLink.textContent = booking.phone; // Safe textContent
        tdPhone.appendChild(telLink);
        tr.appendChild(tdPhone);

        // 4. Check-in
        const tdCheckIn = document.createElement("td");
        tdCheckIn.textContent = formatDate(booking.checkIn);
        tr.appendChild(tdCheckIn);

        // 5. Check-out
        const tdCheckOut = document.createElement("td");
        tdCheckOut.textContent = formatDate(booking.checkOut);
        tr.appendChild(tdCheckOut);

        // 6. Nights
        const nights = nightsBetween(booking.checkIn, booking.checkOut);
        const tdNights = document.createElement("td");
        tdNights.textContent = `${nights} ${nights === 1 ? "night" : "nights"}`;
        tr.appendChild(tdNights);

        // 7. Guests
        const tdGuests = document.createElement("td");
        tdGuests.textContent = `${booking.guests} ${booking.guests === 1 ? "guest" : "guests"}`;
        tr.appendChild(tdGuests);

        // 8. Status Badge
        const tdStatus = document.createElement("td");
        tdStatus.appendChild(createStatusBadge(booking.status));
        tr.appendChild(tdStatus);

        // 9. Actions
        const tdActions = document.createElement("td");
        tdActions.style.textAlign = "right";
        tdActions.style.whiteSpace = "nowrap";

        const actionsWrap = document.createElement("div");
        actionsWrap.style.display = "inline-flex";
        actionsWrap.style.gap = "0.5rem";

        const s = (booking.status || "pending").toLowerCase();

        if (s === "pending") {
            // Confirm Button
            const confirmBtn = createSafeElement("button", {
                type: "button",
                className: "btn btn-success btn-sm",
                onclick: () => handleConfirmBooking(booking._id)
            }, [
                createIconElement("check"),
                "Confirm"
            ]);
            actionsWrap.appendChild(confirmBtn);

            // Cancel Button
            const cancelBtn = createSafeElement("button", {
                type: "button",
                className: "btn btn-danger btn-sm",
                onclick: () => promptCancelBooking(booking)
            }, [
                createIconElement("close"),
                "Cancel"
            ]);
            actionsWrap.appendChild(cancelBtn);
        } else if (s === "confirmed") {
            // Cancel Button
            const cancelBtn = createSafeElement("button", {
                type: "button",
                className: "btn btn-danger btn-sm",
                onclick: () => promptCancelBooking(booking)
            }, [
                createIconElement("close"),
                "Cancel"
            ]);
            actionsWrap.appendChild(cancelBtn);
        }
        // Cancelled bookings have NO actions!

        tdActions.appendChild(actionsWrap);
        tr.appendChild(tdActions);

        return tr;
    }

    function createMobileCard(booking) {
        const card = createSafeElement("div", { className: "admin-booking-card" });

        // Header: Room + Status
        const head = createSafeElement("div", { className: "admin-card-header" });
        const roomTitle = createSafeElement("span", { className: "font-bold", style: "font-size: 1.1rem;" }, [
            getRoomDisplay(booking.room)
        ]);
        head.appendChild(roomTitle);
        head.appendChild(createStatusBadge(booking.status));
        card.appendChild(head);

        // Details
        const rowName = createSafeElement("div", { className: "admin-card-row" }, [
            createSafeElement("span", { className: "text-muted" }, ["Guest:"]),
            createSafeElement("span", { className: "font-semibold" }, [booking.guestName])
        ]);
        card.appendChild(rowName);

        const rowPhone = createSafeElement("div", { className: "admin-card-row" });
        rowPhone.appendChild(createSafeElement("span", { className: "text-muted" }, ["Phone:"]));
        const telA = document.createElement("a");
        telA.href = `tel:${booking.phone}`;
        telA.className = "text-primary font-medium";
        telA.textContent = booking.phone;
        rowPhone.appendChild(telA);
        card.appendChild(rowPhone);

        const rowDates = createSafeElement("div", { className: "admin-card-row" }, [
            createSafeElement("span", { className: "text-muted" }, ["Dates:"]),
            createSafeElement("span", {}, [`${formatDate(booking.checkIn)} → ${formatDate(booking.checkOut)}`])
        ]);
        card.appendChild(rowDates);

        const nights = nightsBetween(booking.checkIn, booking.checkOut);
        const rowStay = createSafeElement("div", { className: "admin-card-row" }, [
            createSafeElement("span", { className: "text-muted" }, ["Party / Stay:"]),
            createSafeElement("span", {}, [`${booking.guests} guests · ${nights} nights`])
        ]);
        card.appendChild(rowStay);

        // Actions
        const s = (booking.status || "pending").toLowerCase();
        if (s !== "cancelled") {
            const actionsWrap = createSafeElement("div", { className: "admin-card-actions" });

            if (s === "pending") {
                const confirmBtn = createSafeElement("button", {
                    type: "button",
                    className: "btn btn-success btn-sm",
                    style: "flex: 1;",
                    onclick: () => handleConfirmBooking(booking._id)
                }, [
                    createIconElement("check"),
                    "Confirm"
                ]);
                actionsWrap.appendChild(confirmBtn);
            }

            const cancelBtn = createSafeElement("button", {
                type: "button",
                className: "btn btn-danger btn-sm",
                style: "flex: 1;",
                onclick: () => promptCancelBooking(booking)
            }, [
                createIconElement("close"),
                "Cancel Booking"
            ]);
            actionsWrap.appendChild(cancelBtn);

            card.appendChild(actionsWrap);
        }

        return card;
    }

    const confirmingIds = new Set();

async function handleConfirmBooking(bookingId) {
    if (confirmingIds.has(bookingId)) return;
    confirmingIds.add(bookingId);

    try {
        const updated = await window.API.updateBookingStatus(bookingId, "confirmed");
        const idx = bookingsCache.findIndex((b) => b._id === bookingId);
        if (idx !== -1) {
            const currentRoom = bookingsCache[idx].room;
            bookingsCache[idx] = {
                ...bookingsCache[idx],
                ...updated,
                status: "confirmed",
                room: (updated && updated.room && updated.room.roomNumber) ? updated.room : currentRoom
            };
        }
        renderFilteredBookings();
        showToast("Booking successfully confirmed!", "success");
    } catch (err) {
        showToast(err.message || "Failed to confirm booking", "error");
    } finally {
        confirmingIds.delete(bookingId);
    }
}

    function promptCancelBooking(booking) {
        confirmModalProceedBtn.disabled = false;                       // ADD
    confirmModalProceedBtn.textContent = "Yes, Cancel Booking";    
        pendingAction = {
            bookingId: booking._id,
            action: "cancel"
        };

        confirmModalTitle.textContent = "Cancel Booking";
        confirmModalMessage.textContent = `Are you sure you want to cancel the booking for ${booking.guestName} (${getRoomDisplay(booking.room)})?`;
        
        // Explicit warning required by spec:
        confirmModalWarningText.textContent = "Warning: Cancelled bookings CANNOT be reactivated later. You will need to create a new booking if the guest changes their mind.";
        confirmModalWarning.style.display = "flex";

        confirmModalProceedBtn.className = "btn btn-danger";
        confirmModalProceedBtn.textContent = "Yes, Cancel Booking";

        confirmModal.classList.add("is-open");
        confirmModal.setAttribute("aria-hidden", "false");
        document.body.classList.add("scroll-locked");
    }

    function closeConfirmModal() {
        confirmModal.classList.remove("is-open");
        confirmModal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("scroll-locked");
        pendingAction = null;
    }

    async function handleProceedAction() {
    if (!pendingAction || pendingAction.action !== "cancel") return;

    const bookingId = pendingAction.bookingId; // save before the modal closes

    confirmModalProceedBtn.disabled = true;
    confirmModalProceedBtn.textContent = "Processing...";

    try {
        const updated = await window.API.updateBookingStatus(bookingId, "cancelled");
        const idx = bookingsCache.findIndex((b) => b._id === bookingId);
        if (idx !== -1) {
            const currentRoom = bookingsCache[idx].room;
            bookingsCache[idx] = {
                ...bookingsCache[idx],
                ...updated,
                status: "cancelled",
                room: (updated && updated.room && updated.room.roomNumber) ? updated.room : currentRoom
            };
        }
        closeConfirmModal();
        renderFilteredBookings();
        showToast("Booking was cancelled.", "info");
    } catch (err) {
        confirmModalWarningText.textContent = err.message || "Failed to cancel booking";
        confirmModalWarning.style.display = "flex";
        showToast(err.message || "Failed to cancel booking", "error");
    } finally {
        confirmModalProceedBtn.disabled = false;
        confirmModalProceedBtn.textContent = "Yes, Cancel Booking";
    }
}

    // Init on DOM ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
