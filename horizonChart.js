//TODO:
//      Make sure it works for any number of bands >= 1
//      - currently things get overlappy and weird when the bandSize is changed to very different values and then updated.
//      Test with only negative values; only positive values.
//      Test with different zero levels of all possibilities.
//      Add Axes and the ability to modify the bandSize

var horizonChart = function () {
  var bandSize = 3.5; // maybe have this constant band size instead of setting the number of bands.

  var height = 50;
  var width = window.innerWidth - 20; //TODO: magic
  var zeroPoint = 0; //TODO: use scales instead? Might make things WAY simpler if we scale the data

  var numOfPositiveBands;
  var numOfNegativeBands;
  var numOfMostBands;

  var bkgrect;
  var frgrect;
  var defclip;

  var chart;

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

    //Set the chart's dimensions
    chart
      .attr("width", width)
      .attr("height", height);

    //Draw the background for the chart
    if (!bkgrect)
    {
      bkgrect = chart
        .insert("svg:rect")
          .attr("width", width)
          .attr("height", height)
          .attr("class", "bkgrect")
          .style("fill", "#FFF");
    }else{
      bkgrect
        .attr("width", width)
        .attr("height", height)
        .style("fill", "#FFF");
    }

    //Make the clipPath (for cropping the paths)
    if (!defclip)
    {
      defclip = chart.insert("defs")
        .append("clipPath")
          .attr("id", "clip")
        .append("rect")
          .attr("width", width)
          .attr("height", height); //height / 4 - 20);
    }else{
      defclip
        .attr("width", width)
        .attr("height", height);
    }

    //Apply the clipPath
    chart.attr("clip-path", "url(#clip)");

    var currentSelection;

    //Make and render the Positive curves.
    currentSelection = chart.selectAll(".posPath")
        .data(d3.range(numOfMostBands));

    //update
    currentSelection
        .attr("fill", function (d, i) { return "rgba(255, " + fillScale(i + 1) + ", " + fillScale(i + 1) + ", 1)"; })
        .style("stroke-width", function () { return outlinesOrNot ? 1 : 0; })
        .style("cursor", "help")
        .style("stroke", "#000")
        .attr("d", d3area1(data))
        .attr("transform", function (d, i) {return "translate(0, " + (i - numOfMostBands + 1) * height + ")"; });

    //enter
    currentSelection.enter().append("path")
        .attr("class", "posPath")
        .attr("fill", function (d, i) { return "rgba(255, " + fillScale(i + 1) + ", " + fillScale(i + 1) + ", 1)"; })
        .style("stroke-width", function () { return outlinesOrNot ? 1 : 0; })
        .style("cursor", "help")
        .style("stroke", "#000")
        .attr("d", d3area1(data))
        .attr("transform", function (d, i) {return "translate(0, " + (i - numOfMostBands + 1) * height + ")"; });


    //Make and render the Negative curves.
    currentSelection = chart.selectAll(".negPath")
        .data(d3.range(numOfMostBands, 0, -1));

    //update
    currentSelection
      .attr("class", "negPath")
      .attr("fill", function (d, i) { return "rgba(" + fillScale(i + 1) + ", " + fillScale(i + 1) + ", 255, 1)"; })
      .style("stroke-width", function () { return outlinesOrNot ? 1 : 0; })
      .style("stroke", "#000")
      .style("cursor", "help")
      .attr("d", d3area1(data))
      .attr("transform", function (d, i) {return "translate(0, " + (d - (numOfMostBands * 2)) * height + ")"; });

    //enter
    currentSelection.enter().append("path")
      .attr("class", "negPath")
      .attr("fill", function (d, i) { return "rgba(" + fillScale(i + 1) + ", " + fillScale(i + 1) + ", 255, 1)"; })
      .style("stroke-width", function () { return outlinesOrNot ? 1 : 0; })
      .style("stroke", "#000")
      .style("cursor", "help")
      .attr("d", d3area1(data))
      .attr("transform", function (d, i) {return "translate(0, " + (d - (numOfMostBands * 2)) * height + ")"; });

      //Draw the outline for the chart
      if(!frgrect)
      {
        frgrect = chart
          .append("svg:rect")
            .attr("width", width)
            .attr("height", height)
            .attr("class", "frgrect")
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


  // == Getters and Setters ==

  my.width = function (value) {
    if (!arguments.length) return width;
    width = value;
    return my;
  }

  my.height = function (value) {
    if (!arguments.length) return height;
    height = value;
    return my;
  }

  my.bandSize = function (value) {
    if (!arguments.length) return bandSize;
    bandSize = value;
    return my;
  }

  my.update = function () {
    my(slctn);
  }

  return my;
}
