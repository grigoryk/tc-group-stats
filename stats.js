var statusList = [];

function el(tag, id) {
    var elem = document.createElement(tag);
    if (id !== undefined) { elem.id = id; }
    return elem;
}

function statsUiContainer() {
    var div = el("div", "gri-statsContainer");
    div.style.margin = "10px";
    var runBtn = el("button");
    runBtn.innerHTML = "Fetch run timings";
    runBtn.addEventListener("click", function() {
        fetchTimings();
    });
    div.appendChild(runBtn);
    var graph = el("div", "gri-graph");
    graph.style.display = "flex";
    graph.style.alignItems = "flex-end";
    div.appendChild(graph);
    var overview = el("div", "gri-overview");
    overview.style.margin = "10px";
    var log = el("span", "gri-log");
    div.appendChild(overview);
    div.appendChild(log)
    var c = document.getElementById("container");
    c.parentNode.insertBefore(div, c);
}

function sort(d) {
    return d.sort(function(a, b) { return a - b; } );
}

function timingStats(timings) {
    var sorted = sort(timings);
    return {
        "count": timings.length,
        "max": Math.max(...sorted),
        "min": Math.min(...sorted),
        "perc99": round(Quartile(sorted, 0.99)),
        "perc70": round(Quartile(sorted, 0.70))
    };
}

function drawGraph(timings) {
    var div = document.getElementById("gri-graph");
    div.innerHTML = "";
    function barDiv(t) {
        var bar = el("div");
        bar.style.height = Math.max(5, Math.round(t) * 5) + "px";
        bar.style.width = "10px";
        bar.style.backgroundColor = "#006071";
        bar.style.marginRight = "1px";
        bar.title = "Time (m): " + t;
        return bar;
    }
    sort(timings).forEach(function(t) {
        div.appendChild(barDiv(t));
    });
}

function setOverview(timings) {
    var stats = timingStats(timings);
    var percDone = round(stats.count / requestedToFetch);
    if (percDone < 1) {
        t = "Fetching... " + round(percDone * 100) + "%<br>";
    } else {
        t = ""
    }
    if (stats.count > 0) {
        t = t + "min: " + stats.min + "<br>max: " + stats.max + "<br>70th percentile: " + stats.perc70 + "<br>99th percentile: " + stats.perc99;
    }
    document.getElementById("gri-overview").innerHTML = t
    drawGraph(timings);
}

function log(message) {
    document.getElementById("gri-log").innerHTML = document.getElementById("gri-log").innerHTML + "<br>" + message;
}

function gotStatus(status) {
    //log("got status! total length before adding: " + statusList.length);
    statusList.push(status);
    analyzeStatuses();
}

function round(d) {
    return Math.round(d * 100) / 100;
}

function analyzeStatuses() {
    var runTimings = [];
    statusList.forEach(function(s) {
        //log(s);
        if (s.runs.length > 0) {
            var latest = s.runs[s.runs.length - 1];
            if (latest.resolved) {
                var delta = new Date(latest.resolved) - new Date(latest.started);
                runTimings.push(round(delta / 1000 / 60));
            }
        }
    });
    setOverview(runTimings);
    //log("timings run: " + runTimings);
}

var requestedToFetch = 0;

function fetchTimings() {
    var taskLinks = document.querySelectorAll("td > a");
    var taskIds = Array.from(taskLinks).map(a => a.href.split("/")[6]);

    requestedToFetch = 0;
    statusList = [];
    taskIds.forEach(function(tId) {
        requestedToFetch += 1;
        var statusUrl = "https://queue.taskcluster.net/v1/task/" + tId + "/status";
        //log("fetching " + statusUrl);
        fetch(statusUrl)
            .then(function(response) {
                //log("got response");
                return response.json();
            })
            .then(function(responseJson) {
                //log("got json");
                gotStatus(responseJson.status);
            })
            .catch(error => log("got error: " + error));
    });
}


statsUiContainer();


// copy-pasta from https://stackoverflow.com/questions/48719873/how-to-get-median-and-quartiles-percentiles-of-an-array-in-javascript-or-php
//adapted from https://blog.poettner.de/2011/06/09/simple-statistics-with-php/
function Quartile(data, q) {
  var pos = ((data.length) - 1) * q;
  var base = Math.floor(pos);
  var rest = pos - base;
  if( (data[base+1]!==undefined) ) {
    return data[base] + rest * (data[base+1] - data[base]);
  } else {
    return data[base];
  }
}

