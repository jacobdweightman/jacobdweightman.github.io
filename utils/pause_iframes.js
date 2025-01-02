// This utility sends a "resume" message to an iframe when it appears on screen,
// and a "pause" message when it scrolls off the screen. This should only work
// with same-origin iframes, and it's up to the receiving iframe to handle these
// messages to conserve compute resources while off screen.

function isOnScreen(element) {
    let belowTop = window.scrollY + window.innerHeight - 25 > element.offsetTop;
    let aboveBottom = window.scrollY - element.offsetTop + 25 < element.height;
    return belowTop && aboveBottom;
}

function signalOnScreenIFrames() {
    let frames = document.getElementsByTagName("iframe");
    for (let frame of frames) {
        if (isOnScreen(frame)) {
            if (!frame.isPlaying) {
                console.log("resume");
                frame.isPlaying = true;
                frame.contentWindow.postMessage("resume", "*");
            }
        } else {
            if (frame.isPlaying) {
                console.log("pause");
                frame.isPlaying = false;
                frame.contentWindow.postMessage("pause", "*");
            }
        }
    }
}

window.addEventListener("scroll", signalOnScreenIFrames);

window.addEventListener("message", (event) => {
    console.log("received message: ", event);
});
