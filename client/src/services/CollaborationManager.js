import { getPusher } from "./pusherClient";
import { fetchPost } from '../utils/fetchUtil';
import TaskManager from "./TaskManager";

class CollaborationManager {
    constructor(collabName) {
        this.collabName = collabName;

        this.pusher = getPusher();

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

    /**
     * 
     * @param {TaskManager} taskManager 
     */
    bind(taskManager) {
        console.log("binding...")
        this.pusher.bind("new-operation", async (data) => {
            console.log("new operation received");
            const type = data.type;
            const details = data.details;
            
            switch (type) {
                case "add":
                    taskManager.addTask(details.value, details.parentId, true, false);
                    break;

                case "update":
                    console.log(details.taskId);
                    let task = await taskManager.getTaskById(details.taskId);
                    
                    if (details.type === "name") taskManager.changeTaskName(task, details.newName, false);
                    else if (details.type === "description") taskManager.updateDescription(task, details.newDescription, false);
                    else if (details.type === "status") taskManager.updateStatus(task, details.newStatus, false);
                    break;
                
                case "delete":
                    taskManager.removeTask(details.taskId, true, false)
                    break;
            }
        })
    }
    send(type, details, others) {
        if (type !== "add" && type !== "update" && type !== "delete") {
            return;
        }

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
            console.log("logging output", data);
            let timestamp = data.createdAt;
        })
        .catch(err => {
            this.handleError(err);
        })
    }

    handleError(err) {
        switch (err.status) {
            case 422:
                console.warn("Invalid operationType");
                break;
            default:
                console.log(err);
        }
    }
}

export default CollaborationManager