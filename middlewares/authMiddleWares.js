const jwt = require("jsonwebtoken");
const Admin = require("../models/admin");

// Returns the admin's id if the token is valid AND the admin still exists, otherwise null
async function getAdminId(req) {
    const header = req.headers.authorization;
    if (typeof header !== "string" || !header.startsWith("Bearer ")) return null;

    const token = header.slice(7).trim();
    if (!token) return null;

    let decoded;
    try {
        // Only accept the algorithm we sign with (blocks "alg" tricks)
        decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    } catch (err) {
        return null;
    }
    if (!decoded || typeof decoded.id !== "string") return null;

    try {
        const stillExists = await Admin.exists({ _id: decoded.id });
        return stillExists ? decoded.id : null;
    } catch (err) {
        if (err.name === "CastError") return null;
        throw err; // real database problem -> error handler (500)
    }
}

// Admin-only routes: no valid token = 401
const authMiddleware = async (req, res, next) => {
    const adminId = await getAdminId(req);
    if (!adminId) {
        return res.status(401).json({ message: "Invalid or missing token" });
    }
    req.adminId = adminId;
    next();
};

// Public routes that show extra data to admins: never blocks, just sets req.adminId if logged in
const optionalAuth = async (req, res, next) => {
    req.adminId = await getAdminId(req);
    next();
};

module.exports = authMiddleware;
module.exports.optionalAuth = optionalAuth;
