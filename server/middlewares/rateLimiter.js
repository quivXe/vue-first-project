const rateLimit = require('express-rate-limit');

const createRateLimiter = (windowMs, max) => {
    return rateLimit({
        windowMs,
        max,
        message: { error: "Too many requests, please try again later" },
        standardHeaders: true,
        legacyHeaders: false
    });
};

module.exports = createRateLimiter;