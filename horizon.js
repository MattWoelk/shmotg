var plots = []; //an array of all plots

//console.log(document.getElementById("charts").offsetWidth);
//document.getElementById("width-element").offsetWidth //this works KINDA:
//- since there are larger elements on the background, the 100% width
//  div doesn't always to back to being smaller. :/

// === Rotating and Resizing: ===
// Detect whether device supports orientationchange event, otherwise fall back to the resize event
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


var dataA = [0, 5, 2, -3, 4, 6, 8, 4, -2, 0];
var dataB = [2, 1, 2, -1, -2, -5, -9, 2, 6, 10];
var dataC = [-2, -1, -2, 1, 2, 5, 9, -2, -6, -10];
var dataD = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
var plot1 = horizonChart().width(100).height(50);
var plot2 = horizonChart().width(100).height(50);
var plot3 = horizonChart().width(100).height(50);
var plot4 = horizonChart().width(100).height(50);

var pl1 = d3.select("#charts").append("svg").datum(dataA).call(plot1);
var pl2 = d3.select("#charts").append("svg").datum(dataB).call(plot2);
var pl3 = d3.select("#charts").append("svg").datum(dataC).call(plot3);
var pl4 = d3.select("#charts").append("svg").datum(dataD).call(plot4);

// This is how we change a value and update the plot.
plot1.height(50).width(supportsOrientationChange ? d3.max([window.innerWidth, screen.width]) : window.innerWidth);
//pl1.call(plot1); // this is an option, but the next one is easier.
plot1.update(); // easy now that we've stored the selection within the plot. Plot instances are now not reusable for more than one data set. This is okay I think.

// This is even EVEN better.
plot3.bandSize(4).update();
plot4.bandSize(1).update();

plot1.width(supportsOrientationChange ? d3.max([window.innerWidth, screen.width]) : window.innerWidth).update();
plot2.width(supportsOrientationChange ? d3.max([window.innerWidth, screen.width]) : window.innerWidth).update();
plot3.width(supportsOrientationChange ? d3.max([window.innerWidth, screen.width]) : window.innerWidth).update();
plot4.width(supportsOrientationChange ? d3.max([window.innerWidth, screen.width]) : window.innerWidth).update();

//So that we can change and update them whenever we like. :)
//  keep them in a nice array
plots.push(plot1);
plots.push(plot2);
plots.push(plot3);
plots.push(plot4);




//
//d3.json("queries/ESGgirder1_from_SPBRTData_0A.js", function(json) {
//  var w = json.length;
//
//  //fakejsondata = [40, -47.85, -39.38, -44.91, 0, 1];
//
//  var plot5 = horizonChart()
//    .width(supportsOrientationChange ? d3.max([window.innerWidth, screen.width]) : window.innerWidth)
//    .outlinesOrNot(false)
//    .bandSize(26);
//  var pl5 = d3.select("#charts").append("svg")
//    .datum(json.map(function (d) { return -d.ESGgirder1; }))
//    //.datum(fakejsondata)
//    .call(plot5);
//  plots.push(plot5);
//
//  var jAvg = -d3.mean(json, function (d) { return d.ESGgirder1; });
//  var jRange = d3.max(json, function (d) { return d.ESGgirder1; })
//    - d3.min(json, function (d) { return d.ESGgirder1; });
//  var plot6 = horizonChart()
//    .width(supportsOrientationChange ? d3.max([window.innerWidth, screen.width]) : window.innerWidth)
//    .outlinesOrNot(false)
//    .bandSize(jRange / 2);
//  var pl6 = d3.select("#charts").append("svg")
//    .datum(json.map(function (d) { return -d.ESGgirder1 - jAvg; }))
//    //.datum(fakejsondata)
//    .call(plot6);
//  plots.push(plot6);
//
//  //console.log(json.map(function (d) { return -d.ESGgirder1 - jAvg; }));
//  //console.log(json.map(function (d) { return -d.ESGgirder1; }));
//  //console.log(d3.mean(json, function (d) { return d.ESGgirder1; }));
//});
//
