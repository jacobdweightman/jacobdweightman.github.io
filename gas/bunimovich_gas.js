
const W = 600;
const H = 400;
const V = 0.5;
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

        if (this.x < W - H) {
            // left semicircle
            bounceBallOffOfCircularWall(this, H / 2, H / 2, H / 2);
        } else if (this.x > H) {
            // right semicircle
            bounceBallOffOfCircularWall(this, H, H / 2, H / 2);
        } else {
            // rectangular region
            if (this.y > H - R) {
                this.y += 2 * (H - R - this.y);
                this.vy *= -1;
            } else if (this.y < R) {
                this.y += 2 * (R - this.y);
                this.vy *= -1;
            }
        }
    }
}

var p;

var canvas;
var c;
var playing = true;

function reset() {
    let angle = 2 * Math.PI * Math.random();
    p = new Particle(W / 2, H / 2, V * Math.cos(angle), V * Math.sin(angle));

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
    } else if (event.data === "reset") {
        reset();
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
    p.advance(dt);
    p.wallBounce();
}

function render() {
    c.clearRect(0, 0, W, H);
    drawStadium();
    c.beginPath();
    c.arc(p.x, p.y, R, 0, 2 * Math.PI, false);
    c.fill();
}

function drawStadium() {
    c.beginPath();
    c.arc(H / 2, H / 2, H / 2, Math.PI / 2, 3 * Math.PI / 2);
    c.arc(H, H / 2, H / 2, -Math.PI / 2, Math.PI / 2);
    c.stroke();
}

function bounceBallOffOfCircularWall(p, cx, cy, radius) {
    let dx = p.x - cx;
    let dy = p.y - cy;
    if (dx ** 2 + dy ** 2 > (radius - R) ** 2) {
        // compute surface normal at point of collision
        let [colX, colY] = getCollisionPoint(p, cx, cy, radius);
        let nx = (cx - colX) / (radius - R);
        let ny = (cy - colY) / (radius - R);

        // For now, set position to collision point. This is almost right!
        p.x = colX + (colX < W / 2 ? 1 : -1);
        p.y = colY;
        let dot = p.vx * nx + p.vy * ny;
        p.vx -= 2 * dot * nx;
        p.vy -= 2 * dot * ny;
    }
}

/**
 * Compute the point of collision between a particle and a circular wall
 * @param {*} p the particle
 * @param {*} cx the center of the circle's x-coordinate
 * @param {*} cy the center of the circle's y-coordinate
 * @param {*} radius the radius of the circle
 */
function getCollisionPoint(p, cx, cy, radius) {
    // find t such that |(r - c) + vt| = radius - R
    let dx = p.x - cx;
    let dy = p.y - cy;

    let a = p.vx ** 2 + p.vy ** 2;
    let b = 2 * (p.vx * dx + p.vy * dy);
    let c = dx ** 2 + dy ** 2 - (radius - R) ** 2;
    let t = (-b + Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a);

    // Now return the collision point r + vt
    return [p.x + p.vx * t, p.y + p.vy * t];
}
