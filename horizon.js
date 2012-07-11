var plots = []; //an array of all plots

// === Rotating and Resizing: ===
// Detect whether device supports orientationchange event, otherwise fall back to
// the resize event.
var supportsOrientationChange = "onorientationchange" in window,
    orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";

window.addEventListener(orientationEvent, function() {
  //redraw the plots
  //alert("plots.length: " + plots.length);
  redraw();
}, false);

var redraw = function () {
  plots.forEach(function (plt) {
    //plt.width(document.documentElement.clientWidth - 20); //TODO: magic
    //plt.redraw();
    //plt.update();
    plt.width(document.documentElement.clientWidth - 20).update();
    //plt.update();
  });
  /////// my.update = function () { slctn.transition().call(my); };
};


var outlinesOrNot = true;

var coolChart = function () {
  var bandSize = 3.5; // maybe have this constant band size instead of setting the number of bands.

  var height = 50;
  var width = document.documentElement.clientWidth - 20; //TODO: magic
  var zeroPoint = 0; //TODO: use scales instead? Might make things WAY simpler if we scale the data

  var numOfPositiveBands;
  var numOfNegativeBands;
  var numOfMostBands;

  var bkgrect;
  var frgrect;
  var defclip;

  var slctn; // Save the selection so that my.update() works.


  var my = function (selection) {
    slctn = selection; // Save the selection so that my.update() works.

    selection.each(function (data) {

    numOfPositiveBands = (d3.max(data) > zeroPoint) ? Math.ceil(Math.abs(d3.max(data) - zeroPoint) / bandSize) : 0; // the closest to mod bandSize, rounded up.
    numOfNegativeBands = (d3.min(data) < zeroPoint) ? Math.ceil(Math.abs(zeroPoint - d3.min(data)) / bandSize) : 0;
    numOfMostBands = d3.max([numOfPositiveBands, numOfNegativeBands]);

    var xScale = d3.scale.linear()
      .domain([0, data.length])
      .range([0, width + (width / (data.length - 1))]); // So that the furthest-right point is at the right edge of the plot

    var yScale = d3.scale.linear()
      .domain([zeroPoint, d3.max([zeroPoint, numOfMostBands * bandSize])])
      .range([height * numOfPositiveBands, 0]);

    var fillScale = d3.scale.linear()
      .domain([0, numOfMostBands])
      .rangeRound([255, 0]);


    var d3area1 = d3.svg.area()
          .x(function (d, i) { return xScale(i); })
          .y1(function (d, i) { return yScale(d); }) // height - (d * 10); })
          .y0(height * numOfPositiveBands) //TODO: change this to both Pos and Neg or something ??? Probably perfect how it is.
              .interpolate("cardinal");

    chart = d3.select(this); //TODO: Since we're using a .call(), "this" is the svg element.
//    console.log(chart);

    //Set it's container's dimensions
    selection
      .attr("height", height)
      .attr("width", width);



    //TODO: the current problem is that too many rectangles are being created.
    //      we need to do something like if(!rect) set rect; else modify rect.

    //Set the chart's dimensions
    chart
      .attr("width", width)
      .attr("height", height);

    //Draw the background for the chart
    bkgrect = chart
      .insert("svg:rect")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "#FFF");

    //Make the clipPath (for cropping the paths)
    defclip = chart.insert("defs")
      .append("clipPath")
        .attr("id", "clip")
      .append("rect")
        .attr("width", width)
        .attr("height", height); //height / 4 - 20);

    //Apply the clipPath
    chart.attr("clip-path", "url(#clip)");


    //Make and render the Positive curves.
    chart.selectAll("posPath")
        .data(d3.range(numOfMostBands))
      .enter().append("path")
        .attr("class", "posPath")
        .attr("fill", function (d, i) { return "rgba(255, " + fillScale(i + 1) + ", " + fillScale(i + 1) + ", 1)"; })
        .style("stroke-width", function () { return outlinesOrNot ? 1 : 0; })
        .style("cursor", "help")
        .style("stroke", "#000")
        .attr("d", d3area1(data))
        .attr("transform", function (d, i) {return "translate(0, " + (i - numOfMostBands + 1) * height + ")"; });

    //Make and render the Negative curves.
    chart.selectAll("negPath")
        .data(d3.range(numOfMostBands, 0, -1))
      .enter().append("path")
        .attr("class", "negPath")
        .attr("fill", function (d, i) { return "rgba(" + fillScale(i + 1) + ", " + fillScale(i + 1) + ", 255, 1)"; })
        .style("stroke-width", function () { return outlinesOrNot ? 1 : 0; })
        .style("stroke", "#000")
        .style("cursor", "help")
        .attr("d", d3area1(data))
        .attr("transform", function (d, i) {return "translate(0, " + (d - (numOfMostBands * 2)) * height + ")"; });

      //Draw the outline for the chart /// TODO: fix this so that it's useful!?!?
      if(!frgrect)
      {
        frgrect = chart
          .append("svg:rect")
            .attr("width", width)
            .attr("height", height)
            .style("fill", "rgba(0,0,0,0)")
            .style("stroke-width", 3)
            .style("stroke", "#000");
      }else{
        frgrect
            .attr("width", width)
            .attr("height", height)
            .style("fill", "rgba(0,0,0,0)")
            .style("stroke-width", 3)
            .style("stroke", "#000");
      }



    });
  }

