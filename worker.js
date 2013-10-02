var MAX_NUMBER_OF_BIN_LEVELS = 46; // keep sync'd with ../binnedChart.js and scraper.js
var MAX_NUMBER_OF_ITEMS_PER_ARRAY = 32; // MUST BE A POWER OF 2. The number of items per bin container

if(typeof importScripts == "function"){
    importScripts('node_modules/underscore/underscore-min.js'); // TODO: why does this need to be in here?
}

var oneSample;
var bd;

self.addEventListener('message',  function(event){
    var command = event.data.command;
    var argz = event.data.argz;
    if (command === "rebin"){
        postMessage({'command': command, 'result': rebin.apply(this, argz)});
    } else if (command === "addRawData") {
        postMessage({'command': command, 'result': addRawData.apply(this, argz)});
    } else if (command === "addBinnedData") {
        postMessage({'command': command, 'result': addBinnedData.apply(this, argz)});
    } else if (command === "haveDataInRange") {
        postMessage({'command': command, 'result': haveDataInRange.apply(this, argz)});
    } else if (command === "getDateRangeWithMissingValues") {
        postMessage({'command': command, 'result': getDateRangeWithMissingValues.apply(this, argz)});
    }
});

function log(message) {
    postMessage({'command': 'print', 'result': message});
}

var bd_meta  = {
    keys : ['average', 'maxes', 'mins', 'q1', 'q3'],
    average : {
        func   : function (a, b) { return (a+b)/2; },
    },
    maxes : {
        func   : function (a, b) { return Math.max(a,b); },
    },
    mins : {
        func   : function (a, b) { return Math.min(a,b); },
    },
    q1 : {
        func   : function (a, b, c, d) { return average(getTwoSmallest([a, b, c, d])); }, // average the two smallest values from q1 and q3
    },
    q3 : {
        func   : function (a, b, c, d) { return average(getTwoLargest([a, b, c, d])); }, // average the two largest values from q1 and q3
    },
}

var bd = { // where all of the data is stored
    rawData : {
        levels: [], // stores all of the values for each level in an array of objects (MAX_NUMBER_OF_ITEMS_PER_ARRAY).
                    // with one key for each range of object, up to a maximum size
                    // example: [{ ms_key: [{val: 1.7, ms: ms_since_epoch}, {val: 2.3, ms: ms_since_epoch}] }, [etc.]]
                    //           ^-- a "bin container" -----------------------------------------------------^
    },
    average : {
        levels: [],
    },
    maxes : {
        levels: [],
    },
    mins : {
        levels: [],
    },
    q1 : {
        levels: [],
    },
    q3 : {
        levels: [],
    },
    quartiles : {
        levels: [],
    },
    missing : {
        levels: [],
    },
    missingBox : {
        levels: [],
    },
    loadingBox : {
        levels: [],
    },
}; // where everything is stored

function rebin (range_to_rebin, level_to_rebin, oneS) {
    oneSample = oneS;

    // link raw data to the source
    for (var keyValue in bd_meta.keys) {
        var key = bd_meta.keys[keyValue];
        bd[key].levels[0] = bd.rawData.levels[0];
    }

    // for each level other than raw data level,
    //   for each key,
    //     bin the data from the lower level
    for (var j = level_to_rebin + 1; j < MAX_NUMBER_OF_BIN_LEVELS; j++){ // for each bin level
        for (var keyValue in bd_meta.keys) { // for each of 'average', 'max', 'min', etc.
            var key = bd_meta.keys[keyValue];

            // bin and store data from lower bin
            var newData = binTheDataWithFunction(bd, j-1, key, bd_meta[key].func, range_to_rebin, oneSample);

            if (newData.length === 0) {
                continue; // Nothing to add; move along.
            }

            // TODO: filter out what is already in the old data, OR add that ability to addData();
            // Combine what was already there and what was just calculated
            // - What was already in this bin level gets precedence
            //   over what is being binned from the lower level

            addData(bd, newData, key, j);

        } // for each key
    } // for each bin level
    postMessage({'command': "rebin", 'result': "success"});
}


// Bin the data in a level into abstracted bins
function binTheDataWithFunction (bin, curLevel, key, func, range_to_rebin, oneS) {
    var bDat = new Array();
    if (!bin[key].levels[curLevel]) {
        return bDat;
    }

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
            combo[i+1].ms - combo[i].ms === sampleSize(curLevel, oneS) :
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
    return bDat; // TODO: currently this returns [];
};

