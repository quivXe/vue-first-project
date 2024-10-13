// /server/controllers/requestCurrentVersionController.js
const pusher = require('../config/pusher');

const openForResponse = {}; // TODO: maybe later add it to memcache

/**
 * Handles incoming requests for current collaboration version.
 *
 * Possible types of request:
 *
 * - `get-current-version`: User wants to get current version.
 *   - If someone is already asking for current version, returns 200 with message.
 *   - Otherwise, triggers `asked-for-current-version` event on channel to notify other users.
 *   - If there is no more than one subscriber, returns 204 with message.
 *   - Otherwise, returns 200. And wait for potential answer (if noone will answer in 10 seconds, trigger pusher event with `{ok: false, status: 204}`).
 *
 * - `establish-connection`: User wants to establish connection for sending current version.
 *   - If connection is already established, returns 409 with message.
 *   - Otherwise, sets user's socket_id as the one to contact when sending current version.
 *
 * - `send-current-version`: User sends current version after establishing connection.
 *   - If connection is not established, returns 409 with message.
 *   - If socket_id is wrong, returns 401 with message.
 *   - Otherwise, sends current version to other users, clears timeout and deletes from openForResponse.
 * 
 * @param {Object} req - The request object containing the request data.
 * @param {Object} req.body - The request body containing type, collabName, and socket_id.
 * @param {string} req.body.type - The type of the request ('get-current-version' | 'establish-connection' | 'send-current-version').
 * @param {string} req.body.collabName - The name of the collaboration.
 * @param {string} req.body.socket_id - The socket_id of the user.
 * @param {Object} res - The response object used to send responses to the client.
 * @returns {Promise<void>} Returns a promise that resolves when the response is sent.
 */
exports.requestCurrentVersionController = async (req, res) => {
    const { type, collabName, socket_id } = req.body;
    // collabName, socket_id, ready, tasks
    if (!type || !collabName || !socket_id) return res.status(400).json({ error: "Bad Request" });


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
            }, 10000) // wait 10 seconds 
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
    
                console.log("--------------------------------------------------");
                console.log(`Subscription count: ${subscriptionCount}`);
                console.log("--------------------------------------------------");
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

        console.log("socket id while establishing:", socket_id);
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

        const { tasks } = req.body;
        if (!tasks) return res.status(400).json({ error: "Bad Request" });

        pusher.trigger(`private-${collabName}`, 'get-current-version', { ok: true, tasks: tasks }, { socket_id }); // TODO: split it if needed, compress it
        clearTimeout(openForResponse[collabName].timeout);
        delete openForResponse[collabName];
        return res.status(200).json({ ok: true });
    }


};

// 409