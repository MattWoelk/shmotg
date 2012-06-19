var MARGINS = {top: 2, right: 2, bottom: 2, left: 2}, // margins around the graph (percentages)
  xRange = d3.scale.linear().range([MARGINS.left + "%", (100 - MARGINS.right) + "%"]), // x range function (percentages)
  yRange = d3.scale.linear().range([100 - MARGINS.top, MARGINS.bottom]), // y range function (percentages)
  //rRange = d3.scale.linear().range([5, 20]); // radius range function - ensures the radius is between 5 and 20
  xAxis = d3.svg.axis().scale(xRange).tickSize(10).tickSubdivide(true),
  yAxis = d3.svg.axis().scale(yRange).tickSize(10).tickSubdivide(true).orient("right"),
  chart, //the chart where everything is drawn.
  drawingData, //the data which will be drawn.
  species= [
    "setosa",
    "versicolor",
    "virginica"],
  flowerVars = [
    "seplen",
    "sepwid",
    "petlen",
    "petwid"
  ],
  flowerData;

chart = d3.select("#chart");

chart.attr("width", "600px")
  .attr("height", "200px");

d3.csv("iris.csv", function(data) {
  drawingData = data;
  d3.select("#chart").selectAll("circle")
      .data(data)
    .enter().append("circle")
      .attr("r", function(d) { return d.seplen; })
      .attr("cx", function(d) { return d.sepwid * 20; })
      .attr("cy", function(d) { return 20*d.petlen; })
      .attr("class", function(d) { return d.species + "_svg"; });
  redraw();
});



// this redraws the graph when forms are clicked
function redraw () {
  console.log("redraw:");
  // THIS WHOLE FUNCTION DOES NOT YET WORK //
  chart = d3.select("#chart");

  //console.log(chart);

  var dataPoints = chart.selectAll("circle").data(drawingData), // select the data points and set their data
    axes = getChosenAxes (); // object containing the axes we'd like to use (duration, inversions, etc.)

  //console.log(dataPoints);

  xRange.domain([
    d3.min(drawingData, function (d) { return +d[axes.xAxis]; }),
    d3.max(drawingData, function (d) { return +d[axes.xAxis]; })
  ]);
  yRange.domain([
    d3.min(drawingData, function (d) { return +d[axes.yAxis]; }),
    d3.max(drawingData, function (d) { return +d[axes.yAxis]; })
  ]);

  // add new points if they're needed
  //dataPoints.enter()
    //.append("svg:circle")
      //.attr("cx", 10)
      //.attr("cy", 10)
      //.style("fill", "#f0f"); // set fill colour from the colours array

  /*
  // the data domains or desired axes might have changed, so update them all
  xRange.domain([
    d3.min(drawingData, function (d) { return +d[axes.xAxis]; }),
    d3.max(drawingData, function (d) { return +d[axes.xAxis]; })
  ]);
  yRange.domain([
    d3.min(drawingData, function (d) { return +d[axes.yAxis]; }),
    d3.max(drawingData, function (d) { return +d[axes.yAxis]; })
  ]);
  rRange.domain([
    d3.min(drawingData, function (d) { return +d[axes.radiusAxis]; }),
    d3.max(drawingData, function (d) { return +d[axes.radiusAxis]; })
  ]);

  // transition function for the axes
    var t = vis.transition().duration(1500).ease("exp-in-out");
    t.select(".x.axis").call(xAxis);
    t.select(".y.axis").call(yAxis);
*/
  // transition the points
  dataPoints.transition().duration(1500).ease("exp-in-out")
    .style("opacity", 1)
    .attr("cx", function (d) { return xRange (d[axes.xAxis]); })
    .attr("cy", function (d) { return yRange (d[axes.yAxis]); });
//    .style("fill", function (d) { return colours[d.type.id]; }) // set fill colour from the colours array
//    .attr("r", function(d) { return rRange (d[axes.radiusAxis]); })
//    .attr("cx", function (d) { return xRange (d[axes.xAxis]); })
//    .attr("cy", function (d) { return yRange (d[axes.yAxis]); });
/*
  // remove points if we don't need them anymore
  rollercoasters.exit()
    .transition().duration(1500).ease("exp-in-out")
    .attr("cx", function (d) { return xRange (d[axes.xAxis]); })
    .attr("cy", function (d) { return yRange (d[axes.yAxis]); })
      .style("opacity", 0)
      .attr("r", 0)
        .remove();
        */
}


/////// HELPER METHODS: ////////

// return an object containing the currently selected axis choices
function getChosenAxes () {
  return {
    xAxis      : document.querySelector("#x-axis input:checked").value,
    yAxis      : document.querySelector("#y-axis input:checked").value,
  };
}

// return a list of types which are currently selected
function getChosenFlowers () {
  return [].map.call (document.querySelectorAll ("#coaster-types input:checked"), function (checkbox) { return checkbox.value;} );
}

// listen to the form fields changing
document.getElementById("controls").addEventListener ("click", redraw, false);
document.getElementById("controls").addEventListener ("keyup", redraw, false);

