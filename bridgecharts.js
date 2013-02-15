//{{{ ZOOMING AND CHANGING
var supportsOrientationChange = "onorientationchange" in window;
var orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";
window.addEventListener(
  orientationEvent,
  function() {
    if (navigator.userAgent.match(/android/i)) {
      setTimeout("redraw()", 500); //Only wait for Android
    } else {
      redraw();
    }
  },
  false
);

document.getElementById("render-lines").addEventListener("change", changeLines, false);
document.getElementById("render-depth").addEventListener("change", changeLines, false);
//  an alternative so that it waits for you to lift up your mouse/finger:
//document.getElementById("render-depth").addEventListener("mouseup", changeLines, false);
//document.getElementById("render-depth").addEventListener("touchend", changeLines, false);
document.getElementById("render-method").addEventListener("change", changeLines, false);

// TODO: magic: make this relative to maxBinRenderSize
var zoomExtents = [Math.pow(2, -32), Math.pow(2,3)];

d3.select("#zoomin").on("click", zoomin);
d3.select("#zoomout").on("click", zoomout);
d3.select("#scrollleft").on("click", scrollleft);
d3.select("#scrollright").on("click", scrollright);

// ZOOMING AND CHANGING }}}

//{{{ VARIABLES

var plots = []; //an array of all plots

// TODO: sync this with the one in bridgeChart.js
var margin = {top: 10, right: 10, bottom: 25, left: 40};

var zoomSVG = d3.select("#zoomSVG");
var zoomRect = d3.select("#zoomRect");

// these are the overall scales which are modified by zooming
// they should be set as the default for new plots
var xScale = d3.scale.linear().domain([0, 1000]).range([0, document.getElementById("chartContainer").offsetWidth]);
var yScale = d3.scale.linear();

var frequency = 200; //Hz

// VARIABLES }}}

//{{{ HELPER FUNCTIONS

var redraw = function () {
  plots.forEach(function (plt) {
    plt.containerWidth(document.getElementById("chartContainer").offsetWidth).update();
  });
  d3.select("#charts").attr("width", document.getElementById("chartContainer").offsetWidth);
  zoomSVG.attr("width", document.getElementById("chartContainer").offsetWidth)
          .attr("height", document.getElementById("chartContainer").offsetHeight);
  zoomRect.attr("width", document.getElementById("chartContainer").offsetWidth - margin.left - margin.right)
           .attr("height", document.getElementById("chartContainer").offsetHeight)
           .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

  //update the zoom for the new plot size
  updateZoom();
}

function transitionAllNextTime() {
  plots.forEach(function (plt) {
    plt.transitionNextTime(true);
  });
}

function initPlot(data) {
  var plot = binnedLineChart(data);
  plot.xScale(copyScale(xScale));

  var pl = d3.select("#charts").append("g").call(plot);

  plot.containerWidth(document.getElementById("chartContainer").offsetWidth).height(75).marginTop(120*plots.length + 10).update();

  plots.push(plot);

  redraw();

  d3.select("#charts").attr("height", 120*plots.length).attr("width", document.getElementById("chartContainer").offsetWidth); //TODO: make this dynamic

  zoomSVG.attr("width", document.getElementById("chartContainer").offsetWidth)
         .attr("height", document.getElementById("chartContainer").offsetHeight)
         .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

  zoomRect.attr("width", document.getElementById("chartContainer").offsetWidth - margin.left - margin.right)
          .attr("height", document.getElementById("chartContainer").offsetHeight - margin.top)
          .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

  zoomRect.attr("fill", "rgba(0,0,0,0)")
          .call(zoom);

  // Redefine this function now that we have data for it to work from
  updateZoom = function () {
    xScale = plot.xScale();
    yScale = plot.yScale();
    zoom.x(xScale);
    zoom.y(yScale);
  };

  updateZoom();
}

// this will be changed once 'news' is sent from the server
// for now it's just a dummy
var updateZoom = function () { return 0; };


function copyScale(scal) {
  return d3.scale.linear().domain([scal.domain()[0], scal.domain()[1]]).range([scal.range()[0], scal.range()[1]]);
}

function zoomAll() {
  console.log(zoom.translate());
  plots.forEach(function (plt) {
    plt.xScale(copyScale(xScale)).update();
  });
}

var zoom = d3.behavior.zoom()
  .scaleExtent(zoomExtents)
  .on("zoom", zoomAll);


function changeLines () {
  plots.forEach(function (plt) {
    plt.setSelectedLines()/*.reRenderTheNextTime(true)*/.update();
  });
}

// func1 is the function which modifies the domain start in terms of the old domain start, and xdist
// func2 is the function which modifies the domain end in terms of the old domain end, and xdist
function changeZoom(func1, func2) {
  var xdist = xScale.domain()[1] - xScale.domain()[0];

  var tmpScale = d3.scale.linear().range(xScale.range());
  tmpScale.domain([
    func1(xScale.domain()[0], xdist),
    func2(xScale.domain()[1], xdist)
  ]);

  //xScale =
    changeXScale(xScale, tmpScale);

  transitionAllNextTime();
  zoomAll();
}

function getScaleValue(scal) {
  // gives a result which has units pixels / samples
  return (scal.range()[1] - scal.range()[0])/ (scal.domain()[1] - scal.domain()[0]);
}

