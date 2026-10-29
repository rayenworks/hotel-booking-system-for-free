const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
    {
        guestName: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
        phone: { type: String, required: true, trim: true, maxlength: 20 },
        checkIn: { type: Date, required: true },
        checkOut: { type: Date, required: true },
        guests: { type: Number, min: 1, required: true },
        room: { type: mongoose.Schema.Types.ObjectId, ref: "room", required: true },
        status: {
            type: String,
            enum: ["pending", "confirmed", "cancelled"],
            default: "pending",
        },
    },
    // timestamps adds createdAt/updatedAt. utils/availability.js NEEDS createdAt
    // to know when a pending booking is older than 48h.
    { timestamps: true }
);

// Speeds up the "is this room free?" queries
bookingSchema.index({ room: 1, status: 1, checkIn: 1, checkOut: 1 });

module.exports = mongoose.model("booking", bookingSchema);
