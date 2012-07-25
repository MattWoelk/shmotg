//TODO:
//      Make sure it works for any number of bands >= 1
//      - currently things get overlappy and weird when the bandSize is changed to very different values and then updated.
//      Test with only negative values; only positive values.
//      Test with different zero levels of all possibilities.
//      Add Axes and the ability to modify the bandSize
//      strange things happen for various bandSize's and negative and positive values.

var horizonChart = function () {
  var bandSize = 3.5; // maybe have this constant band size instead of setting the number of bands.
  var outlinesOrNot = true;


  var margins = {top: 0, left: 25, bottom: 25, right: 25};

  var height = 50;
  var width = d3.max([window.innerWidth, screen.width]);
  var zeroPoint = 0; //TODO: use scales instead? Might make things WAY simpler if we scale the data

  var numOfPositiveBands;
  var numOfNegativeBands;
  var numOfMostBands;

  var bkgrect;
  var frgrect;
  var defclip;
  var xAxisContainer;
  var xAxis;
  var yAxisContainer;
  var yAxis;
  var xScale;
  var yScale;
  var xAxisScale;

  var chart;
  var paths;

  var slctn; // Save the selection so that my.update() works.


  var my = function (selection) {
    //console.log(document.getElementById("charts").offsetWidth + " : " + window.innerWidth);
    slctn = selection; // Save the selection so that my.update() works.

    realWidth = width - margins.right - margins.left;
    //width = width - margins.right - margins.left;

    selection.each(function (data) {

    numOfPositiveBands = (d3.max(data) > zeroPoint) ? Math.ceil(Math.abs(d3.max(data) - zeroPoint) / bandSize) : 0; // the closest to mod bandSize, rounded up.
    numOfNegativeBands = (d3.min(data) < zeroPoint) ? Math.ceil(Math.abs(zeroPoint - d3.min(data)) / bandSize) : 0;
    numOfMostBands = d3.max([numOfPositiveBands, numOfNegativeBands]);

    if (!xScale) {
      xScale = d3.scale.linear()
        .domain([0, data.length])
        .range([0, realWidth + (realWidth / (data.length - 1))]); // So that the furthest-right point is at the right edge of the plot
    }else{
      xScale
        .range([0, realWidth + (realWidth / (data.length - 1))]); // So that the furthest-right point is at the right edge of the plot
    }

    if (!xAxisScale) {
    xAxisScale = d3.scale.linear() //different than xScale because we want the right-most point to be at the right edge of the chart
      .domain([0, data.length - 1])
      .range([0, realWidth]);
    }else{
      xAxisScale
        .range([0, realWidth]);
    }

    if (!yScale){
      yScale = d3.scale.linear()
        .domain([zeroPoint, d3.max([zeroPoint, numOfMostBands * bandSize])])
        .range([height * numOfPositiveBands, 0]);
    }else{
      yScale
        .domain([zeroPoint, d3.max([zeroPoint, numOfMostBands * bandSize])])
        .range([height * numOfPositiveBands, 0]);
    }

    var fillScale = d3.scale.linear()
      .domain([0, numOfMostBands])
      .rangeRound([255, 0]);


    var d3area1 = d3.svg.area()
          .x(function (d, i) { return xScale(i); })
          .y1(function (d, i) { return yScale(d); }) // height - (d * 10); })
          .y0(height * numOfPositiveBands) //TODO: change this to both Pos and Neg or something ??? Probably perfect how it is.
//              .interpolate("cardinal");
              .interpolate("linear");

    chart = d3.select(this); //TODO: Since we're using a .call(), "this" is the svg element.

    //Set it's container's dimensions
    selection
      .attr("height", height + margins.bottom)
      .attr("width", width);

    //Set the chart's dimensions
    chart
      .attr("width", width - 10) //TODO: magic numbers to get rid of scroll bars
      .attr("height", height + margins.bottom);

    //Draw the background for the chart
    if (!bkgrect)
    {
      bkgrect = chart
        .insert("svg:rect")
          .attr("width", realWidth)
          .attr("height", height)
          .attr("class", "bkgrect")
          .attr("transform", "translate(" + margins.left + ", 0)")
          .style("fill", "#FFF");
    }else{
      bkgrect
        .attr("width", realWidth)
        .attr("height", height)
        .attr("transform", "translate(" + margins.left + ", 0)")
        .style("fill", "#FFF");
    }

    //Make the clipPath (for cropping the paths)
    if (!defclip)
    {
      defclip = chart.insert("defs")
        .append("clipPath")
          .attr("id", "clip")
        .append("rect")
          .attr("width", realWidth)
          .attr("transform", "translate(" + margins.left + ", 0)")
          .attr("height", height);
    }else{
      defclip
        .attr("width", realWidth)
        .attr("transform", "translate(" + margins.left + ", 0)")
        .attr("height", height);
    }

    //Apply the clipPath
    paths = !paths ? chart.append("g") : paths;
    paths
        .attr("clip-path", "url(#clip)")
        .attr("class", "paths")
        .attr("height", height);

    var currentSelection;

    //Make and render the Positive curves.
    currentSelection = paths.selectAll(".posPath")
        .data(d3.range(numOfMostBands));

    var d3area1withdata = d3area1(data);

    //update
    currentSelection
        .attr("fill", function (d, i) { return "rgba(255, " + fillScale(i + 1) + ", " + fillScale(i + 1) + ", 1)"; })
        .style("stroke-width", function () { return outlinesOrNot ? 1 : 0; })
        //.style("cursor", "help")
        .style("stroke", "#000")
        .transition().duration(1000)
        .attr("d", d3area1withdata)
        .attr("transform", function (d, i) {return "translate(" + margins.left + ", " + (i - numOfMostBands + 1) * height + ")"; });

    //enter
    currentSelection.enter().append("path")
        .attr("class", "posPath")
        .attr("fill", function (d, i) { return "rgba(255, " + fillScale(i + 1) + ", " + fillScale(i + 1) + ", 1)"; })
        .style("stroke-width", function () { return outlinesOrNot ? 1 : 0; })
        .style("stroke", "#000")
        .attr("d", d3area1withdata)
        .attr("transform", function (d, i) {return "translate(" + margins.left + ", " + (i - numOfMostBands + 1) * height + ")"; });


    //Make and render the Negative curves.
    currentSelection = paths.selectAll(".negPath")
        .data(d3.range(numOfMostBands, 0, -1));

    //update
    currentSelection
      .attr("class", "negPath")
      .attr("fill", function (d, i) { return "rgba(" + fillScale(i + 1) + ", " + fillScale(i + 1) + ", 255, 1)"; })
      .style("stroke-width", function () { return outlinesOrNot ? 1 : 0; })
      .style("stroke", "#000")
      .transition().duration(1000)
      .attr("d", d3area1withdata)
      .attr("transform", function (d, i) {return "translate(" + margins.left + ", " + (d - (numOfMostBands * 2)) * height + ")"; });

    //enter
    currentSelection.enter().append("path")
      .attr("class", "negPath")
      .attr("fill", function (d, i) { return "rgba(" + fillScale(i + 1) + ", " + fillScale(i + 1) + ", 255, 1)"; })
      .style("stroke-width", function () { return outlinesOrNot ? 1 : 0; })
      .style("stroke", "#000")
      .attr("d", d3area1withdata)
      .attr("transform", function (d, i) {return "translate(" + margins.left + ", " + (d - (numOfMostBands * 2)) * height + ")"; });

      // Draw Axes
      xAxis = d3.svg.axis()
        .scale(xAxisScale).orient("bottom");
      yAxis = d3.svg.axis().scale(yScale).orient("bottom");

      if(!xAxisContainer)
      {
        xAxisContainer = chart.append("svg:g")
          .attr("class", "x axis")
          .attr("transform", "translate(" + margins.left + "," + height + ")");
        xAxisContainer.call(xAxis);
      }else{
        d3.select(".x")
          .attr("transform", "translate(" + margins.left + "," + height + ")");
        xAxisContainer.transition().duration(1000).call(xAxis);
      }

      //Draw the outline for the chart
      if(!frgrect)
      {
        frgrect = chart
          .append("svg:rect")
            .attr("width", realWidth)
            .attr("height", height)
            .attr("class", "frgrect")
            .style("fill", "rgba(0,0,0,0)")
            .style("stroke-width", 3)
            .attr("transform", "translate(" + margins.left + ", 0)")
            .style("stroke", "#000");
      }else{
        frgrect
            .attr("width", realWidth)
            .attr("height", height)
            .style("fill", "rgba(0,0,0,0)")
            .style("stroke-width", 3)
            .attr("transform", "translate(" + margins.left + ", 0)")
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

  my.outlinesOrNot = function (value) {
    if (!arguments.length) return outlinesOrNot;
    outlinesOrNot = value;
    return my;
  }

  my.zoomout = function () {
    xScale.domain([0, xScale.domain()[1] * 2]);
    xAxisScale.domain([0, xAxisScale.domain()[1] * 2]);
    return my;
  }

  my.zoomin = function () {
    xScale.domain([0, xScale.domain()[1] / 2]);
    xAxisScale.domain([0, xAxisScale.domain()[1] / 2]);
    return my;
  }

  my.update = function () {
    my(slctn);
  }

  return my;
}

//greatest value of screen.width and window.innerWidth ???
