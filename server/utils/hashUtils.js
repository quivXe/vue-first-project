const bcrypt = require('bcrypt');
const saltRounds = 10;

// Function to hash the password
const hashPassword = async (password) => {
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    } catch (error) {
        throw new Error('Error hashing password');
    }
};

// Function to compare a plaintext password with a hashed password
const comparePasswords = async (plaintextPassword, hashedPassword) => {
    try {
        const isMatch = await bcrypt.compare(plaintextPassword, hashedPassword);
        return isMatch;
    } catch (error) {
        throw new Error('Error comparing passwords');
    }
};

module.exports = { hashPassword, comparePasswords };