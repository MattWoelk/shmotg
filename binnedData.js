// This is binnedData. A convenient way of storing binned data

//{{{ CONSTANTS
var MAX_NUMBER_OF_BIN_LEVELS = 46; // keep sync'd with ../binnedChart.js and scraper.js
var MAX_NUMBER_OF_ITEMS_PER_ARRAY = 32; // MUST BE A POWER OF 2. The number of items per bin container
// TODO: phase this out (preferable) OR set it as a really high number

/// CONSTANTS }}}

binnedData = function () {

    //{{{ VARIABLES
    var oneSample = 1000 / 200; // milliseconds per sample

    var bd_meta  = {// where all of the data is stored
        keys : ['average', 'maxes', 'mins', 'q1', 'q3'],
        average : {
            func   : function (a, b) { return (a+b)/2; },
        },
        maxes : {
            func   : function (a, b) { return d3.max([a,b]); },
        },
        mins : {
            func   : function (a, b) { return d3.min([a,b]); },
        },
        q1 : {
            func   : function (a, b, c, d) { return average(getTwoSmallest([a, b, c, d])); }, // average the two smallest values from q1 and q3
        },
        q3 : {
            func   : function (a, b, c, d) { return average(getTwoLargest([a, b, c, d])); }, // average the two largest values from q1 and q3
        },
    }

    var haveDataInRangeCallBack = function () {};

    var bdWorker = new Worker('worker.js');
    bdWorker.onmessage = function(event) {
        // TODO: - combine them instead?
        var command = event.data.command;
        if(command === "print") {
            console.log("WORKER:", event.data.result);
        } else if (command === "rebin") {
            console.log("rebinned");
            //bd = event.data.result;
            // TODO: update the plot?
        } else if (command === "addRawData") {
            console.log("added raw data");
            // TODO: update the plot?
        } else if (command === "addBinnedData") {
            console.log("added binned data");
            // TODO: update the plot?
        } else if (command === "haveDataInRange") {
            console.log("have data in range");
            haveDataInRangeCallBack(event.data.result);
            // TODO: update the plot?
        } else {
            console.log("Receiving from Worker: ", event.data.command, event.data.result.average);
        }
    };

    // VARIABLES }}}

    //{{{ HELPER METHODS

    function sampleSize(lvl) {
        return Math.pow(2, lvl) * oneSample;
    }

    function combineWithoutDuplicates(arr1, arr2) {
        // ASSUMPTION: arr1 and arr2 are both sorted
        //             arr1 and arr2 are in the format: [{ms: _}, {ms: _}]
        // TODO: arr1 gets precedence. Return an array which has no duplicates in the 'ms' field.

        var uniques = []; // The values found in arr2 which were not in arr1
        var arr1Length = arr1.length;
        var arr1Index = 0;

        for (var i = 0; i < arr2.length; i++) {
            // For each element of arr2, go through arr1,
            // element by element, and see how their ms compare

            while (1) {
                if (arr1Index >= arr1Length) {
                    uniques.push(arr2[i]);
                    break;
                } // we've run out of arr1

                if (arr1[arr1Index].ms > arr2[i].ms) {
                    // If the next one is higher,
                    // add this one to the list,
                    // and move on to the next arr2 (don't increment)

                    uniques.push(arr2[i]);

                    //console.log("add them:", arr1[arr1Index].ms, arr2[i].ms);
                    break;
                } else if (arr1[arr1Index].ms === arr2[i].ms) {
                    // If the next one is the same,
                    // move on to the next arr2 (don't increment)

                    // Though, if one is NaN, then the other should be used.
                    if (isNaN(arr1[arr1Index].val)) {
                        arr1[arr1Index].val = arr2[i].val;
                    }

                    //console.log("dont add:", arr1[arr1Index].ms, arr2[i].ms);
                    break;
                } else {
                    // If the next one is lower than this one,
                    // increment and compare to the new one from arr1

                    //console.log("continue:", arr1[arr1Index].ms, arr2[i].ms);
                    arr1Index++;
                }
            }
        }

        return arr1.concat(uniques);
    }

    function getMSStartForTimeAtLevel (ms, lvl) {
        // TODO: calculate the starting ms of the bin container
        // [at this level] in which this ms would fit.


        var sizeOfTheBinContainerInMS = sampleSize(lvl) * MAX_NUMBER_OF_ITEMS_PER_ARRAY;

        return Math.floor(ms / ( sizeOfTheBinContainerInMS )) * sizeOfTheBinContainerInMS;
    }

    function getSurroundingBinContainers (start, end, lvl) {
        // return all bin container starts at this level between start and end
        // NOT INCLUDING the highest point if it is equal to end

        var binSize = my.binContainerSize(lvl);

        var startRounded = getMSStartForTimeAtLevel(start, lvl);

        return _.range(startRounded, end, binSize);
    }

    function splitIntoBinsAtLevel (data, lvl) {
        // TODO: round level down to nearest maxNumberOfBins
        //       then separate the data out into a structure:
        //       { '0': [{ms: 3}, {ms: 4}]
        //         '5': [{ms: 5}, {ms: 9}]}
        //       This function is to be used when adding raw data
        // Assumption: data is ordered and continuous

        return _.groupBy(data, function (d) {
            return getMSStartForTimeAtLevel(d.ms, lvl);
        });
    }

    function atModularLocation(ms, lvl) {
        // True if ms is at the beginning of a bin in level lvl.
        return ms % (Math.pow(2, lvl) * oneSample) === 0;
    }

    function getTwoLargest (array) {
        var arr = array.slice();
        first = d3.max(arr);
        arr.splice(arr.indexOf(first),1);
        second = d3.max(arr);
        return [first, second];
    };

    function average (array) {
        return d3.sum(array)/array.length;
    };

    function getTwoSmallest (array) {
        var arr = array.slice();
        first = d3.min(arr);
        arr.splice(arr.indexOf(first),1);
        second = d3.min(arr);
        return [first, second];
    };

    function combineAndSortArraysOfDateValObjects (arr1, arr2) {
        // Add the objects from arr2 (array) to arr1 (array)
        //   only if the object from arr2 has a ms value
        //   which no object in arr1 has.
        // AKA: arr1 gets precedence

        // concat them
        var result = combineWithoutDuplicates(arr1, arr2);

        // sort the result TODO: may not be required, as combineWithoutDuplicates gives a sorted result
        result.sort(function (a, b) { return a.ms - b.ms; });

        return result;
    }

    function inAButNotInB(arr1, arr2) {
        return _.filter(arr1, function (d) {
            return !_.contains(arr2, d);
        });
    }

    // HELPER METHODS }}}

    //{{{ INITIALIZATION (runs once)
    // INITIALIZATION }}}

    //{{{ MY (runs whenever something changes)

    var my = function () {
    }

    // MY }}}

    //{{{ PUBLIC METHODS
    my.addRawData = function (data, dontBin) {
        // data must be in the following form: (example)
        // [ {val: value_point, ms: ms_since_epoch},
        //   {val: value_point, ms: ms_since_epoch},
        //   {etc...},
        // ],

        bdWorker.postMessage({
            command: "addRawData",
            argz: [data, dontBin]
        });

        return my;
    }

    my.addBinnedData = function (bData, lvl, dontBin) {
        // only the level lvl will be stored
        // data must be in the form of the following example:
        // { average: {
        //     levels: [
        //       [{val: value_point, ms: ms_since_epoch},
        //        {val: value_point, ms: ms_since_epoch},
        //        {etc...}],
        //       [etc.]
        //     ],
        //   },
        //   q1: {
        //     levels: [
        //       [etc.]
        //     ],
        //   },
        //   etc: {},
        // }

        bdWorker.postMessage({
            command: "addBinnedData",
            argz: [bData, lvl, dontBin]
        });

        return my;
    }

    my.haveDataInRange = function (ms_range, level, callback) {
        // Determine the number of samples which we should have in the given range.

        bdWorker.postMessage({
            command: "haveDataInRange",
            argz: [ms_range, level]
        });

        haveDataInRangeCallBack = callback;

        return my;
    }

    my.missingBins = function(ms_range, level, samplesInsteadOfRanges) {
        // Return which bins which we are missing in the given range and level.
        // returns [[start, end],[start,end],...] ranges of required data

        var key;
        if (level === 0) {
            key = "rawData";
        } else {
            key = "average";
        }

        var fir = Math.floor(ms_range[0] / (Math.pow(2, level) * oneSample));
        var las = Math.floor(ms_range[1] / (Math.pow(2, level) * oneSample));

        var normalizedRange = [ fir * Math.pow(2, level) * oneSample, (las + 1) * Math.pow(2, level) * oneSample ];
        var datedRange = my.getDateRange([key], level, normalizedRange);

        if (datedRange.length === 0) {
            // TODO: for the grey missing data boxes, should this return something different?
            if (samplesInsteadOfRanges) { return [ms_range[0]]; }
            return [ms_range];
        }

        var neededBins = _.range(normalizedRange[0], normalizedRange[1], sampleSize(level));
        neededBins.forEach(function (d) {
            d = d * Math.pow(2, level) * oneSample;
        });

        var missingSamples = inAButNotInB(neededBins, _.pluck(datedRange, 'ms'));
        missingSamples.total = datedRange.length;

        if(samplesInsteadOfRanges) { return missingSamples; }

        var missingRanges = [];

        _.each(missingSamples, function (d,i) {
            missingRanges.push([d, d + sampleSize(level)]);
            // missingRanges will now be like this: [[0,1],[1,2],[4,5],[5,6],[6,7]]
        });

        return missingRanges; // form: [[0,1],[1,2],[4,5],[5,6],[6,7]]
    }

    my.getDateRangeWithMissingValues = function (key, lvl, range, extra) {
        // give the range of data for this key and level
        // NOT including the highest value in range
        // USE:
        // filter an array so that we don't render much more
        // than the required amount of line and area
        // missing values are NaN's

        var missings = my.missingBins(range, lvl, true);

        missingsObjs = missings.map(function (d) {
            return {ms: d, val: NaN};
        });

        result = combineAndSortArraysOfDateValObjects(
                missingsObjs,
                my.getDateRange([key], lvl, range)
                );

        // if we should add in an extra value before each NaN
        // so that everything looks nice for step-after interpolation
        if (extra) {
            var toEnd = result.length;
            for (var i = 1; i < toEnd; i++) {
                if (isNaN(result[i].val)) {
                    result.splice(i, 0, { ms: result[i].ms, val: result[i-1].val });
                    i++;
                    toEnd++;
                }
            }
        }

        return result;
    }

    my.getDateRange = function (keys, lvl, range) {
        // give the range of data for this key and level
        // NOT including the highest value in range
        // USE:
        // filter an array so that we don't render much more
        // than the required amount of line and area

        var result = [];

        // where to look for this data:
        var whichBinsToLookIn = getSurroundingBinContainers(range[0], range[1], lvl);

        for (var k = 0; k < keys.length; k++) {
            var key = keys[k];
            _.each(whichBinsToLookIn, function (n) {
                if(!bd[key] || !bd[key].levels[lvl]) { return; }
                var dat = bd[key].levels[lvl][n];

                result = result.concat(_.filter(dat, function (d, i) {
                    return d.ms <= range[1] && d.ms >= range[0];
                }));
            });
        }

        // sort it
        result = result.sort(function (a, b) { return a.ms - b.ms; });

        return result;
    }

    my.binSize = function (lvl) {
        return Math.pow(2, lvl) * oneSample;
    }

    my.oneSample = function (value) {
        if (!arguments.length) return oneSample;
        oneSample = value;
        return my;
    }

    my.binContainerSize = function (lvl) {
        return my.binSize(lvl) * MAX_NUMBER_OF_ITEMS_PER_ARRAY;
    }

    my.getSurroundingBinContainers = function (r0, r1, lvl) {
        return getSurroundingBinContainers(r0, r1, lvl);
    }

    my.getKeys = function () {
        return bd_meta.keys.slice(0); // give a copy of the array
    }

    my.bd = function () {
        return bd;
    }

    my.combineAndSortArraysOfDateValObjects = function(a, b) {
        return combineAndSortArraysOfDateValObjects(a, b);
    }

    my.getChildBins = function(ms, lvl) {
        // TODO: Return an array of two bins of level lvl-1,
        //       which are the bins which are used to calculate
        //       the value for the bin at ms.
        result = [ms];
        var siz = my.binSize(lvl-1);
        if (atModularLocation(ms, lvl)) {
            result.push(ms+siz);
        } else {
            result.push(ms-siz);
        }
        return result;
    }

    // PUBLIC METHODS }}}

    return my;
}

/* vim: set foldmethod=marker: */
