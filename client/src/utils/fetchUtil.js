/**
 * Error object for responses that does not have header with Content-Type: application/json
 *
 * @class NotJsonResponseError
 * @typedef {NotJsonResponseError}
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
 * @param {JSON} payload
 * @returns {Promise<JSON>}
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
            throw new Error(errorData.error || "Unexpected error");
        });
    }

    return res.json();
}