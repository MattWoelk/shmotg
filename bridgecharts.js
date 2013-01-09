var plots = []; //an array of all plots

// sync this with the one in bridgeChart.js
var margin = {top: 10, right: 10, bottom: 25, left: 40};

var supportsOrientationChange = "onorientationchange" in window,
    orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";
window.addEventListener(orientationEvent, function() {
  if (navigator.userAgent.match(/android/i)) {
    setTimeout("redraw()", 500); //Only wait for Android
  } else {
    redraw();
  }
}, false);

var zoom_svg = d3.select("#zoom_svg");
var chart_svg = d3.select("#charts");
var zoom_rect = d3.select("#zoom_rect");

var redraw = function () {
  plots.forEach(function (plt) {
    plt.container_width(document.getElementById("chart_container").offsetWidth).update();
  });
  chart_svg = d3.select("#charts");
  chart_svg.attr("width", document.getElementById("chart_container").offsetWidth);
  zoom_svg.attr("width", document.getElementById("chart_container").offsetWidth)
          .attr("height", document.getElementById("chart_container").offsetHeight);
  zoom_rect.attr("width", document.getElementById("chart_container").offsetWidth - margin.left - margin.right)
           .attr("height", document.getElementById("chart_container").offsetHeight)
           .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

  //update the zoom for the new plot size
  update_zoom();
}

// this will be changed once 'news' is sent from the server
// for now it's just a dummy
var update_zoom = function () { return 0; };


// these are the overall scales which are modified by zooming
// they should be set as the default for new plots
var xScale = d3.scale.linear().domain([100, 900]).range([0, document.getElementById("chart_container").offsetWidth]);
var yScale = d3.scale.linear();

function copy_scale(scal) {
  return d3.scale.linear().domain([scal.domain()[0], scal.domain()[1]]).range([scal.range()[0], scal.range()[1]]);
}

function zoom_all() {
  plots.forEach(function (plt) {
    plt.xScale(copy_scale(xScale)).update();
  });
}

var zoom = d3.behavior.zoom()
  .on("zoom", zoom_all);


var changeLines = function () {
  plots.forEach(function (plt) {
    plt.setSelectedLines().update();
  });
}

document.getElementById("controls").addEventListener ("change", changeLines, false);


var socket = io.connect('130.179.231.28:8080/');
var first_time = true;

socket.on('connect_failed', function () {
  console.log("connect_failed :(");
});

socket.on('connecting', function () {
  console.log("connecting :!");
});

socket.on('connect', function () {
  console.log("connected !!");
});

socket.on('disconnect', function () {
  console.log("disconnected !!");
});


// Set up the demo in case the server is down:
// TODO: find a way to check if the server is down, so this doesn't always happen

d3.json("Server/ESGgirder1_from_SPBRTData_0A.js", function (error, data) {
  if (error || plots.length > 0) {
    return;
  }

  var json = data;

  var plot10 = binnedLineChart(_.map(json, function (d) { return -d.ESGgirder1; }));
  plot10.xScale(copy_scale(xScale));

  var pl10 = d3.select("#charts").append("g").call(plot10);

  plot10.container_width(document.getElementById("chart_container").offsetWidth).height(75).margin_top(10).update();

  //plot10.offsetWidth(document.getElementById("chart_container").offsetWidth).height(75).margin_top(10).update();
  //plot11.offsetWidth(document.getElementById("chart_container").offsetWidth).height(75).margin_top(120*1 + 10).update();
  //plot12.offsetWidth(document.getElementById("chart_container").offsetWidth).height(75).margin_top(120*2 + 10).update();
  //plot13.offsetWidth(document.getElementById("chart_container").offsetWidth).height(75).margin_top(120*3 + 10).update();
  plots.push(plot10);

  // TODO: trim this all; put it into a separate function, so both this and the from-server code run the same identical code.
  redraw();

  d3.select("#charts").attr("height", 120*plots.length); //TODO: make this dynamic

  zoom_svg.attr("width", document.getElementById("chart_container").offsetWidth)
          .attr("height", document.getElementById("chart_container").offsetHeight)
          .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

  zoom_rect.attr("width", document.getElementById("chart_container").offsetWidth - margin.left - margin.right)
    .attr("height", document.getElementById("chart_container").offsetHeight - margin.top)
    .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

  zoom_rect.attr("fill", "rgba(0,0,0,0)")
    .call(zoom);

  //redefine this function now that we have data for it to work from
  update_zoom = function () {
    var x = copy_scale( plot10.xScale() );
    var y = copy_scale( plot10.yScale() );
    zoom.x(x);
    zoom.y(y);
  };

  update_zoom();

  d3.select("#zoomin").on("click", zoomin);
  d3.select("#zoomout").on("click", zoomout);
  d3.select("#scrollleft").on("click", scrollleft);
  d3.select("#scrollright").on("click", scrollright);

  function transition_all_next_time() {
    plots.forEach(function (plt) {
      plt.transition_the_next_time(true);
    });
  }

  function zoomin() {
    var xdist = xScale.domain()[1] - xScale.domain()[0];
    xScale.domain( [ xScale.domain()[0] + (xdist*1/4)
              , xScale.domain()[1] - (xdist*1/4) ]);
    zoom.x(xScale);
    transition_all_next_time();
    zoom_all();
  }

  function zoomout() {
    var xdist = xScale.domain()[1] - xScale.domain()[0];
    xScale.domain( [ xScale.domain()[0] - (xdist*1/2)
              , xScale.domain()[1] + (xdist*1/2) ]);
    zoom.x(xScale);
    transition_all_next_time();
    zoom_all();
  }

  function scrollleft() {
    var xdist = xScale.domain()[1] - xScale.domain()[0];
    xScale.domain( [ xScale.domain()[0] + (xdist*1/4)
              , xScale.domain()[1] + (xdist*1/4) ]);
    zoom.x(xScale);
    transition_all_next_time();
    zoom_all();
  }

  function scrollright() {
    var xdist = xScale.domain()[1] - xScale.domain()[0];
    xScale.domain( [ xScale.domain()[0] - (xdist*1/4)
              , xScale.domain()[1] - (xdist*1/4) ]);
    zoom.x(xScale);
    transition_all_next_time();
    zoom_all();
  }

});

