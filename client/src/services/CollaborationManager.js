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

        /* ------------------------- New operation listener ------------------------- */
        this.pusher.bind("new-operation", async (data) => {
            console.log("new operation received");
            const type = data.type;
            const details = data.details;
            
            switch (type) {
                case "add":
                    taskManager.addTask({
                        value: details.value,
                        parentId: details.parentId,
                        fromUI: false
                    });
                    break;

                case "update":
                    console.log(details.taskId);
                    
                    if (details.type === "name") {
                        let task = await taskManager.getTaskById(details.taskId);
                        taskManager.changeTaskName(task, details.newName, false);
                    }
                    else if (details.type === "description") {
                        let task = await taskManager.getTaskById(details.taskId);
                        taskManager.updateDescription(task, details.newDescription, false);
                    }
                    else if (details.type === "drag") taskManager.fixFlexIndexesAndSetStatus({
                        draggedTaskId: details.taskId,
                        newStatus: details.newStatus,
                        newFlexIndex: details.newFlexIndex
                    });
                    break;
                
                case "delete":
                    taskManager.removeTask({ taskId: details.taskId, fromUI: false })
                    break;
            }
        })

        // TODO: make this bind only after subscribtion and making sure this user is up to date
        // answer for asking for current tasks version
        this.pusher.bind("asked-for-current-version", () => {
            console.log("asked for current version");
            const payload = {
                type: "establish-connection",
                collabName: this.collabName,
                socket_id: this.pusher.connection.socket_id
            }
            fetchPost("/api/request-current", payload)
            .then(async () => { // connection established

                // Get local tasks
                const tasksInCollab = await taskManager.indexedDBManager.getTasksByCollabName(this.collabName)  // TODO: compress it
                
                const payload = {
                    type: "send-current-version",
                    collabName: this.collabName,
                    socket_id: this.pusher.connection.socket_id,
                    tasks: tasksInCollab
                }
                fetchPost("/api/request-current", payload)
                .catch(err => { // something went wrong
                    console.log(err);
                })
                
                
            })
            .catch(err => { // someone was first or something went wrong
                console.log(err);
            })
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

    requestCurrentVersion() {
        console.log("requesting current version...");
        const payload = {
            type: "get-current-version",
            collabName: this.collabName,
            socket_id: this.pusher.connection.socket_id,
        }
        fetchPost("/api/request-current", payload)
        .then(serverResData => {

            return new Promise((resolve, reject) => {

                if (serverResData.ok) { // someone may provide current version - listen for it
                        this.channel.bind("get-current-version", pusherData => {
                            this.channel.unbind("get-current-version");
                
                            if ( !pusherData.ok && pusherData.nooneOnline ) {
                                reject({nooneOnline: true});
                            }
                            resolve(pusherData);
                        })
                    
                } else {
                    if (serverResData.message === "Noone to provide current version") {
                        reject({ nooneOnline: true });
                    }
                }

            })
            
        })
        .then(data => {
            console.log("--------------------------------------------------");
            console.log("Current version:");
            console.log(data);
            console.log("--------------------------------------------------");
        })
        .catch(err => {

            if (err.nooneOnline) {
                console.log("Noone to provide current version");

            } else { // unhandled
                console.log(err);
            }
        })

    }
}

export default CollaborationManager