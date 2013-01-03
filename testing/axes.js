var data = d3.range(40).map(Math.random);

var margin = {top: 10, right: 10, bottom: 20, left: 10},
    width = document.documentElement.clientWidth - margin.left - margin.right - 20;
    height = 100 - margin.top - margin.bottom;

var x = d3.scale.linear()
    .range([0, width]);

var y = d3.random.normal(height / 2, height / 8);

var chart = d3.select("#chart").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

chart.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.svg.axis().scale(x).orient("bottom"));

var circle = chart.append("g").selectAll("circle")
    .data(data)
  .enter().append("circle")
//    .attr("transform", function(d) { return "translate(" + x(d) + "," + y() + ")"; })
    .attr("cy", function (d) { return y(d); })
    .attr("cx", function (d) { return x(d); })
    .attr("r", 3.5);

chart.attr("font", "10px sans-serif");

chart.append("g")
    .attr("class", "brush")
    .call(d3.svg.brush().x(x)
    .on("brushstart", brushstart)
    .on("brush", brushmove)
    .on("brushend", brushend))
  .selectAll("rect")
    .attr("height", height);

function brushstart() {
  chart.classed("selecting", true);
}

function brushmove() {
  var s = d3.event.target.extent();
  circle.classed("selected", function(d) { return s[0] <= d && d <= s[1]; });
}

function brushend() {
  chart.classed("selecting", !d3.event.target.empty());
}






//var plots = []; //an array of all plots

//var outlinesOrNot = true;

// === Rotating and Resizing: ===
// Detect whether device supports orientationchange event, otherwise fall back to the resize event
//var supportsOrientationChange = "onorientationchange" in window,
    //orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";
//window.addEventListener(orientationEvent, function() {
  //redraw();
//}, false);
//
//var redraw = function () {
  //plots.forEach(function (plt) {
    //plt.width(window.innerWidth - 20).update();
  //});
//}
//
//
//var dataA = [0, 5, 2, -3, 4, 6, 8, 4, -2, 0];
//var dataB = [2, 1, 2, -1, -2, -5, -9, 2, 6, 10];
//var dataC = [-2, -1, -2, 1, 2, 5, 9, -2, -6, -10];
//plot1 = horizonChart().width(100).height(100);
//plot2 = horizonChart().width(window.innerWidth - 20); //TODO: magic
//plot3 = horizonChart().width(window.innerWidth - 20); //TODO: magic
//
//pl1 = d3.select("#charts").append("svg").datum(dataA).call(plot1);
//pl2 = d3.select("#charts").append("svg").datum(dataB).call(plot2);
//pl3 = d3.select("#charts").append("svg").datum(dataC).call(plot3);
//
//// This is how we change a value and update the plot.
//plot1.height(50).width(window.innerWidth - 20);
////pl1.call(plot1); // this is an option, but the next one is easier.
//plot1.update(); // easy now that we've stored the selection within the plot. Plot instances are now not reusable for more than one data set. This is okay I think.
//
//// This is even EVEN better.
//plot3.bandSize(4).update();
//
////So that we can change and update them whenever we like. :)
////  keep them in a nice array
//plots.push(plot1);
//plots.push(plot2);
//plots.push(plot3);
