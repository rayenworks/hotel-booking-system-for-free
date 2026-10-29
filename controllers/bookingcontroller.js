const Room = require("../models/room");
const Booking = require("../models/booking");
const { findAvailableRooms, hasActiveOverlap } = require("../utils/availability");
const {
    isId, parseDate, stayError, cleanGuests, cleanName, cleanPhone, MAX_GUESTS,
} = require("../utils/validate");

exports.createBooking = async (req, res) => {
    try {
        const body = req.body ?? {};
        const guestName = cleanName(body.guestName);
        const phone = cleanPhone(body.phone);
        const guests = cleanGuests(body.guests);
        const checkIn = parseDate(body.checkIn);
        const checkOut = parseDate(body.checkOut);

        if (!isId(body.room)) {
            return res.status(400).json({ message: "A valid room is required" });
        }
        if (!guestName) {
            return res.status(400).json({ message: "Please enter your full name (2 to 80 characters)" });
        }
        if (!phone) {
            return res.status(400).json({ message: "Please enter a valid phone number (8 to 15 digits)" });
        }
        const dateError = stayError(checkIn, checkOut);
        if (dateError) {
            return res.status(400).json({ message: dateError });
        }
        if (guests === null) {
            return res.status(400).json({ message: `guests must be a whole number from 1 to ${MAX_GUESTS}` });
        }

        const room = await Room.findById(body.room);
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }
        if (guests > room.capacity) {
            return res.status(400).json({ message: `This room fits at most ${room.capacity} guests` });
        }

        // Check availability right before saving, never trust the earlier search results
        const available = await findAvailableRooms(checkIn, checkOut, guests);
        const stillFree = available.some((r) => r._id.equals(room._id));
        if (!stillFree) {
            return res.status(409).json({ message: "Sorry, this room is no longer available for those dates" });
        }

        const booking = await Booking.create({
            room: room._id,
            guestName,
            phone,
            checkIn,
            checkOut,
            guests,
        });

        // Two guests can pass the check above at the same moment. So after saving we look
        // again: if another active booking overlaps, we remove ours. If two requests collide,
        // at worst both are refused (the guest simply tries again). Never both accepted.
        if (await hasActiveOverlap(room._id, checkIn, checkOut, booking._id)) {
            await Booking.deleteOne({ _id: booking._id });
            return res.status(409).json({ message: "Sorry, this room is no longer available for those dates" });
        }

        res.status(201).json(booking);
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ message: "Invalid booking data" });
        }
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

const VALID_STATUSES = ["pending", "confirmed", "cancelled"];

exports.getBookings = async (req, res) => {
    try {
        const filter = {};
        if (req.query.status !== undefined) {
            if (typeof req.query.status !== "string" || !VALID_STATUSES.includes(req.query.status)) {
                return res.status(400).json({ message: "status must be pending, confirmed or cancelled" });
            }
            filter.status = req.query.status;
        }

        const bookings = await Booking.find(filter)
            .populate("room", "roomNumber floor")
            .sort({ checkIn: 1 });

        res.status(200).json(bookings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.updateBookingStatus = async (req, res) => {
    try {
        const status = (req.body ?? {}).status;
        if (typeof status !== "string" || !VALID_STATUSES.includes(status)) {
            return res.status(400).json({ message: "status must be pending, confirmed or cancelled" });
        }
        if (!isId(req.params.id)) {
            return res.status(400).json({ message: "Invalid booking id" });
        }

        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.status === "cancelled" && status !== "cancelled") {
            return res.status(409).json({
                message: "Cancelled bookings can't be reactivated. Create a new booking instead.",
            });
        }

        // Never allow two CONFIRMED bookings for the same room and dates
        if (status === "confirmed" && booking.status !== "confirmed") {
            const clash = await Booking.exists({
                _id: { $ne: booking._id },
                room: booking.room,
                status: "confirmed",
                checkIn: { $lt: booking.checkOut },
                checkOut: { $gt: booking.checkIn },
            });
            if (clash) {
                return res.status(409).json({
                    message: "Another confirmed booking already uses this room for those dates.",
                });
            }
        }

        booking.status = status;
        await booking.save();
        res.status(200).json(booking);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
