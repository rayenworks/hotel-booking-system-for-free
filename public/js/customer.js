/**
 * Customer Booking Page Logic
 */

(function () {
    const { formatPrice, formatDate, nightsBetween, todayISO, addDaysISO, createSafeElement, createIconElement, getAmenityIcon } = window.UTILS;

    // DOM Elements
    const hotelNameDisplay = document.getElementById("hotel-name-display");
    const footerHotelName = document.getElementById("footer-hotel-name");
    const searchForm = document.getElementById("search-form");
    const checkInInput = document.getElementById("check-in-input");
    const checkOutInput = document.getElementById("check-out-input");
    const guestsInput = document.getElementById("guests-input");
    const stepperMinus = document.getElementById("stepper-minus");
    const stepperPlus = document.getElementById("stepper-plus");
    const searchSubmitBtn = document.getElementById("search-submit-btn");
    const largeGroupNotice = document.getElementById("large-group-notice");
    const dateValidationNotice = document.getElementById("date-validation-notice");
    const dateValidationMessage = document.getElementById("date-validation-message");
    const resultsSection = document.getElementById("results-section");
    const resultsHeader = document.getElementById("results-header");
    const resultsSummary = document.getElementById("results-summary");
    const roomsContainer = document.getElementById("rooms-container");

    // Modal Elements
    const bookingModal = document.getElementById("booking-modal");
    const bookingModalTitle = document.getElementById("booking-modal-title");
    const modalCloseBtn = document.getElementById("modal-close-btn");
    const modalBody = document.getElementById("modal-body");

    // State
    let currentSearch = {
        checkIn: "",
        checkOut: "",
        guests: 2,
        nights: 1
    };
    let activeModalTrigger = null;
    let selectedRoom = null;
    let savedFormData = { guestName: "", phone: "" };

    // Initialize Page
    function init() {
        // Hotel Name
        const name = (window.CONFIG && window.CONFIG.HOTEL_NAME) || "Hotel Name";
        hotelNameDisplay.textContent = name;
        if (footerHotelName) {
            footerHotelName.textContent = `© ${new Date().getFullYear()} ${name}. All rights reserved.`;
        }
        document.title = `${name} | Luxury Stays & Room Booking`;

        // Date Inputs Init
        const today = todayISO();
        const tomorrow = addDaysISO(today, 1);

        checkInInput.min = today;
        checkInInput.value = today;

        checkOutInput.min = tomorrow;
        checkOutInput.value = tomorrow;

        currentSearch.checkIn = today;
        currentSearch.checkOut = tomorrow;
        currentSearch.guests = Number(guestsInput.value) || 2;
        currentSearch.nights = nightsBetween(today, tomorrow);

        // Date Change Listeners
        checkInInput.addEventListener("change", handleCheckInChange);
        checkOutInput.addEventListener("change", handleCheckOutChange);

        // Stepper Listeners
        stepperMinus.addEventListener("click", () => updateGuests(-1));
        stepperPlus.addEventListener("click", () => updateGuests(1));

        // Form Submit
        searchForm.addEventListener("submit", handleSearchSubmit);

        // Modal Listeners
        modalCloseBtn.addEventListener("click", closeModal);
        bookingModal.addEventListener("click", (e) => {
            if (e.target === bookingModal) {
                closeModal();
            }
        });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && bookingModal.classList.contains("is-open")) {
                closeModal();
            }
        });

        // Trigger initial search for default dates
        performSearch();
    }

    function handleCheckInChange() {
        const checkInVal = checkInInput.value;
        if (!checkInVal) return;

        // Auto-adjust check-out min to check-in + 1 day
        const nextDay = addDaysISO(checkInVal, 1);
        checkOutInput.min = nextDay;

        if (!checkOutInput.value || checkOutInput.value <= checkInVal) {
            checkOutInput.value = nextDay;
        }

        validateDates();
    }

    function handleCheckOutChange() {
        validateDates();
    }

    function validateDates() {
        dateValidationNotice.style.display = "none";
        dateValidationMessage.textContent = "";

        const checkInVal = checkInInput.value;
        const checkOutVal = checkOutInput.value;
        const today = todayISO();

        if (!checkInVal || !checkOutVal) return false;

        if (checkInVal < today) {
            showDateError("Check-in date cannot be in the past.");
            return false;
        }

        if (checkOutVal <= checkInVal) {
            showDateError("Check-out date must be at least one day after check-in.");
            return false;
        }

        const maxNights = (window.CONFIG && window.CONFIG.MAX_NIGHTS) || 30;
        if (nightsBetween(checkInVal, checkOutVal) > maxNights) {
            showDateError(`The maximum stay is ${maxNights} nights.`);
            return false;
        }

        const maxAdvance = (window.CONFIG && window.CONFIG.MAX_ADVANCE_DAYS) || 365;
        if (checkInVal > addDaysISO(today, maxAdvance)) {
            showDateError(`Bookings can be made up to ${maxAdvance} days ahead.`);
            return false;
        }

        return true;
    }

    function showDateError(msg) {
        dateValidationMessage.textContent = msg; // Safe textContent
        dateValidationNotice.style.display = "flex";
    }

    function updateGuests(delta) {
        let current = Number(guestsInput.value) || 2;
        let updated = current + delta;
        if (updated < 1) updated = 1;
        if (updated > 12) updated = 12;

        guestsInput.value = updated;
        currentSearch.guests = updated;

        if (updated >= 6) {
            largeGroupNotice.style.display = "flex";
            searchSubmitBtn.disabled = true;
        } else {
            largeGroupNotice.style.display = "none";
            searchSubmitBtn.disabled = false;
        }
    }

    function handleSearchSubmit(e) {
        e.preventDefault();
        if (!validateDates()) return;

        if (currentSearch.guests >= 6) {
            largeGroupNotice.style.display = "flex";
            return;
        }

        currentSearch.checkIn = checkInInput.value;
        currentSearch.checkOut = checkOutInput.value;
        currentSearch.guests = Number(guestsInput.value);
        currentSearch.nights = nightsBetween(currentSearch.checkIn, currentSearch.checkOut);

        performSearch();
    }

    async function performSearch() {
        const { checkIn, checkOut, guests } = currentSearch;
        
        // Show Skeleton State
        renderSkeletons();
        resultsHeader.style.display = "none";

        try {
            const rooms = await window.API.getAvailableRooms(checkIn, checkOut, guests);
            renderRooms(rooms);
        } catch (err) {
            renderErrorState(err);
        }
    }

    function renderSkeletons() {
        roomsContainer.innerHTML = "";
        const grid = createSafeElement("div", { className: "rooms-grid" });

        for (let i = 0; i < 3; i++) {
            const card = createSafeElement("div", { className: "skeleton-card" });
            const header = createSafeElement("div", { className: "skeleton-card-header skeleton" });
            const body = createSafeElement("div", { className: "skeleton-card-body" });
            
            const line1 = createSafeElement("div", { className: "skeleton", style: "height: 20px; width: 60%;" });
            const line2 = createSafeElement("div", { className: "skeleton", style: "height: 40px; width: 100%; border-radius: 8px;" });
            const line3 = createSafeElement("div", { className: "skeleton", style: "height: 24px; width: 80%;" });
            const line4 = createSafeElement("div", { className: "skeleton", style: "height: 44px; width: 100%; border-radius: 12px; margin-top: auto;" });

            body.appendChild(line1);
            body.appendChild(line2);
            body.appendChild(line3);
            body.appendChild(line4);

            card.appendChild(header);
            card.appendChild(body);
            grid.appendChild(card);
        }
        roomsContainer.appendChild(grid);
    }

    function renderRooms(rooms) {
        roomsContainer.innerHTML = "";

        if (!rooms || rooms.length === 0) {
            resultsHeader.style.display = "none";
            const empty = createSafeElement("div", { className: "empty-state" });
            const icon = createSafeElement("div", { className: "empty-state-icon" }, [createIconElement("bed")]);
            const title = createSafeElement("h3", { className: "empty-state-title" }, ["No rooms available for those dates"]);
            const text = createSafeElement("p", { className: "empty-state-text" }, ["We couldn't find any rooms fitting your guest count for the selected dates. Try adjusting your dates or splitting your party across multiple rooms."]);

            empty.appendChild(icon);
            empty.appendChild(title);
            empty.appendChild(text);
            roomsContainer.appendChild(empty);
            return;
        }

        // Summary Line
        const count = rooms.length;
        const nightsText = currentSearch.nights === 1 ? "1 night" : `${currentSearch.nights} nights`;
        const guestsText = currentSearch.guests === 1 ? "1 guest" : `${currentSearch.guests} guests`;
        const roomsText = count === 1 ? "1 room available" : `${count} rooms available`;

        resultsSummary.textContent = `${roomsText} · ${nightsText} · ${guestsText}`;
        resultsHeader.style.display = "block";

        const grid = createSafeElement("div", { className: "rooms-grid" });

        rooms.forEach((room) => {
            const card = createRoomCard(room);
            grid.appendChild(card);
        });

        roomsContainer.appendChild(grid);
    }

    function createRoomCard(room) {
        const floor = Number(room.floor) || 1;
        const card = createSafeElement("article", { className: "room-card" });

        // Header with gradient
        const header = createSafeElement("div", { className: `room-card-header floor-${floor}` });
        
        const numWrap = createSafeElement("div", { className: "room-number-wrap" });
        const numLabel = createSafeElement("span", { className: "room-number-label" }, ["Room"]);
        const numVal = createSafeElement("span", { className: "room-number" }, [room.roomNumber]);
        numWrap.appendChild(numLabel);
        numWrap.appendChild(numVal);

        const floorBadge = createSafeElement("span", { className: "floor-badge" }, [`Floor ${floor}`]);
        header.appendChild(numWrap);
        header.appendChild(floorBadge);
        card.appendChild(header);

        // Body
        const body = createSafeElement("div", { className: "room-card-body" });

        // Capacity
        const meta = createSafeElement("div", { className: "room-meta" });
        const capBadge = createSafeElement("span", { className: "capacity-badge" }, [
            createIconElement("guest"),
            `Up to ${room.capacity} guests`
        ]);
        meta.appendChild(capBadge);
        body.appendChild(meta);

        // Included Services Box
        const servicesBox = createSafeElement("div", { className: "included-services-box" });
        const servTitle = createSafeElement("div", { className: "included-services-title" }, [
            createIconElement("sparkle"),
            "Included in every stay"
        ]);
        servicesBox.appendChild(servTitle);

        const servList = createSafeElement("ul", { className: "services-list" });
        const hotelServices = (window.CONFIG && window.CONFIG.HOTEL_SERVICES) || [];
        hotelServices.forEach((s) => {
            const iconName = getAmenityIcon(s);
            const li = createSafeElement("li", { className: "service-item" }, [
                createIconElement(iconName),
                s
            ]);
            servList.appendChild(li);
        });

        // Additional amenities returned by API (e.g. balcony, mountain view, etc.)
        if (Array.isArray(room.amenities)) {
            const standardLower = hotelServices.map((x) => x.toLowerCase());
            room.amenities.forEach((amenity) => {
                if (!amenity) return;
                const aLower = amenity.toLowerCase();
                // Check if already represented in hotelServices
                const isRedundant = standardLower.some((std) => std.includes(aLower) || aLower.includes(std));
                if (!isRedundant) {
                    const iconName = getAmenityIcon(amenity);
                    const chip = createSafeElement("li", { className: "amenity-chip" }, [
                        createIconElement(iconName),
                        amenity
                    ]);
                    servList.appendChild(chip);
                }
            });
        }
        servicesBox.appendChild(servList);
        body.appendChild(servicesBox);

        // Footer & Price
        const footer = createSafeElement("div", { className: "room-card-footer" });
        const priceWrap = createSafeElement("div", { className: "price-wrap" });
        
        const priceRow = createSafeElement("div", { className: "price-row" });
        const priceVal = createSafeElement("span", { className: "price-val" }, [formatPrice(room.pricePerNight)]);
        priceRow.appendChild(priceVal);

        const pricePeriod = createSafeElement("span", { className: "price-period" }, [
            "per room, per night · breakfast & dinner included"
        ]);

        priceWrap.appendChild(priceRow);
        priceWrap.appendChild(pricePeriod);

        // Stay Total
        if (currentSearch.nights > 1) {
            const stayTotal = room.pricePerNight * currentSearch.nights;
            const stayTotalEl = createSafeElement("span", { className: "price-stay-total" }, [
                `${currentSearch.nights} nights · total ${formatPrice(stayTotal)}`
            ]);
            priceWrap.appendChild(stayTotalEl);
        }

        footer.appendChild(priceWrap);

        // Book Button
        const bookBtn = createSafeElement("button", {
            type: "button",
            className: "btn btn-primary btn-block",
            onclick: () => openBookingModal(room, bookBtn)
        }, [
            "Book this room",
            createIconElement("arrowRight")
        ]);
        footer.appendChild(bookBtn);

        body.appendChild(footer);
        card.appendChild(body);

        return card;
    }

    function renderErrorState(err) {
        resultsHeader.style.display = "none";
        roomsContainer.innerHTML = "";

        const errBox = createSafeElement("div", { className: "empty-state" });
        const icon = createSafeElement("div", { className: "empty-state-icon", style: "color: #991b1b; background: #fee2e2;" }, [
            createIconElement("warning")
        ]);
        const title = createSafeElement("h3", { className: "empty-state-title" }, ["Unable to load rooms"]);
        const text = createSafeElement("p", { className: "empty-state-text" });
        text.textContent = err.message || "An unexpected error occurred. Please try again.";

        const retryBtn = createSafeElement("button", {
            type: "button",
            className: "btn btn-primary",
            style: "margin-top: 1.25rem;",
            onclick: () => performSearch()
        }, ["Retry Search"]);

        errBox.appendChild(icon);
        errBox.appendChild(title);
        errBox.appendChild(text);
        errBox.appendChild(retryBtn);
        roomsContainer.appendChild(errBox);
    }

    // Modal Workflow
    function openBookingModal(room, triggerBtn) {
        activeModalTrigger = triggerBtn;
        selectedRoom = room;

        bookingModalTitle.textContent = `Book Room ${room.roomNumber} (Floor ${room.floor})`;
        renderBookingFormView();

        bookingModal.classList.add("is-open");
        bookingModal.setAttribute("aria-hidden", "false");
        document.body.classList.add("scroll-locked");

        // Focus first input
        setTimeout(() => {
            const nameInput = document.getElementById("guest-name-input");
            if (nameInput) nameInput.focus();
        }, 100);
    }

    function closeModal() {
        bookingModal.classList.remove("is-open");
        bookingModal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("scroll-locked");
        if (activeModalTrigger && typeof activeModalTrigger.focus === "function") {
            activeModalTrigger.focus();
        }
    }

    function renderBookingFormView() {
        modalBody.innerHTML = "";

        const { checkIn, checkOut, guests, nights } = currentSearch;
        const room = selectedRoom;
        const totalCost = room.pricePerNight * nights;

        // Stay Summary Box
        const summaryCard = createSafeElement("div", { className: "stay-summary-card" });
        
        const rowRoom = createSafeElement("div", { className: "stay-summary-row" }, [
            createSafeElement("span", { className: "text-muted" }, ["Room Selection"]),
            createSafeElement("span", { className: "font-semibold" }, [`Room ${room.roomNumber} · Floor ${room.floor}`])
        ]);

        const rowDates = createSafeElement("div", { className: "stay-summary-row" }, [
            createSafeElement("span", { className: "text-muted" }, ["Dates"]),
            createSafeElement("span", { className: "font-semibold" }, [`${formatDate(checkIn)} → ${formatDate(checkOut)}`])
        ]);

        const rowDuration = createSafeElement("div", { className: "stay-summary-row" }, [
            createSafeElement("span", { className: "text-muted" }, ["Stay Details"]),
            createSafeElement("span", { className: "font-semibold" }, [`${nights} ${nights === 1 ? "night" : "nights"} · ${guests} ${guests === 1 ? "guest" : "guests"}`])
        ]);

        const rowServices = createSafeElement("div", { className: "stay-summary-row" }, [
            createSafeElement("span", { className: "text-muted" }, ["Dining & Perks"]),
            createSafeElement("span", { className: "font-semibold text-primary" }, ["Breakfast & Dinner Included"])
        ]);

        const rowCalc = createSafeElement("div", { className: "stay-summary-row" }, [
            createSafeElement("span", { className: "text-muted" }, ["Rate"]),
            createSafeElement("span", {}, [`${formatPrice(room.pricePerNight)} × ${nights} ${nights === 1 ? "night" : "nights"}`])
        ]);

        const rowTotal = createSafeElement("div", { className: "stay-summary-row stay-summary-total" }, [
            createSafeElement("span", {}, ["Total Estimated Stay"]),
            createSafeElement("span", {}, [formatPrice(totalCost)])
        ]);

        summaryCard.appendChild(rowRoom);
        summaryCard.appendChild(rowDates);
        summaryCard.appendChild(rowDuration);
        summaryCard.appendChild(rowServices);
        summaryCard.appendChild(rowCalc);
        summaryCard.appendChild(rowTotal);
        modalBody.appendChild(summaryCard);

        // Booking Form
        const form = createSafeElement("form", { id: "modal-booking-form", novalidate: true });

        // Error Banner inside modal
        const modalErrorBox = createSafeElement("div", {
            id: "modal-error-box",
            className: "alert-box alert-danger",
            style: "display: none;",
            role: "alert"
        });
        const errIcon = createIconElement("warning");
        const errMsgSpan = createSafeElement("span", { id: "modal-error-text" });
        modalErrorBox.appendChild(errIcon);
        modalErrorBox.appendChild(errMsgSpan);
        form.appendChild(modalErrorBox);

        // Guest Name
        const nameGroup = createSafeElement("div", { className: "form-group", style: "margin-bottom: 1rem;" });
        const nameLabel = createSafeElement("label", { for: "guest-name-input", className: "form-label" }, [
            createIconElement("guest"),
            "Full Name"
        ]);
        const nameInput = createSafeElement("input", {
            type: "text",
            id: "guest-name-input",
            className: "input-control",
            placeholder: "e.g. John Doe",
            value: savedFormData.guestName || "",
            required: true,
            minlength: 2
        });
        nameGroup.appendChild(nameLabel);
        nameGroup.appendChild(nameInput);
        form.appendChild(nameGroup);

        // Guest Phone
        const phoneGroup = createSafeElement("div", { className: "form-group", style: "margin-bottom: 1.25rem;" });
        const phoneLabel = createSafeElement("label", { for: "guest-phone-input", className: "form-label" }, [
            createIconElement("phone"),
            "Phone Number (for confirmation call)"
        ]);
        const phoneInput = createSafeElement("input", {
            type: "tel",
            id: "guest-phone-input",
            className: "input-control",
            placeholder: "e.g. +213 555 123 456",
            value: savedFormData.phone || "",
            required: true
        });
        phoneGroup.appendChild(phoneLabel);
        phoneGroup.appendChild(phoneInput);
        form.appendChild(phoneGroup);

        // Pending Notice Note
        const noticeNote = createSafeElement("div", { className: "notice-box", style: "margin-bottom: 1.25rem;" }, [
            createSafeElement("strong", {}, ["Important note on reservation confirmation:"]),
            createSafeElement("p", {}, ["Reservations start in a PENDING status. Our front desk team will contact you by telephone to verify and confirm your booking. No payment is required right now."])
        ]);
        form.appendChild(noticeNote);

        // Submit Button
        const submitBtn = createSafeElement("button", {
            type: "submit",
            id: "modal-submit-btn",
            className: "btn btn-primary btn-block btn-lg"
        }, [
            createIconElement("check"),
            "Submit Booking Request"
        ]);
        form.appendChild(submitBtn);

        // Form Submit Handler
        form.addEventListener("submit", (e) => handleBookingSubmit(e, form, submitBtn, nameInput, phoneInput, modalErrorBox, errMsgSpan));

        modalBody.appendChild(form);
    }

    async function handleBookingSubmit(e, form, submitBtn, nameInput, phoneInput, errorBox, errorText) {
        e.preventDefault();
        errorBox.style.display = "none";
        errorText.textContent = "";

        const guestName = nameInput.value.trim();
        const rawPhone = phoneInput.value.trim();

        // Save typed data so it's not lost on error
        savedFormData.guestName = guestName;
        savedFormData.phone = rawPhone;

        // Validation
        if (!guestName || guestName.length < 2) {
            errorText.textContent = "Please enter your full name (at least 2 characters).";
            errorBox.style.display = "flex";
            nameInput.focus();
            return;
        }

        // Phone check: 8-15 digits, allowing +, spaces and dashes
        const digitsOnly = rawPhone.replace(/[\s\-+()]/g, "");
        if (digitsOnly.length < 8 || digitsOnly.length > 15 || !/^[0-9]+$/.test(digitsOnly)) {
            errorText.textContent = "Please enter a valid phone number (8 to 15 digits).";
            errorBox.style.display = "flex";
            phoneInput.focus();
            return;
        }

        // Lock button (Double submit prevention)
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting Request...";

        const payload = {
            room: selectedRoom._id,
            guestName,
            phone: rawPhone,
            checkIn: currentSearch.checkIn,
            checkOut: currentSearch.checkOut,
            guests: currentSearch.guests
        };

        try {
            const booking = await window.API.createBooking(payload);
            renderBookingSuccessView(booking);
        } catch (err) {
            // Handle 409 Conflict (Room no longer available)
            if (err.status === 409) {
                errorText.textContent = err.message || "This room was just booked by someone else. Please select another room.";
                errorBox.style.display = "flex";
                submitBtn.disabled = false;
                submitBtn.textContent = "Submit Booking Request";
                
                // Automatically re-run the search in the background to refresh room list!
                performSearch();
                return;
            }

            // Other errors (400, 500, network)
            errorText.textContent = err.message || "An unexpected error occurred. Please try again.";
            errorBox.style.display = "flex";
            submitBtn.disabled = false;
            submitBtn.textContent = "Submit Booking Request";
        }
    }

    function renderBookingSuccessView(booking) {
        modalBody.innerHTML = "";
        bookingModalTitle.textContent = "Request Received";

        const successView = createSafeElement("div", { className: "success-view" });

        const iconWrap = createSafeElement("div", { className: "success-icon-wrap" }, [
            createIconElement("check")
        ]);

        const title = createSafeElement("h3", { className: "font-serif", style: "font-size: 1.5rem;" }, [
            "Booking Request Submitted"
        ]);

        // Reference Code: last 8 characters uppercase
        const refCode = (booking._id ? booking._id.slice(-8) : "REQUEST").toUpperCase();
        const refRow = createSafeElement("div", { style: "display: flex; flex-direction: column; align-items: center; gap: 0.25rem;" }, [
            createSafeElement("span", { className: "text-muted", style: "font-size: 0.85rem;" }, ["Booking Reference"]),
            createSafeElement("span", { className: "reference-pill" }, [`#${refCode}`])
        ]);

        // Details Box
        const detailsCard = createSafeElement("div", { className: "stay-summary-card", style: "width: 100%; text-align: left;" });
        
        detailsCard.appendChild(createSafeElement("div", { className: "stay-summary-row" }, [
            createSafeElement("span", { className: "text-muted" }, ["Guest"]),
            createSafeElement("span", { className: "font-semibold" }, [booking.guestName])
        ]));

        detailsCard.appendChild(createSafeElement("div", { className: "stay-summary-row" }, [
            createSafeElement("span", { className: "text-muted" }, ["Contact"]),
            createSafeElement("span", { className: "font-semibold" }, [booking.phone])
        ]));

        detailsCard.appendChild(createSafeElement("div", { className: "stay-summary-row" }, [
            createSafeElement("span", { className: "text-muted" }, ["Dates"]),
            createSafeElement("span", { className: "font-semibold" }, [`${formatDate(booking.checkIn)} → ${formatDate(booking.checkOut)}`])
        ]));

        detailsCard.appendChild(createSafeElement("div", { className: "stay-summary-row" }, [
            createSafeElement("span", { className: "text-muted" }, ["Included Perks"]),
            createSafeElement("span", { className: "font-semibold text-primary" }, ["Breakfast & Dinner Included"])
        ]));

        // Clear Pending Status Notice
        const pendingNotice = createSafeElement("div", { className: "notice-box", style: "width: 100%;" }, [
            createSafeElement("div", { style: "font-weight: 700; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.35rem;" }, [
                createIconElement("warning"),
                "Status: PENDING PHONE CONFIRMATION"
            ]),
            createSafeElement("p", {}, [
                "Your booking request has been safely registered. Please note that your booking is NOT yet confirmed. A member of our hotel reception will contact you by telephone shortly to confirm details and finalize your reservation."
            ])
        ]);

        // Action button
        const closeBtn = createSafeElement("button", {
            type: "button",
            className: "btn btn-primary btn-block",
            onclick: () => {
                closeModal();
                savedFormData = { guestName: "", phone: "" };
                performSearch();
            }
        }, ["Make Another Booking"]);

        successView.appendChild(iconWrap);
        successView.appendChild(title);
        successView.appendChild(refRow);
        successView.appendChild(detailsCard);
        successView.appendChild(pendingNotice);
        successView.appendChild(closeBtn);

        modalBody.appendChild(successView);
    }

    // Run on DOM ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
