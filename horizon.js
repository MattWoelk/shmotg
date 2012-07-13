var plots = []; //an array of all plots

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
    plt.width(window.innerWidth - 20).update();
  });
}


var dataA = [0, 5, 2, -3, 4, 6, 8, 4, -2, 0];
var dataB = [2, 1, 2, -1, -2, -5, -9, 2, 6, 10];
var dataC = [-2, -1, -2, 1, 2, 5, 9, -2, -6, -10];
plot1 = horizonChart().width(100).height(100);
plot2 = horizonChart().width(window.innerWidth - 20); //TODO: magic
plot3 = horizonChart().width(window.innerWidth - 20); //TODO: magic

pl1 = d3.select("#charts").append("svg").datum(dataA).call(plot1);
pl2 = d3.select("#charts").append("svg").datum(dataB).call(plot2);
pl3 = d3.select("#charts").append("svg").datum(dataC).call(plot3);

// This is how we change a value and update the plot.
plot1.height(50).width(window.innerWidth - 20);
//pl1.call(plot1); // this is an option, but the next one is easier.
plot1.update(); // easy now that we've stored the selection within the plot. Plot instances are now not reusable for more than one data set. This is okay I think.

// This is even EVEN better.
plot3.bandSize(4).update();

//So that we can change and update them whenever we like. :)
//  keep them in a nice array
plots.push(plot1);
plots.push(plot2);
plots.push(plot3);
