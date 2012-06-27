var data = [1, 5, 10, 7, 10, 0, 7, -8, 6, 3, 0, 1, 2, 7, 8, 2];

var colors = ["#F88", "#F44"];
//var colors = ["steelblue", "lightblue"];
var numOfBands = 4;
var height = 50;
var width = document.documentElement.clientWidth - 20;

var upperBound = d3.max(data); //TODO: make use of these in scales.
var lowerBound = d3.min(0, d3.min(data));

var d3area1 = d3.svg.area()
  .x(function (d, i) { return width / (data.length - 1) * i; })
  .y1(function (d, i) { return height - (d * 10); })
  .y0(height)
  .interpolate("cardinal");

//Set the chart's dimensions
d3.select("#chart")
  .attr("width", width)
  .attr("height", height)

//Draw the background for the chart
d3.select("#chart")
  .insert("svg:rect")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "#FFF");

//Our canvas, where the curves will be rendered, and which will be clipped.
var chart = d3.select("#chart").append("svg:g");

//Make the clipPath (for cropping the paths)
chart.insert("defs")
  .append("clipPath")
    .attr("id", "clip")
  .append("rect")
    .attr("width", width)
    .attr("height", height); //height / 4 - 20);

//Make and render the curves.
chart.selectAll("path")
    .data(d3.range(numOfBands))
  .enter().append("path")
    .attr("fill", "rgba(0, 0, 255, " + 1.0 / numOfBands + ")") //function (d, i) { return colors[i]; })
    .style("stroke-width", 2)
    .style("cursor", "help")
    .attr("d", d3area1(data))
    .attr("transform", function (d, i) {return "translate(0, " + (i - 1) * 50 + ")"; });


//Draw the outline for the chart
d3.select("#chart")
  .append("svg:rect")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "rgba(0,0,0,0)")
    .style("stroke-width", 3)
    .style("stroke", "#000");


//TODO: wrap this all up into a nice abstractable class thing :)
//      - use scales instead of magic
//      - make it work for negative values
//      Make the graph dynamic so that it sizes according to the screen
//      - this might just mean setting it statically each time the screen is loaded or rotated.
//      Either use transparency for the colours, or find a sweet way to make it an equation.
