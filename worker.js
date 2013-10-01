if(typeof importScripts == "function"){
    importScripts('binnedData.js'); // TODO: why does this need to be in here?
}

//var binData = binnedData();

var oneSample;

self.addEventListener('message',  function(event){
    var command = event.data.command;
    var argz = event.data.argz;
    postMessage({'command': command, 'result': rebin.apply(this, argz)});
});

var bd_meta  = {
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

function rebin (bd, range_to_rebin, level_to_rebin, oneS) {
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

            my.addData(newData, key, j);

        } // for each key
    } // for each bin level
    return bd;
}


// Bin the data in a level into abstracted bins
function binTheDataWithFunction (bin, curLevel, key, func, range_to_rebin, oneSample) {
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
            combo[i+1].ms - combo[i].ms === sampleSize(curLevel, oneSample) :
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

function getMSStartForTimeAtLevel (ms, lvl) {
    // TODO: calculate the starting ms of the bin container
    // [at this level] in which this ms would fit.


    var sizeOfTheBinContainerInMS = sampleSize(lvl) * MAX_NUMBER_OF_ITEMS_PER_ARRAY;

    return Math.floor(ms / ( sizeOfTheBinContainerInMS )) * sizeOfTheBinContainerInMS;
}

function sampleSize(lvl, oneSample) {
    return Math.pow(2, lvl) * oneSample;
}

binContainerSize = function (lvl) {
    return binSize(lvl) * MAX_NUMBER_OF_ITEMS_PER_ARRAY;
}

binSize = function (lvl) {
    return Math.pow(2, lvl) * oneSample;
}
