export class Syncope {
    private current: Operation;
    private controller = new AbortController();

    lock(): Operation {
        this.controller.abort();
        this.controller = new AbortController();
        this.current = new Operation(this.controller.signal, this.current?.running);
        return this.current;
    }
}

export class Operation {
    public running = true;
    constructor(private signal: AbortSignal, public interrupted: boolean) { }

    abort(): boolean {
        return this.signal.aborted;
    }

    done() {
        this.running = false;
    }

    yield() {
        return new Promise(resolve => setTimeout(resolve, 0));
    }
}
