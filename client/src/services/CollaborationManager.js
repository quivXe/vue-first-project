import { getPusher } from "./pusherClient";
import { fetchPost } from '../utils/fetchUtil';
import { setCookie, getCookie } from "../utils/cookieUtils";
import { importTasks } from "../utils/taskTransferUtils";

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

        /* ------------------------- New operation listener ------------------------- */
        this.pusher.bind("new-operation", async (data) => {
            console.log("new operation received");
            const type = data.type;
            const details = data.details;
            const timestamp = data.timestamp;
            
            this.handleOperation(type, details, taskManager);
            setCookie(`lastUpdate-${this.collabName}`, timestamp, { path: '/', expires: 365 });
        })

        // Answer for asking for current tasks version
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
                    tasks: tasksInCollab,
                    timestamp: getCookie(`lastUpdate-${this.collabName}`)
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

        const operation_part = 1;
        const operation_max_part = 1;
        const payload = {
            collabName: this.collabName,
            operationType: type,
            details,
            operation_part,
            operation_max_part,
            socket_id: this.pusher.connection.socket_id,
        }

        fetchPost("/api/operations/log", payload)
        .then(data => {
            console.log("logging output", data);
            let timestamp = data.createdAt;
            setCookie(`lastUpdate-${this.collabName}`, timestamp, { path: '/', expires: 365 });
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

    async getOperationsFromDatabase(taskManager, collabIndexedDBManager) { // TODO: deleting and updating doesnt seem to work 
        const lastUpdate = getCookie(`lastUpdate-${this.collabName}`);

        /* -- If there is no last update (first time launching this collaboration), - */
        /* ---------------- request current version from active users --------------- */
        if (!lastUpdate) {
            console.log("first time launch");
            await this.requestCurrentVersion(collabIndexedDBManager);
            return;
        }

        const payload = {
            collabName: this.collabName,
            timestamp: lastUpdate
        }

        fetchPost("/api/operations/get", payload)
        .then(data => {
            console.log(data);
            for (let operation of data.operations) {
                if (operation.operationType === "init") continue;
                this.handleOperation(operation.operationType, JSON.parse(operation.details), taskManager);
            }
        })
        .catch(async err => {
            if (err.status === 410) { // timestamp is not in the database
                console.log("timestamp is not in the database");
                await this.requestCurrentVersion(collabIndexedDBManager);
            } else {
                console.log("unknown error", err);
            }
        })
    }
    requestCurrentVersion(collabIndexedDBManager) {

        return new Promise((mainResolve, mainReject) => {

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
            .then(async data => {
                console.log("--------------------------------------------------");
                console.log("Current version:");
                console.log(data);
                console.log("--------------------------------------------------");

                setCookie(`lastUpdate-${this.collabName}`, data.timestamp, { path: '/', expires: 365 });
                const tasks = data.tasks;
                await importTasks(collabIndexedDBManager, tasks);
                mainResolve(data);
            })
            .catch(err => {
                if (err.nooneOnline) {
                    console.log("Noone to provide current version");
                    
                } else { // unhandled
                    console.log(err);
                }
                mainReject(err);
            })

            
        })

    }

    async handleOperation(type, details, taskManager) {
        console.log(type, details);
        switch (type) {
            case "add":
                taskManager.addTask({
                    value: details.value,
                    parentId: details.parentId,
                    collabTaskId: details.collabTaskId,
                    fromUI: false
                });
                break;
    
            case "update":
                
                if (details.type === "name") {
                    taskManager.changeTaskName({
                        taskId: details.taskId,
                        newName: details.newName,
                        fromUI: false 
                    });
                }
                else if (details.type === "description") {
                    taskManager.updateDescription({ 
                        taskId: details.taskId,
                        newDescription: details.newDescription,
                        fromUI: false
                    });
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

    }
}

export default CollaborationManager