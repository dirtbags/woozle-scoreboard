/*
 * LADD Roller Derby Scoreboard
 * Copyright © 2011  Neale Pickett <neale@woozle.org>
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
 *
 * Corollary: don't change element ids without making a corresponding
 * change in this file.
 */


/* State names */
var SETUP = 0;                  // !P 30:00   !J 2:00
var JAM = 1;                    //  P          J 2:00  
var LINEUP = 2;                 //  P          J 1:00
var TIMEOUT = 3;                // !P          J 1:00

var periodtext = ["Period 1", "Halftime", "Period 2", "Break"];
var jamtext = ["Jam", "Lineup", "Timeout", "Setup"];
var period = 0;

var state = SETUP;

var timer_updates = [];
function update() {
    for (i in timer_updates) {
        var u = timer_updates[i];

        u();
    }
}

// Create a timer on [element].
// If [tenths] is true, show tenths of a second.
// If [callback] is defined, call it when time runs out.
function startTimer(element, tenths, callback) {
    var startTime;
    var running = false;
    var duration = 0;
    var className;

    // Re-calculate and update displayed time
    function refresh () {
        var remain = element.remaining();
        var min = Math.floor(Math.abs(remain / 60000));
        var sec = (Math.floor(Math.abs(remain / 100)) / 10) % 60;

        // Set classes
        element.className = className;
        if ((! className) && (remain <= 20000)) {
            element.className += " lowtime";
        }
        if (! running) {
            element.className += " paused";
        }

        // Has the timer run out?
        if ((duration > 0) && (remain <= 0)) {
            duration = 0;
            sec = 0;
            running = false;
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
        if (running) {
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
        if (! running) {
            startTime = (new Date()).getTime();
            running = true;
        }
        refresh();
    }

    // Stop timer
    element.stop = function() {
        if (running) {
            duration = element.remaining();
            running = false;
        }
        refresh();
    }

    timer_updates.push(refresh);
}

// Transition state machine based on state
function transition(newstate) {
    var jt = e("jam");
    var pt = e("period");
    var jtext = e("jamtext");

    if ((newstate == undefined) || (newstate == state)) {
        return;
    }

    if ((state == SETUP) && window.penalties) {
        penalties_duck();
    }

    state = newstate;

    if (state == JAM) {
        pt.start();
        jt.set(120000);
        jt.start();
        jtext.innerHTML = jamtext[0];
    } else if (state == LINEUP) {
        pt.start();
        jt.set(30000, "lineup");
        jt.start();
        jtext.innerHTML = jamtext[1];
    } else if (state == TIMEOUT) {
        pt.stop();
        if (pt.remaining() <= 0) {
            pt.set(1800000);
        }
        jt.set(0, "timeout");
        jt.start();
        jtext.innerHTML = jamtext[2];
    }

    // Reset lead jammer indicators
    e("jammer-a").className = "";
    e("jammer-b").className = ""; 
}



/***********************************
 * Notices
 */
var notice_timer;

function notice_expire(n) {
    var p = document.getElementById("notice-vanish");
    var pClassName = "";

    for (var i = 0; i < 10; i += 1) {
        var e = document.getElementById("notice-" + i);
        
        if (! e) continue;
        if (i == n) {
            e.className = "active";
            pClassName = "notice";
        } else {
            e.className = "";
        }
    }
    if (p) p.className = pClassName;
}

function notice(n) {
    clearTimeout(notice_timer);
    notice_timer = setTimeout(function() {notice_expire()}, 8000);
    notice_expire(n);
}

function e(id) {
    ret = document.getElementById(id);
    if (! ret) {
        return Array();
    }
    return ret;
}

function score(team, points) {
    var te = document.getElementById("score-" + team);
    var ts = Number(te.innerHTML);

    ts += points;
    te.innerHTML = ts;
}

/***********************************
 * Event handlers
 */

var logo = {a:-1, b:-1};

function leadJammer(team) {
    tgt = e("jammer-" + team);
    var on = ! tgt.className;

    e("jammer-a").className = "";
    e("jammer-b").className = "";
    if (on) tgt.className = "lead";
}

function handle(event) {
    var tgt = event.target || window.event.srcElement;
    var team = tgt.id.substr(tgt.id.length - 1);
    var adj = event.shiftKey?-1:1;
    var mod = (event.ctrlKey || event.altKey);
    var newstate;

    switch (tgt.id) {
    case "name-a":
    case "name-b":
        if (state == SETUP) {
            var tn = prompt("Enter team " + team + " name", tgt.innerHTML);

            if (tn) {
                tgt.innerHTML = tn;
            }
            if (window.penalties) {
                penalties_setTeamName(team, tn);
            }
        }
        break;
    case "logo-a":
    case "logo-b":
        if (state == SETUP) {
            if (mod) {
                var u = prompt("Enter URL to team " + team + " logo");

                if (u) {
                    tgt.src = u;
                }
            } else {
                var t;

                logo[team] = (teams.length + logo[team] + adj) % teams.length;
                t = teams[logo[team]];

                e("name-" + team).innerHTML = t[0];
                tgt.src = "logos/" + t[1];

                if (window.penalties) {
                    penalties_setTeamName(team, t[0]);
                }
            }
        } else {
            score(team, -adj);
        }
        break;
    case "jammer-a":
    case "jammer-b":
        leadJammer(team);
        break;
    case "timeouts-a":
    case "timeouts-b":
        // Allow for timeouts > 3
        var v = Number(tgt.innerHTML);

        v -= adj;
        if (v == -1) v = 3;
        tgt.innerHTML = v;
        break;
    case "period":
        if ((state == SETUP) || (state == TIMEOUT)) {
            var r = prompt("Enter new time for period clock", tgt.innerHTML);
            if (! r) return;

            var t = r.split(":");
            var sec = 0;

            if (t.length > 3) {
                tgt.innerHTML = "What?";
                return;
            }

            for (var i in t) {
                var v = t[i];
                sec = (sec * 60) + Number(v);
            }

            tgt.set(sec*1000);
        } else {
            newstate = TIMEOUT;
        }
        break;
    case "periodtext":
        var pt;

        if (mod) {
            pt = prompt("Enter new period indicator text", tgt.innerHTML);
        } else {
            var ptl = periodtext.length;

            period = (period + ptl + adj) % ptl;
            pt = periodtext[period];
        }
        if (pt) tgt.innerHTML = pt;
        break;
    case "jam":
        if (state == JAM) {
            newstate = LINEUP;
        } else {
            newstate = JAM;
        }
        break;
    case "score-a":
    case "score-b":
        if (state == SETUP) {
            var s = prompt("Enter score for team " + team, tgt.innerHTML);
            if (s) {
                tgt.innerHTML = s;
            }
        } else {
            score(team, adj);
        }
        break;
    }
    transition(newstate);
}

function key(event) {
    var c = String.fromCharCode(event.which || 0);
    var newstate;

    switch (c) {
    case " ":
        if (state == JAM) {
            newstate = LINEUP;
        } else {
            newstate = JAM;
        }
        break;
    case "t":
        newstate = TIMEOUT;
        break;
    case "a":
    case "[":
        score('a', 1);
        break;
    case "b":
    case "]":
        score('b', 1);
        break;
    case "A":
    case "{":
        score('a', -1);
        break;
    case "B":
    case "}":
        score('b', -1);
        break;
    case ",":
        leadJammer('a');
        break;
    case ".":
        leadJammer('b');
        break;
    case "1":
    case "2":
    case "3":
    case "4":
    case "5":
    case "6":
    case "7":
    case "8":
    case "9":
    case "0":
        var n = Number(c);

        window.notice(n);
    }

    transition(newstate);
}

function dfl(v, d) {
    if (v == undefined) {
        return d;
    } else {
        return v;
    }
}

function store(k, v) {
    if ((v == undefined) || ! localStorage) {
        return;
    } else {
        localStorage["rdsb_" + k] = v;
    }
}

function save() {
    var ls = localStorage || {};

    store("period_clock", e("period").remaining());
    store("name_a", e("name-a").innerHTML);
    store("name_b", e("name-b").innerHTML);
    store("logo_a", e("logo-a").src);
    store("logo_b", e("logo-b").src);
    store("score_a", e("score-a").innerHTML);
    store("score_b", e("score-b").innerHTML);
    store("timeout_a", e("timeouts-a").innerHTML);
    store("timeout_b", e("timeouts-b").innerHTML);
    store("period", period);
}
    
function start() {
    var p = document.getElementById("period");
    var j = document.getElementById("jam");
    var ls = localStorage || {};
    var c;

    // IE8 doesn't have localStorage for file:// URLs  :<
    e("name-a").innerHTML = dfl(ls.rdsb_name_a, "Home");
    e("name-b").innerHTML = dfl(ls.rdsb_name_b, "Vis");
    e("logo-a").src = dfl(ls.rdsb_logo_a, "logos/black.png");
    e("logo-b").src = dfl(ls.rdsb_logo_b, "logos/white.png");
    e("score-a").innerHTML = dfl(ls.rdsb_score_a, 0);
    e("score-b").innerHTML = dfl(ls.rdsb_score_b, 0);
    e("timeouts-a").innerHTML = dfl(ls.rdsb_timeout_a, 3);
    e("timeouts-b").innerHTML = dfl(ls.rdsb_timeout_b, 3);
    period = Number(ls.rdsb_period) || 0;

    if (localStorage) {
        save_itimer = setInterval(save, 1000);
    }
    
    if (window.penalties) {
        penalties_init();
    }

    e("periodtext").innerHTML = periodtext[period];
    e("jamtext").innerHTML = jamtext[3];
    transition();

    c = Number(ls.rdsb_period_clock || 1800000);
    startTimer(p);
    p.set(c);

    var j = document.getElementById("jam");
    startTimer(j, window.tenths);
    j.set(120000);

    save_timer = setInterval(save, 1000);
    update_itimer = setInterval(update, 33);
}

window.onload = start;
window.tenths = true;
