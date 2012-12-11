var plots = []; //an array of all plots

var supportsOrientationChange = "onorientationchange" in window,
    orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";
window.addEventListener(orientationEvent, function() {
  setTimeout("redraw()", 500); //TODO: make only wait for Android
  //redraw();
}, false);

var redraw = function () {
  plots.forEach(function (plt) {
    plt.offsetWidth(document.getElementById("charts").offsetWidth).update();
  });
}

var changeLines = function () {
  plots.forEach(function (plt) {
    plt.setSelectedLines().update();
  });
}

document.getElementById("controls").addEventListener ("change", changeLines, false);

var zoomout = function () {
  plots.forEach(function (plt) {
    plt.zoomout().update();
  });
}

var zoomin = function () {
  plots.forEach(function (plt) {
    plt.zoomin().update();
  });
}


var socket = io.connect('http://shm1.eng.umanitoba.ca:8080/');

socket.on('news', function (data) {
  var json = JSON.parse(data);
  socket.emit('ack', "Message received!");

  var w = json.length;

  var plot10 = binnedLineChart();

  var pl10 = d3.select("#charts").append("svg").datum(_.map(json, function (d) { return -d.ESGgirder1; })).call(plot10);

  var plot11 = binnedLineChart();

  var pl11 = d3.select("#charts").append("svg").datum(_.map(json,function (d) { return Math.random() * 5 + -d.ESGgirder1; })).call(plot11);

  var plot12 = binnedLineChart();

  var pl12 = d3.select("#charts").append("svg").datum(_.map(json,function (d) { return Math.random() * 5 + -d.ESGgirder1; })).call(plot12);

  var plot13 = binnedLineChart();

  var pl13 = d3.select("#charts").append("svg").datum(_.map(json,function (d) { return Math.random() * 5 + -d.ESGgirder1; })).call(plot13);

  plot10.offsetWidth(document.getElementById("charts").offsetWidth).height(75).update();
  plot11.offsetWidth(document.getElementById("charts").offsetWidth).height(75).update();
  plot12.offsetWidth(document.getElementById("charts").offsetWidth).height(75).update();
  plot13.offsetWidth(document.getElementById("charts").offsetWidth).height(75).update();
  plots.push(plot10);
  plots.push(plot11);
  plots.push(plot12);
  plots.push(plot13);
  redraw();
});
