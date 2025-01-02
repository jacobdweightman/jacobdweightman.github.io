
const W = 400;
const H = 400;
const V = 0.2;
const R = 5;
const N = 30;

class Particle {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
    }

    advance(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

    wallBounce() {
        // If the particle has passed through a wall (on this frame), reflect
        // the position across the wall so that it is as if the ball bounced at
        // the right time and place during the frame.
        if (this.x > W - R) {
            this.x += 2 * (W - R - this.x);
            this.vx *= -1;
        } else if (this.x < R) {
            this.x += 2 * (R - this.x);
            this.vx *= -1;
        }

        if (this.y > H - R) {
            this.y += 2 * (H - R - this.y);
            this.vy *= -1;
        } else if (this.y < R) {
            this.y += 2 * (R - this.y);
            this.vy *= -1;
        }
    }
}

var particles;
var canvas;
var c;
var playing = true;

function reset() {
    particles = Array(N).fill(null).map((_) => {
        let angle = 2 * Math.PI * Math.random();
        return new Particle(
            R + (W - R) * Math.random(),
            R + (H - R) * Math.random(),
            V * Math.cos(angle),
            V * Math.sin(angle)
        );
    });

    canvas = document.getElementById("c");
    c = canvas.getContext("2d");
    c.fillStyle = "#000";
    if (playing) {
        requestAnimationFrame(frame);
    }
}

window.onload = reset;
document.onclick = reset;

window.addEventListener("message", (event) => {
    event.source.postMessage(event.data, "http://127.0.0.1:4000");
    // if (event.origin !== "https://jacobweightman.com" && event.origin !== "http://127.0.0.1:4000") {
    //     return;
    // }

    if (event.data === "resume") {
        playing = true;
        prevT = document.timeline.currentTime;
        requestAnimationFrame(frame);
    } else if (event.data === "pause") {
        playing = false;
    }
})

var prevT = 0;
function frame(t) {
    // set a maximum amount of time simulated per frame, because sometimes balls
    // can fly away otherwise — I suspect this is due to the same ball bouncing
    // multiple times in a single simulation step, which should never happen with
    // "normal" frame times.
    let dt = Math.min(t - prevT, 100);
    prevT = t;
    step(dt);
    render();
    if (playing) {
        requestAnimationFrame(frame);
    }
}

function step(dt) {
    for (let p of particles) {
        p.advance(dt);
        p.wallBounce();
    }
}

function render() {
    c.clearRect(0, 0, W, H);
    for (let p of particles) {
        c.beginPath();
        c.arc(p.x, p.y, R, 0, 2 * Math.PI, false);
        c.fill();
    }
}
