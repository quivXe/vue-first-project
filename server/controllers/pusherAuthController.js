// /server/controllers/pusherAuthController.js
const pusher = require('../config/pusher');

/**
 * Authorizes a user to access a private Pusher channel.
 *
 * This function validates the incoming request to ensure that the session is
 * initialized, the required parameters (socket_id and channel_name) are present,
 * and that the channel_name corresponds to the user's collaboration name.
 * If all checks pass, it uses the Pusher client to authorize the channel.
 * 
 * Handled response status codes:
 * 
 * 200 - Request successful; returns the authorization data for the channel.
 * 
 * 400 - Bad Request; either socket_id or channel_name is missing.
 * 
 * 401 - Unauthorized; the channel_name does not match the expected format.
 * 
 * 500 - Internal Server Error; session not initialized or other internal error occurred.
 * 
 * @async
 * @param {Object} req - The request object containing the request data.
 * @param {Object} req.body - The request body containing channel authorization details.
 * @param {string} req.body.socket_id - The socket ID of the user attempting to connect to the channel.
 * @param {string} req.body.channel_name - The name of the channel the user is trying to access.
 * @param {Object} res - The response object used to send responses to the client.
 * @param {Function} res.status - A function to set the HTTP status code for the response.
 * @returns {Promise<void>} Returns a promise that resolves when the response is sent.
 */
exports.channelAuth = async (req, res) => {
    const { socket_id, channel_name } = req.body;

    if (!req.session || !req.session.collabName) {
        return res.status(500).json({ error: 'Session has not been initialized. Please log in.' });
    }
    if (!socket_id || !channel_name) {
        return res.status(400).json({ error: 'Bad Request: socket_id and channel_name are required.' });
    }
    if (`private-${req.session.collabName}` !== channel_name) {
        return res.status(401).json({ error: 'Unauthorized: You do not have permission to access this channel.' });
    }

    const auth = pusher.authorizeChannel(socket_id, channel_name);
    return res.status(200).json(auth);
};