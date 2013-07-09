// {{{ SETUP
var fs = require('fs');
var mysql = require('mysql');
d3 = require("d3");
require("../binnedData.js");

red = '\033[31m';
yellow = '\033[33m';
magenta = '\033[35m';
blue = '\033[36m';
reset = '\033[0m';

dt = function (num) {
  var newdate = new Date();
  newdate.setTime(num);
  return newdate;
}
// SETUP }}}

//{{{ PROTOTYPE
// Override Date.prototype.toJSON
// because JSON.stringify() uses it to change
// the format of our dates when they're converted
// back to strings
// NOTE: this is not actually required anymore
// because we're sending milliseconds instead of
// date strings, but it's nice to have around. :)
Date.prototype.toJSON = function (key) {
  //console.log("key: ");
  //console.log(key, this);
  return this + "";
};
// PROTOTYPE }}}

// {{{ CONNECTION
// CONNECTION }}}

// {{{ PRIVATE FUNCTIONS
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
// PRIVATE FUNCTION }}}

// {{{ PUBLIC METHODS
makeQuery = function(a, b, letter) {
    var dtr = dt(a); // date to request
    var dtr2 = dt(b); // second date to request

    var let = letter ? letter : 'A';

    // query = 'SELECT ESGgirder18, SampleIndex, Miliseconds, Time FROM SPBRTData_0A LIMIT 1000';
    var queryHead = 'SELECT ESGgirder18, SampleIndex, Time FROM SPBRTData_0' + let + ' WHERE Time BETWEEN';
    var query1 = ' "' + dtr.getFullYear() +
               '-' + pad(dtr.getMonth() + 1) +
               '-' + pad(dtr.getDate()) +
               ' ' + pad(dtr.getHours()) +
               ':' + pad(dtr.getMinutes()) +
               ':' + pad(dtr.getSeconds()) + '"';
    var queryMid = ' AND ';
    var query2 = '"' + dtr2.getFullYear() +
               '-' + pad(dtr2.getMonth() + 1) +
               '-' + pad(dtr2.getDate()) +
               ' ' + pad(dtr2.getHours()) +
               ':' + pad(dtr2.getMinutes()) +
               ':' + pad(dtr2.getSeconds() + 1) + '"';
    var queryTail = '';

    return queryHead + query1 + queryMid + query2 + queryTail;
}

dateStringToMilliseconds = function (dateStr) {
  return d3.time.format("%a %b %d %Y %H:%M:%S")
    .parse(dateStr.substring(0, 24))
    .getTime();
}

samplesToMilliseconds = function (sampleIndex) {
  var samplesPerSecond = 200;
  var msPerSample = 1000/samplesPerSecond;
  var mils = sampleIndex * msPerSample;
  return mils;
}

dateAndSampleIndexStringToMilliseconds = function (dateStr, sampleIndex) {
  return dateStringToMilliseconds(dateStr) + samplesToMilliseconds(sampleIndex);
}

getDataFromDataBaseInRange = function (ms0, ms1, callback) {
    vals = ['A','B','C','D','E','F'];
    queries = [];
    for (var i = 0, l = vals.length; i < l; i ++) {
        queries.push(makeQuery(ms0, ms1, vals[i]));
    }

    result = [];

    // Get all queries in series,
    // then callback with the combination of them all

    //Heavy inspiration from: http://book.mixu.net/ch7.html
    function series(item, func, callback) {
        if(item) {
            func(item, function(dat) {
                result = combineAndSortArraysOfDateValObjects(result, dat);
                return series(queries.shift(), func, callback);
            });
        } else {
            return callback(result);
        }
    }

    series(queries.shift(), sendDatabaseQuery, callback);
}

sendDatabaseQuery = function(query, doWithResult) {
  console.log("sending db query");
  var mysqlconnection = mysql.createConnection({
    host     : 'shm1.ee.umanitoba.ca',
    user     : 'mattwoelk',
    password : fs.readFileSync(__dirname + '/ps').toString().trim(),
    database : 'SPB_SHM_2012MM01',
  });

  mysqlconnection.query(query, function (err, rows, fields) {
    if (err) { console.log("err: ", err); doWithResult(null); return; }
    console.log(red+query, blue+rows.length+reset);
    //console.log("ROWS: ", rows);
    var send_object = rows.map(function (d) {
        return { val: d.ESGgirder18 ,
                 ms: dateAndSampleIndexStringToMilliseconds(
                 d.Time + "",
                 d.SampleIndex)
               };
    });

    doWithResult(send_object); // send_object is always raw data
    //mysqlconnection.end();
  });

  mysqlconnection.end();
}

pad = function(integ) {
  var i = "" + integ;
  if (i.length === 1) { i = "0" + i; } // pad with a zero if necessary
  return i;
}
// PUBLIC METHODS }}}
/* vim: set foldmethod=marker: */
