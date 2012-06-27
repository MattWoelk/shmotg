var data = [1, 5, 3, 7, 10, 0, 7, 8, 6, 3, 0, 1, 2, 7, 8, 2]; //TODO: This isn't actually mapping properly... maybe scales will fix it.

var chart = d3.select("#chart").append("svg");

chart.attr("width", 1200)
  .attr("height", 1600);

// Make one array for each band, and store all arrays in a big array
//var allArrays = [[], [], []];
var numOfBands = 2;
var maxValue = d3.max(data);
var modValue = d3.max(data) / numOfBands; //TODO: use a d3 scale instead.

var d3area1 = d3.svg.area()
  .x(function (d, i) { return i * 20; })
  .y1(function (d, i) { return 100 - (d * 10); })
  .y0(100)
  .interpolate("basis");

//var marker5 = d3.svg.marker();
//var colors = ["steelblue", "lightblue"];
var colors = ["#F88", "#F44"];

for (var i = 0; i < numOfBands; i++) {
  chart.append("svg:path")
    .attr("d", d3area1(data))
    .style("stroke-width", 2)
    .style("fill", colors[i])
    .style("cursor", "help")
    .attr("transform", "translate(0, " + (i - 1) * 50 + ")");

  chart.attr("width", data.length * 50).attr("height", 50);
}


//TODO: wrap this all up into a nice abstractable class thing :)
//      - get rid of magic numbers
//      - make it work for negative values (might work already)
