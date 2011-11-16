var TIMEOUT = 0;
var JAM = 1;
var ROTATE = 2;

var state = TIMEOUT;

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
    var bg;

    var display = function () {
        var remain = element.remaining();
        var min = Math.floor(Math.abs(remain / 60000));
        var sec = Math.abs(remain / 1000) % 60;

        /* Scale sec to precision, since toFixed only rounds */
        sec = Math.floor(sec * precmult) / precmult;

        if (itimer) {
            element.style.color = element.fg;
        } else {
            element.style.color = "#888";
        }

        if (! bg) {
            if (! duration) {
                element.style.backgroundColor = "#044";
            } else if (remain <= 20000) {
                element.style.backgroundColor = "#f24";
            } else {
                element.style.backgroundColor = element.bg;
            }
        }

        element.innerHTML = "";
        if ((duration > 0) && (remain <= 0)) {
            element.stop();
            element.innerHTML = "0:0" + (0).toFixed(precision);
            if (callback) callback();
            return;
        }
        element.innerHTML += min + ":" + pad(sec.toFixed(precision));
    }

    // Is element timer running?
    element.running = function () {
        return !!itimer;
    }
    
    // Is element a countdown timer?
    element.descending = function () {
        return !!duration;
    }

    element.d = function() {
        return [beginning, duration];
    }

    // Return time on clock
    element.remaining = function () {
        if (element.running()) {
            return beginning + duration - (new Date()).getTime();
        } else {
            return duration;
        }
    }

    // Stop (clear timer)
    element.stop = function () {
        if (itimer) {
            clearInterval(itimer);
            itimer = undefined;
        }
    }

    // Start
    element.start = function () {
        beginning = (new Date()).getTime();
        if (itimer) {
            return;
        }
        itimer = setInterval(display, 100);
        display();
    }

    // Unpause if paused
    element.go = function () {
        if (itimer) return;

        element.start();
    }

    // Pause if unpaused
    element.pause = function () {
        if (! itimer) return;
        
        element.stop();
        duration -= (new Date()).getTime() - beginning;
        display();
    }

    // Restart with a new time
    element.reset = function (t, color) {
        bg = color;
        if (color) {
            element.style.backgroundColor = color;
        }

        duration = t;
        display(duration);
    }

    // Setup
    for (var i = 0; i < precision; i += 1) {
        precmult *= 10;
    }

    if (precision == undefined) {
        precision = 1;
    }

    if (element.bg == undefined) {
        element.bg = element.style.backgroundColor;
        element.fg = element.style.color;
    }
    display();
}

// Transition state machine based on state
function transition() {
    var jt = document.getElementById("jam");
    var pt = document.getElementById("period");
    var ptext = document.getElementById("periodtext");
    var jtext = document.getElementById("jamtext");

    if (state == JAM) {
        pt.go();
        jt.reset(120000);
        jt.start();
        jtext.innerHTML = "Jam";
    } else if (state == ROTATE) {
        pt.go();
        jt.reset(30000, "#060");
        jt.start();
        jtext.innerHTML = "Rotation";
    } else if (state == TIMEOUT) {
        pt.pause();
        jt.reset(0);
        jt.start();
        jtext.innerHTML = "Timeout";
    }
    ptext.innerHTML = "Period " + period;
}

function save() {
    localStorage.rdsb_name_a = e("name-a").innerHTML;
    localStorage.rdsb_name_b = e("name-b").innerHTML;
    localStorage.rdsb_score_a = e("score-a").innerHTML;
    localStorage.rdsb_score_b = e("score-b").innerHTML;
    localStorage.rdsb_period = period;
    localStorage.rdsb_period_clock = e("period").remaining();
}
    

function e(id) {
    return document.getElementById(id);
}

function score(team, points) {
    var te = document.getElementById("score-" + team);
    var ts = Number(te.innerHTML);

    ts += points;
    te.innerHTML = ts;
}

function teamname(t, v) {
    if (! v) return;
    e("name-" + t).innerHTML = v || "Home";
    e("logo-" + t).src = v.toLowerCase() + ".png";
}

function handle(event) {
    var e = event.target;
    var team = e.id.substr(e.id.length - 1);

    if (state == TIMEOUT) {
        // During startup, everything is editable
        switch (e.id) {
        case "name-a":
        case "name-b":
            teamname(team, prompt("Enter team " + team + " name", e.innerHTML));
            break;
        case "score-a":
        case "score-b":
            var s = prompt("Enter team " + team + " score", e.innerHTML);
            if (! s) return;

            e.innerHTML = s;
            break;
        case "period":
            var r = prompt("Enter new time for period clock", e.innerHTML);
            if (! r) return;

            var t = r.split(":");
            var sec = 0;

            if (t.length > 3) {
                e.innerHTML = "What?";
                return;
            }

            for (var i in t) {
                var v = t[i];

                sec = (sec * 60) + Number(v);
            }

            e.reset(sec*1000);
            break;
        case "periodtext":
            period = 3 - period;
            e.innerHTML = "Period " + period;
            break;
        case "jam":
            state = JAM;
            transition();
            break;
        }
    } else {
        switch (e.id) {
        case "period":
            state = TIMEOUT;
            break;
        case "jam":
            if (state == JAM) {
                state = ROTATE;
            } else {
                state = JAM;
            }
            break;
        case "name-a":
        case "logo-a":
        case "name-b":
        case "logo-b":
            score(team, -1);
            break;
        case "score-a":
        case "score-b":
            score(team, 1);
            break;
        }
        transition();
    }
}

function key(e) {
    var s;

    switch (String.fromCharCode(e.which || 0)) {
    case " ":
        if (state == JAM) {
            s = ROTATE;
        } else {
            s = JAM;
        }
        break;
    case "j":
        s = JAM;
        break;
    case "r":
    case "l":                   // WFTDA TV uses this
        s = ROTATE;
        break;
    case "t":
        s = TIMEOUT;
        break;
    case "a":
    case ",":
        score('a', 1);
        break;
    case "b":
    case ".":
        score('b', 1);
        break;
    case "A":
    case "<":
        score('a', -1);
        break;
    case "B":
    case ">":
        score('b', -1);
        break;
    }

    if ((s != undefined) && (s != state)) {
        state = s;
        transition();
    }
}

function start() {
    var p = document.getElementById("period");
    var j = document.getElementById("jam");

    teamname("a", localStorage.rdsb_name_a || "Home");
    teamname("b", localStorage.rdsb_name_b || "Visitor");
    e("score-a").innerHTML = localStorage.rdsb_score_a || 0;
    e("score-b").innerHTML = localStorage.rdsb_score_b || 0;
    period = localStorage.rdsb_period || 1;

    c = Number(localStorage.rdsb_period_clock || 1800000);
    startTimer(p, 0, c);
    startTimer(j, 1, 120000);

    save_itimer = setInterval(save, 1000);
}

window.onload = start;
window.onkeypress = key;