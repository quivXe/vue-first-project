const session = require('express-session');
const MemcachedStore = require('connect-memjs')(session);

module.exports = session({
    key: "sid",
    secret: process.env.SESSION_SECRET,
    store: new MemcachedStore(),
    resave: false,
    saveUninitialized: false,
    rolling: true, // reset maxAge on every response
    cookie: {
        maxAge: 1800000, // session expires after 30 minutes of inactivity
        secure: false, // temp
        httpOnly: true,
        sameSite: 'Strict' // Ensures cookie is only sent in same-site requests
    } 
});