socket.on('news', function (data) {
  //only do this once, so that plots don't get overlapped whenever the server restarts.
  if (!first_time) {
    return;
  }
  // TODO: extract data about which "level" the data is for.
  // SPB is 200Hz

  first_time = false;

  // delete all example plots -->
  _.times(plots.length, function (i) {
    delete plots[i];
  });
  svg = document.getElementById("charts");
  while (svg.lastChild) {
    svg.removeChild(svg.lastChild);
  }
  plots = []; // delete the previous plots
  // <-- done deleting all example plots

  var json = JSON.parse(data);
  socket.emit('ack', "Message received!");

  var plot10 = binnedLineChart(_.map(json, function (d) { return -d.ESGgirder1; }));
  plot10.xScale(copy_scale(xScale));

  var pl10 = d3.select("#charts").append("g").call(plot10);

  var plot11 = binnedLineChart(_.map(json,function (d) { return Math.random() * 5 + -d.ESGgirder1; }));
  plot11.xScale(copy_scale(xScale));

  var pl11 = d3.select("#charts").append("g").call(plot11);

//  var plot12 = binnedLineChart();
//
//  var pl12 = d3.select("#charts").append("g").datum(_.map(json,function (d) { return Math.random() * 5 + -d.ESGgirder1; })).call(plot12);
//
//  var plot13 = binnedLineChart();
//
//  var pl13 = d3.select("#charts").append("g").datum(_.map(json,function (d) { return Math.random() * 5 + -d.ESGgirder1; })).call(plot13);

  // TODO: make the margin_top values dynamic
  plot10.container_width(document.getElementById("chart_container").offsetWidth).height(75).margin_top(10).update();
  plot11.container_width(document.getElementById("chart_container").offsetWidth).height(75).margin_top(120*1 + 10).update();
//  plot12.container_width(document.getElementById("charts").offsetWidth).height(75).margin_top(120*2 + 10).update();
//  plot13.container_width(document.getElementById("charts").offsetWidth).height(75).margin_top(120*3 + 10).update();
  plots.push(plot10);
  plots.push(plot11);
//  plots.push(plot12);
//  plots.push(plot13);
  redraw();

  d3.select("#charts").attr("height", 120*plots.length).attr("width", document.getElementById("chart_container").offsetWidth);

  zoom_svg.attr("width", document.getElementById("chart_container").offsetWidth)
          .attr("height", document.getElementById("chart_container").offsetHeight)
          .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

  zoom_rect.attr("width", document.getElementById("chart_container").offsetWidth - margin.left - margin.right)
    .attr("height", document.getElementById("chart_container").offsetHeight - margin.top)
    .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

  zoom_rect.attr("fill", "rgba(0,0,0,0)")
    .call(zoom);

  //redefine this function now that we have data for it to work from
  update_zoom = function () {
    xScale = plot10.xScale();
    yScale = plot10.yScale();
    zoom.x(xScale);
    zoom.y(yScale);
  };

  update_zoom();

  d3.select("#zoomin").on("click", zoomin);
  d3.select("#zoomout").on("click", zoomout);

  function transition_all_next_time() {
    plots.forEach(function (plt) {
      plt.transition_the_next_time(true);
    });
  }

  function zoomin() {
    var xdist = xScale.domain()[1] - xScale.domain()[0];
    xScale.domain( [ xScale.domain()[0] + (xdist*1/4)
              , xScale.domain()[1] - (xdist*1/4) ]);
    zoom.x(xScale);
    transition_all_next_time();
    zoom_all();
  }

  function zoomout() {
    var xdist = xScale.domain()[1] - xScale.domain()[0];
    xScale.domain( [ xScale.domain()[0] - (xdist*1/2)
              , xScale.domain()[1] + (xdist*1/2) ]);
    zoom.x(xScale);
    transition_all_next_time();
    zoom_all();
  }

  //chart.call(d3.behavior.zoom().x(xScale).y(yScale).scaleExtent([0.125, 8]).on("zoom", my.zoom));
  //
  //var redraw = function () {
  //  plots.forEach(function (plt) {
  //    plt.offsetWidth(document.getElementById("charts").offsetWidth).update();
  //  });
  //}
});
