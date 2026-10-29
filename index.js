require("dotenv").config();
const path = require("path");
const express = require("express");
const helmet = require("helmet");

// ---- Refuse to start with unsafe settings ----
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error("JWT_SECRET is missing or shorter than 32 characters");
    process.exit(1);
}
if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is missing");
    process.exit(1);
}

const connectDB = require("./config/db");
const { apiLimiter } = require("./middlewares/rateLimiters");
const { notFoundApi, errorHandler } = require("./middlewares/errorHandlers");

const isProd = process.env.NODE_ENV === "production";
const app = express();

// How many proxies sit in front of the app (Render, Heroku... = 1; local = 0).
// Without this, every visitor looks like the same IP and rate limits hit everyone at once.
app.set("trust proxy", Number(process.env.TRUST_PROXY ?? (isProd ? 1 : 0)));

// ---- Security headers ----
app.use(
    helmet({
        contentSecurityPolicy: {
            useDefaults: true,
            directives: {
                "default-src": ["'self'"],
                "script-src": ["'self'"], // no inline scripts allowed
                "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                "font-src": ["'self'", "https://fonts.gstatic.com"],
                "img-src": ["'self'", "data:"],
                "connect-src": ["'self'"],
                "object-src": ["'none'"],
                "base-uri": ["'self'"],
                "form-action": ["'self'"],
                "frame-ancestors": ["'none'"],
                // keep http://localhost working while developing
                "upgrade-insecure-requests": isProd ? [] : null,
            },
        },
    })
);

app.use(express.json({ limit: "10kb" }));

// ---- API ----
app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store"); // never cache bookings or tokens
    next();
});
app.use("/api", apiLimiter);
app.use("/api/admin", require("./routes/adminroutes"));
app.use("/api/rooms", require("./routes/roomroutes"));
app.use("/api/bookings", require("./routes/bookingroutes"));
app.use("/api", notFoundApi);

// ---- Website files ----
app.use(express.static(path.join(__dirname, "public")));

app.use(errorHandler);

// Start only when run directly (node index.js), so tests can import `app` safely
if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    connectDB().then(() => {
        app.listen(PORT, () => console.log(`server running on ${PORT}`));
    });
}

module.exports = app;
