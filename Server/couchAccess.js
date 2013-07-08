var cradle = require('cradle')
var db = new(cradle.Connection)().database('bridge_test2');

// TODO TODO TODO: make a function which merges data instead of just overwriting it
//                 and use it instead!

saveWithMergeToCouch = function (sensorType, sensorNumber, type, lvl, ms_start, data, callback) {
    getFromCouch(sensorType, sensorNumber, type, lvl, ms_start, function (d) {
        if (data.length > d.length) {
            //console.log("adding data", data.length, d.length, combineAndSortArraysOfDateValObjects(data, d).length);
        }
        saveToCouch(sensorType, sensorNumber, type, lvl, ms_start, combineAndSortArraysOfDateValObjects(data, d), callback);
    });
}

function combineAndSortArraysOfDateValObjects (arr1, arr2) {
    // Add the objects from arr2 (array) to arr1 (array)
    //   only if the object from arr2 has a ms value
    //   which no object in arr1 has.
    // ie. arr1 gets precedence

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

                //console.log("add them:", arr1[arr1Index].ms, arr2[i].ms);
                break;
            } else if (arr1[arr1Index].ms === arr2[i].ms) {
                // If the next one is the same,
                // move on to the next arr2 (don't increment)

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

saveToCouch = function (sensorType, sensorNumber, type, level, ms_start, data, callback) {
    var idString = makeIDString(sensorType, sensorNumber, type, level, ms_start);

    db.save(idString, {
        data: data
    }, function (err, res) {
        if (err) {
            //Handle error
            console.log("saving ERROR");
        } else {
            // Handle success
            console.log("saving success!", idString);
        }
        if (callback) {
            callback();
        }
    });
}

makeIDString = function (sensorType, sensorNumber, type, level, ms_start) {
    var typeConversion = {
        "average": "a",
        "q1": "1",
        "q3": "3",
        "mins": "i",
        "maxes": "m",
    }

    var result = ""
    if (sensorType === "girder") {
        result += "G";
    } else if (sensorType === "strap") {
        result += "S";
    }
    result += sensorNumber;
    result += "-" + typeConversion[type];
    result += "-" + level;
    result += "-" + ms_start;
    return result;
}

getFromCouch = function (sensorType, sensorNumber, type, level, ms_start, callback){
    var idString = makeIDString(sensorType, sensorNumber, type, level, ms_start);

    db.get(idString, function (err, doc) {
        var result = doc ? doc.data : [];
        callback(result);
    });
}

checkIfExists = function (sensorType, sensorNumber, type, level, ms_start, callback) {
    var idString = makeIDString(sensorType, sensorNumber, type, level, ms_start);

    db.query({
        method: 'HEAD',
        path: '/' + idString,
    }, function (err, res) {
        callback(res.statusCode === 200);
    });
}
