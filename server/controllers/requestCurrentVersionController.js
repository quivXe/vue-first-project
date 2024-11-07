// /server/controllers/requestCurrentVersionController.js
const pusher = require('../config/pusher');

const openForResponse = {}; // TODO: maybe later add it to memcache


/**
 * This function handles collaboration current version requests.
 * 
 * It is responsible for triggering Pusher events to request current versions from other users in the same collaboration,
 * and for accepting and forwarding the current version to the requesting user.
 * It also handles the case where noone is online to provide the current version.
 *
 * Handled response status codes:
 * 
 * - 200 - Request successful - { ok: boolean, message: "Someone is already asking for current version" | "Noone to provide current version" | "Someone may provide current version" }
 * - 400 - Invalid request body.
 * - 409 - Data has already been provided / Establish connection first
 * - 500 - Internal Server Error; session not initialized or other internal error occurred.
 * 
 * Pusher events:
 * 
 * - "get-current-version" - message: { ok: boolean, nooneOnline: boolean }
 * - "asked-for-current-version" - message: {  }
 *
 * @param {Object} req - The request object containing the request data.
 * @param {string} req.body.type - The type of the request. One of "get-current-version", "establish-connection", "send-current-version".
 * @param {string} req.body.collabName - The name of the collaboration.
 * @param {string} req.body.socket_id - The socket ID of the user making the request.
 * @param {import('../../client/src/services/TaskManager').Task[]} [req.body.tasks] - The tasks in the current version. Only required for "send-current-version" requests.
 * @param {Object} res - The response object used to send responses to the client.
 * @returns {Promise<void>} Returns a promise that resolves when the response is sent.
 *
 */
exports.requestCurrentVersionController = async (req, res) => {
    const { type, collabName, socket_id } = req.body;

    // collabName, socket_id, ready, tasks
    if (!type || !collabName || !socket_id) return res.status(400).json({ error: "Invalid request body" });


    /* -------------------- User wants to get current version ------------------- */
    if (type === "get-current-version") {
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
                };
                
                return res.status(200).json({ ok: true, message: "Someone may provide current version" });

            } else {
                return res.status(500).json({ error: "Internal Server Error" });
            }
        } catch(e) {
            console.log("Error triggering pusher:", e);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    }

    /* ----- User wants to establish connection for sending current version ----- */
    else if (type === "establish-connection") {

        if (openForResponse[collabName]?.isOpen) {
            openForResponse[collabName].isOpen = false; 
            openForResponse[collabName].socket_id = socket_id;
            return res.status(200).json({ ok: true });
        } else {
            return res.status(409).json({ error: "Data has already been provided" });
        }
    }

    /* -------- User sends current version after establishing connection -------- */
    else if (type === "send-current-version") {
        if (openForResponse[collabName]?.isOpen) { return res.status(409).json({ error: "Establish connection first" }) };
        if (socket_id !== openForResponse[collabName].socket_id) return res.status(401).json({ error: "Wrong socket_id" });

        const { tasks, timestamp } = req.body;
        if (!tasks || !timestamp) return res.status(400).json({ error: "Invalid request body" });

        pusher.trigger(`private-${collabName}`, 'get-current-version', { ok: true, tasks, timestamp }, { socket_id }); // TODO: split it if needed, compress it
        clearTimeout(openForResponse[collabName].timeout);
        delete openForResponse[collabName];
        return res.status(200).json({ ok: true });
    }
};