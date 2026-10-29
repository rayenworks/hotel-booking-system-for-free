const Admin = require("../models/admin");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Used when the email doesn't exist, so the answer takes the same time either way
// (otherwise response speed would reveal which emails are real admins)
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body ?? {};

        if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        if (email.length > 254 || password.length > 128) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
        const match = await bcrypt.compare(password, admin ? admin.password : DUMMY_HASH);

        if (!admin || !match) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
            algorithm: "HS256",
            expiresIn: "8h",
        });
        res.json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
