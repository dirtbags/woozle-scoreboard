var START = 0;
var JAM = 1;
var ROTATE = 2;
var TIMEOUT = 3;

var period = 1;
var state = START;

function pad(i) {
    if (i < 10) {
        return "0" + i;
    } else {
        return i;
    }
}

// Start a timer on [element] for [duration] milliseconds.
function startTimer(element, precision, duration, callback) {
    var beginning;
    var itimer;
    var precmult = 1;

    for (var i = 0; i < precision; i += 1) {
        precmult *= 10;
    }

    function display(remain) {
        var min = Math.floor(Math.abs(remain / 60000));
        var sec = Math.abs(remain / 1000) % 60;

        /* Scale sec to precision, since toFixed only rounds */
        sec = Math.floor(sec * precmult) / precmult;

        if (itimer) {
            element.style.color = element.fg;
        } else {
            element.style.color = "#888";
        }

        if (! duration) {
            element.style.backgroundColor = "#044";
        } else if (remain <= 20000) {
            element.style.backgroundColor = "#f24";
        } else {
            element.style.backgroundColor = element.bg;
        }

        element.innerHTML = "";
        if ((duration > 0) && (remain <= 0)) {
            this.stop();
            element.innerHTML = "0:0" + (0).toFixed(precision);
            if (callback) callback();
            return;
        }
        element.innerHTML += min + ":" + pad(sec.toFixed(precision));
    }

    function update() {
        var now = (new Date()).getTime();
        var remain = beginning + duration - now;

        display(remain);
    }

    // Is this timer running?
    this.running = function () {
        return ~~itimer;
    }
    
    // Is this a countdown timer?
    this.descending = function () {
        return ~~duration;
    }

    // Stop (clear timer)
    this.stop = function () {
        if (itimer) {
            clearInterval(itimer);
            itimer = undefined;
        }
    }

    // Start
    this.start = function () {
        beginning = (new Date()).getTime();
        if (itimer) {
            return;
        }
        itimer = setInterval(update, 100);
        display(duration);
    }

    // Unpause if paused
    this.go = function () {
        if (itimer) return;

        this.start();
    }

    // Pause if unpaused
    this.pause = function () {
        if (! itimer) return;
        
        this.stop();
        duration -= (new Date()).getTime() - beginning;
        display(duration);
    }

    // Restart with a new time
    this.reset = function (t) {
        duration = t;
        this.start();
        display(duration);
    }

    if (precision == undefined) {
        precision = 1;
    }

    if (element.bg == undefined) {
        element.bg = element.style.backgroundColor;
        element.fg = element.style.color;
    }
}

// Transition state machine based on state
function transition() {
    var jt = document.getElementById("jam").timer;
    var pt = document.getElementById("period").timer;
    var ptext = document.getElementById("periodtext");
    var jtext = document.getElementById("jamtext");

    if (state == JAM) {
        pt.go();
        jt.reset(120000);
        jtext.innerHTML = "Jam";
    } else if (state == ROTATE) {
        pt.go();
        jt.reset(30000);
        jtext.innerHTML = "Rotation";
    } else if (state == TIMEOUT) {
        pt.pause();
        jt.reset(0);
        jtext.innerHTML = "Timeout";
    }
    ptext.innerHTML = "Period " + period;
}

// A timer was clicked
// 0 = period timer
// 1 = jam timer
function timer(tn) {
    if (tn == 0) {
        if ((state == JAM) || (state == ROTATE)) {
            state = TIMEOUT;
        } else {
            state = JAM;
        }
    } else {
        if (state == JAM) {
            state = ROTATE;
        } else {
            state = JAM;
        }
    }
    transition();
}

function score(team, points) {
    var te = document.getElementById("score-" + team);
    var ts = Number(te.innerHTML);

    ts += points;
    te.innerHTML = ts;
}

function mockup() {
    var p = document.getElementById("period");
    var j = document.getElementById("jam");

    p.timer = new startTimer(p, 0, 1800000);

    function jtexp() {
        if (state == JAM) {
            state = ROTATE;
        } else {
            state = JAM;
        }
        transition();
    }
    j.timer = new startTimer(j, 1, 120000, jtexp);
}

window.onload = mockup;
