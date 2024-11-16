import { getPusher } from "./pusherClient";
import apiClient from '../utils/fetchUtil';
import { setCookie, getCookie } from "../utils/cookieUtils";
import { importTasks } from "../utils/taskTransferUtils";
import { handleFetchError, redirect } from "../utils/handleErrorUtil";

class CollaborationManager {
    constructor(collabName) {
        this.collabName = collabName;

        try {
            this.pusher = getPusher();
        }
        catch (error) {
            window.dispatchEvent(
                new CustomEvent("show-notification", {
                    detail: {
                        message: "Something went wrong, please try again."
                    }
                })
            );
            redirect("/join");
        }

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

    disconnect() {
        this.pusher.disconnect();
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

        /* --------------- Answer for asking for current tasks version -------------- */
        this.pusher.bind("asked-for-current-version", () => {

            const { url, json } = apiClient.versionConnectionRequest(this.collabName, this.pusher.connection.socket_id);
            json
            .then(async () => { // connection established
                // Get local tasks
                const tasksInCollab = await taskManager.indexedDBManager.getTasksByCollabName(this.collabName)  // TODO: compress it
                let timestamp = getCookie(`lastUpdate-${this.collabName}`);

                const { url, json } = apiClient.provideCurrentVersion(this.collabName, this.pusher.connection.socket_id, tasksInCollab, timestamp)
                json
                .catch(err => { // something went wrong
                    console.log(err);
                    handleFetchError({ url: url, statusCode: err.status });
                })


            })
            .catch(err => { // someone was first or something went wrong
                console.log(err);
                handleFetchError({ url: url, statusCode: err.status });
            })
        })
    }
    send(type, details) {
        return new Promise((resolve, reject) => {

            if (type !== "add" && type !== "update" && type !== "delete") {
                reject("Provide correct type (add | update | delete)");
            }

            const { url, json } = apiClient.logOperation(this.collabName, type, details, {
                socket_id : this.pusher.connection.socket_id
            })

            json
            .then(data => {
                let timestamp = data.createdAt;
                setCookie(`lastUpdate-${this.collabName}`, timestamp, { path: '/', expires: 365 });
                resolve();
            })
            .catch(err => {
                reject({ err, url });
            })

        })
    }

    async getOperationsFromDatabase(taskManager, collabIndexedDBManager) {
        function handleRequestCurrentVersionError({nooneOnline, err, url}) {
            if (nooneOnline) {
                window.dispatchEvent(
                    new CustomEvent('show-notification', {
                        detail: "There is noone online. Please try again later."
                    })
                );
                redirect("/join");
            } else {
                handleFetchError({ url, status: err.status });
            }
        }


        const lastUpdate = getCookie(`lastUpdate-${this.collabName}`);

        /* -- If there is no last update (first time launching this collaboration), - */
        /* ---------------- request current version from active users --------------- */
        if (!lastUpdate) {

            try {

                await this.requestCurrentVersion(collabIndexedDBManager);
                return 1;

            } 
            catch (errDetails) {
                const { nooneOnline, err, url } = errDetails;

                if (url) {
                    handleRequestCurrentVersionError({nooneOnline, err, url});
                } else {

                    window.dispatchEvent(
                        new CustomEvent('show-notification', {
                            detail: "Something went wrong. Please try again."
                        })
                    )

                }
                return 0;
            }
        }


        const { url, json} = apiClient.getOperations(this.collabName, lastUpdate);
        try {
            const data = await json;
            let timestamp = null;
            for (let operation of data.operations) {
                if (operation.operationType === "init") continue;
                this.handleOperation(operation.operationType, JSON.parse(operation.details), taskManager);
                timestamp = operation.createdAt;
            }
            if (timestamp) setCookie(`lastUpdate-${this.collabName}`, timestamp, { path: '/', expires: 365 });

            return 1;
        }

        /* ------------------ Couldn't get operations from database ----------------- */
        catch(err) {
            if (err.status === 410) { // timestamp is not in the database

                try {
                    await this.requestCurrentVersion(collabIndexedDBManager);
                    return 1;
                }
                catch (errDetails) {
                    const { nooneOnline, err, url } = errDetails;

                    if (url) handleRequestCurrentVersionError({ nooneOnline, err, url });
                    else {

                        window.dispatchEvent(
                            new CustomEvent('show-notification', {
                                detail: "Something went wrong. Please try again"
                            })
                        )
                    }
                    return 0;
                }

            } else {
                handleFetchError({ url: url, statusCode: err.status });
            }

            return 0;
        }
    }

    requestCurrentVersion(collabIndexedDBManager) {
        return new Promise((mainResolve, mainReject) => {

            const { url, json } = apiClient.requestCurrentVersion(this.collabName, this.pusher.connection.socket_id)
            json
                .then(serverResData => {

                    return new Promise((resolve, reject) => {

                        if (serverResData.ok) { // someone may provide current version - listen for it
                            this.channel.bind("get-current-version", pusherData => {
                                this.channel.unbind("get-current-version");

                                if (!pusherData.ok && pusherData.nooneOnline) {
                                    reject({nooneOnline: true, err: null});
                                }
                                resolve(pusherData);
                            })

                        } else {
                            if (serverResData.message === "Noone to provide current version") {
                                reject({nooneOnline: true, err: null});
                            }
                        }

                    })

                })
                .then(async data => {

                    try {
                        // Delete previous tasks.
                        await collabIndexedDBManager.deleteObjectsByCollabName(this.collabName);
                        setCookie(`lastUpdate-${this.collabName}`, data.timestamp, {path: '/', expires: 365});
                        const tasks = data.tasks;
                        try {
                            // Import new tasks.
                            await importTasks(collabIndexedDBManager, tasks);
                            mainResolve(data);
                        } catch (err) { // Importing task error.
                            mainReject({err: err, type: 'import-task-error'});
                        }
                    } catch (err) { // Idb error.
                        mainReject({err: err, type: "idb-error"});
                    }

                })
                .catch((errorDetails) => { // err: {nooneOnline: true} OR http error while fetching
                    const { nooneOnline, err, url } = errorDetails;
                    mainReject({nooneOnline, err, url});
                });

            
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