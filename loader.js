/* Usage: TODO: update this
* var myLoader = loader({width: 960, height: 500, container: "#loader_container", id: "loader"});
* myLoader();
*/

(function () {

loader = function () {
    var tau = 2 * Math.PI;
    var innerRadiusRatio = 0.5;
    var outerRadiusRatio = 0.9;
    var width = 25;
    var height = 25;

    var slctn; // Save the selection so that my.update() works.
    var svg;


    function my (g) {
        slctn = g; // Saving the selection so that my.update() works.

        g.each(function(d, i) {
            var g = d3.select(this);

            // {{{ VARIABLES
            svg = svg ? svg : g.append("svg")
                .attr("width", width)
                .attr("height", height);
            // VARIABLES }}}

            var radius = Math.min(width, height) / 2;

            var arc = d3.svg.arc()
                    .innerRadius(radius*innerRadiusRatio)
                    .outerRadius(radius*outerRadiusRatio)
                    .startAngle(0);

            var gElement = svg.append("g")
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")

            var background = gElement.append("path")
                    .datum({endAngle: 0.33*tau})
                    .style("fill", "#4D4D4D")
                    .attr("d", arc)
                    .call(spin, 1500)

            function spin(selection, duration) {
                selection.transition()
                    .ease("linear")
                    .duration(duration)
                    .attrTween("transform", function() {
                        return d3.interpolateString("rotate(0)", "rotate(360)");
                    });

                setTimeout(function() { spin(selection, duration); }, duration);
            }

            function transitionFunction(path) {
                path.transition()
                    .duration(7500)
                    .attrTween("stroke-dasharray", tweenDash)
                    .each("end", function() { gElement.call(transition); });
            }
        });
        d3.timer.flush();
    };

    // {{{ GETTERS AND SETTERS
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

    my.update = function () {
        my(slctn);
    };
    // GETTERS AND SETTERS }}}

    return my;
}

})();

/* vim: set foldmethod=marker: */
