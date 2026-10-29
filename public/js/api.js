/**
 * Unified API Client for Hotel Booking System
 */

(function () {
    const TOKEN_KEY = "adminToken";

    function getAdminToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    function setAdminToken(token) {
        if (token) {
            localStorage.setItem(TOKEN_KEY, token);
        } else {
            localStorage.removeItem(TOKEN_KEY);
        }
    }

    function clearAdminToken() {
        localStorage.removeItem(TOKEN_KEY);
    }

    /**
     * Unified fetch wrapper
     * @param {string} endpoint - e.g. "/api/rooms"
     * @param {object} options - fetch options
     */
    async function apiRequest(endpoint, options = {}) {
        const headers = {
            ...(options.headers || {})
        };

        const token = getAdminToken();
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        // Default content-type to application/json if sending a body
        if (options.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
            headers["Content-Type"] = "application/json";
            options.body = JSON.stringify(options.body);
        }

        let response;
        try {
            response = await fetch(endpoint, {
                ...options,
                headers
            });
        } catch (networkErr) {
            const friendlyErr = new Error("Unable to reach the hotel server. Please check your internet connection and try again.");
            friendlyErr.status = 0;
            friendlyErr.isNetworkError = true;
            throw friendlyErr;
        }

        // Handle 401 Unauthorized for admin requests
        if (response.status === 401) {
            clearAdminToken();
            // If currently on an admin page, redirect to login
            if (window.location.pathname.includes("/admin/") && !window.location.pathname.endsWith("/login.html")) {
                window.location.href = "/admin/login.html";
            }
        }

        // Attempt to parse JSON response
        let data = null;
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
            try {
                data = await response.json();
            } catch (jsonErr) {
                data = null;
            }
        } else {
            try {
                const text = await response.text();
                data = text ? { message: text } : null;
            } catch (tErr) {
                data = null;
            }
        }

        if (!response.ok) {
            const message = (data && data.message) ? data.message : `Request failed with status ${response.status}`;
            const err = new Error(message);
            err.status = response.status;
            err.data = data;
            throw err;
        }

        return data;
    }

    // API Helper Methods
    const API = {
        getToken: getAdminToken,
        setToken: setAdminToken,
        clearToken: clearAdminToken,

        // Public Customer API
        getAvailableRooms(checkIn, checkOut, guests) {
            const params = new URLSearchParams({
                checkIn,
                checkOut,
                guests: String(guests)
            });
            return apiRequest(`/api/rooms/available?${params.toString()}`, { method: "GET" });
        },

        createBooking(bookingData) {
            return apiRequest("/api/bookings", {
                method: "POST",
                body: bookingData
            });
        },

        // Admin Auth
        login(email, password) {
            return apiRequest("/api/admin/login", {
                method: "POST",
                body: { email, password }
            });
        },

        // Admin Bookings
        getBookings(status) {
            let endpoint = "/api/bookings";
            if (status && status !== "all") {
                endpoint += `?status=${encodeURIComponent(status)}`;
            }
            return apiRequest(endpoint, { method: "GET", cache: "no-store" });
        },

        updateBookingStatus(id, status) {
            return apiRequest(`/api/bookings/${id}/status`, {
                method: "PATCH",
                body: { status }
            });
        },

        // Rooms (Admin & Public read)
        getRooms() {
            return apiRequest("/api/rooms", { method: "GET", cache: "no-store" });
        },

        createRoom(roomData) {
            return apiRequest("/api/rooms", {
                method: "POST",
                body: roomData
            });
        },

        updateRoom(id, roomData) {
            return apiRequest(`/api/rooms/${id}`, {
                method: "PUT",
                body: roomData
            });
        },

        deleteRoom(id) {
            return apiRequest(`/api/rooms/${id}`, {
                method: "DELETE"
            });
        },

        addBlock(roomId, blockData) {
            return apiRequest(`/api/rooms/${roomId}/block`, {
                method: "POST",
                body: blockData
            });
        },

        removeBlock(roomId, blockId) {
            return apiRequest(`/api/rooms/${roomId}/block/${blockId}`, {
                method: "DELETE"
            });
        }
    };

    window.API = API;
})();
