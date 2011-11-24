/*
 * LADD Roller Derby Scoreboard
 * Copyright © 2011  Neale Pickett <neale@woozle.org>
 * Time-stamp: <2011-11-23 20:01:35 neale>
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

/* You can only have one scoreboard per page.  This limitation is mostly
 * because elements need specific id= attributes, and these attribumets
 * must be unique within a page.
 */


/* State names */
var STARTUP = 0;
var JAM = 1;
var ROTATE = 2;
var TIMEOUT = 3;
var BREAK = 4;

var state = STARTUP;

// Create a timer on [element].
// If [tenths] is true, show tenths of a second.
// If [callback] is defined, call it when time runs out.
function startTimer(element, tenths, callback) {
    var itimer;
    var startTime;
    var duration = 0;
    var className;

    // Re-calculate and update displayed time
    function refresh() {
        var remain = element.remaining();
        var min = Math.floor(Math.abs(remain / 60000));
        var sec = (Math.floor(Math.abs(remain / 100)) / 10) % 60;

        // Set classes
        element.className = className;
        if (! itimer) {
            element.className += " paused";
        }
        if ((! className) && (remain <= 20000)) {
            element.className += " lowtime";
        }

        // Has the timer run out?
        if ((duration > 0) && (remain <= 0)) {
            duration = 0;
            sec = 0;
            clearInterval(itimer);
            itimer = undefined;
            if (callback) {
                callback();
            }
        }

        // .toFixed() rounds, we want to truncate
        if (! tenths) {
            sec = Math.floor(sec);
        } else {
            sec = sec.toFixed(1);
        }
        // Zero-pad
        if (sec < 10) {
            sec = "0" + sec;
        }

        var t = min + ":" + sec;
        if (t != element.innerHTML) {
            element.innerHTML = t;
        }
    }

    // Return remaining time in milliseconds
    element.remaining = function() {
        if (itimer) {
            var now = (new Date()).getTime();
            return duration - (now - startTime);
        } else {
            return duration;
        }
    }

    // Set timer to [d] milliseconds.
    // Put element into class [cn], if set.
    element.set = function(t, cn) {
        startTime = (new Date()).getTime();
        duration = t;
        className = cn;
        refresh();
    }

    // Start timer
    element.start = function() {
        if (! itimer) {
            startTime = (new Date()).getTime();
            itimer = setInterval(refresh, 33);
        }
        refresh();
    }

    // Stop timer
    element.stop = function() {
        if (itimer) {
            duration = element.remaining();
            clearInterval(itimer);
            itimer = undefined;
        }
        refresh();
    }
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
        pt.start();
        jt.set(120000);
        jt.start();
        jtext.innerHTML = "Jam";
    } else if (state == ROTATE) {
        pt.start();
        jt.set(30000, "rotate");
        jt.start();
        jtext.innerHTML = "Rotation";
    } else if (state == TIMEOUT) {
        pt.stop();
        if (pt.remaining() <= 0) {
            pt.set(1800000);
        }
        jt.set(0, "timeout");
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

var preset = {a:-1, b:-1};
function logo_rotate(team, dir) {
    var t;

    preset[team] = (teams.length + preset[team] + dir) % teams.length;
    t = teams[preset[team]];

    e("name-" + team).innerHTML = t[0];
    e("logo-" + team).src = "logos/" + t[1];
}

function handle(event) {
    var e = event.target;
    var team = e.id.substr(e.id.length - 1);
    var newstate;

    switch (e.id) {
    case "name-a":
    case "name-b":
        if (state == STARTUP) {
            if (event.ctrlKey) {
                var tn = prompt("Enter team " + team + " name", e.innerHTML);
                if (tn) {
                    e.innerHTML = tn;
                }
            } else {
                logo_rotate(team, event.shiftKey?-1:1);
            }
        }
        break;
    case "logo-a":
    case "logo-b":
        if (state == STARTUP) {
            if (event.ctrlKey) {
                var u = prompt("Enter URL to team " + team + " logo");

                if (u) {
                    e.src = u;
                }
            } else {
                logo_rotate(team, event.shiftKey?-1:1);
            }
        }
        break;
    case "period":
        if ((state == STARTUP) || (state == TIMEOUT)) {
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

            e.set(sec*1000);
        } else {
            newstate = TIMEOUT;
        }
        break;
    case "periodtext":
        period = 3 - period;
        e.innerHTML = "Period " + period;
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
        if (event.ctrlKey) {
            var s = prompt("Enter score for team " + team, e.innerHTML);
            if (s) {
                e.innerHTML = s;
            }
        } else if (event.shiftKey) {
            score(team, -1);
        } else {
            score(team, 1);
        }
        break;
    }
    transition(newstate);
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

    e("name-a").innerHTML = localStorage.rdsb_name_a || "Home";
    e("name-b").innerHTML = localStorage.rdsb_name_b || "Visitor";
    e("logo-a").src = localStorage.rdsb_logo_a || "skate.png";
    e("logo-b").src = localStorage.rdsb_logo_b || "skate.png";
    e("score-a").innerHTML = localStorage.rdsb_score_a || 0;
    e("score-b").innerHTML = localStorage.rdsb_score_b || 0;
    period = localStorage.rdsb_period || 1;
    e("periodtext").innerHTML = "Period " + period;

    c = Number(localStorage.rdsb_period_clock || 1800000);
    startTimer(p);
    p.set(c);

    startTimer(j, true);
    j.set(120000);

    save_itimer = setInterval(save, 1000);
}

window.onload = start;
