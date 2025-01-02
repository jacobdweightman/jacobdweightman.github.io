
const W = 400;
const H = 400;
const V = 0.1;
const R = 5;
const N = 50;

class Particle {
    constructor(x, y, vx, vy, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
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

    collideWith(p) {
        let rx = this.x - p.x;
        let ry = this.y - p.y;
        let rvx = this.vx - p.vx;
        let rvy = this.vy - p.vy;
        let r2 = rx ** 2 + ry ** 2;

        // Change in velocity is parallel to the force, which acts radially from
        // the point of contact:
        // ∆v = (2 / r^2)((v1 - v2) • r) r
        let dvx = (rvx * rx + rvy * ry) * rx / r2;
        let dvy = (rvx * rx + rvy * ry) * ry / r2;

        this.vx -= dvx;
        this.vy -= dvy;
        p.vx += dvx;
        p.vy += dvy;
    }
}

var particles = Array(N).fill(null).map((_) => {
    return new Particle(
        R + (W - R) * Math.random(),
        R + (H - R) * Math.random(),
        0.0,
        0.0
    );
});

var canvas;
var c;
var playing = true;

function reset() {
    particles = Array(N).fill(null).map((_) => {
        return new Particle(
            R + (W - R) * Math.random(),
            R + (H - R) * Math.random(),
            0.0,
            0.0
        );
    });

    let angle = 2 * Math.PI * Math.random();
    particles[0].vx = V * Math.cos(angle);
    particles[0].vy = V * Math.sin(angle);

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
        // playing = false;
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

// Returns the time at which p1 and p2 will collide in the future on their
// current trajectories.
function getCollisionTime(p1, p2) {
    // Find t such that at time t in the future the positions of p1 and p2 are
    // a distance of 2R apart. If there is no such t (e.g. it is in the past),
    // then return undefined.
    let xr = p1.x - p2.x;
    let yr = p1.y - p2.y;
    let vxr = p1.vx - p2.vx;
    let vyr = p1.vy - p2.vy;

    let a = vxr ** 2 + vyr ** 2;
    let b = 2 * (vxr * xr + vyr * yr);
    let c = xr ** 2 + yr ** 2 - 4 * R ** 2;

    let t = (-b - Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a);
    if (t === NaN || t < 0) {
        return undefined;
    }
    return t;
}

function getNextCollision() {
    let nextT = Infinity;
    let pa, pb = undefined;

    for (p1 of particles) {
        for (p2 of particles) {
            if (p1 == p2)
                continue;
            let t = getCollisionTime(p1, p2);
            if (t < nextT) {
                nextT = t;
                pa = p1;
                pb = p2;
            }
        }
    }
    return [nextT, pa, pb];
}

function step(dt) {
    while (true) {
        let [dt1, p1, p2] = getNextCollision();
        if (dt1 === undefined || dt1 > dt) break;

        for (let p of particles) {
            p.advance(dt1);
        }
        p1.collideWith(p2);

        dt -= dt1;
    }
    // Now that all collisions are resolved for the frame, advance all particles
    // by any remaining time and handle collisions with the walls.
    console.assert(dt >= 0);
    for (let p of particles) {
        p.advance(dt);
        p.wallBounce();
    }
}

function render() {
    c.clearRect(0, 0, W, H);
    for (let p of particles) {
        c.fillStyle = p.color;
        c.beginPath();
        c.arc(p.x, p.y, R, 0, 2 * Math.PI, false);
        c.fill();
    }
}