//  my.update = function () { slctn.transition().call(my); };
//
//  my.redraw = function () {
//    //TODO: put a bunch of the stuff from my() into here.
//    //      set x range, and transition (just like in iris.js)
//    // alert("redrawing");
//    selection.selectAll("rect")
//      .attr("width", width);
//
//    xScale
//      .domain([0, data.length])
//      .range([0, width + (width / (data.length - 1))]); // So that the furthest-right point is at the right edge of the plot
//    d3area1
//      .x(function (d, i) { return xScale(i); })
//
//    selection.selectAll("negPath")
//        .data(d3.range(numOfMostBands, 0, -1))
//      .enter().append("path")
//        .attr("class", "negPath")
//        .attr("fill", function (d, i) { return "rgba(" + fillScale(i + 1) + ", " + fillScale(i + 1) + ", 255, 1)"; })
//        .style("stroke-width", function () { return outlinesOrNot ? 1 : 0; })
//        .style("stroke", "#000")
//        .style("cursor", "help")
//        .attr("d", d3area1(data))
//
//
//  }

  my.width = function (value) {
    if (!arguments.length) return width;
    width = value;
//    selection.attr("width", width);
//    my.redraw();
    return my;
  }

  my.height = function (value) {
    if (!arguments.length) return height;
    height = value;
//    selection.attr("height", height);
//    my.redraw();
    return my;
  }

  my.update = function () {
    my(slctn);
  }

  return my;

  //TODO:
  //      Make the graph dynamic so that it sizes according to the screen
  //      - this might just mean setting it statically each time the screen is loaded or rotated.
  //      Either use transparency for the colours, or find a sweet way to make it an equation.
  //      Make sure it works for any number of bands >= 1
  //      Test with only negative values; only positive values.
  //      Test with different zero levels of all possibilities.
}


//var data = [0, -5, 10, -7, 10, -1, 7, 8, 2.5];
//var coolChart1 = coolChart(); //TODO: send it an appended one? That's probably most useful in the long run. AND that way we don't have data being assigned and re-assigned all over the place.
//plots.push (d3.select("#charts").append("svg")
//  .datum(data)
//  .call(coolChart()));




var dataA = [0, 5, 2, -3, 4, 6, 8, 4, -2, 0];
plot1 = coolChart().width(100).height(100);
plot2 = coolChart().width(document.documentElement.clientWidth - 20); //TODO: magic

pl1 = d3.select("#charts").append("svg").datum(dataA).call(plot1);
pl2 = d3.select("#charts").append("svg").datum(dataA).call(plot2);

// This is how we change a value and update the plot.
plot1.height(75).width(100);
//pl1.call(plot1);
plot1.update(); // easy now that we've stored the selection within the plot. Plot instances are now not reusable for more than one data set. This is okay I think.

plots.push(plot1);
plots.push(plot2);





//plots.push(coolChart1);

//coolChart1.width(100).height(70);

//var data2 = [2, 3, 2, 2, 3, 1, -1, 0, 1];
//var coolChart2 = coolChart(); // coolChart2 = my;
//d3.select("#charts").append("svg")
//  .datum(data2)
//  .call(coolChart()); // This essentially calls my(data) for the coolChart1 instance.
//
//plots.push(coolChart2);
//
//var data3 = [0, 1, -3, 10, 0, 5, -4, -10, 2.5];
//var coolChart3 = coolChart();
//d3.select("#charts").append("svg")
//  .datum(data3)
//  .call(coolChart());
//
//plots.push(coolChart3);
//
//var data4 = [10, 8, 9, 5, 3, 7, 4, 8, 9];
//var coolChart4 = coolChart();
//d3.select("#charts").append("svg")
//  .datum(data4)
//  .call(coolChart());
//
//plots.push(coolChart4);
