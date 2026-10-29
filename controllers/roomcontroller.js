const Room = require("../models/room");
const Booking = require("../models/booking");
const { findAvailableRooms } = require("../utils/availability");
const {
    isId, parseDate, stayError, capacityAndPrice, cleanGuests, cleanFloor,
    cleanRoomNumber, cleanAmenities, cleanReason, MAX_GUESTS,
} = require("../utils/validate");

const SERVER_ERROR = { message: "Server error" };
const badId = (res) => res.status(400).json({ message: "Invalid id" });

// Public visitors must not see the admin's private block notes. Admins (valid token) do.
exports.getRooms = async (req, res) => {
    try {
        const query = Room.find();
        if (!req.adminId) query.select("-blockedPeriods");
        res.status(200).json(await query);
    } catch (err) {
        console.error(err);
        res.status(500).json(SERVER_ERROR);
    }
};

exports.getRoom = async (req, res) => {
    try {
        if (!isId(req.params.id)) return badId(res);
        const query = Room.findById(req.params.id);
        if (!req.adminId) query.select("-blockedPeriods");
        const room = await query;
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }
        res.status(200).json(room);
    } catch (err) {
        console.error(err);
        res.status(500).json(SERVER_ERROR);
    }
};

exports.createRoom = async (req, res) => {
    try {
        const body = req.body ?? {};
        const roomNumber = cleanRoomNumber(body.roomNumber);
        const floor = cleanFloor(body.floor);
        const cap = capacityAndPrice(body.capacity);
        const amenities = cleanAmenities(body.amenities);

        if (!roomNumber) return res.status(400).json({ message: "roomNumber must be 1 to 10 simple characters" });
        if (floor === null) return res.status(400).json({ message: "floor must be 1, 2, 3 or 4" });
        if (!cap) return res.status(400).json({ message: "capacity must be 2, 3, 4 or 5" });
        if (!amenities) return res.status(400).json({ message: "amenities must be a short list of short texts" });

        const room = await Room.create({
            roomNumber,
            floor,
            capacity: cap.capacity,
            amenities,
            pricePerNight: cap.price, // price always comes from the table
        });
        res.status(201).json(room);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: "Room number already exists" });
        }
        if (err.name === "ValidationError") {
            return res.status(400).json({ message: "Invalid room data" });
        }
        console.error(err);
        res.status(500).json(SERVER_ERROR);
    }
};

exports.updateRoom = async (req, res) => {
    try {
        if (!isId(req.params.id)) return badId(res);
        const body = req.body ?? {};

        // Only these 4 fields can be changed. Everything else in the body is ignored.
        const update = {};

        if (body.roomNumber !== undefined) {
            const v = cleanRoomNumber(body.roomNumber);
            if (!v) return res.status(400).json({ message: "roomNumber must be 1 to 10 simple characters" });
            update.roomNumber = v;
        }
        if (body.floor !== undefined) {
            const v = cleanFloor(body.floor);
            if (v === null) return res.status(400).json({ message: "floor must be 1, 2, 3 or 4" });
            update.floor = v;
        }
        if (body.capacity !== undefined) {
            const cap = capacityAndPrice(body.capacity);
            if (!cap) return res.status(400).json({ message: "capacity must be 2, 3, 4 or 5" });
            update.capacity = cap.capacity;
            update.pricePerNight = cap.price; // price always comes from the table
        }
        if (body.amenities !== undefined) {
            const v = cleanAmenities(body.amenities);
            if (!v) return res.status(400).json({ message: "amenities must be a short list of short texts" });
            update.amenities = v;
        }
        if (Object.keys(update).length === 0) {
            return res.status(400).json({ message: "Nothing to update" });
        }

        const room = await Room.findByIdAndUpdate(
            req.params.id,
            { $set: update },
            { returnDocument: "after", runValidators: true }
        );
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }
        res.status(200).json(room);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: "Room number already exists" });
        }
        if (err.name === "ValidationError") {
            return res.status(400).json({ message: "Invalid room data" });
        }
        console.error(err);
        res.status(500).json(SERVER_ERROR);
    }
};

exports.deleteRoom = async (req, res) => {
    try {
        if (!isId(req.params.id)) return badId(res);

        const hasBookings = await Booking.exists({ room: req.params.id });
        if (hasBookings) {
            return res.status(409).json({
                message: "This room has bookings and can't be deleted. Block it instead.",
            });
        }

        const room = await Room.findByIdAndDelete(req.params.id);
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }
        res.status(200).json({ message: "Room deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json(SERVER_ERROR);
    }
};

exports.addBlock = async (req, res) => {
    try {
        if (!isId(req.params.id)) return badId(res);
        const body = req.body ?? {};
        const start = parseDate(body.from);
        const end = parseDate(body.to);
        const reason = cleanReason(body.reason);

        if (isNaN(start) || isNaN(end) || end <= start) {
            return res.status(400).json({ message: "Valid 'from' and 'to' dates are required, and 'to' must be after 'from'" });
        }
        if (reason === null) {
            return res.status(400).json({ message: "reason must be 200 characters or less" });
        }

        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        // refuse if an active booking overlaps this period
        const conflict = await Booking.exists({
            room: room._id,
            status: { $in: ["pending", "confirmed"] },
            checkIn: { $lt: end },
            checkOut: { $gt: start },
        });
        if (conflict) {
            return res.status(409).json({ message: "A booking overlaps this period. Cancel or move it first." });
        }

        room.blockedPeriods.push({ from: start, to: end, reason });
        await room.save();
        res.status(201).json(room);
    } catch (err) {
        console.error(err);
        res.status(500).json(SERVER_ERROR);
    }
};

exports.removeBlock = async (req, res) => {
    try {
        if (!isId(req.params.id) || !isId(req.params.blockId)) return badId(res);

        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        const block = room.blockedPeriods.id(req.params.blockId);
        if (!block) {
            return res.status(404).json({ message: "Blocked period not found" });
        }

        room.blockedPeriods.pull(req.params.blockId);
        await room.save();
        res.status(200).json(room);
    } catch (err) {
        console.error(err);
        res.status(500).json(SERVER_ERROR);
    }
};

exports.getAvailableRooms = async (req, res) => {
    try {
        const checkIn = parseDate(req.query.checkIn);
        const checkOut = parseDate(req.query.checkOut);
        const guests = cleanGuests(req.query.guests);

        const dateError = stayError(checkIn, checkOut);
        if (dateError) {
            return res.status(400).json({ message: dateError });
        }
        if (guests === null) {
            return res.status(400).json({ message: `guests must be a whole number from 1 to ${MAX_GUESTS}` });
        }

        const rooms = await findAvailableRooms(checkIn, checkOut, guests);
        res.status(200).json(rooms);
    } catch (err) {
        console.error(err);
        res.status(500).json(SERVER_ERROR);
    }
};
