/*
	LADD Roller Derby Scoreboard
	Copyright © 2014 Neale Pickett <neale@woozle.org>

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful, but
	WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.	See the GNU
	General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program.	If not, see <http://www.gnu.org/licenses/>.
 */

/* You can only have one scoreboard per page.  This limitation is mostly
 * because elements need specific id= attributes, and these attribumets
 * must be unique within a page.
 *
 * Corollary: don't change element ids without making a corresponding
 * change in this file.
 */

/* Times for various rulesets */
var presets = [
	["WFTDA", 1800, 120, 30],
	["USARS", 1800, 90, 30],
	["MADE", 900, 90, 30]
];
var period_time = presets[0][1] * 1000;
var jam_time = presets[0][2] * 1000;
var lineup_time = presets[0][3] * 1000;

/* State names */
var SETUP = 0;
var JAM = 1;
var LINEUP = 2;
var TIMEOUT = 3;

var periodtext = [
	chrome.i18n.getMessage("timeToGame"),
	chrome.i18n.getMessage("period1"),
	chrome.i18n.getMessage("halftime"),
	chrome.i18n.getMessage("period2")
];
var jamtext = [
	chrome.i18n.getMessage("jam"),
	chrome.i18n.getMessage("lineup"),
	chrome.i18n.getMessage("timeout"),
	chrome.i18n.getMessage("setup")
];
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
// If [callback] is defined, call it when time runs out.
function startTimer(element, callback) {
	var startTime;
	var running = false;
	var set_duration = 0;
	var duration = 0;
	var className;

	// Re-calculate and update displayed time
	function refresh () {
		var remain = Math.abs(Math.ceil(element.remaining() / 1000));
		var min = Math.floor(remain / 60);
		var sec = remain % 60;

		// Set classes
		element.className = className;
		if ((! className) && (remain <= 20)) {
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

		sec = Math.ceil(sec);
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
		jt.set(jam_time);
		jt.start();
		jtext.innerHTML = jamtext[0];
		jamno += 1;
		jno.innerHTML = jamno;
	} else if (state == LINEUP) {
		pt.start();
		jt.set(lineup_time, "lineup");
		jt.start();
		jtext.innerHTML = jamtext[1];
	} else if (state == TIMEOUT) {
		pt.stop();
		if (pt.remaining() <= 0) {
			pt.set(period_time);
		}
		jt.set(0, "timeout");
		jt.start();
		jtext.innerHTML = jamtext[2];
	}

	// Reset lead jammer indicators
	e("jammer-a").className = "";
	e("jammer-b").className = "";
	
	save();
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
			var t, name;

			logo[team] = (teams.length + logo[team] + adj) % teams.length;
			t = teams[logo[team]];

			name = t[0];

			e("name-" + team).innerHTML = name;
			tgt.src = "logos/" + t[1];

			if (window.penalties) {
				penalties_setTeamName(team, t[0]);
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
		var ptl = periodtext.length;

		period = (period + ptl + adj) % ptl;
		pt = periodtext[period];
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
			e(tgt.id).innerHTML = 0;
		} else {
			score(team, adj);
		}
		break;
	case "close":
		window.close();
		break;
	}
	transition(newstate);
}

function key(event) {
	var e = event || window.event;
	var k = e.which || e.keyCode || 0;
	var c;
	var newstate;

	switch (k) {
	case 32:
		c = " ";
		break;
	case 38:
		c = "up";
		break;
	case 40:
		c = "down";
		break;
	case 188:
		c = ",";
		break;
	case 190:
		c = ".";
		break;
	case 221:
		c = e.shiftKey ? "}" : "]";
		break;
	case 219:
		c = e.shiftKey ? "{" : "[";
		break;
	default:
		if ((k >= 48) && (k <= 90)) {
			c = String.fromCharCode(k);
			if (! e.shiftKey) {
				c = c.toLowerCase();
			}
		} else {
			c = null;
		}
		break;
	}

	bige = e;

	console.log("Key " + k + " pressed: " + c + " === " + e.which);

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
	chrome.storage.local.set(
		{
			"period_time": period_time,
			"jam_time": jam_time,
			"lineup_time": lineup_time,

			"logo_a": e("logo-a").src,
			"logo_b": e("logo-b").src,
			"score_a": e("score-a").innerHTML,
			"score_b": e("score-b").innerHTML,
			"timeouts_a": e("timeouts-a").innerHTML,
			"timeouts_b": e("timeouts-b").innerHTML,
			"period_clock": e("period").remaining(),
		}
	);
}

function load() {
	function load_cb(state) {
		period_time = state.period_time;
		jam_time = state.jam_time;
		lineup_time = state.lineup_time;

		e("logo-a").src = state.logo_a;
		e("logo-b").src = state.logo_b;
		e("score-a").innerHTML = state.score_a;
		e("score-b").innerHTML = state.score_b;
		e("timeouts-a").innerHTML = state.timeouts_a;
		e("timeouts-b").innerHTML = state.timeouts_b;
		
		var p = e("period");
		startTimer(p);
		p.set(state.period_clock);
	}
	
	chrome.storage.local.get({
			"period_clock": period_time,
			"score_a": 0,
			"score_b": 0,
			"logo_a": "logos/black.png",
			"logo_b": "logos/white.png",
			"timeouts_a": 3,
			"timeouts_b": 3,
			"period_time": period_time,
			"jam_time": jam_time,
			"lineup_time": lineup_time
		}, load_cb);		
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
	load();

	ei("logo-a");
	ei("logo-b");
	ei("score-a");
	ei("score-b")
	ei("jammer-a");
	ei("jammer-b");
	ei("timeouts-a");
	ei("timeouts-b");
	ei("period");
	ei("jam");
	ei("prefs");
	ei("close");
	
	ei("periodtext").innerHTML = periodtext[period];
	ei("jamtext").innerHTML = jamtext[3];
	transition();

	var j = e("jam");
	startTimer(j);
	j.set(jam_time);

	update_itimer = setInterval(update, 200); // 5 times a second

}

function resize() {
	var w, h;
	
	w = window.innerWidth / 7;
	h = window.innerHeight / 5;

	document.body.style.fontSize = Math.min(w, h) + 'px';
}

window.onload = start;
document.onkeydown = key;  // IE requires document, not window
window.onresize = resize;
