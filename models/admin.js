const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
        maxlength: 254,
    },
    // bcrypt hash (the password length rule is checked before hashing, in seed.js)
    password: {
        type: String,
        required: true,
    },
});

module.exports = mongoose.model("admin", adminSchema);
