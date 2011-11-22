/*
 * LADD Roller Derby Scoreboard
 * Copyright © 2011  Neale Pickett <neale@woozle.org>
 * Time-stamp: <2011-11-21 23:17:49 neale>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at
 * your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

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
    var classname;

    var display = function () {
        var remain = element.remaining();
        var min = Math.floor(Math.abs(remain / 60000));
        var sec = Math.abs(remain / 1000) % 60;
        var t = "";

        /* Scale sec to precision, since toFixed only rounds */
        sec = Math.floor(sec * precmult) / precmult;

        if (itimer) {
            element.className = classname;
        } else {
            element.className = classname + " paused";
        }

        if (! classname) {
            if (! duration) {
                element.className = "ascending";
            } else if (remain <= 20000) {
                element.className = "lowtime";
            }
        }

        if ((duration > 0) && (remain <= 0)) {
            // Timer has run out
            duration = 0;
            element.stop();
            t = "0:0" + (0).toFixed(precision);
            if (callback) callback();
            return;
        }
        t += min + ":" + pad(sec.toFixed(precision));

        if (t != element.innerHTML) {
            element.innerHTML = t;
        }
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
        itimer = setInterval(display, 33);
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
    element.reset = function (t, cn) {
        classname = cn;
        if (cn) {
            element.className = cn;
        }

        self.stop();
        duration = t;
        beginning = (new Date()).getTime();
        display(duration);
    }

    // Setup
    for (var i = 0; i < precision; i += 1) {
        precmult *= 10;
    }

    if (precision == undefined) {
        precision = 1;
    }

    display();
}

// Transition state machine based on state
function transition(newstate) {
    if ((newstate == undefined) || (newstate == state)) {
        return;
    }
    state = newstate;

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
        jt.reset(30000, "rotate");
        jt.start();
        jtext.innerHTML = "Rotation";
    } else if (state == TIMEOUT) {
        pt.pause();
        if (pt.remaining() <= 0) {
            pt.reset(1800000);
        }
        jt.reset(0);
        jt.start();
        jtext.innerHTML = "Timeout";
    }
    ptext.innerHTML = "Period " + period;
}

function save() {
    localStorage.rdsb_name_a = e("name-a").innerHTML;
    localStorage.rdsb_name_b = e("name-b").innerHTML;
    localStorage.rdsb_logo_a = e("logo-a").src;
    localStorage.rdsb_logo_b = e("logo-b").src;
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

    var name = e("name-" + t);
    var logo = e("logo-" + t);

    if (logo.plastic) {
        logo.src = v.toLowerCase() + ".png";
        logo.plastic = false;
    }
    e("name-" + t).innerHTML = v;
}

function handle(event) {
    var e = event.target;
    var team = e.id.substr(e.id.length - 1);
    var newstate;

    if (state == TIMEOUT) {
        // During startup, everything is editable
        switch (e.id) {
        case "name-a":
        case "name-b":
            teamname(team, prompt("Enter team " + team + " name", e.innerHTML));
            break;
        case "logo-a":
        case "logo-b":
            var u = prompt("Enter URL to team " + team + " logo");

            if (! u) return;
            e.src = u;
            e.plastic = false;
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
            newstate = JAM;
            break;
        }
    } else {
        switch (e.id) {
        case "period":
            newstate = TIMEOUT;
            break;
        case "jam":
            if (state == JAM) {
                newstate = ROTATE;
            } else {
                newstate = JAM;
            }
            break;
        case "score-a":
        case "score-b":
            if (event.shiftKey == 1) {
                score(team, -1);
            } else {
                score(team, 1);
            }
            return;
        }
    }
    transition(newstate);
}

function imgfail(team) {
    var logo = e("logo-" + team);
    var url = e("name-" + team).innerHTML.toLowerCase() + ".png";

    if (logo.plastic && (logo.src != url)) {
        logo.src = url;
    } else {
        logo.src = "skate.png";
        logo.plastic = true;
    }
}

function key(e) {
    var newstate;

    switch (String.fromCharCode(e.which || 0)) {
    case " ":
        if (state == JAM) {
            newstate = ROTATE;
        } else {
            newstate = JAM;
        }
        break;
    case "j":
        newstate = JAM;
        break;
    case "r":
    case "l":                   // WFTDA TV uses this
        newstate = ROTATE;
        break;
    case "t":
        newstate = TIMEOUT;
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

    transition(newstate);
}

function start() {
    var p = document.getElementById("period");
    var j = document.getElementById("jam");

    teamname("a", localStorage.rdsb_name_a || "Home");
    teamname("b", localStorage.rdsb_name_b || "Visitor");
    e("logo-a").src = localStorage.rdsb_logo_a || "skate.png";
    e("logo-b").src = localStorage.rdsb_logo_b || "skate.png";
    e("score-a").innerHTML = localStorage.rdsb_score_a || 0;
    e("score-b").innerHTML = localStorage.rdsb_score_b || 0;
    period = localStorage.rdsb_period || 1;
    e("periodtext").innerHTML = "Period " + period;

    c = Number(localStorage.rdsb_period_clock || 1800000);
    startTimer(p, 0, c);
    startTimer(j, 1, 120000);

    save_itimer = setInterval(save, 1000);
}

window.onload = start;
