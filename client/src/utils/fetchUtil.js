/**
 * Error object for responses that does not have header with Content-Type: application/json
 *
 * @class NotJsonResponseError
 * @extends {Error}
 */
class NotJsonResponseError extends Error {
    /**
     * Creates an instance of NotJsonResponseError.
     *
     * @constructor
     * @param {Response} res - response object when error occured
     */
    constructor(res) {
        let message = "Not JSON response body";
        super(message);

        this.response = res;
        this.type = "not-json-response";
    }
}

/**
 * Create fetch with POST method and application/json header. Handle response and return Promise with JSON content.
 * May throw NotJsonResponseError, when response is not of application/json type
 * This error has 'type' attribute with 'not-json-response' value
 *
 * @export
 * @async
 * @param {String} url
 * @param {object} payload
 * @returns {Promise<Object>}
 */
export async function fetchPost(url, payload) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    // Check if content type is JSON
    const contentType = res.headers.get("Content-Type");
    if (!contentType || !contentType.includes("application/json")) {
        throw new NotJsonResponseError(res);
    }

    if (!res.ok) {
        return res.json().then(errorData => {
            const error = new Error(errorData.error || "Unexpected error");
            error.status = res.status;
            throw error;
        });
    }

    return res.json();
}

/**
 * API Client for interacting with various endpoints of the application.
 * Provides methods for creating, joining collaborations, logging operations,
 * fetching version information, and more.
 *
 * @const {Object} apiClient
 */
const apiClient = {
    /**
     * Base URL for API requests
     * @type {string}
     * @default '/api'
     */
    baseUrl: '/api',

    /**
     * Helper function to make POST requests to the API and return URL + data.
     *
     * @param {string} endpoint - The API endpoint to call.
     * @param {object} payload - The request payload.
     * @returns {{url: string, json: Promise<Object>}} An object containing the URL and the request promise with data.
     */
    request(endpoint, payload) {
        const url = `${this.baseUrl}${endpoint}`;
        const jsonPromise = fetchPost(url, payload);

        // Return both the URL and the response data
        return { url, json: jsonPromise };
    },

    /**
     * Creates a new collaboration.
     *
     * @async
     * @param {string} collabName - The name of the collaboration.
     * @param {string} password - The password for the collaboration.
     * @returns {{url: string, json: Promise<Object>}} An object containing the URL and the request promise with data.
     */
    createCollaboration(collabName, password) {
        return this.request('/collaborations/create', { name: collabName, password });
    },

    /**
     * Joins an existing collaboration.
     *
     * @async
     * @param {string} collabName - The name of the collaboration.
     * @param {string} password - The password for the collaboration.
     * @returns {{url: string, json: Promise<Object>}} An object containing the URL and the request promise with data.
     */
    joinCollaboration(collabName, password) {
        return this.request('/collaborations/join', { name: collabName, password });
    },

    /**
     * Logs an operation in the collaboration.
     *
     * @async
     * @param {string} collabName - The name of the collaboration.
     * @param {string} operationType - The type of the operation. ('init', 'add', 'update', 'delete')
     * @param {Object} details - Details of the operation.
     * @param {Object} others - Other details of request.
     * @param {Number} [others.operation_part=1] - Operation's part when splitting
     * @param {Number} [others.operation_max_part=1] - Operation's number of parts when splitting
     * @param {string} [others.socket_id] - Pusher's socket_id
     * @returns {{url: string, json: Promise<Object>}} An object containing the URL and the request promise with data.
     */
    logOperation(collabName, operationType, details, others) {
        if (!others) others = {};
        let payload = {
            collabName,
            operationType,
            details,
            operation_part: others.operation_part || 1,
            operation_max_part: others.operation_max_part || 1,
        };
        payload.operation_part = others.operation_part === undefined ?
            1 :
            others.operation_part;
        payload.operation_max_part = others.operation_max_part === undefined ?
            1 :
            others.operation_max_part;
        if (others.socket_id) payload.socket_id = others.socket_id;
        return this.request('/operations/log', payload);
    },

    /**
     * Fetches operations for a collaboration.
     *
     * @async
     * @param {string} collabName - The name of the collaboration.
     * @param {string|null} [timestamp=null] - The timestamp to filter operations by.
     * @returns {{url: string, json: Promise<Object>}} An object containing the URL and the request promise with data.
     */
    getOperations(collabName, timestamp=null) {
        const payload = { collabName };
        if (timestamp) { payload.timestamp = timestamp }
        return this.request('/operations/get', payload);
    },

    /**
     * Requests the current version for a given collaboration.
     *
     * @async
     * @param {string} collabName - The name of the collaboration.
     * @param {string} socket_id - The socket ID of the user making the request.
     * @returns {{url: string, json: Promise<Object>}} An object containing the URL and the request promise with data.
     */
    requestCurrentVersion(collabName, socket_id) {
        return this.request('/version-controller/current-version', { collabName, socket_id });
    },

    /**
     * Establishes a connection to request the current version.
     *
     * @async
     * @param {string} collabName - The name of the collaboration.
     * @param {string} socket_id - The socket ID of the user.
     * @returns {{url: string, json: Promise<Object>}} An object containing the URL and the request promise with data.
     */
    versionConnectionRequest(collabName, socket_id) {
        return this.request('/version-controller/provide/establish-connection', { collabName, socket_id });
    },

    /**
     * Provides the current version for a given collaboration, including tasks.
     *
     * @async
     * @param {string} collabName - The name of the collaboration.
     * @param {string} socket_id - The socket ID of the user.
     * @param {Array} tasks - The tasks associated with the current version.
     * @param {string} timestamp - The timestamp of the version being provided.
     * @returns {{url: string, json: Promise<Object>}} An object containing the URL and the request promise with data.
     */
    provideCurrentVersion(collabName, socket_id, tasks, timestamp) {
        return this.request('/version-controller/provide', { collabName, socket_id, tasks, timestamp });
    }
}

export default apiClient;