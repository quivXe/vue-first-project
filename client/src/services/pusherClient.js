import Pusher from 'pusher-js';
Pusher.logToConsole = true; // temp

/**
 * Returns new Pusher instance.
 *
 * @export
 * @returns {Pusher}
 * 
 * @throws Will throw an error if initiation of Pusher instance will fail.
 */
export function getPusher() {
    try {
        return new Pusher('3c9b5a2b563681b87cb3', {
            cluster: 'eu',
            channelAuthorization: {
                endpoint: '/api/pusher/channel-auth',
            }
        });
    }
    catch (error) {
        console.warn("Error while creating Pusher instance.", error); // TODO: handle this somehow
        throw error;
    }
}
