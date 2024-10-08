class Debounce {
    /**
     * Creates an instance of Debounce.
     *
     * @constructor
     * @param {Function} callback
     * @param {number} ms
     */
    constructor(callback, ms) {
        this.callback = callback;
        this.ms = ms;
        this.timeoutId = null;

        this.run = this.run.bind(this);
        this.stop = this.stop.bind(this);
        this.now = this.now.bind(this);
    }
    /** Trigger callback after given ms milliseconds */
    run() {
        this.stop();
        this.timeoutId = setTimeout(this.callback, this.ms);
    }
    /** Stops timeout */
    stop() {
        if (this.timeoutId !== null) clearTimeout(this.timeoutId);
    }
    /** Trigger callback immediately */
    now() {
        this.callback();
    }
}

export default Debounce;