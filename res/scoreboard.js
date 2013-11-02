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

longnames = false;
tenths = true;

/* State names */
var SETUP = 0;                  // !P 30:00   !J 2:00
var JAM = 1;                    //  P          J 2:00
var LINEUP = 2;                 //  P          J 1:00
var TIMEOUT = 3;                // !P          J 1:00

var periodtext = ["Period 1", "Halftime", "Period 2", "Break"];
var jamtext = ["Jam", "Lineup", "Timeout", "Setup"];
var period = 0;
var jamno = 0;

var state = SETUP;

var timer_updates = [];
function update() {
    for (var i in timer_updates) {
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
    var set_duration = 0;
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
        if ((set_duration > 0) && (remain <= 0)) {
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
        set_duration = t;
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
    var jno = e("jamno");

    if ((newstate === undefined) || (newstate == state)) {
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
        jamno += 1;
        jno.innerHTML = jamno;
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

var notices = [
	false,
	'<embed src="res/Zounds.swf" type="text/html">',
	'<embed src="res/Ouch.swf" type="text/html">',
	'<embed src="res/Pow.swf" type="text/html">',
	'<embed src="res/HolyShot.swf" type="text/html">',
	'<embed src="res/FasterFaster.swf" type="text/html">',
	'<embed src="res/BadGirl.swf" type="text/html">',
	'<embed src="res/banana.gif" type="image/gif">',
];

var notice_timer;

function notice_expire() {
	var c = document.getElementById("notice");

	c.innerHTML = "";
	c.style.display = "none";
}

function notice(n) {
    var c = document.getElementById("notice");

    c.style.display = "block";
    if (notices[n]) {
        c.innerHTML = notices[n];
        clearTimeout(notice_timer);
        notice_timer = setTimeout(function() {notice_expire()}, 8000);
    } else {
        notice_expire();
    }
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
    case "logo-a":
    case "logo-b":
        if (state == SETUP) {
            if (true) {
                var t, name;

                logo[team] = (teams.length + logo[team] + adj) % teams.length;
                t = teams[logo[team]];

                if (longnames) {
                    name = t[2];
                } else {
                    name = t[0];
                }

                e("name-" + team).innerHTML = name;
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
        	// Nothin'
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
        if (pt) {
            tgt.innerHTML = pt;
            if (state == TIMEOUT) {
                jamno = 0;
                e("jamno").innerHTML = jamno;
            }
        }
        break;
    case "jam":
        if (state == JAM) {
            newstate = LINEUP;
        } else {
            newstate = JAM;
        }
        break;
    case "jamno":
        jamno -= adj;
        tgt.innerHTML = jamno;
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
    var e = event || window.event;
    var c;
    var newstate;

	switch (e.keyCode) {
	case 38:
		c = "up";
		break;
	case 40:
		c = "down";
		break;
	default:
		c = String.fromCharCode(e.which || e.keyCode || 0);
		break;
	}

    switch (c) {
	case "up":
		if ((state == TIMEOUT) || (state == SETUP)) {
			var pt = document.getElementById("period");
			var rem = pt.remaining();
			pt.set(rem + 1000);
		}
		break;
	case "down":
		if ((state == TIMEOUT) || (state == SETUP)) {
			var pt = document.getElementById("period");
			var rem = pt.remaining();
			pt.set(rem - 1000);
		}
		break;
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


function save() {
	chrome.storage.sync.set(
		{
			"period_clock": e("period").remaining(),
			"name_a": e("name-a").innerHTML,
			"name_b": e("name-b").innerHTML,
			"logo_a": e("logo-a").src,
			"logo_b": e("logo-b").src,
			"score_a": e("score-a").innerHTML,
			"score_b": e("score-b").innerHTML,
			"timeout_a": e("timeouts-a").innerHTML,
			"timeout_b": e("timeouts-b").innerHTML,
			"jamno": jamno,
			"period": period,
		}
	);
}
    
function iecheck() {
    // If it's IE, it's got to be at least 7
    var ua = navigator.userAgent;
    var ie = ua.indexOf("MSIE ");

    if (ie == -1) {
        // Not IE
        return;
    } else {
        var n = parseFloat(ua.substring(ie + 5, ua.indexOf(";", ie)));
        if (n < 7) {
            alert("Your browser is too old to run the Woozle scoreboard.\nYou can use Firefox, Chrome, Opera, or Internet Explorer 7 and up.");
        }
    }
}

function ei(name) {
	el = e(name);
	if (el.addEventListener) {
		el.addEventListener("click", handle, false);
	}
	return el;
}

function start() {
    resize();
    iecheck();

    var p = document.getElementById("period");
    var j = document.getElementById("jam");
    var c;

	// XXX: I think, instead of null, you can pass in a dictionary of defaults
	function load(state) {
		ei("name-a").innerHTML = state.name_a || "Home";
		ei("name-b").innerHTML = state.name_b || "Vis";
		ei("logo-a").src = state.logo_a || "logos/black.png";
		ei("logo-b").src = state.logo_b || "logos/white.png";
		ei("score-a").innerHTML = state.score_a || 0;
		ei("score-b").innerHTML = state.score_b || 0;
		ei("timeouts-a").innerHTML = state.timeout_a || 3;
		ei("timeouts-b").innerHTML = state.timeout_b || 3;
		period = state.period || 0;
		jamno = state.jamno || 0;
		
		var c = state.period_clock || 1800000;
		startTimer(p);
		p.set(c);
	}
	chrome.storage.sync.get(null, load);

    ei("jammer-a");
    ei("jammer-b");
    ei("period");
    ei("jam");
    
    ei("periodtext").innerHTML = periodtext[period];
    ei("jamtext").innerHTML = jamtext[3];
    transition();

    startTimer(j, window.tenths);
    j.set(120000);

    save_timer = setInterval(save, 1000);
    update_itimer = setInterval(update, 33);

}

function resize() {
    var b = document.getElementsByTagName("body")[0];
    var w, h;
    
    // Internet Explorer makes everything a pain in the ass
    if (window.innerWidth) {
        w = window.innerWidth;
        h = window.innerHeight;
    } else if (document.documentElement && document.documentElement.clientWidth) {
        w = document.documentElement.clientWidth;
        h = document.documentElement.clientHeight;
    } else if (document.body) {
        w = document.body.clientWidth;
        h = document.body.clientHeight;
    } else {
        // Punt
        w = 800;
        h = 600;
    }
   
    w /= 7;
    h /= 5;

    var fs = Math.min(w, h);

    b.style.fontSize = fs + 'px';
}

window.onload = start;
document.onkeydown = key;  // IE requires document, not window
window.onresize = resize;
