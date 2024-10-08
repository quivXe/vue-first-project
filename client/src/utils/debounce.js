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
    /**
     * Trigger the callback after the given delay.
     * Any arguments passed to `run` will be forwarded to the callback.
     *
     * @param {...any} args - Arguments to pass to the callback when it's invoked.
     */

    run(...args) {
        this.stop(...args);
        this.timeoutId = setTimeout(() => { this.callback(...args) }, this.ms);
    }

    /**
     * Stops the currently running timeout.
     */
    stop() {
        if (this.timeoutId !== null) clearTimeout(this.timeoutId);
    }

    /**
     * Trigger the callback immediately and clear any pending timeout.
     * Any arguments passed to `now` will be forwarded to the callback.
     *
     * @param {...any} args - Arguments to pass to the callback when it's invoked.
     */
    now(...args) {
        if (this.timeoutId !== null) {
            clearTimeout(this.timeoutId);
            this.callback(...args);
        }
    }
}

export default Debounce;