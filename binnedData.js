// This is binnedData. A convenient way of storing binned data

//{{{ CONSTANTS
var MAX_NUMBER_OF_BIN_LEVELS = 46; // keep sync'd with ../binnedChart.js and scraper.js
var MAX_NUMBER_OF_ITEMS_PER_ARRAY = 32; // MUST BE A POWER OF 2. The number of items per bin container
// TODO: phase this out (preferable) OR set it as a really high number

/// CONSTANTS }}}

binnedData = function () {

    //{{{ VARIABLES
    var bd = { // where all of the data is stored
        keys : ['average', 'maxes', 'mins', 'q1', 'q3'],
        rawData : {
            color: '#000',
            dash: '0',
            opacity: 0.5,
            levels: [], // stores all of the values for each level in an array of objects (MAX_NUMBER_OF_ITEMS_PER_ARRAY).
                        // with one key for each range of object, up to a maximum size
                        // example: [{ ms_key: [{val: 1.7, ms: ms_since_epoch}, {val: 2.3, ms: ms_since_epoch}] }, [etc.]]
                        //           ^-- a "bin container" -----------------------------------------------------^
        },
        average : {
            color : '#C00',
            dash: '0',
            opacity: 1,
            func   : function (a, b) { return (a+b)/2; },
            levels: [],
        },
        maxes : {
            color : '#000FB5',
            dash: '0',
            opacity: 1,
            func   : function (a, b) { return d3.max([a,b]); },
            levels: [],
        },
        mins : {
            color : '#00B515',
            dash: '0',
            opacity: 1,
            func   : function (a, b) { return d3.min([a,b]); },
            levels: [],
        },
        q1 : {
            color : '#800',
            dash: '0',
            opacity: 1,
            func   : function (a, b, c, d) { return average(getTwoSmallest([a, b, c, d])); }, // average the two smallest values from q1 and q3
            levels: [],
        },
        q3 : {
            color : '#800',
            dash: '0',
            opacity: 1,
            func   : function (a, b, c, d) { return average(getTwoLargest([a, b, c, d])); }, // average the two largest values from q1 and q3
            levels: [],
        },
        quartiles : {
            color : '#800',
            dash: '0',
            opacity: 0.3,
            //func   : function (a, b, c, d) { return average(getTwoLargest([a, b, c, d])); }, // average the two largest values from q1 and q3
            levels: [],
        },
        missing : {
            color : '#C00',
            dash: '4',
            opacity: 1,
            //func   : function (a, b, c, d) { return average(getTwoLargest([a, b, c, d])); }, // average the two largest values from q1 and q3
            levels: [],
        },
    }; // where everything is stored

    // VARIABLES }}}

    //{{{ HELPER METHODS

    // testing this function. It works.
    //console.log(combineWithoutDuplicates([{ms: 1}, {ms: 2}, {ms: 3, lvl: 5}, {ms: 4}],
    //                                     [{ms: 1}, {ms: 1}, {ms: 3}, {ms: 5}]));

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

        var oneSample = 1000 / 200; // milliseconds per sample
        var sampleSize = Math.pow(2, lvl) * oneSample;

        var sizeOfTheBinContainerInMS = sampleSize * MAX_NUMBER_OF_ITEMS_PER_ARRAY;

        return Math.floor(ms / ( sizeOfTheBinContainerInMS )) * sizeOfTheBinContainerInMS;
    }

    //function splitAndApplyToEachWithOverflowAtLevel (data, func, lvl) {
    //    // - data is split into sections
    //    // - func will be applied to each binnedData at level lvl
    //    //   using the split data

    //    // TODO TODO TODO: test this function!

    //    var splitData = splitIntoBinsAtLevel(data, lvl);

    //    for (prop in splitData) {

    //        // Create if we don't have:
    //        if( !bds[lvl] ) { bds[lvl] = {}; }
    //        if( !bds[lvl][prop] ) { bds[lvl][prop] = binnedData(maxNumberOfBins); }

    //        var overflow = func.call(bds[lvl][prop], splitData[prop]);
    //        //console.log("overflow:", overflow);
    //        // TODO: May have to use apply instead
    //        //       so as to transfer arguments

    //        //while (overflow){
    //            // TODO TODO: handle overflows!
    //        //}
    //    }

    //}

    function combineAllOfKeyAndLevel(key, lvl) {
        var result = [];

        for (var keyValue in bd.keys) {
            var key = bd.keys[keyValue];
            result = result.concat(bd[key].levels[lvl]);
        }

        return result;
    }

    function callForAllAtLevelAndCombineResults (func, lvl) {
        // func must return an array

        var result = [];

        for (key in bds[lvl]) {
            var res = func(bds[lvl][key]);

            if(isArray(res)) {
                result = result.concat(res);
            } else if (res.hasOwnProperty("rawData") || res.hasOwnProperty("average")) {
                if (isArray(result)) { result = binnedData(); }

                if (lvl === 0) {
                    result.addRawData(res.rawData.levels[0]);
                }else {
                    result.addBinnedData(res);
                }

            } else {
                result = binnedData().combineAndSortArraysOfDateValObjects(result, res);
            }
        }

        return result;
    }

    function doWeHaveBinsForThisRangeAndLevel (rng, lvl) {
        // TODO: calculate the key we're looking for
        if (key in bds[lvl]) {
        }
        return false;
    }

    function isArray(a) {
        return Object.prototype.toString.call(a) === '[object Array]';
    }

    function getSurroundingBins (start, end, lvl) {
        // return all bin starts at this level between start and end
        // NOT INCLUDING the highest point if it is equal to end

        var oneSample = 1000 / 200; // milliseconds per sample
        var binSize = Math.pow(2, lvl) * oneSample;

        var startRounded = getMSStartForTimeAtLevel(start, lvl);

        return _.range(startRounded, end, binSize);
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

    function rebin (range_to_rebin, level_to_rebin) {
        // link raw data to the source
        for (var keyValue in bd.keys) {
            var key = bd.keys[keyValue];
            bd[key].levels[0] = bd.rawData.levels[0];
        }

        // for each level other than raw data level,
        //   for each key,
        //     bin the data from the lower level
        for (var j = level_to_rebin + 1; j < MAX_NUMBER_OF_BIN_LEVELS; j++){ // for each bin level
            for (var keyValue in bd.keys) { // for each of 'average', 'max', 'min', etc.
                var key = bd.keys[keyValue];

                // bin and store data from lower bin
                var newData = binTheDataWithFunction(bd, j-1, key, bd[key].func, range_to_rebin);

                if (newData.length === 0) {
                    continue; // Nothing to add; move along.
                }

                // TODO: filter out what is already in the old data, OR add that ability to addData();
                // Combine what was already there and what was just calculated
                // - What was already in this bin level gets precedence
                //   over what is being binned from the lower level

                my.addData(newData, key, j);

            } // for each key
        } // for each bin level
    }

    function combineFilteredBinContainerInformation (bin, lvl, key, range) {
        // Returns ALL data from any container which intersects the requested range
        // AKA:  Grabs ALL containers which line up with the containers of the
        //       one-higher level's intersection with this range

        // get lvl+1's range of containers for this range
        var upperLevelRange = [ // range until very end
            getMSStartForTimeAtLevel(range[0], lvl+1),
            getMSStartForTimeAtLevel(range[1], lvl+1) + my.binContainerSize(lvl+1)
        ];

        // get lvl range of containers for that range
        if (!upperLevelRange[0] || !upperLevelRange[1]) {
            //console.log(upperLevelRange[0], upperLevelRange[1]);
            return [];
        }
        var binsToBeCombined = getSurroundingBinContainers(upperLevelRange[0], upperLevelRange[1], lvl);

        var combo = [];
        for (var i in binsToBeCombined) {
            if (bin[key].levels[lvl][binsToBeCombined[i]]){
                combo = combo.concat(bin[key].levels[lvl][binsToBeCombined[i]]);
            }
        }

        return combo;
    }

    // Bin the data in a level into abstracted bins
    function binTheDataWithFunction (bin, curLevel, key, func, range_to_rebin) {
        var bDat = new Array();
        if (!bin[key].levels[curLevel]) {
            return bDat;
        }

        var oneSample = 1000 / 200; // milliseconds per sample
        var sampleSize = Math.pow(2, curLevel) * oneSample;

        // Combine all data which is within range_to_rebin
        var combo = combineFilteredBinContainerInformation(bin, curLevel, key, range_to_rebin);

        // if we're calculating for quartiles, then we need the other quartile as well
        if (key === 'q1') {
            var combo2 = combineFilteredBinContainerInformation(bin, curLevel, 'q3', range_to_rebin);
        } else if (key === 'q3'){
            var combo2 = combineFilteredBinContainerInformation(bin, curLevel, 'q1', range_to_rebin);
        }

        // Use this new combined data instead of bin[key].levels[curLevel].length
        for(var i = 0; i < combo.length; i = i + 2){
            // If we are at a bad spot to begin a bin, decrement i by 1 and continue;
            var sampleIsAtModularLocation = atModularLocation(combo[i].ms, curLevel+1);
            var nextSampleExists = combo.length > i + 1;
            var nextSampleIsRightDistanceAway = nextSampleExists ?
                combo[i+1].ms - combo[i].ms === sampleSize :
                true;

            if (!sampleIsAtModularLocation || !nextSampleExists || !nextSampleIsRightDistanceAway) {
                // This is here so that both the server and client's bins start and end at the same place
                // no matter what range of data they have to work with.
                // we skip over values which are not at the beginning of a bin
                i = i - 1;
                continue;
            }

            if (combo[i+1]){
                var newdate = combo[i/*+1*/].ms;

                if (key === 'q1' || key === 'q3') {
                    bDat.push({ val:  func(
                                        combo[i].val,
                                        combo[i+1].val,
                                        combo2[i].val,
                                        combo2[i+1].val)
                              , ms: newdate }); // This is messy and depends on a lot of things
                }else{
                    bDat.push( { val: func(
                                        combo[i].val,
                                        combo[i+1].val)
              , ms: newdate });
                }
            }
        }
        return bDat;
    };

    function atModularLocation(ms, lvl) {
        // True if ms is at the beginning of a bin in level lvl.
        return ms % (Math.pow(2, lvl) * 5) === 0;
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

    my.addData = function (data, key, lvl) {
        // data must be in the following form: (example)
        // [ {val: value_point, ms: ms_since_epoch},
        //   {val: value_point, ms: ms_since_epoch},
        //   {etc...},
        // ],

        var splitData = splitIntoBinsAtLevel(data, lvl);

        for (prop in splitData) {
            // Create if we don't have:
            if (!bd[key].levels[lvl]) { bd[key].levels[lvl] = {}; }
            if (!bd[key].levels[lvl][prop]) { bd[key].levels[lvl][prop] = []; }

            // combine and put in bd
            bd[key].levels[lvl][prop] = combineAndSortArraysOfDateValObjects(bd[key].levels[lvl][prop], splitData[prop]);
        }
    }

    my.addRawData = function (data, dontBin) {
        // data must be in the following form: (example)
        // [ {val: value_point, ms: ms_since_epoch},
        //   {val: value_point, ms: ms_since_epoch},
        //   {etc...},
        // ],

        var range = d3.extent(data, function (d) { return d.ms; });

        my.addData(data, 'rawData', 0);

        if(!dontBin) {
            rebin(range, 0);
        }

        return my;

    }

    my.replaceRawData = function (data, dontBin) {
        // data must be in the following form: (example)
        // [ {val: value_point, ms: ms_since_epoch},
        //   {val: value_point, ms: ms_since_epoch},
        //   {etc...},
        // ],

        // TODO TODO TODO: update for new bin containers
        var range = d3.extent(data, function (d) { return d.ms; });

        // make this level if it does not yet exist
        if (!bd.rawData.levels[0]) { bd.rawData.levels[0] = []; }

        bd.rawData.levels[0] = data;

        if(!dontBin) {
            rebin(range, 0);
        }

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

        var lows = [];
        var highs = [];
        var keys = ['average', 'q1', 'q3', 'mins', 'maxes'];

        for (var i = 0; i < keys.length; i++) {
            if (bData[keys[i]] && bData[keys[i]].levels && bData[keys[i]].levels[lvl]) {
                var ext = d3.extent(bData[keys[i]].levels[lvl], function (d) { return d.ms; });
                lows.push(ext[0]);
                highs.push(ext[1]);
            }
        }

        var range = [
                d3.min(lows),
                d3.max(highs)
        ];

        //var range = d3.extent(bData.average.levels[lvl], function (d) { return d.ms; }); // ASSUMPTION: average is always included

        for (var k in bd.keys) { // for each of max_val, min_val, etc.
            var key = bd.keys[k];
            my.addData(bData[key].levels[lvl], key, lvl);
        }; // for each of max_val, min_val, etc.

        if(!dontBin) {
            rebin(range, lvl);
        }

        return my;
    }

    my.replaceBinnedData = function(bData, lvl, dontBin) {
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

        // TODO TODO TODO: update for new bin containers

        var range = d3.extent(bData.average.levels[lvl], function (d) { return d.ms; }); // ASSUMPTION: average is always included

        for (var k in bd.keys) { // for each of max_val, min_val, etc.
            var key = bd.keys[k];

            //if we don't have a lvl for this already, initialize one
            if (!bd[key].levels[lvl]) {
                bd[key].levels[lvl] = [];
            }

            if(bData[key].levels) {
                bd[key].levels[lvl] = bData[key].levels[lvl];
            }
        }; // for each of max_val, min_val, etc.

        if(!dontBin) {
            rebin(range, 0);
        }

        return my;
    }

    my.replaceAllData = function (bDat) {
        // Replace all data with what is given
        bd = bDat;
    }


    my.haveDataInRange = function(ms_range, level) {
        // Determine the number of samples which we should have in the given range.

        // TODO TODO TODO: update for new bin containers

        var key;
        if (level === 0) {
            key = "rawData";
        } else {
            key = "average";
        }

        var datedRange = my.getDateRange([key], level, ms_range);

        if (datedRange.length === 0) {
            return false;
        }

        var firstSample = datedRange[0].ms;
        var oneSample = 1000 / 200; // milliseconds per sample
        var sampleSize = Math.pow(2, level) * oneSample;

        if (firstSample > ms_range[0] + sampleSize) {
            return false;
        }

        var actualRange = ms_range[1] - firstSample;
        var numberWeShouldHave = Math.floor(actualRange / sampleSize);

        var numberWeHave = datedRange.length;

        return numberWeHave >= numberWeShouldHave;
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

        var oneSample = 1000 / 200; // milliseconds per sample TODO: magic ?
        var fir = Math.floor(ms_range[0] / (Math.pow(2, level) * oneSample));
        var las = Math.floor(ms_range[1] / (Math.pow(2, level) * oneSample));

        var normalizedRange = [ fir * Math.pow(2, level) * oneSample, (las + 1) * Math.pow(2, level) * oneSample ];
        var datedRange = my.getDateRange([key], level, normalizedRange);

        if (datedRange.length === 0) {
            // TODO: for the grey missing data boxes, should this return something different?
            if (samplesInsteadOfRanges) { return [ms_range[0]]; }
            return [ms_range];
        }

        var sampleSize = Math.pow(2, level) * oneSample; // TODO: replace with function which does this for us.

        var neededBins = _.range(normalizedRange[0], normalizedRange[1], sampleSize);
        neededBins.forEach(function (d) {
            d = d * Math.pow(2, level) * oneSample;
        });

        var missingSamples = inAButNotInB(neededBins, _.pluck(datedRange, 'ms'));
        missingSamples.total = datedRange.length;

        if(samplesInsteadOfRanges) { return missingSamples; }

        var missingRanges = [];

        _.each(missingSamples, function (d,i) {
            missingRanges.push([d, d + sampleSize]);
            // missingRanges will now be like this: [[0,1],[1,2],[4,5],[5,6],[6,7]]
        });

        return missingRanges; // form: [[0,1],[1,2],[4,5],[5,6],[6,7]]
    }

    //my.missingRawBinsUnderThisRangeAndLevel = function (ms_range, level) {

    //    // TODO TODO TODO: update for new bin containers
    //    var currentMissingBinStarts = my.missingBins(ms_range, level);
    //    var nextMissingBinStarts = [];

    //    console.log("levels:");
    //    //console.log(bd.average.levels);

    //    var oneSample = 1000 / 200; // milliseconds per sample
    //    var sampleSize = Math.pow(2, level) * oneSample;

    //    //console.log("currentMissingBinStarts", currentMissingBinStarts);

    //    // for each level, going DOWN to zero:
    //    for(var lvl = level; lvl >= 0; lvl--) {
    //        sampleSize = Math.pow(2, lvl);
    //        //console.log("level", lvl);

    //        // for each range
    //        // - find which bins are missing in the previous level's ranges
    //        for(var rng = 0; rng < currentMissingBinStarts.length; rng++) {
    //            //console.log("  checking range", currentMissingBinStarts[rng]);
    //            // add the start of each missing range found within
    //            // the above missing range
    //            nextMissingBinStarts.push(my.missingBins(currentMissingBinStarts[rng], lvl, true));
    //        }

    //        // swap the variables
    //        var flattened = _.uniq(_.flatten(nextMissingBinStarts).sort());


    //        var missingRanges = [];
    //        _.each(flattened, function (d,i) {
    //            missingRanges.push([d, d + sampleSize]);
    //            // missingRanges will now be like this: [[0,1],[1,2],[4,5],[5,6],[6,7]]
    //        });
    //        //console.log("  level", lvl, "was missing", missingRanges);
    //        currentMissingBinStarts = missingRanges;
    //        nextMissingBinStarts = [];
    //    }

    //    return currentMissingBinStarts;
    //}

    my.getMin = function (lvl) {
        var lowestValue = 999999;

        if (lvl === 0) {
            var k = "rawData";
        } else {
            var k = "average";
        }

        for (key in bd[k].levels[lvl]) {
            lowestValue = Math.min(d3.min(bd[k].levels[lvl][key], function (d) { return d.val; }),
                                    lowestValue);
        }

        return lowestValue;
    }

    my.getMax = function (lvl) {
        var highestValue = -999999;

        if (lvl === 0) {
            var k = "rawData";
        } else {
            var k = "average";
        }

        for (key in bd[k].levels[lvl]) {
            highestValue = Math.max(d3.max(bd[k].levels[lvl][key], function (d) { return d.val; }),
                                    highestValue);
        }

        return highestValue;
    }

    my.getMinMS = function (lvl) {
        // pick the minimum bin (highest key) in bds level lvl
        // and ask for the lowest raw value

        if (lvl === 0) {
            var k = "rawData";
        } else {
            var k = "average";
        }

        var getMinOfArray = function (numArray) {
            return Math.min.apply(null, numArray);
        }

        var keys = Object.keys(bd[k].levels[lvl]);
        return d3.min(bd[k].levels[lvl][getMinOfArray(keys)], function (d) { return d.ms; });
    }

    my.getMaxMS = function (lvl) {
        if (lvl === 0) {
            var k = "rawData";
        } else {
            var k = "average";
        }

        var getMaxOfArray = function (numArray) {
            return Math.max.apply(null, numArray);
        }

        var keys = Object.keys(bd[k].levels[lvl]);
        return d3.max(bd[k].levels[lvl][getMaxOfArray(keys)], function (d) { return d.ms; });
    }

    my.getColor = function (key) {
        return bd[key].color;
    }

    my.getDash = function (key) {
        return bd[key].dash;
    }

    my.getOpacity = function (key) {
        return bd[key].opacity;
    }

    my.getAllInRange = function(lvl, range) {
        // return a bd-like data structure but only
        // with data in the following range and level
        // from all keys

        // initialize the data structure to be sent
        var theKeys = ["average", "q1", "q3", "mins", "maxes"];
        var send_req = {};

        for (var i = 0; i < theKeys.length; i++) {
            send_req[theKeys[i]] = {};
            send_req[theKeys[i]].levels = [];
            send_req[theKeys[i]].levels[lvl] = my.getDateRange([theKeys[i]], lvl, range);
        }

        return send_req;
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

    my.removeAllLevelsBelow = function(LowestLevel) {
        //TODO
        for(var i = 0; i < LowestLevel; i++) {
            for(k in bd.keys) {
                var key = bd.keys[k];
                //console.log("removing", key, i);
                bd[key].levels[i] = {};
            }
        }

        // remove rawData, too
        if (LowestLevel > 0) {
            //console.log("removing", "rawData", 0);
            bd.rawData.levels[0] = {};
        }

        //console.log("removing ;]");
    }

    my.importDataFromAnotherBinnedDataObject = function (otherBinnedData) {
        for (k in otherBinnedData.keys) {
            var key = otherBinnedData.keys[k];
            // for each key in otherBinnedData

            for (var l = 0; l < MAX_NUMBER_OF_BIN_LEVELS; l++) {
                // for each level

                if (!otherBinnedData[key].levels[l]) { continue; }

                for (b in otherBinnedData[key].levels[l]) {
                    // for each bin container

                    if (!bd[key].levels[l]) {
                        bd[key].levels[l] = {};
                    }

                    if (!bd[key].levels[l].hasOwnProperty(b)) {
                        // If we don't have it already, plunk it in
                       bd[key].levels[l][b] = otherBinnedData[key].levels[l][b];
                    } else {
                        // If we do, combine them.
                       bd[key].levels[l][b] = combineWithoutDuplicates(
                           bd[key].levels[l][b],
                           otherBinnedData[key].levels[l][b]);
                    }
                } // for each bin container
            } // for each level
        } // for each key
    }

    my.doToEachContainerInRange = function (range, level, func) {
        getSurroundingBinContainers(range[0], range[1], level).forEach(function (d) {
            func(d);
        });
    }

    // TODO: use this instead of manually doing it everywhere
    my.binSize = function (lvl) {
        var oneSample = 1000 / 200; // milliseconds per sample
        return Math.pow(2, lvl) * oneSample;
    }

    my.binContainerSize = function (lvl) {
        return my.binSize(lvl) * MAX_NUMBER_OF_ITEMS_PER_ARRAY;
    }

    my.getSurroundingBinContainers = function (r0, r1, lvl) {
        return getSurroundingBinContainers(r0, r1, lvl);
    }

    my.getSurroundingBins = function (start, end, lvl) {
        return getSurroundingBins(start, end, lvl);
    }

    my.getBinContainerForMSAtLevel = function (ms, lvl) {
        return getMSStartForTimeAtLevel(ms, lvl);
    }

    my.getKeys = function () {
        return bd.keys.slice(0); // give a copy of the array
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

    my.toString = function () {
        // Give bd as a string
        return JSON.stringify(bd);
    }

    my.rebinAll = function (range, lvl) {
        rebin(range, lvl);
    }

    // PUBLIC METHODS }}}

    return my;
}

/* vim: set foldmethod=marker: */
