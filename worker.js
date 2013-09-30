if(typeof importScripts == "function"){
    importScripts('binnedData.js'); // TODO: why does this need to be in here?
}
var binData = binnedData();

self.addEventListener('message',  function(event){
    var command = event.data.command;
    var argz = event.data.argz;
    postMessage([command, binData[command].apply(binData, argz)]);
});

function getNextPrime(i) {
    return i+1;
}

function combineAndSortArraysOfDateValObjects(arr1, arr2) {
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

    return (arr1.concat(uniques)).sort(function (a, b) { return a.ms - b.ms; });
}
