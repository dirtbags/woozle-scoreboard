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
	["WFTDA", 30 * 60 * 1000, 120 * 1000, 30 * 1000, 3],
	["USARS", 30 * 60 * 1000, 90 * 1000, 30 * 1000, 3],
	["RDCL", 15 * 60 * 1000, 60 * 1000, 30 * 1000, 3],
	["MADE", 15 * 60 * 1000, 90 * 1000, 30 * 1000, 1]
];
var period_time;
var jam_time;
var lineup_time;
var timeouts;

/* State names */
var SETUP = 0;
var JAM = 1;
var LINEUP = 2;
var TIMEOUT = 3;

var periodtext = [
	chrome.i18n.getMessage("period1"),
	chrome.i18n.getMessage("halftime"),
	chrome.i18n.getMessage("period2"),
	chrome.i18n.getMessage("timeToGame")
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

function e(id) {
	ret = document.getElementById(id);
	if (! ret) {
		return Array();
	}
	return ret;
}

// Create a timer on [element].
function startTimer(element) {
	var startTime;
	var running = false;
	var set_duration = 0;
	var duration = 0;
	var className;

	// Heartbeat
	function pulse() {
		if (! running) {
			element.className = className + " paused";
			return;
		}
		
		refresh();
	}
	
	// Re-calculate and update displayed time
	function refresh() {
		var remain = Math.ceil(element.remaining() / 1000);
		var min = Math.floor(Math.abs(remain) / 60);
		var sec = Math.abs(remain) % 60;
		
		// Set classes
		if ((! className) && (remain <= 20)) {
			element.className = "lowtime";
		} else {
			element.className = className;
		}

		// Has the timer run out?
		if ((set_duration > 0) && (remain <= 0)) {
			duration = 0;
			sec = 0;
			element.stop();
		}

		sec = Math.ceil(sec);
		// Zero-pad
		if (sec < 10) {
			sec = "0" + sec;
		}

		var t = min + ":" + sec;
		if (t != element.value) {
			element.value = t;
		}
	}
	
	function inputHandler() {
		var t = element.value.split(":");
		var sec = (Number(t[0]) * 60) + Number(t[1]);
		
		if (isNaN(sec) || (sec <= 0) || (sec > (59 * 60))) {
			// Ignore goofy values
			return;
		}
		
		element.set(sec * 1000, className, true);
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
	// If [stealth] is set, don't refresh
	element.set = function(t, cn, stealth) {
		startTime = (new Date()).getTime();
		set_duration = t;
		duration = t;
		className = cn;
		
		if (! stealth) {
			refresh();
		}
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
	}

	element.readOnly = true;
	element.addEventListener("input", inputHandler);

	timer_updates.push(pulse);
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

	state = newstate;

	if (state == JAM) {
		pt.start();
		jt.set(jam_time);
		jt.start();
		jtext.innerHTML = jamtext[0];
		jamno += 1;
		jno.innerHTML = jamno;
		pt.readOnly = true;
	} else if (state == LINEUP) {
		pt.start();
		jt.set(lineup_time, "lineup");
		jt.start();
		jtext.innerHTML = jamtext[1];
		pt.readOnly = true;
	} else if (state == TIMEOUT) {
		pt.stop();
		if (pt.remaining() <= 0) {
			pt.set(period_time);
		}
		jt.set(0, "timeout");
		jt.start();
		jtext.innerHTML = jamtext[2];
		pt.readOnly = false;
	}

	// Reset lead jammer indicators
	e("jammer-a").className = "";
	e("jammer-b").className = "";
	e("preset").style.display = "none";
	
	save();
}



/***********************************
 * Notices
 */

var notices = {
	"banana": '<img src="res/banana.gif">'
};

var notice_timer;

function notice_expire() {
	var c = e("notice");

	c.innerHTML = "";
	c.style.display = "none";
}

function notice(n) {
	var c = e("notice");

	if (notices[n]) {
		if (c.innerHTML != notices[n]) {
			c.innerHTML = notices[n];
			c.style.display = "block";
		}
		clearTimeout(notice_timer);
		notice_timer = setTimeout(function() {notice_expire()}, 8000);
	} else {
		notice_expire();
	}
}


function score(team, points) {
	var te = e("score-" + team);
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

			tgt.src = "logos/" + t[1];
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
		if (v == -1) {
			v = timeouts;
		}
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
	case "preset":
		load_preset(+1);
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
	case 191:
		c = "/";
		break;
	case 219:
		c = e.shiftKey ? "{" : "[";
		break;
	case 221:
		c = e.shiftKey ? "}" : "]";
		break;
	case 222:
		c = e.shiftKey ? "\"" : "'";
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

	switch (c) {
	case "up":
		if ((state == TIMEOUT) || (state == SETUP)) {
			var pt = e("period");
			var rem = pt.remaining();
			pt.set(rem + 1000);
		}
		break;
	case "down":
		if ((state == TIMEOUT) || (state == SETUP)) {
			var pt = e("period");
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
	case "'":
	case "]":
		score('b', 1);
		break;
	case "z":
	case "{":
		score('a', -1);
		break;
	case "/":
	case "}":
		score('b', -1);
		break;
	case ",":
		leadJammer('a');
		break;
	case ".":
		leadJammer('b');
		break;
	case "g":
		window.notice("banana");
		break;
	}

	transition(newstate);
}


function save() {
	chrome.storage.local.set(
		{
			"preset": e("preset").innerHTML,

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

function load_preset(preset_name) {
	var inc = false;
	var pn = 0;

	if (preset_name == +1) {
		preset_name = e("preset").innerHTML;
		inc = true;
	}
		
	for (var i in presets) {
		if (presets[i][0] == preset_name) {
			pn = Number(i);
			break;
		}
	}
	if (inc) {
		pn = (pn + 1) % presets.length;
	}
	preset_name = presets[pn][0];
	period_time = presets[pn][1];
	jam_time = presets[pn][2];
	lineup_time = presets[pn][3];
	timeouts = presets[pn][4];
	
	e("preset").innerHTML = preset_name;
	e("jam").set(jam_time);
	e("period").set(period_time);
	e("timeouts-a").innerHTML = timeouts;
	e("timeouts-b").innerHTML = timeouts;
	e("score-a").innerHTML = 0;
	e("score-b").innerHTML = 0;
}	
	
function load() {
	function load_cb(state) {
		load_preset(state.preset);
		
		e("period").set((state.period_clock >= 0) ? state.period_clock : period_time);

		e("logo-a").src = state.logo_a;
		e("logo-b").src = state.logo_b;
		e("score-a").innerHTML = state.score_a;
		e("score-b").innerHTML = state.score_b;
		
		e("timeouts-a").innerHTML = (state.timeouts_a >= 0) ? state.timeouts_a : timeouts;
		e("timeouts-b").innerHTML = (state.timeouts_b >= 0) ? state.timeouts_b : timeouts;
		
	}
	
	chrome.storage.local.get({
			"preset": presets[0][0],
			"period_clock": -1,
			"score_a": 0,
			"score_b": 0,
			"logo_a": "logos/black.png",
			"logo_b": "logos/white.png",
			"timeouts_a": -1,
			"timeouts_b": -1
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
	ei("preset");
	
	ei("periodtext").innerHTML = periodtext[period];
	ei("jamtext").innerHTML = jamtext[3];
	transition();

	var p = e("period");
	startTimer(p);
	p.readOnly = false;

	var j = e("jam");
	startTimer(j);

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
