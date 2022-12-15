const STATE = {
    AVAILABLE: 0,
    BUSY: 1,
}

class Thread {
    state = STATE.AVAILABLE
    remains = 0;

    use(timeoutMillis) {
        console.log(timeoutMillis)
        this.remains = timeoutMillis;
        this.state = STATE.BUSY;
    }

    tick() {
        if (this.state === STATE.BUSY) {
            this.remains--;
            if (this.remains < 0) {
                this.state = STATE.AVAILABLE;
                this.remains = 0;
            }
        }
    }

    char() {
        switch (this.state) {
            case STATE.AVAILABLE:
                return "_"
            case STATE.BUSY:
                return "*"
            default:
                return "ERR"
        }
    }
}

class Simulator {
    req_per_sec;
    threads;
    timeoutMillis;
    current = document.getElementById("current")
    failCountElement = document.getElementById("failCount")
    tickCountElement = document.getElementById("tickCount")
    counter = 0.0
    failCounter = 0
    tickCounter = 0

    constructor(req_per_sec, threads, timeoutMillis) {
        this.threads = Array.from(Array(threads)).map((_) => new Thread());
        this.req_per_sec = req_per_sec;
        this.timeoutMillis = timeoutMillis;
    }

    tick() {
        // 1 tick は 1msec とする。
        // 100 req/sec の場合 100/1000 req/msec なので、10msec=10tick に一回 request が発生する。
        this.counter += this.req_per_sec / 1000
        if (this.counter > 1.0) {
            // request 発生。割当先の thread を見つけて割り当てる。
            const availableThreads = this.threads.filter(it => {
                return it.state === STATE.AVAILABLE
            })
            if (availableThreads.length > 0) {
                availableThreads[0].use(this.timeoutMillis)
            } else {
                this.failCounter++
            }
            this.counter -= 1.0
        }

        // 現状走っているリクエストを処理させる。
        this.threads.forEach(thread => {
            thread.tick()
        })

        // render current state
        const table = this.threads.map((it) => it.char()).join("")
        this.current.innerText = table;
        this.failCountElement.innerText = this.failCounter.toString();
        this.tickCountElement.innerText = this.tickCounter.toString();

        // increment counter
        this.tickCounter++
    }
}

document.addEventListener("readystatechange", ()=> {
    let intervalId = null

    function submitForm() {
        const req_per_sec = parseInt(document.getElementById("req_per_sec").value, 10)
        const threads = parseInt(document.getElementById("threads").value, 10)
        const timeout = parseInt(document.getElementById("timeout").value, 10)
        const interval = parseInt(document.getElementById("interval").value, 10)

        const simulator = new Simulator(req_per_sec, threads, timeout)
        if (intervalId) {
            clearInterval(intervalId)
        }
        intervalId = setInterval(() => {
            if (simulator != null) {
                simulator.tick()
            }
        }, interval)
    }

    const form = document.getElementById("form")
    form.addEventListener("submit", (e) => {
        e.preventDefault()
        e.stopPropagation()

        submitForm()
    })

    if (location.hash === "#autorun") {
        submitForm()
    }
})
