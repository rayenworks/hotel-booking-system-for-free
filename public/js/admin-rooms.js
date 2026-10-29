/**
 * Admin Rooms Management Logic
 */

(function () {
    const { formatPrice, formatDate, todayISO, addDaysISO, createSafeElement, createIconElement, showToast } = window.UTILS;

    // Check authentication
    if (!window.API.getToken()) {
        window.location.href = "/admin/login.html";
        return;
    }

    // DOM Elements
    const hotelNameEl = document.getElementById("admin-nav-hotel-name");
    const logoutBtn = document.getElementById("admin-logout-btn");
    const openAddRoomBtn = document.getElementById("open-add-room-btn");
    const floorsContainer = document.getElementById("floors-container");

    // Room Modal (Add/Edit)
    const roomModal = document.getElementById("room-modal");
    const roomModalTitle = document.getElementById("room-modal-title");
    const roomModalClose = document.getElementById("room-modal-close");
    const roomModalCancel = document.getElementById("room-modal-cancel");
    const roomModalSubmit = document.getElementById("room-modal-submit");
    const roomForm = document.getElementById("room-form");
    const roomNumberInput = document.getElementById("room-number-input");
    const roomFloorSelect = document.getElementById("room-floor-select");
    const roomCapacitySelect = document.getElementById("room-capacity-select");
    const roomAmenitiesInput = document.getElementById("room-amenities-input");
    const roomModalError = document.getElementById("room-modal-error");
    const roomModalErrorText = document.getElementById("room-modal-error-text");
    const keepAddingWrap = document.getElementById("keep-adding-wrap");
    const keepAddingCheckbox = document.getElementById("keep-adding-checkbox");

    // Block Dates Modal
    const blockModal = document.getElementById("block-modal");
    const blockModalTitle = document.getElementById("block-modal-title");
    const blockModalClose = document.getElementById("block-modal-close");
    const blockModalCancel = document.getElementById("block-modal-cancel");
    const blockModalSubmit = document.getElementById("block-modal-submit");
    const blockForm = document.getElementById("block-form");
    const blockRoomInfo = document.getElementById("block-room-info");
    const blockFromInput = document.getElementById("block-from-input");
    const blockToInput = document.getElementById("block-to-input");
    const blockReasonInput = document.getElementById("block-reason-input");
    const blockModalError = document.getElementById("block-modal-error");
    const blockModalErrorText = document.getElementById("block-modal-error-text");

    // Delete / Confirm Modal
    const deleteConfirmModal = document.getElementById("delete-confirm-modal");
    const deleteConfirmTitle = document.getElementById("delete-confirm-title");
    const deleteConfirmMessage = document.getElementById("delete-confirm-message");
    const deleteConfirmError = document.getElementById("delete-confirm-error");
    const deleteConfirmErrorText = document.getElementById("delete-confirm-error-text");
    const deleteConfirmClose = document.getElementById("delete-confirm-close");
    const deleteConfirmCancel = document.getElementById("delete-confirm-cancel");
    const deleteConfirmProceed = document.getElementById("delete-confirm-proceed");

    // State
    let roomsCache = [];
    let editingRoomId = null; // null for add, string id for edit
    let activeBlockRoomId = null;
    let pendingDeleteAction = null; // { type: 'room' | 'block', roomId, blockId, label }

    // Floor capacity defaults rule: 1->2, 2->3, 3->4, 4->5
    const FLOOR_DEFAULT_CAPACITY = {
        "1": "2",
        "2": "3",
        "3": "4",
        "4": "5"
    };

    function init() {
        if (hotelNameEl && window.CONFIG) {
            hotelNameEl.textContent = window.CONFIG.HOTEL_NAME;
        }

        logoutBtn.addEventListener("click", () => {
            window.API.clearToken();
            window.location.href = "/admin/login.html";
        });

        // Floor change auto-adjusts capacity
        roomFloorSelect.addEventListener("change", () => {
            const floorVal = roomFloorSelect.value;
            if (FLOOR_DEFAULT_CAPACITY[floorVal]) {
                roomCapacitySelect.value = FLOOR_DEFAULT_CAPACITY[floorVal];
            }
        });

        // Open Add Room
        openAddRoomBtn.addEventListener("click", () => openAddRoomModal());

        // Room Modal Close listeners
        roomModalClose.addEventListener("click", closeRoomModal);
        roomModalCancel.addEventListener("click", closeRoomModal);
        roomModal.addEventListener("click", (e) => {
            if (e.target === roomModal) closeRoomModal();
        });

        // Room Form Submit
        roomForm.addEventListener("submit", handleRoomFormSubmit);

        // Block Modal Listeners
        blockModalClose.addEventListener("click", closeBlockModal);
        blockModalCancel.addEventListener("click", closeBlockModal);
        blockModal.addEventListener("click", (e) => {
            if (e.target === blockModal) closeBlockModal();
        });
        blockForm.addEventListener("submit", handleBlockFormSubmit);

        // Block Dates auto-adjust
        blockFromInput.addEventListener("change", () => {
            const fromVal = blockFromInput.value;
            if (fromVal) {
                const nextDay = addDaysISO(fromVal, 1);
                blockToInput.min = nextDay;
                if (!blockToInput.value || blockToInput.value <= fromVal) {
                    blockToInput.value = nextDay;
                }
            }
        });

        // Delete Confirm Modal Listeners
        deleteConfirmClose.addEventListener("click", closeDeleteConfirmModal);
        deleteConfirmCancel.addEventListener("click", closeDeleteConfirmModal);
        deleteConfirmModal.addEventListener("click", (e) => {
            if (e.target === deleteConfirmModal) closeDeleteConfirmModal();
        });
        deleteConfirmProceed.addEventListener("click", handleExecuteDelete);

        // Esc key listener
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                if (roomModal.classList.contains("is-open")) closeRoomModal();
                if (blockModal.classList.contains("is-open")) closeBlockModal();
                if (deleteConfirmModal.classList.contains("is-open")) closeDeleteConfirmModal();
            }
        });

        loadRooms();
    }

    async function loadRooms() {
        renderLoading();

        try {
            const rooms = await window.API.getRooms();
            roomsCache = Array.isArray(rooms) ? rooms : [];
            renderFloors(roomsCache);
        } catch (err) {
            renderError(err.message || "Failed to load rooms");
            showToast(err.message || "Failed to load rooms", "error");
        }
    }

    function renderLoading() {
        floorsContainer.innerHTML = "";
        floorsContainer.appendChild(createSafeElement("div", {
            className: "empty-state",
            style: "padding: 3rem;"
        }, [
            createSafeElement("div", { className: "skeleton", style: "height: 30px; width: 40%; margin: 0 auto 1.5rem;" }),
            createSafeElement("div", { className: "skeleton", style: "height: 100px; width: 80%; margin: 0 auto;" })
        ]));
    }

    function renderError(msg) {
        floorsContainer.innerHTML = "";
        const box = createSafeElement("div", { className: "empty-state" });
        box.appendChild(createSafeElement("div", { className: "empty-state-icon", style: "color: #991b1b; background: #fee2e2;" }, [
            createIconElement("warning")
        ]));
        box.appendChild(createSafeElement("h3", { className: "empty-state-title" }, ["Error loading rooms"]));
        const text = createSafeElement("p", { className: "empty-state-text" });
        text.textContent = msg;
        box.appendChild(text);

        const retry = createSafeElement("button", {
            type: "button",
            className: "btn btn-primary",
            style: "margin-top: 1.25rem;",
            onclick: () => loadRooms()
        }, ["Retry"]);
        box.appendChild(retry);

        floorsContainer.appendChild(box);
    }

    function renderFloors(rooms) {
        floorsContainer.innerHTML = "";

        // Floors 1, 2, 3, 4
        const floors = [1, 2, 3, 4];

        floors.forEach((floorNum) => {
            const floorRooms = rooms.filter((r) => Number(r.floor) === floorNum);
            
            // Floor Section
            const section = createSafeElement("section", { className: "floor-section" });

            // Floor Header
            const header = createSafeElement("div", { className: `floor-section-header f${floorNum}` });
            const titleWrap = createSafeElement("div");
            const title = createSafeElement("h2", { style: "font-size: 1.3rem;" }, [`Floor ${floorNum}`]);
            const subtitle = createSafeElement("span", { className: "text-muted", style: "font-size: 0.85rem;" }, [
                `Capacity tier: max ${floorNum + 1} guests per room`
            ]);
            titleWrap.appendChild(title);
            titleWrap.appendChild(subtitle);

            const countBadge = createSafeElement("span", {
                className: "capacity-badge font-semibold"
            }, [`${floorRooms.length} ${floorRooms.length === 1 ? "room" : "rooms"}`]);

            header.appendChild(titleWrap);
            header.appendChild(countBadge);
            section.appendChild(header);

            // Floor Rooms Grid
            if (floorRooms.length === 0) {
                const empty = createSafeElement("div", {
                    style: "background: var(--bg-surface); padding: 1.5rem; border-radius: var(--radius-md); border: 1px dashed var(--border-color); color: var(--text-muted); text-align: center; font-size: 0.9rem;"
                }, ["No rooms added to this floor yet. Click \"+ Add Room\" to add one."]);
                section.appendChild(empty);
            } else {
                const grid = createSafeElement("div", { className: "admin-rooms-grid" });
                floorRooms.forEach((room) => {
                    grid.appendChild(createAdminRoomCard(room));
                });
                section.appendChild(grid);
            }

            floorsContainer.appendChild(section);
        });
    }

    function createAdminRoomCard(room) {
        const card = createSafeElement("div", { className: "admin-room-card" });

        // Top Row: Room number + Price (read-only from API)
        const topRow = createSafeElement("div", { className: "admin-room-top" });
        const numWrap = createSafeElement("div");
        const roomNum = createSafeElement("span", { className: "admin-room-num" }, [`Room ${room.roomNumber}`]);
        numWrap.appendChild(roomNum);

        const priceWrap = createSafeElement("div", { style: "text-align: right;" });
        const priceVal = createSafeElement("div", { className: "font-bold text-primary", style: "font-size: 1.15rem;" }, [
            formatPrice(room.pricePerNight)
        ]);
        const priceLabel = createSafeElement("div", { className: "text-muted", style: "font-size: 0.75rem;" }, [
            "per night (server calculated)"
        ]);
        priceWrap.appendChild(priceVal);
        priceWrap.appendChild(priceLabel);

        topRow.appendChild(numWrap);
        topRow.appendChild(priceWrap);
        card.appendChild(topRow);

        // Capacity
        const capRow = createSafeElement("div", { style: "font-size: 0.85rem;" }, [
            createSafeElement("span", { className: "text-muted" }, ["Capacity: "]),
            createSafeElement("span", { className: "font-semibold" }, [`${room.capacity} guests`])
        ]);
        card.appendChild(capRow);

        // Amenities
        const amenRow = createSafeElement("div", { style: "display: flex; flex-wrap: wrap; gap: 0.35rem;" });
        if (Array.isArray(room.amenities) && room.amenities.length > 0) {
            room.amenities.forEach((a) => {
                const chip = createSafeElement("span", { className: "amenity-chip", style: "font-size: 0.75rem;" });
                chip.textContent = a; // Safe textContent
                amenRow.appendChild(chip);
            });
        } else {
            amenRow.appendChild(createSafeElement("span", { className: "text-muted", style: "font-size: 0.8rem;" }, ["No extra amenities"]));
        }
        card.appendChild(amenRow);

        // Blocked Periods (if any)
        if (Array.isArray(room.blockedPeriods) && room.blockedPeriods.length > 0) {
            const blockBox = createSafeElement("div", { className: "blocked-periods-box" });
            const bTitle = createSafeElement("div", { className: "blocked-periods-title" }, [
                createIconElement("block"),
                "Maintenance Blackout Periods"
            ]);
            blockBox.appendChild(bTitle);

            room.blockedPeriods.forEach((bp) => {
                const bItem = createSafeElement("div", { className: "blocked-period-item" });
                
                const bDetails = createSafeElement("div");
                const bDates = createSafeElement("div", { className: "font-semibold" }, [
                    `${formatDate(bp.from)} → ${formatDate(bp.to)}`
                ]);
                const bReason = createSafeElement("div", { style: "font-size: 0.75rem; opacity: 0.85;" });
                bReason.textContent = bp.reason || "Scheduled maintenance"; // Safe textContent
                bDetails.appendChild(bDates);
                bDetails.appendChild(bReason);

                const removeBtn = createSafeElement("button", {
                    type: "button",
                    className: "btn btn-sm",
                    style: "color: #991b1b; padding: 0.2rem 0.4rem; background: rgba(153, 27, 27, 0.1);",
                    title: "Remove block",
                    onclick: () => promptRemoveBlock(room, bp)
                }, [
                    createIconElement("trash")
                ]);

                bItem.appendChild(bDetails);
                bItem.appendChild(removeBtn);
                blockBox.appendChild(bItem);
            });

            card.appendChild(blockBox);
        }

        // Room Action Buttons
        const actions = createSafeElement("div", {
            style: "display: flex; gap: 0.5rem; margin-top: auto; padding-top: 0.75rem; border-top: 1px solid var(--border-color);"
        });

        // Edit Button
        const editBtn = createSafeElement("button", {
            type: "button",
            className: "btn btn-secondary btn-sm",
            style: "flex: 1;",
            onclick: () => openEditRoomModal(room)
        }, [
            createIconElement("edit"),
            "Edit"
        ]);

        // Block Dates Button
        const blockBtn = createSafeElement("button", {
            type: "button",
            className: "btn btn-secondary btn-sm",
            style: "flex: 1;",
            onclick: () => openBlockModal(room)
        }, [
            createIconElement("block"),
            "Block"
        ]);

        // Delete Button
        const deleteBtn = createSafeElement("button", {
            type: "button",
            className: "btn btn-sm",
            style: "color: #dc2626; border: 1px solid #fecaca; background: #fff5f5;",
            title: "Delete room",
            onclick: () => promptDeleteRoom(room)
        }, [
            createIconElement("trash")
        ]);

        actions.appendChild(editBtn);
        actions.appendChild(blockBtn);
        actions.appendChild(deleteBtn);
        card.appendChild(actions);

        return card;
    }

    // ADD / EDIT MODAL WORKFLOW
    function openAddRoomModal() {
        roomModalSubmit.disabled = false;
        editingRoomId = null;
        roomModalTitle.textContent = "Add New Room";
        roomModalError.style.display = "none";
        roomModalErrorText.textContent = "";

        // If previously selected floor exists, keep it
        const currentFloor = roomFloorSelect.value || "1";
        roomNumberInput.value = "";
        roomFloorSelect.value = currentFloor;
        roomCapacitySelect.value = FLOOR_DEFAULT_CAPACITY[currentFloor] || "2";
        roomAmenitiesInput.value = "wifi, heating/ac, breakfast, dinner";

        keepAddingWrap.style.display = "flex";
        roomModalSubmit.textContent = "Save Room";

        roomModal.classList.add("is-open");
        roomModal.setAttribute("aria-hidden", "false");
        document.body.classList.add("scroll-locked");

        setTimeout(() => roomNumberInput.focus(), 100);
    }

    function openEditRoomModal(room) {
         roomModalSubmit.disabled = false;
        editingRoomId = room._id;
        roomModalTitle.textContent = `Edit Room ${room.roomNumber}`;
        roomModalError.style.display = "none";
        roomModalErrorText.textContent = "";

        roomNumberInput.value = room.roomNumber || "";
        roomFloorSelect.value = String(room.floor || 1);
        roomCapacitySelect.value = String(room.capacity || 2);
        roomAmenitiesInput.value = Array.isArray(room.amenities) ? room.amenities.join(", ") : "";

        keepAddingWrap.style.display = "none";
        roomModalSubmit.textContent = "Update Room";

        roomModal.classList.add("is-open");
        roomModal.setAttribute("aria-hidden", "false");
        document.body.classList.add("scroll-locked");

        setTimeout(() => roomNumberInput.focus(), 100);
    }

    function closeRoomModal() {
        roomModal.classList.remove("is-open");
        roomModal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("scroll-locked");
        editingRoomId = null;
    }

    async function handleRoomFormSubmit(e) {
    e.preventDefault();
    roomModalError.style.display = "none";
    roomModalErrorText.textContent = "";

    const roomNumber = roomNumberInput.value.trim();
    const floor = Number(roomFloorSelect.value);
    const capacity = Number(roomCapacitySelect.value);

    const amenities = roomAmenitiesInput.value
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

    if (!roomNumber) {
        roomModalErrorText.textContent = "Room number is required.";
        roomModalError.style.display = "flex";
        roomNumberInput.focus();
        return;
    }

    if (![2, 3, 4, 5].includes(capacity)) {
        roomModalErrorText.textContent = "Capacity must be 2, 3, 4, or 5.";
        roomModalError.style.display = "flex";
        return;
    }

    const roomId = editingRoomId; // save it BEFORE any close call
    const isEdit = Boolean(roomId);

    roomModalSubmit.disabled = true;
    roomModalSubmit.textContent = "Saving...";

    const payload = { roomNumber, floor, capacity, amenities };

    try {
        if (isEdit) {
            const updated = await window.API.updateRoom(roomId, payload);
            const idx = roomsCache.findIndex((r) => r._id === roomId);
            if (idx !== -1 && updated) roomsCache[idx] = updated;
            closeRoomModal();
            renderFloors(roomsCache);
            showToast(`Room ${updated.roomNumber || roomNumber} updated successfully!`, "success");
        } else {
            const created = await window.API.createRoom(payload);
            if (created) {
                roomsCache.push(created);
                renderFloors(roomsCache);
            }
            showToast(`Room ${created.roomNumber || roomNumber} added successfully! Price: ${formatPrice(created.pricePerNight)}`, "success");

            if (keepAddingCheckbox.checked) {
                roomNumberInput.value = "";
                roomNumberInput.focus();
            } else {
                closeRoomModal();
            }
        }
        roomModalSubmit.disabled = false;
        roomModalSubmit.textContent = isEdit ? "Update Room" : "Save Room";
    } catch (err) {
        roomModalErrorText.textContent = err.message || "Failed to save room.";
        roomModalError.style.display = "flex";
        roomModalSubmit.disabled = false;
        roomModalSubmit.textContent = isEdit ? "Update Room" : "Save Room";
    }
}

    // BLOCK DATES WORKFLOW
    function openBlockModal(room) {
        blockModalSubmit.disabled = false;
        blockModalSubmit.textContent = "Confirm Block";
        activeBlockRoomId = room._id;
        blockModalTitle.textContent = `Block Dates for Room ${room.roomNumber}`;
        blockRoomInfo.textContent = `Room ${room.roomNumber} · Floor ${room.floor} · Capacity ${room.capacity}`;
        
        blockModalError.style.display = "none";
        blockModalErrorText.textContent = "";

        const today = todayISO();
        const tomorrow = addDaysISO(today, 1);
        blockFromInput.min = today;
        blockFromInput.value = today;

        blockToInput.min = tomorrow;
        blockToInput.value = tomorrow;

        blockReasonInput.value = "";

        blockModal.classList.add("is-open");
        blockModal.setAttribute("aria-hidden", "false");
        document.body.classList.add("scroll-locked");

        setTimeout(() => blockReasonInput.focus(), 100);
    }

    function closeBlockModal() {
        blockModal.classList.remove("is-open");
        blockModal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("scroll-locked");
        activeBlockRoomId = null;
    }

    async function handleBlockFormSubmit(e) {
    e.preventDefault();
    blockModalError.style.display = "none";
    blockModalErrorText.textContent = "";

    const from = blockFromInput.value;
    const to = blockToInput.value;
    const reason = blockReasonInput.value.trim();

    if (!from || !to) {
        blockModalErrorText.textContent = "Please select both from and to dates.";
        blockModalError.style.display = "flex";
        return;
    }

    if (to <= from) {
        blockModalErrorText.textContent = "'To' date must be after 'From' date.";
        blockModalError.style.display = "flex";
        return;
    }

    const roomId = activeBlockRoomId; // save it BEFORE closing

    blockModalSubmit.disabled = true;
    blockModalSubmit.textContent = "Blocking...";

    try {
        const updatedRoom = await window.API.addBlock(roomId, { from, to, reason });
        const idx = roomsCache.findIndex((r) => r._id === roomId);
        if (idx !== -1 && updatedRoom) roomsCache[idx] = updatedRoom;
        closeBlockModal();
        renderFloors(roomsCache);
        showToast("Blackout period added successfully!", "success");
    } catch (err) {
        blockModalErrorText.textContent = err.message || "Failed to block dates.";
        blockModalError.style.display = "flex";
    } finally {
        blockModalSubmit.disabled = false;
        blockModalSubmit.textContent = "Confirm Block";
    }
}

    // REMOVE BLOCK WORKFLOW
    function promptRemoveBlock(room, block) {
        deleteConfirmProceed.disabled = false;
        pendingDeleteAction = {
            type: "block",
            roomId: room._id,
            blockId: block._id,
            label: `${formatDate(block.from)} to ${formatDate(block.to)}`
        };

        deleteConfirmTitle.textContent = "Remove Blackout Period";
        deleteConfirmMessage.textContent = `Are you sure you want to remove the blocked period (${pendingDeleteAction.label}) for Room ${room.roomNumber}?`;
        deleteConfirmError.style.display = "none";
        deleteConfirmErrorText.textContent = "";

        deleteConfirmProceed.className = "btn btn-danger";
        deleteConfirmProceed.textContent = "Yes, Remove Block";

        deleteConfirmModal.classList.add("is-open");
        deleteConfirmModal.setAttribute("aria-hidden", "false");
        document.body.classList.add("scroll-locked");
    }

    // DELETE ROOM WORKFLOW
    function promptDeleteRoom(room) {
        deleteConfirmProceed.disabled = false; 
        pendingDeleteAction = {
            type: "room",
            roomId: room._id,
            label: `Room ${room.roomNumber}`
        };

        deleteConfirmTitle.textContent = `Delete ${pendingDeleteAction.label}`;
        deleteConfirmMessage.textContent = `Are you sure you want to permanently delete Room ${room.roomNumber} (Floor ${room.floor})?`;
        deleteConfirmError.style.display = "none";
        deleteConfirmErrorText.textContent = "";

        deleteConfirmProceed.className = "btn btn-danger";
        deleteConfirmProceed.textContent = "Delete Room";

        deleteConfirmModal.classList.add("is-open");
        deleteConfirmModal.setAttribute("aria-hidden", "false");
        document.body.classList.add("scroll-locked");
    }

    function closeDeleteConfirmModal() {
        deleteConfirmModal.classList.remove("is-open");
        deleteConfirmModal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("scroll-locked");
        pendingDeleteAction = null;
    }

    async function handleExecuteDelete() {
    if (!pendingDeleteAction) return;

    const action = pendingDeleteAction; // local copy, survives the close call
    const defaultLabel = action.type === "block" ? "Yes, Remove Block" : "Delete Room";

    deleteConfirmProceed.disabled = true;
    deleteConfirmProceed.textContent = "Deleting...";

    try {
        if (action.type === "block") {
            const updatedRoom = await window.API.removeBlock(action.roomId, action.blockId);
            const idx = roomsCache.findIndex((r) => r._id === action.roomId);
            if (idx !== -1) {
                if (updatedRoom && updatedRoom._id) {
                    roomsCache[idx] = updatedRoom;
                } else if (Array.isArray(roomsCache[idx].blockedPeriods)) {
                    roomsCache[idx].blockedPeriods = roomsCache[idx].blockedPeriods.filter(
                        (b) => b._id !== action.blockId
                    );
                }
            }
            closeDeleteConfirmModal();
            renderFloors(roomsCache);
            showToast("Blocked period removed.", "success");
        } else {
            await window.API.deleteRoom(action.roomId);
            roomsCache = roomsCache.filter((r) => r._id !== action.roomId);
            closeDeleteConfirmModal();
            renderFloors(roomsCache);
            showToast(`${action.label} was deleted.`, "success");
        }
    } catch (err) {
        // e.g. 409: room has bookings. Keep the modal open and show the message.
        deleteConfirmErrorText.textContent = err.message || "Failed to complete deletion.";
        deleteConfirmError.style.display = "flex";
    } finally {
        deleteConfirmProceed.disabled = false;
        deleteConfirmProceed.textContent = defaultLabel;
    }
}

    // Init on DOM ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
