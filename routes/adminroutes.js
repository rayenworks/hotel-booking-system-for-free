const express = require("express");
const router = express.Router();
const { login } = require("../controllers/admincontroller");
const { loginLimiter } = require("../middlewares/rateLimiters");

router.post("/login", loginLimiter, login);

module.exports = router;
