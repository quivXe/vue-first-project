import router from "../router";
import { removeCookie } from "./cookieUtils";

function redirect(url, clearSession=true, timeout=500) {
    if (clearSession) { removeCookie("sid", {path: "/"}) }
    setTimeout(() => router.push(url), timeout);
}

export function handleFetchError(details) {
    
    /* ---------------------------- Too many requests --------------------------- */
    if (details.statusCode === 429) {
        window.dispatchEvent(
            new CustomEvent('show-notification', {
                detail: "Too many requests, please try again later."
            })
        );
        return;
    }
    switch (details.url) {

        case "/api/collaborations/create":

            /* --------------------------- Name already exists -------------------------- */
            if (details.statusCode === 409) {
                window.dispatchEvent(
                    new CustomEvent('show-notification', {
                        detail: "The collaboration name is taken."
                    })
                );
            }
            
            /* ------------------- Invalid characters or too long name ------------------ */
            /* ----------------- (shouldn't happen without breaking js) ----------------- */
            else if (details.statusCode === 422) {
                window.dispatchEvent(
                    new CustomEvent('show-notification', {
                        detail: "Don't use illegal characters."
                    })
                );
            }

            /* -------------------------- Initial server error -------------------------- */
            else if (details.statusCode === 500) {
                window.dispatchEvent(
                    new CustomEvent('show-notification', {
                        detail: "Something went wrong, please try again."
                    })
                );
            }

            /* -------------------------- Invalid request body -------------------------- */
            /* ----------------- (shouldn't happen without breaking js) ----------------- */
            else if (details.statusCode === 400) {
                window.dispatchEvent(
                    new CustomEvent('show-notification', {
                        detail: "Something went wrong, please try again."
                    })
                );
            }

            else {
                window.dispatchEvent(
                    new CustomEvent('show-notification', {
                        detail: "Something went wrong, please try again."
                    })
                );
            }


            break;

        case "/api/collaborations/join":

            /* ----------------------- Name or password incorrect ----------------------- */
            if (details.statusCode === 401) {
                window.dispatchEvent(
                    new CustomEvent('show-notification', {
                        detail: "Name or password incorrect."
                    })
                );
            }

            /* -------------------------- Invalid request body -------------------------- */
            /* ----------------- (shouldn't happen without breaking js) ----------------- */
            else if (details.statusCode === 400) {
                window.dispatchEvent(
                    new CustomEvent('show-notification', {
                        detail: "Something went wrong, please try again."
                    })
                );
            }

            /* -------------------------- Initial server error -------------------------- */
            else if (details.statusCode === 500) {
                window.dispatchEvent(
                    new CustomEvent('show-notification', {
                        detail: "Something went wrong, please try again."
                    })
                );
            }
            
            break;

        case "/api/operations/log":

            /* -------------------------- Invalid request body -------------------------- */
            /* ----------------- (shouldn't happen without breaking js) ----------------- */
            if (details.statusCode === 400) {
                window.dispatchEvent(
                    new CustomEvent('show-notification', {
                        detail: "Something went wrong, please try again."
                    })
                );
            }

            /* ----------------------------- Session expired ---------------------------- */
            else if (details.statusCode === 401) {
                window.dispatchEvent(
                    new CustomEvent('show-notification', {
                        detail: "Session expired, please log in again."
                    })
                );
                redirect("/join");
            }
            
            /* ------------------------- Invalid operation type ------------------------- */
            /* ----------------- (shouldn't happen without breaking js) ----------------- */
            else if (details.statusCode === 422) {
                window.dispatchEvent(
                    new CustomEvent('show-notification', {
                        detail: "Something went wrong, please try again."
                    })
                );
            }

            /* -------------------------- Initial server error -------------------------- */
            else if (details.statusCode === 500) {
                window.dispatchEvent(
                    new CustomEvent('show-notification', {
                        detail: "Something went wrong, please log in again."
                    })
                );
                redirect("/join");
            }

            break;

        case "/api/operations/get":

            /* ------------------------ Timestamp not in database ----------------------- */
            if (details.statusCode === 410) {
                // TODO: return info that it should get current version
            }

            /* ----------------------------- Session expired ---------------------------- */
            else if (details.statusCode === 401) {
                window.dispatchEvent(
                    new CustomEvent('show-notification', {
                        detail: "Session expired, please log in again."
                    })
                );
                redirect("/join");
            }

            /* -------------------------- Initial server error -------------------------- */
            else if (details.statusCode === 500) {
                window.dispatchEvent(
                    new CustomEvent('show-notification', {
                        detail: "Something went wrong, please log in again."
                    })
                );
                redirect("/join");
            }

            /* -------------------------- Invalid request body -------------------------- */
            /* ----------------- (shouldn't happen without breaking js) ----------------- */
            else if (details.statusCode === 400) {
                window.dispatchEvent(
                    new CustomEvent('show-notification', {
                        detail: "Something went wrong, please try again."
                    })
                );
            }
            break;

        case "/api/request-current":

            /* ------- Data has already been provided / Establish connection first ------ */
            // TODO: in requestCurrentController edit status code for establish connection first
            if (details.statusCode === 409) {
                // Nothing to do
            }

            /* ----------------------------- Session expired ---------------------------- */
            else if (details.statusCode === 401) {
                window.dispatchEvent(
                    new CustomEvent('show-notification', {
                        detail: "Session expired, please log in again."
                    })
                );
                redirect("/join");
            }

            /* -------------------------- Internal server error ------------------------- */
            else if (details.statusCode === 500) {
                window.dispatchEvent(
                    new CustonEvent('show-notification', {
                        detail: "Something went wrong, please log in again."
                    })
                );
                redirect("/join");
            }

            /* -------------------------- Invalid request body -------------------------- */
            /* ------------------ (shoudn't happen without breaking js) ----------------- */
            else if (details.statusCode === 400) {
                window.dispatchEvent(
                    new CustomEvent('show-notification', {
                        detail: "Something went wrong, please log in again."
                    })
                );
                redirect("/join");
            }



            

            break;

        case "/api/pusher/channel-auth":

            /* ----------------------------- Session expired ---------------------------- */
            if (details.statusCode === 401) {
                window.dispatchEvent(
                    new CustomEvent('show-notification', {
                        detail: "Session expired, please log in again."
                    })
                );
                redirect("/join");
            }

            /* ------------------------- Internal server errror ------------------------- */
            else if (details.statusCode === 500) {
                window.dispatchEvent(
                    new CustomEvent('show-notification', {
                        detail: "Something went wrong, please log in again."
                    })
                );
                redirect("/join");
            }

            /* -------------------------- Invalid request body -------------------------- */
            /* ------------------ (shoudn't happen without breaking js) ----------------- */
            else if (details.statusCode === 400) {
                window.dispatchEvent(
                    new CustomEvent('show-notification', {
                        detail: "Something went wrong, please try again."
                    })
                );
                redirect("/join");
            }

            break;      
    };
}