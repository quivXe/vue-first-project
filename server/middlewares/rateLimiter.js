const rateLimit = require('express-rate-limit');

/**
 * Request rate limiter
 *
 * This function creates a rate limiter middleware for Express applications.
 * It limits the number of requests from a client within a specified time window.
 * 
 * @param {number} windowMs - The time frame in milliseconds during which requests are counted.
 * @param {number} max - The maximum number of requests allowed within the specified time window.
 * @returns {RateLimitRequestHandler}
 */
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