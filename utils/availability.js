const Room = require("../models/room");
const Booking = require("../models/booking");

const PENDING_HOLD_MS = 48 * 60 * 60 * 1000; // a pending booking holds a room for 48 hours

// "Active" = confirmed (holds the room for good) OR pending and younger than 48h
function activeBookingFilter() {
    const cutoff = new Date(Date.now() - PENDING_HOLD_MS);
    return {
        $or: [{ status: "confirmed" }, { status: "pending", createdAt: { $gt: cutoff } }],
    };
}

exports.findAvailableRooms = async (checkIn, checkOut, guests) => {
    const bookedRoomIds = await Booking.distinct("room", {
        ...activeBookingFilter(),
        checkIn: { $lt: checkOut },
        checkOut: { $gt: checkIn },
    });

    return Room.find({
        capacity: { $gte: guests },
        _id: { $nin: bookedRoomIds },
        blockedPeriods: {
            $not: { $elemMatch: { from: { $lt: checkOut }, to: { $gt: checkIn } } },
        },
    })
        .select({ blockedPeriods: 0 })
        .sort({ pricePerNight: 1 });
};

// Is there ANOTHER active booking for this room on these dates?
// Used right after saving, to catch two guests booking at the same moment.
exports.hasActiveOverlap = async (roomId, checkIn, checkOut, ignoreBookingId) => {
    const clash = await Booking.exists({
        ...activeBookingFilter(),
        _id: { $ne: ignoreBookingId },
        room: roomId,
        checkIn: { $lt: checkOut },
        checkOut: { $gt: checkIn },
    });
    return Boolean(clash);
};
