const rateLimit = require("express-rate-limit");

// Shared settings: send standard RateLimit-* headers, hide the old X-RateLimit-* ones
const base = { standardHeaders: true, legacyHeaders: false };

// General limit for every /api request (stops scraping and floods)
exports.apiLimiter = rateLimit({
    ...base,
    windowMs: 15 * 60 * 1000,
    limit: 300,
    message: { message: "Too many requests. Please slow down." },
});

// Admin login: only 5 FAILED tries per 15 minutes per IP (successful logins don't count)
exports.loginLimiter = rateLimit({
    ...base,
    windowMs: 15 * 60 * 1000,
    limit: 5,
    skipSuccessfulRequests: true,
    message: { message: "Too many login attempts. Try again in 15 minutes." },
});

// Public booking form: 5 requests per hour per IP
exports.bookingLimiter = rateLimit({
    ...base,
    windowMs: 60 * 60 * 1000,
    limit: 5,
    message: { message: "Too many booking requests. Try again later." },
});
