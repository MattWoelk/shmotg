var plots = []; //an array of all plots

var supportsOrientationChange = "onorientationchange" in window,
    orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";
window.addEventListener(orientationEvent, function() {
  redraw();
}, false);

var redraw = function () {
  plots.forEach(function (plt) {
    plt.width(supportsOrientationChange ? d3.max([window.innerWidth, screen.width]) : window.innerWidth).update();
  });
}

var changeLines = function () {
  plots.forEach(function (plt) {
    plt.setSelectedLines().update();
  });
}

document.getElementById("controls").addEventListener ("change", changeLines, false);

var zoomout = function () {
  plots.forEach(function (plt) {
    plt.zoomout().update();
  });
}

var zoomin = function () {
  plots.forEach(function (plt) {
    plt.zoomin().update();
  });
}


var plot10 = binnedLineChart().width(100).height(150);

d3.json("ESGgirder_toy_data.js", function(json) {
  var w = json.length;

  var jAvg = -d3.mean(json, function (d) { return d.ESGgirder1; });
  var jRange = d3.max(json, function (d) { return d.ESGgirder1; })
    - d3.min(json, function (d) { return d.ESGgirder1; });

  var plot10 = binnedLineChart()
    .width(100)
    .outlinesOrNot(true);

  var pl10 = d3.select("#charts").append("svg").datum(json.map(function (d) { return -d.ESGgirder1; })).call(plot10);
  plot10.width(supportsOrientationChange ? d3.max([window.innerWidth, screen.width]) : window.innerWidth).update();
  plots.push(plot10);
});

