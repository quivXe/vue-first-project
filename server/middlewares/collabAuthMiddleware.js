
/**
 * This middleware checks if the user is authenticated and authorized to access
 * the specified collaboration. Checks if the session is initialized and if the
 * session's collabName matches the one provided in the request body. If the
 * checks pass, it calls next(), otherwise it sends a 440 Login Time-out.
 *
 * @param {Object} req - The request object containing the request data.
 * @param {Object} req.body - The request body containing the collaboration name. Either collabName or channel_name must be provided.
 * @param {string} [req.body.collabName] - The name of the collaboration the user trying to access.
 * @param {string} [req.body.channel_name] - The name of the channel the user is trying to access.
 * @param {Object} res - The response object used to send responses to the client.
 * @param {Function} next - A function to call the next middleware in the stack.
 */
exports.collabAuthMiddleware = (req, res, next) => {
    if (!req.session || !req.session.collabName) return res.status(440).json({ error: 'Login Time-out: You do not have permission to access this channel.' });
    else if (req.body.channel_name === `private-${req.session.collabName}`) next();
    else if (req.body.collabName === req.session.collabName) next();
    else res.status(440).json({ error: 'Login Time-out: You do not have permission to access this channel.' });
};
