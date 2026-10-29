/**
 * Global Configuration for Hotel Booking System
 */
const CONFIG = {
    HOTEL_NAME: "Hotel Name",
    CURRENCY: "DZD",
    HOTEL_SERVICES: [
        "Free Wi-Fi",
        "Heating & air conditioning",
        "Free breakfast",
        "Free dinner"
    ],

    // Same limits as the server (utils/validate.js)
    MAX_NIGHTS: 30,
    MAX_ADVANCE_DAYS: 365
};

if (typeof window !== "undefined") {
    window.CONFIG = CONFIG;
}
