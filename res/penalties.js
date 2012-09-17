/***********************************
 * Penalties
 */
function penalties (team) {
    var table = document.getElementById("penalties-" + team);

    var majors = table.getElementsByClassName("majors")[0];
    var sk8ers = table.getElementsByClassName("sk8ers")[0];

    var majdiv = majors.getElementsByTagName("div");
    var sk8div = sk8ers.getElementsByTagName("div");

    var ret = [];

    for (var i = 0; i < 20; i += 1) {
        ret.push([sk8div[i].text,
                  majdiv[i].value || 0]);
    }

    return ret;
}

function penalties_save () {
    var ls = localStorage || {};

    var name_a = document.getElementById("name-a").innerHTML;
    var name_b = document.getElementById("name-b").innerHTML;

    var pen_a = JSON.stringify(penalties("a"));
    var pen_b = JSON.stringify(penalties("b"));

    ls["rdsb_penalties_a"] = pen_a;
    ls["rdsb_penalties_b"] = pen_b;

    ls["rdsb_roster " + name_a] = pen_a;
    ls["rdsb_roster " + name_b] = pen_b;
}

function penalties_setdiv (div, value) {
    if (div.text == undefined) {
        div.value = value;
        div.style.height = (value||0) + "em";
        div.innerHTML = value?value:"";
    } else {
        div.text = value;
        div.innerHTML = value?"":"•";
        for (var i in value) {
            var c = value[i];
            // XXX: use CSS "text-wrap: unrestricted" when supported
            div.innerHTML += c + " ";
        }
    }
}

function penalties_load (team, values) {
    var table = document.getElementById("penalties-" + team);

    var majors = table.getElementsByClassName("majors")[0];
    var sk8ers = table.getElementsByClassName("sk8ers")[0];

    var majdiv = majors.getElementsByTagName("div");
    var sk8div = sk8ers.getElementsByTagName("div");

    for (var i = 0; i < values.length; i += 1) {
        penalties_setdiv(sk8div[i], values[i][0]);
        penalties_setdiv(majdiv[i], values[i][2]);
    }
}

function penalties_setTeamName (team, name) {
    var ls = localStorage || {};
    var roster_in = ls["rdsb_roster " + name];
    var roster_out = [];

    if (roster_in) {
        roster_in = JSON.parse(roster_in);
    }

    for (var i = 0; i < 20; i += 1) {
        if (! roster_in) {
            roster_out.push(["", 0, 0]);
        } else {
            roster_out.push([roster_in[i][0], 0, 0])
        }
    }
    penalties_load(team, roster_out);
}

function penalties_click (event) {
    var element = event.currentTarget;
    var pops = element.parentNode;
    var div = element.getElementsByTagName("div")[0];
    var inc = event.shiftKey?-1:1;
    var val;

    if (pops.className == "majors") {
        val = ((div.value || 0) + inc + 9) % 9;
    } else if (state == SETUP) {
        val = prompt("Enter skater number", div.text);
    }

    if (val != undefined) {
        penalties_setdiv(div, val);
        penalties_save();
    }
}

// Remove penalties area if there are no players set
function penalties_duck () {
    var pen = document.getElementById("penalties");
    var a = penalties("a");
    var b = penalties("b");

    for (var i = 0; i < 20; i += 1) {
        if (a[i][0] || b[i][0]) {
            return;
        }
    }

    pen.style.display = "none";
}

function penalties_init () {
    var ls = localStorage || {};

    // Populate ALL ROWS AT ONCE because I'm crazy like that.
    for (var j = 0; j < 2; j += 1) {
        var team = (j==0)?"a":"b";

        var table = document.getElementById("penalties-" + team);
        var majors = table.getElementsByClassName("majors")[0];
        var sk8ers = table.getElementsByClassName("sk8ers")[0];

        for (var i = 0; i < 20; i += 1) {
            var td;
            var div;

            var majdiv = document.createElement("div");
            td = document.createElement("td");
            td.onclick = penalties_click;
            td.appendChild(majdiv);
            majors.appendChild(td);


            div = document.createElement("div");
            div.text = "";
            div.appendChild(document.createTextNode("•"));
            td = document.createElement("td");
            td.onclick = penalties_click;
            td.appendChild(div);
            sk8ers.appendChild(td);
        }
    }

    if (ls.rdsb_penalties_a) {
        penalties_load("a", JSON.parse(ls.rdsb_penalties_a));
    }
    if (ls.rdsb_penalties_b) {
        penalties_load("b", JSON.parse(ls.rdsb_penalties_b));
    }
}