function combineFilteredBinContainerInformation (bin, lvl, key, range) {
    // Returns ALL data from any container which intersects the requested range
    // AKA:  Grabs ALL containers which line up with the containers of the
    //       one-higher level's intersection with this range

    // get lvl+1's range of containers for this range
    var upperLevelRange = [ // range until very end
        getMSStartForTimeAtLevel(range[0], lvl+1),
        getMSStartForTimeAtLevel(range[1], lvl+1) + binContainerSize(lvl+1)
    ];

    // get lvl range of containers for that range
    if (!upperLevelRange[0] || !upperLevelRange[1]) {
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

function getMSStartForTimeAtLevel (ms, lvl) {
    // TODO: calculate the starting ms of the bin container
    // [at this level] in which this ms would fit.

    var sizeOfTheBinContainerInMS = sampleSize(lvl, oneSample) * MAX_NUMBER_OF_ITEMS_PER_ARRAY;

    return Math.floor(ms / ( sizeOfTheBinContainerInMS )) * sizeOfTheBinContainerInMS;
}

function sampleSize(lvl, oneS) {
    return Math.pow(2, lvl) * oneS;
}

binContainerSize = function (lvl) {
    return binSize(lvl) * MAX_NUMBER_OF_ITEMS_PER_ARRAY;
}

binSize = function (lvl) {
    return Math.pow(2, lvl) * oneSample;
}

addData = function (bd, data, key, lvl) {
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

function getSurroundingBinContainers (start, end, lvl) {
    // return all bin container starts at this level between start and end
    // NOT INCLUDING the highest point if it is equal to end

        var binSize = binContainerSize(lvl);

        var startRounded = getMSStartForTimeAtLevel(start, lvl);

        return range(startRounded, end, binSize);
}

function range(start, stop, step){
  var a=[], b=start;
  while(b<stop){b+=step;a.push(b-step)}
  return a;
}

function atModularLocation(ms, lvl) {
    // True if ms is at the beginning of a bin in level lvl.
    return ms % (Math.pow(2, lvl) * oneSample) === 0;
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

                break;
            } else if (arr1[arr1Index].ms === arr2[i].ms) {
                // If the next one is the same,
                // move on to the next arr2 (don't increment)

                // Though, if one is NaN, then the other should be used.
                if (isNaN(arr1[arr1Index].val)) {
                    arr1[arr1Index].val = arr2[i].val;
                }

                break;
            } else {
                // If the next one is lower than this one,
                // increment and compare to the new one from arr1

                arr1Index++;
            }
        }
    }

    return arr1.concat(uniques);
}

function getTwoSmallest (array) {
    var arr = array.slice();
    first = Math.min.apply(this, arr);
    arr.splice(arr.indexOf(first),1);
    second = Math.min.apply(this, arr);
    return [first, second];
};

function average (array) {
    var sum = array.reduce(function(a, b) { return a + b });
    return sum/array.length;
};

function getTwoLargest (array) {
    var arr = array.slice();
    first = Math.max.apply(this, arr);
    arr.splice(arr.indexOf(first),1);
    second = Math.max.apply(this, arr);
    return [first, second];
};

addData = function (data, key, lvl) {
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

addRawData = function (data, dontBin, oneS) {
    // data must be in the following form: (example)
    // [ {val: value_point, ms: ms_since_epoch},
    //   {val: value_point, ms: ms_since_epoch},
    //   {etc...},
    // ],

    var range = timeExtent(data);
    addData(data, 'rawData', 0);

    if(!dontBin) {
        rebin(range, 0, oneS);
    }
}

timeExtent = function (arr) {
    return [_.min(arr, function (d) { return d.ms; }),
            _.max(arr, function (d) { return d.ms; })];
}

addBinnedData = function (bData, lvl, dontBin, oneS) {
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
            var ext = timeExtent(bData[keys[i]].levels[lvl]);
            lows.push(ext[0]);
            highs.push(ext[1]);
        }
    }

    var range = [
            Math.min.apply(this, lows),
            Math.max.apply(this, highs)
    ];

    for (var k in bd_meta.keys) { // for each of max_val, min_val, etc.
        var key = bd_meta.keys[k];
        addData(bData[key].levels[lvl], key, lvl);
    }; // for each of max_val, min_val, etc.

    if(!dontBin) {
        rebin(range, lvl, oneS);
    }
}

haveDataInRange = function(ms_range, level) {
    // Determine the number of samples which we should have in the given range.

    // TODO TODO TODO: update for new bin containers

    var key;
    if (level === 0) {
        key = "rawData";
    } else {
        key = "average";
    }

    var datedRange = getDateRange([key], level, ms_range);

    if (datedRange.length === 0) {
        return false;
    }

    var firstSample = datedRange[0].ms;

    if (firstSample > ms_range[0] + sampleSize(level)) {
        return false;
    }

    var actualRange = ms_range[1] - firstSample;
    var numberWeShouldHave = Math.floor(actualRange / sampleSize(level));

    var numberWeHave = datedRange.length;

    return numberWeHave >= numberWeShouldHave;
}

getDateRange = function (keys, lvl, range) {
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

getDateRangeWithMissingValues = function (key, lvl, range, extra) {
    // give the range of data for this key and level
    // NOT including the highest value in range
    // USE:
    // filter an array so that we don't render much more
    // than the required amount of line and area
    // missing values are NaN's

    var missings = missingBins(range, lvl, true);

    missingsObjs = missings.map(function (d) {
        return {ms: d, val: NaN};
    });

    result = combineAndSortArraysOfDateValObjects(
            missingsObjs,
            getDateRange([key], lvl, range)
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

missingBins = function(ms_range, level, samplesInsteadOfRanges) {
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
    var datedRange = getDateRange([key], level, normalizedRange);

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
