import { getPusher } from "./pusherClient";
import { fetchPost } from '../utils/fetchUtil';

class CollaborationManager {
    constructor(collabName) {
        this.collabName = collabName;

        this.pusher = getPusher();
        
        this.pusher.bind("new-operation", (data) => {
            const type = data.type;
            const details = data.details;
            console.log(type, details);
        })
    }
    
    subscribe() {
        this.channel = this.pusher.subscribe(`private-${this.collabName}`);
        return new Promise((resolve, reject) => {
            this.channel.bind("pusher:subscription_succeeded", () => {
                resolve();
            })
            this.channel.bind("pusher:subscription_error", (err) => {
                reject(err);
            })
        })
    }

    send(type, details, others) {
        // check type for enum

        const payload = {
            collabName: this.collabName,
            operationType: type,
            details,
            operation_part: others?.operation_part || 1,
            operation_max_part: others?.operation_max_part || 1,
            socket_id: this.pusher.connection.socket_id,
        }

        fetchPost("/api/operations/log", payload)
        .then(data => {
            console.log(data);
        })
    }
}

export default CollaborationManager