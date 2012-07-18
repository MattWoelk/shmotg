var plots = []; //an array of all plots

console.log(document.getElementById("charts").offsetWidth);
//document.getElementById("charts").offsetWidth //this works KINDA:
//- since there are larger elements on the background, the 100% width
//  div doesn't always to back to being smaller. :/

var outlinesOrNot = true;

// === Rotating and Resizing: ===
// Detect whether device supports orientationchange event, otherwise fall back to the resize event
var supportsOrientationChange = "onorientationchange" in window,
    orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";
window.addEventListener(orientationEvent, function() {
  redraw();
}, false);

var redraw = function () {
  plots.forEach(function (plt) {
    plt.width(supportsOrientationChange ? d3.max([window.innerWidth, screen.width]) : window.innerWidth).update();
  });
}


var dataA = [0, 5, 2, -3, 4, 6, 8, 4, -2, 0];
var dataB = [2, 1, 2, -1, -2, -5, -9, 2, 6, 10];
var dataC = [-2, -1, -2, 1, 2, 5, 9, -2, -6, -10];
var dataD = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
plot1 = horizonChart().width(100).height(100);
plot2 = horizonChart().width(supportsOrientationChange ? d3.max([window.innerWidth, screen.width]) : window.innerWidth);
plot3 = horizonChart().width(supportsOrientationChange ? d3.max([window.innerWidth, screen.width]) : window.innerWidth);
plot4 = horizonChart().width(supportsOrientationChange ? d3.max([window.innerWidth, screen.width]) : window.innerWidth);

pl1 = d3.select("#charts").append("svg").datum(dataA).call(plot1);
pl2 = d3.select("#charts").append("svg").datum(dataB).call(plot2);
pl3 = d3.select("#charts").append("svg").datum(dataC).call(plot3);
pl4 = d3.select("#charts").append("svg").datum(dataD).call(plot4);

// This is how we change a value and update the plot.
plot1.height(50).width(supportsOrientationChange ? d3.max([window.innerWidth, screen.width]) : window.innerWidth);
//pl1.call(plot1); // this is an option, but the next one is easier.
plot1.update(); // easy now that we've stored the selection within the plot. Plot instances are now not reusable for more than one data set. This is okay I think.

// This is even EVEN better.
plot3.bandSize(4).update();
plot4.bandSize(1).update();

//So that we can change and update them whenever we like. :)
//  keep them in a nice array
plots.push(plot1);
plots.push(plot2);
plots.push(plot3);
plots.push(plot4);
