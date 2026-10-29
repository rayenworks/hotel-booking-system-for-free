const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
    roomNumber: { type: String, required: true, unique: true, trim: true, maxlength: 10 },
    floor: { type: Number, required: true },
    capacity: { type: Number, required: true },
    pricePerNight: { type: Number, required: true },
    amenities: [{ type: String, trim: true, maxlength: 40 }],
    blockedPeriods: [
        {
            from: { type: Date, required: true },
            to: { type: Date, required: true },
            reason: { type: String, maxlength: 200 },
        },
    ],
});

module.exports = mongoose.model("room", roomSchema);
