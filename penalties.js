function penalties (team) {
    var table = document.getElementById("penalties-" + team);

    var minors = table.getElementsByClassName("minors")[0];
    var majors = table.getElementsByClassName("majors")[0];
    var sk8ers = table.getElementsByClassName("sk8ers")[0];

    var mindiv = minors.getElementsByTagName("div");
    var majdiv = majors.getElementsByTagName("div");
    var sk8div = sk8ers.getElementsByTagName("div");

    var ret = [];

    for (var i = 0; i < 20; i += 1) {
        ret.push([sk8div[i].text,
                  mindiv[i].value || 0,
                  majdiv[i].value || 0]);
    }

    return ret;
}

function penalties_save () {
    var name_a = document.getElementById("name-a").innerHTML;
    var name_b = document.getElementById("name-b").innerHTML;

    var pen_a = JSON.stringify(penalties("a"));
    var pen_b = JSON.stringify(penalties("b"));

    localStorage["rdsb_penalties_a"] = pen_a;
    localStorage["rdsb_penalties_b"] = pen_b;

    console.log(name_a);
    localStorage["rdsb_roster " + name_a] = pen_a;
    localStorage["rdsb_roster " + name_b] = pen_b;
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

    var minors = table.getElementsByClassName("minors")[0];
    var majors = table.getElementsByClassName("majors")[0];
    var sk8ers = table.getElementsByClassName("sk8ers")[0];

    var mindiv = minors.getElementsByTagName("div");
    var majdiv = majors.getElementsByTagName("div");
    var sk8div = sk8ers.getElementsByTagName("div");

    for (var i = 0; i < values.length; i += 1) {
        penalties_setdiv(sk8div[i], values[i][0]);
        penalties_setdiv(mindiv[i], values[i][1]);
        penalties_setdiv(majdiv[i], values[i][2]);
    }
}

function penalties_setTeamName (team, name) {
    var roster_in = localStorage["rdsb_roster " + name];
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

    if (pops.className == "minors") {
        val = ((div.value || 0) + inc + 4) % 4;
        if ((inc == 1) && (val == 0)) {
            var majdiv = div.majdiv;
            
            penalties_setdiv(majdiv, ((majdiv.value || 0) + 1) % 9);
        }
    } else if (pops.className == "majors") {
        val = ((div.value || 0) + inc + 9) % 9;
    } else {
        val = prompt("Enter skater number", div.text);
    }

    if (val != undefined) {
        penalties_setdiv(div, val);
        penalties_save();
    }
}

function penalties_init () {
    // Populate ALL THREE ROWS AT ONCE because I'm crazy like that.
    for (var j = 0; j < 2; j += 1) {
        var team = (j==0)?"a":"b";

        var table = document.getElementById("penalties-" + team);
        var minors = table.getElementsByClassName("minors")[0];
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


            td = document.createElement("td");
            div = document.createElement("div");
            div.majdiv = majdiv;
            td.onclick = penalties_click;
            td.appendChild(div);
            minors.appendChild(td);


            div = document.createElement("div");
            div.text = "";
            div.appendChild(document.createTextNode("•"));
            td = document.createElement("td");
            td.onclick = penalties_click;
            td.appendChild(div);
            sk8ers.appendChild(td);
        }
    }

    if (localStorage.rdsb_penalties_a) {
        penalties_load("a", JSON.parse(localStorage.rdsb_penalties_a));
    }
    if (localStorage.rdsb_penalties_b) {
        penalties_load("b", JSON.parse(localStorage.rdsb_penalties_b));
    }
}