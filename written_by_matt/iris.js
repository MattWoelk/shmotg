//IDEAS:
// - a 'keep axes rigid' button which keeps the upper and lower bounds on the graph constant, independent of what property is being shown.

var MARGINS = {top: 15, right: 15, bottom: 15, left: 15}, // margins around the graph (percentages)
  xRange = d3.scale.linear().range([MARGINS.left + "%", (100 - MARGINS.right) + "%"]), // x range function (percentages)
  yRange = d3.scale.linear().range([100 - MARGINS.top + "%", MARGINS.bottom + "%"]), // y range function (percentages)
  xAxis = d3.svg.axis().scale(xRange).tickSize(10).tickSubdivide(true),
  yAxis = d3.svg.axis().scale(yRange).tickSize(10).tickSubdivide(true).orient("right"),
  chart, //the chart where everything is drawn.
  drawingData, //the data which will be drawn.
  flowerSpecies = [ //the species of the flowers
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

chart.attr("width", "100%")
  .attr("height", document.documentElement.clientHeight/2 - MARGINS.top - MARGINS.bottom)
  .attr("display", "block");

d3.csv("iris.csv", function(data) {
  drawingData = data;
  d3.select("#chart").selectAll("circle")
      .data(data)
    .enter().append("circle")
      .attr("r", function(d) { return 1; })
      .attr("cx", function(d) { return "50%"; })
      .attr("cy", function(d) { return "50%"; })
      .attr("class", function(d) { return d.species + "_svg"; });
  redraw();
});



// this redraws the graph when forms are clicked
function redraw () {
  chart = d3.select("#chart");

  var localDrawingData = filterOutUnwantedTypes(drawingData);
  //var localDrawingData = drawingData;
  console.log(getSelectedFlowerTypes());
  //console.log(filterOutUnwantedTypes(drawingData));

  var dataPoints = chart.selectAll("circle").data(localDrawingData, function (d) { return d.id; }), // select the data points and set their data
      axes = getChosenAxes (); // object containing the axes we'd like to use (duration, inversions, etc.)

  // add new points if they're needed
  dataPoints.enter()
    .insert("svg:circle")
      .attr("r", 0)
      .attr("cx", function (d) { return xRange (d[axes.xAxis]); })
      .attr("cy", function (d) { return yRange (d[axes.yAxis]); })
      .attr("class", function(d) { return d.species + "_svg"; });

  dataPoints.transition()
    .duration(1500)
    .attr("r", 5);

  xRange.domain([
    d3.min(localDrawingData, function (d) { return +d[axes.xAxis]; }),
    d3.max(localDrawingData, function (d) { return +d[axes.xAxis]; })
  ]);

  yRange.domain([
    d3.min(localDrawingData, function (d) { return +d[axes.yAxis]; }),
    d3.max(localDrawingData, function (d) { return +d[axes.yAxis]; })
  ]);

  // transition the points
  dataPoints.transition()
    .duration(1500)
    .attr("r", 5)
    .attr("cx", function (d) { return xRange (d[axes.xAxis]); })
    .attr("cy", function (d) { return yRange (d[axes.yAxis]); });

  // delete old points if they aren't needed
  dataPoints.exit()
    .transition()
    .duration(1500)
    .attr("r", 0)
    .attr("cx", function (d) { return xRange (d[axes.xAxis]); })
    .attr("cy", function (d) { return yRange (d[axes.yAxis]); })
    .remove();

  /*
  // the data domains or desired axes might have changed, so update them all
  xRange.domain([
    d3.min(localDrawingData, function (d) { return +d[axes.xAxis]; }),
    d3.max(localDrawingData, function (d) { return +d[axes.xAxis]; })
  ]);
  yRange.domain([
    d3.min(localDrawingData, function (d) { return +d[axes.yAxis]; }),
    d3.max(localDrawingData, function (d) { return +d[axes.yAxis]; })
  ]);
  rRange.domain([
    d3.min(localDrawingData, function (d) { return +d[axes.radiusAxis]; }),
    d3.max(localDrawingData, function (d) { return +d[axes.radiusAxis]; })
  ]);

  // transition function for the axes
    var t = vis.transition().duration(1500).ease("exp-in-out");
    t.select(".x.axis").call(xAxis);
    t.select(".y.axis").call(yAxis);
*/

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
    xAxis: document.querySelector("#x-axis input:checked").value,
    yAxis: document.querySelector("#y-axis input:checked").value,
  };
}

// return a list of types which are currently selected
function getSelectedFlowerTypes () {
  return [].map.call (document.querySelectorAll ("#flower-types input:checked"), function (checkbox) { return checkbox.value;} );
}

function filterOutUnwantedTypes (dataToBeFiltered) {
  var typesToInclude = getSelectedFlowerTypes();

  return dataToBeFiltered.filter (function (flr) {
    return typesToInclude.indexOf(flr.species) !== -1;
  });
}

// listen to the form fields changing
document.getElementById("controls").addEventListener ("change", redraw, false);
