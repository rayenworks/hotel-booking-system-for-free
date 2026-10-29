// Re-applies the prices from config/pricing.js to every room. Run with:  npm run update-prices
require("dotenv").config();
require("./config/dns");
const mongoose = require("mongoose");
const Room = require("./models/room");
const PRICES = require("./config/pricing");

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        for (const [capacity, price] of Object.entries(PRICES)) {
            const result = await Room.updateMany(
                { capacity: Number(capacity) },
                { pricePerNight: price }
            );
            console.log(`capacity ${capacity}: ${result.modifiedCount} rooms set to ${price}`);
        }
    } catch (err) {
        console.error("Update failed:", err.message);
    } finally {
        await mongoose.disconnect();
    }
}

run();
