var data = [1, 5, 10, 7, 10, 0, 7, 8, 6, 3, 0, 1, 2, 7, 8, 2];

var chart = d3.select("#chart").append("svg:g");
var height = 50;
//var width = 800;
var width = document.documentElement.clientWidth - 20;

var numOfBands = 2;
var maxValue = d3.max(data);
var modValue = d3.max(data) / numOfBands; //TODO: use a d3 scale instead.


//var colors = ["steelblue", "lightblue"];
var colors = ["#F88", "#F44"];

var d3area1 = d3.svg.area()
  .x(function (d, i) { return width / data.length * i; })
  .y1(function (d, i) { return 100 - (d * 10); })
  .y0(100)
  .interpolate("cardinal");

d3.select("#chart")
  .attr("width", width)
  .attr("height", height);

chart.insert("defs")
  .append("clipPath")
    .attr("id", "clip")
  .append("rect")
    .attr("width", width)
    .attr("height", height); //height / 4 - 20);

chart.attr("width", width + 100)
//  .attr("clip-path", "url(#clip)")
  .attr("height", height + 100);

chart.selectAll("path")
    .data(d3.range(numOfBands))
  .enter().append("path")
    .attr("fill", function (d, i) { return colors[i]; })
    .style("stroke-width", 2)
    .style("cursor", "help")
    .attr("d", d3area1(data))
    .attr("transform", function (d, i) {return "translate(0, " + (i - 1) * 50 + ")"; });




//TODO: wrap this all up into a nice abstractable class thing :)
//      - use scales instead of magic
//      - make it work for negative values (might work already)
//      Make the graph dynamic so that it sizes according to the screen
//      - this might just mean setting it statically each time the screen is loaded or rotated.
