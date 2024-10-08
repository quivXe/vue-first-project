class Debounce {
    constructor(callback, ms) {
        this.callback = callback;
        this.ms = ms;
        this.timeoutId = null;

        this.run = this.run.bind(this);
        this.stop = this.stop.bind(this);
        this.now = this.now.bind(this);
    }
    run() {
        this.stop();
        this.timeoutId = setTimeout(this.callback, this.ms);
    }
    stop() {
        if (this.timeoutId !== null) clearTimeout(this.timeoutId);
    }
    now() {
        this.callback();
    }
}

export default Debounce;