// Creates the first admin account. Run once with:  npm run seed
require("dotenv").config();
require("./config/dns");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Admin = require("./models/admin");

async function seed() {
    try {
        const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
        if (!process.env.MONGO_URI) {
            console.log("Set MONGO_URI in .env");
            return;
        }
        if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) {
            console.log("Set ADMIN_EMAIL and an ADMIN_PASSWORD of 12+ characters in .env");
            return;
        }

        await mongoose.connect(process.env.MONGO_URI);

        const existing = await Admin.findOne();
        if (existing) {
            console.log("Admin already exists, nothing to do.");
            return;
        }

        const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);
        await Admin.create({ email: ADMIN_EMAIL, password: hashed });
        console.log("Admin created. Now DELETE ADMIN_PASSWORD from your .env file.");
    } catch (err) {
        console.error("Seed failed:", err.message);
    } finally {
        await mongoose.disconnect();
    }
}

seed();
