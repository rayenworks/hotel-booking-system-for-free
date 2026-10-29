// Input checks used by the controllers.
// Every helper returns the CLEAN value, or null when the input is not acceptable.
const PRICES = require("../config/pricing");

const MAX_NIGHTS = 30;
const MAX_ADVANCE_DAYS = 365;
const MAX_GUESTS = 12;
const MAX_FLOOR = 4;
const DAY = 24 * 60 * 60 * 1000;

exports.MAX_GUESTS = MAX_GUESTS;

// A MongoDB id is exactly 24 hex characters (a string, never an object)
exports.isId = (v) => typeof v === "string" && /^[0-9a-fA-F]{24}$/.test(v);

// Only real date strings like "2027-01-10" or "2027-01-10T10:00:00Z".
// Anything else (numbers, objects, "12") gives an invalid Date.
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})?)?$/;
exports.parseDate = (v) =>
    typeof v === "string" && DATE_PATTERN.test(v) ? new Date(v) : new Date(NaN);

// Returns an error message, or null when the stay is fine
exports.stayError = (checkIn, checkOut) => {
    if (isNaN(checkIn) || isNaN(checkOut)) return "Valid checkIn and checkOut dates are required";
    if (checkOut <= checkIn) return "checkOut must be after checkIn";
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (checkIn < today) return "checkIn can't be in the past";
    if (checkIn - today > MAX_ADVANCE_DAYS * DAY) return `Bookings can be made at most ${MAX_ADVANCE_DAYS} days ahead`;
    if ((checkOut - checkIn) / DAY > MAX_NIGHTS) return `Maximum stay is ${MAX_NIGHTS} nights`;
    return null;
};

// capacity must be a key of PRICES (2, 3, 4, 5). Object.hasOwn blocks "constructor", "toString"...
exports.capacityAndPrice = (value) => {
    if (typeof value !== "number" && typeof value !== "string") return null;
    const capacity = Number(value);
    if (!Number.isInteger(capacity) || !Object.hasOwn(PRICES, capacity)) return null;
    return { capacity, price: PRICES[capacity] };
};

const wholeNumber = (v, min, max) => {
    if (typeof v !== "number" && typeof v !== "string") return null;
    const n = Number(v);
    return Number.isInteger(n) && n >= min && n <= max ? n : null;
};

exports.cleanGuests = (v) => wholeNumber(v, 1, MAX_GUESTS);
exports.cleanFloor = (v) => wholeNumber(v, 1, MAX_FLOOR);

exports.cleanName = (v) =>
    typeof v === "string" && v.trim().length >= 2 && v.trim().length <= 80 ? v.trim() : null;

exports.cleanPhone = (v) => {
    if (typeof v !== "string") return null;
    const p = v.trim();
    if (p.length > 20 || !/^\+?[0-9\s\-()]+$/.test(p)) return null;
    const digits = p.replace(/\D/g, "").length;
    return digits >= 8 && digits <= 15 ? p : null;
};

// Letters, numbers, space, dot, dash, underscore. 1-10 characters.
exports.cleanRoomNumber = (v) => {
    if (typeof v !== "string") return null;
    const s = v.trim();
    return /^[A-Za-z0-9 ._-]{1,10}$/.test(s) ? s : null;
};

// Missing = empty list. Otherwise: an array of up to 20 short strings.
exports.cleanAmenities = (v) => {
    if (v === undefined || v === null) return [];
    if (!Array.isArray(v) || v.length > 20) return null;
    const out = [];
    for (const item of v) {
        if (typeof item !== "string") return null;
        const s = item.trim();
        if (s.length > 40) return null;
        if (s) out.push(s);
    }
    return out;
};

// Optional text up to 200 characters
exports.cleanReason = (v) => {
    if (v === undefined || v === null || v === "") return "";
    if (typeof v !== "string" || v.trim().length > 200) return null;
    return v.trim();
};
