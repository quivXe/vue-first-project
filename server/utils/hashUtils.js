const bcrypt = require('bcrypt');
const saltRounds = 10;

/**
 * Hashes a plaintext password using bcrypt.
 *
 * This function generates a hashed version of the provided password.
 *
 * @param {string} password - The plaintext password to be hashed.
 * @returns {Promise<string>} - A promise that resolves to the hashed password.
 * @throws {Error} If an error occurs while hashing the password.
 * 
 * @example
 * const hashedPassword = await hashPassword('myPlaintextPassword');
 */
const hashPassword = async (password) => {
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    } catch (error) {
        throw new Error('Error hashing password');
    }
};

/**
 * Compares a plaintext password with a hashed password.
 *
 * This function checks if the provided plaintext password matches the hashed password.
 *
 * @param {string} plaintextPassword - The plaintext password to compare.
 * @param {string} hashedPassword - The previously hashed password to compare against.
 * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating whether the passwords match.
 * @throws {Error} If an error occurs while comparing the passwords.
 * 
 * @example
 * const isMatch = await comparePasswords('myPlaintextPassword', hashedPassword);
 */
const comparePasswords = async (plaintextPassword, hashedPassword) => {
    try {
        const isMatch = await bcrypt.compare(plaintextPassword, hashedPassword);
        return isMatch;
    } catch (error) {
        throw new Error('Error comparing passwords');
    }
};

module.exports = { hashPassword, comparePasswords };
