var statusList = [];

function statsUiContainer() {
    var div = document.createElement("div");
    div.id = "gri-statsContainer";
    div.style.margin = "10px";
    var runBtn = document.createElement("button");
    runBtn.innerHTML = "Fetch run timings";
    runBtn.addEventListener("click", function() {
        fetchTimings();
    });
    div.appendChild(runBtn);
    var overview = document.createElement("div");
    overview.id = "gri-overview";
    overview.style.margin = "10px";
    var log = document.createElement("span");
    log.id = "gri-log";
    div.appendChild(overview);
    div.appendChild(log)
    var c = document.getElementById("container");
    c.parentNode.insertBefore(div, c);
}

function timingStats(timings) {
    var sorted = timings.sort(function(a, b){return a-b});
    return {
        "count": timings.length,
        "max": Math.max(...sorted),
        "min": Math.min(...sorted),
        "perc99": round(Quartile(sorted, 0.99)),
        "perc70": round(Quartile(sorted, 0.70))
    };
}

function setOverview(timings) {
    var stats = timingStats(timings);
    var t = "completed count: " + stats.count;
    if (stats.count > 0) {
        t = t + "<br>all timings: " + timings + "<br>min: " + stats.min + "<br>max: " + stats.max + "<br>70th percentile: " + stats.perc70 + "<br>99th percentile: " + stats.perc99;
    }
    document.getElementById("gri-overview").innerHTML = t
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

function fetchTimings() {
    var taskLinks = document.querySelectorAll("td > a");
    var taskIds = Array.from(taskLinks).map(a => a.href.split("/")[6]);

    statusList = [];
    taskIds.forEach(function(tId) {
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

function Array_Sum(t){
   return t.reduce(function(a, b) { return a + b; }, 0); 
}

function Array_Average(data) {
  return Array_Sum(data) / data.length;
}

function Array_Stdev(tab){
   var i,j,total = 0, mean = 0, diffSqredArr = [];
   for(i=0;i<tab.length;i+=1){
       total+=tab[i];
   }
   mean = total/tab.length;
   for(j=0;j<tab.length;j+=1){
       diffSqredArr.push(Math.pow((tab[j]-mean),2));
   }
   return (Math.sqrt(diffSqredArr.reduce(function(firstEl, nextEl){
            return firstEl + nextEl;
          })/tab.length));  
}
