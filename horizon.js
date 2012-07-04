
function coolChart() {
	var colors = ["#F88", "#F44"];
	//var colors = ["steelblue", "lightblue"];
	var numOfBands = 2;
	var height = 50;
	var width = document.documentElement.clientWidth - 20;
	var zeroPoint = 0;

	var bandSize = 5; // maybe have a constant band size instead of setting the number of bands.

	var upperBound = d3.max(data); //TODO: make use of these in scales.
	var lowerBound = d3.min(0, d3.min(data));

	var numOfPositiveBands = (d3.max(data) > zeroPoint) ? Math.ceil(Math.abs(d3.max(data) - zeroPoint) / bandSize) : 0; // the closest to mod bandSize, rounded up.
	var numOfNegativeBands = (d3.min(data) < zeroPoint) ? Math.ceil(Math.abs(zeroPoint - d3.min(data)) / bandSize) : 0;

	console.log("numPos: " + numOfPositiveBands); //TODO: test these with all types of input data. Maybe make test cases which use this as a module and render a bunch of different graphs. :D
	console.log("numNeg: " + numOfNegativeBands);

	var xScale = d3.scale.linear()
	  .domain([0, data.length])
	  .range([0, width + (width / (data.length - 1))]); // So that the furthest-right point is at the right edge of the plot

	var yScalePos = d3.scale.linear()
	  .domain([zeroPoint, d3.max([zeroPoint, d3.max(data)])])
	  .range([height * numOfPositiveBands, 0]);

	//var yScaleNeg = d3.scale.linear()
	//  .domain([d3.min(d3.min(data), zeroPoint), zeroPoint])
	//  .range([height * numOfBands, 0]);


	var d3area1 = d3.svg.area()
	  .x(function (d, i) { return xScale(i); })
	  .y1(function (d, i) { return yScalePos(d); }) // height - (d * 10); })
	  .y0(height * numOfBands)
	  .interpolate("cardinal");

	function my(selection) {

		selection.each(function (d, i) {
			//Set the chart's dimensions
			d3.select("#chart")
			  .attr("width", width * 2)
			  .attr("height", height);

			//Draw the background for the chart
			d3.select("#chart")
			  .insert("svg:rect")
			    .attr("width", width)
			    .attr("height", height)
			    .style("fill", "#FFF");

			//Our canvas, where the curves will be rendered, and which will be clipped.
			var chart = d3.select("#chart").append("svg:g");

			//Make the clipPath (for cropping the paths) //TODO: actually employ this
			chart.insert("defs")
			  .append("clipPath")
			    .attr("id", "clip")
			  .append("rect")
			    .attr("width", width)
			    .attr("height", height); //height / 4 - 20);

			//Make and render the curves.
			chart.selectAll("path")
			    .data(d3.range(numOfBands)) //TODO: make this number of positive bands, then make another for negative ones.
			  .enter().append("path")
			    .attr("fill", "rgba(0, 0, 255, " + 1.0 / numOfBands + ")") //function (d, i) { return colors[i]; }) //TODO: use a non-linear scale for this instead!!!
			    .style("stroke-width", 2)
			    .style("cursor", "help")
			    .attr("d", d3area1(d))
			    .attr("transform", function (d, i) {return "translate(0, " + (i - 1) * 50 + ")"; });


			//Draw the outline for the chart
			d3.select("#chart")
			  .append("svg:rect")
			    .attr("width", width)
			    .attr("height", height)
			    .style("fill", "rgba(0,0,0,0)")
			    .style("stroke-width", 3)
			    .style("stroke", "#000");
		});
	}

	my.width = function(value) {
		if (!arguments.length) return width;
		width = value;
		return my;
	}

	my.height = function(value) {
		if (!arguments.length) return height;
		height = value;
		return my;
	}

	return my;

	//TODO:
	//      make it work for negative values
	//      - maybe use streamgraphs so that the tops and bottoms are both wiggly?
	//      Make the graph dynamic so that it sizes according to the screen
	//      - this might just mean setting it statically each time the screen is loaded or rotated.
	//      Either use transparency for the colours, or find a sweet way to make it an equation.
	//      Make sure it works for any number of bands >= 1
}


//var data = [0, 5, 10, 7, 10, 0, 7, 8, 6, 3, 0, 1, 2, 7, 8, 2];
//var data = [1, 2, 5, 4, 7, 6, 9, 8, 10, 0, 1];
var data = [0, 5, 10, 7, 10, 0, 7, 8, 2.5];
//var data = [-1, 0, 1, 0];
//var data = [0, 1, 0];


//var coolChart1 = coolChart().width(50).height(50);
var coolChart1 = coolChart();
d3.select("#chart")
	.datum(data)
	.call(coolChart1);
