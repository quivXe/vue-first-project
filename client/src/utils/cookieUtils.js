
// Cookie utility functions

/**
 * Sets a cookie with the specified name, value, and options.
 * 
 * @param {string} name - The name of the cookie.
 * @param {string} value - The value of the cookie.
 * @param {Object} [options] - Optional cookie attributes.
 * @param {number} [options.expires] - Number of days until the cookie expires.
 * @param {string} [options.path] - Path where the cookie is accessible.
 * @param {string} [options.domain] - Domain where the cookie is accessible.
 * @param {boolean} [options.secure] - Indicates if the cookie should only be transmitted over secure protocols.
 * @param {boolean} [options.httpOnly] - Indicates if the cookie is accessible only through the HTTP protocol.
 */
export function setCookie(name, value, options = {}) {
    let expires = '';

    if (options.expires) {
        const date = new Date();
        date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toUTCString();
    }

    const path = options.path ? '; path=' + options.path : '';
    const domain = options.domain ? '; domain=' + options.domain : '';
    const secure = options.secure ? '; secure' : '';
    const httpOnly = options.httpOnly ? '; HttpOnly' : '';

    document.cookie = name + '=' + (value || '') + expires + path + domain + secure + httpOnly;
}

/**
 * Retrieves the value of a cookie by its name.
 * 
 * @param {string} name - The name of the cookie to retrieve.
 * @returns {string|null} - The cookie value, or null if the cookie does not exist.
 */
export function getCookie(name) {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');

    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    
    return null; // Cookie not found
}
