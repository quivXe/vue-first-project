// /server/controllers/versionController.js
const pusher = require('../config/pusher');

const openForResponse = {}; // TODO: maybe later add it to memcache


/**
 * This function handles requesting for current version.
 *
 * If anyone asked for it already, it returns http response 200 with informing message and ok: true.
 * If there is noone online in Pusher channel, it returns http response 200 with ok: false
 * If there is someone online, it returns http response 200 with ok: true and informing message.
 * There is a change that another subscribed user also does not have current version. It is handled by pusher event tho.
 *
 * Handled response status codes:
 * 
 * - 200 - Request successful - { ok: boolean, message: "Someone is already asking for current version" | "Noone to provide current version" | "Someone may provide current version" }
 * - 400 - Invalid request body.
 * - 500 - Internal Server Error
 *
 * @param {Object} req - The request object containing the request data.
 * @param {string} req.body.collabName - The name of the collaboration.
 * @param {string} req.body.socket_id - The socket ID of the user making the request.
 * @param {Object} res - The response object used to send responses to the client.
 * @returns {Promise<void>} Returns a promise that resolves when the response is sent.
 *
 */
exports.requestCurrentVersionController = async (req, res) => {
    const { collabName, socket_id } = req.body;

    if (!collabName || !socket_id) return res.status(400).json({ error: "Invalid request body" });

    if (openForResponse[collabName]) return res.status(200).json({ ok: true, message: "Someone is already asking for current version" });

    /* ------------------- Give access to establish connection ------------------ */
    openForResponse[collabName] = {
        isOpen: true,
        timeout: setTimeout(() => {
            clearTimeout(openForResponse[collabName].timeout);
            delete openForResponse[collabName];
            pusher.trigger(`private-${collabName}`, 'get-current-version', { ok: false, nooneOnline: true });
        }, 5000) // wait 5 seconds
    };

    try {
        /* -------------------------- Create Pusher trigger ------------------------- */
        const pusherRes = await pusher.trigger(
            `private-${collabName}`,
            "asked-for-current-version",
            {  },
            { info: "subscription_count", socket_id }
        );

        if (pusherRes.ok) {
            const data = await pusherRes.json();
            const subscriptionCount = data.channels[`private-${collabName}`].subscription_count;

            if (subscriptionCount <= 1) { // Speeds up response, if noone is really online
                clearTimeout(openForResponse[collabName].timeout);
                delete openForResponse[collabName];
                return res.status(200).json({ ok: false, message: "Noone to provide current version" });
            }

            return res.status(200).json({ ok: true, message: "Someone may provide current version" });

        } else {
            return res.status(500).json({ error: "Internal Server Error" });
        }
    } catch(e) {
        console.log("Error triggering pusher:", e);
        return res.status(500).json({ error: "Internal Server Error" });
    }

};

/**
 * This function handles establishing connection.
 * If someone asks for current collaboration version, it will first try to establish connection.
 * If its first establishment, http response 200 is sent.
 * If not, http response 409 is sent.
 *
 * @param req - The request data containing the request body.
 * @param {string} req.body.collabName - The name of the collaboration.
 * @param {string} req.body.socket_id - The socket ID of the user making the request.
 * @param res - The response object used to send responses to the client.
 * @returns {Promise<*>}
 */
exports.establishConnectionController = async (req, res) => {
    const { collabName, socket_id } = req.body;

    if ( !collabName || !socket_id ) return res.status(400).json({error: "Invalid request body."});

    if (openForResponse[collabName]?.isOpen) {
        openForResponse[collabName].isOpen = false;
        openForResponse[collabName].socket_id = socket_id;
        return res.status(200).json({ ok: true });
    } else {
        return res.status(409).json({error: "Data has already been provided"});
    }
}

/**
 * This function handles providing current version.
 * If user established connection first, he should send tasks and timestamp in request body.
 *
 * @param req - The request data containing the request body.
 * @param {string} req.body.collabName - The name of the collaboration.
 * @param {string} req.body.socket_id - The socket ID of the user making the request.
 * @param {import('../../client/src/services/TaskManager').Task[]} req.body.tasks - The tasks in the current version.
 * @param {number} req.body.timestamp - Current timestamp.
 * @param res - The response object used to send responses to the client.
 * @returns {Promise<*>}
 */
exports.provideCurrentVersionController = async (req, res) => {
    const { collabName, socket_id, tasks, timestamp } = req.body;

    if ( !collabName || !socket_id || !tasks || !timestamp ) return res.status(400).json({error: "Invalid request body."});

    if (openForResponse[collabName]?.isOpen) { return res.status(409).json({ error: "Establish connection first" }) }
    if (socket_id !== openForResponse[collabName].socket_id) return res.status(401).json({ error: "Wrong socket_id" });

    // Sent pusher event
    pusher.trigger(`private-${collabName}`, 'get-current-version', {ok: true, tasks, timestamp}, {socket_id}); // TODO: split it if needed, compress it

    // Clear openForResponse dict
    clearTimeout(openForResponse[collabName].timeout);
    delete openForResponse[collabName];

    return res.status(200).json({ ok: true });
}