function changeXScale (scal, value) {
  // set zoom extents for button zooming as well
  // TODO: set zoom to correspond with this. Currently they don't work together.
  if (getScaleValue(value) < zoomExtents[1] && getScaleValue(value) > zoomExtents[0] ) {
    // Doing this manually because cursor zooming and button zooming
    //   don't place nice together when extents are involved.
    // To be more specific, applying the x scale again resets
    //   the zoom scale.
      console.log("----------");
    var ratio = getScaleValue(scal) / getScaleValue(value);
    // find the difference between the averages
    var avg = function (dom) {
      return (dom[0] + dom[1]) / 2.0;
    }

    somerat = getScaleValue(scal);

    var old = value.domain()[1] - value.domain()[0];
    console.log("ratio: " + ratio);
    console.log("old: " + old);
    console.log("old/ratio: " + (old*ratio));

    var diff = value.domain()[0] - scal.domain()[0];
    // centreValue is the offset in PIXELS...
    // TODO: translate pixels to domain
    // .invert(val)
    var centreValue = (scal.domain()[1] - scal.domain()[0]) / 2;
    console.log("centreValue: " + centreValue);
    console.log("centreValue * somerat: " + centreValue * somerat);
    console.log("centreValue / somerat: " + centreValue / somerat);
    console.log("scal: " + scal.domain() + " val: " + value.domain());
    console.log("diff: " + diff);
      //console.log(ratio);
      console.log("zoom.scale(): " + zoom.scale());
      //console.log("getscv(xScale): " + getScaleValue(scal))
      //console.log("getscv(value): " + getScaleValue(value))
      console.log("translate: " + zoom.translate());
    //zoom.x(value);
    var sc = zoom.scale();
    var tr = zoom.translate();
      //console.log(sc);
    //zoom.translate([zoom.translate()[0] + diff - (old*ratio), zoom.translate()[1]]);
    //zoom.translate([zoom.translate()[0] + (diff/2), zoom.translate()[1]]);
    //zoom.translate([tr[0] - (diff/4), tr[1]]);
      console.log("translate: " + zoom.translate());
    //zoom.translate([tr[0]/ratio, tr[1]]);
    zoom.translate([value.invert(centreValue), tr[1]]);
    var range = value.range()[1] - value.range()[0];
      console.log("range: " + range);
      console.log("value.invert(centreValue): " + value.invert(centreValue));
      console.log( zoom.translate()[0] * (896 / (value.range()[1] - value.range()[0])));
    zoom.scale(sc / ratio);
      console.log("zoom.scale(): " + zoom.scale());
      console.log(document.getElementById("chartContainer").offsetWidth);
    return value;
  } else {
    console.log("bad extents: " + getScaleValue(value));
    return scal;
  }
}

function zoomin() {
  changeZoom(
    function (a, b) { return a + (b/4); },
    function (a, b) { return a - (b/4); }
  );
}

function zoomout() {
  changeZoom(
    function (a, b) { return a - (b/2); },
    function (a, b) { return a + (b/2); }
  );
}

function scrollleft() {
  changeZoom(
    function (a, b) { return a + (b/4); },
    function (a, b) { return a + (b/4); }
  );
}

function scrollright() {
  changeZoom(
    function (a, b) { return a - (b/4); },
    function (a, b) { return a - (b/4); }
  );
}

// HELPER FUNCTIONS }}}

//{{{ SERVER COMMUNICATIONS

var socket = io.connect('130.179.231.28:8080/');
var firstTime = true;

//socket.on('connect_failed', function () {
//  console.log("connect_failed :(");
//});
//
//socket.on('connecting', function () {
//  console.log("connecting :!");
//});
//
//socket.on('connect', function () {
//  console.log("connected !!");
//});
//
//socket.on('disconnect', function () {
//  console.log("disconnected !!");
//});


socket.on('news', function (data) {
  // only do this once, so that plots don't get overlapped whenever the server restarts.
  if (!firstTime) {
    return;
  }
  // TODO: extract data about which "level" the data is for.
  // SPB is 200Hz

  firstTime = false;

  // deleting all example plots -->
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

  //initPlot(json);
  initPlot(_.map(json, function (d) { return { ESGgirder18: d.ESGgirder18, SampleIndex: d.SampleIndex*(1000/frequency)}; }));
  initPlot(_.map(json, function (d) { return { ESGgirder18: Math.random() * 5 + d.ESGgirder18, SampleIndex: d.SampleIndex*(1000/frequency)}; }));
});

// SERVER COMMUNICATIONS }}}

//{{{ OFFLINE DEMO

// A demonstration with example data in case the server is down:
// wait 2 seconds to give the server a chance to send the data (to avoid the demo popping up and then disappearing)
setTimeout(rundemo, 1500);

function rundemo() {
  d3.json("Server/esg_sample_index.js", function (error, data) {
    if (error || plots.length > 0) {
      return;
    }

    var json = data;

    //initPlot(json);
    initPlot(_.map(json, function (d) { return { ESGgirder18: d.ESGgirder18, SampleIndex: d.SampleIndex*(1000/frequency)}; }));
  });
}

// OFFLINE DEMO }}}

/* vim: set foldmethod=marker: */
