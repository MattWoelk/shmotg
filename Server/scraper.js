// {{{ SETUP
var http = require('http');
var fs = require('fs');
var mysql = require('mysql');
_ = require('underscore');
d3 = require("d3");
require("../binnedData.js");
require("./database.js");
//require("./couchAccess.js");


var cradle = require('cradle')
var db = new(cradle.Connection)().database('bridge_test');

red = '\033[31m';
yellow = '\033[33m';
magenta = '\033[35m';
blue = '\033[36m';
reset = '\033[0m';

function dt (num) {
    var newdate = new Date();
    newdate.setTime(num);
    return newdate;
}
// SETUP }}}

// {{{ GLOBAL VARIABLES
var MAX_NUMBER_OF_BIN_LEVELS = 46; // keep sync'd with ../binnedChart.js and scraper.js
var WHICH_GIRDER = "ESGgirder18";

var STEP_SIZE = 600000; // 10000 is 2400 samples each time
                      // 60000 is 1 minute each time
                      // 100000 is 1:40 each time
                      // 600000 is ten minutes each time (works best for binning 1.0)

var binData = binnedData();
// GLOBAL VARIABLES}}}

// {{{ COMMAND LINE INPUT
if (process.argv[9] === undefined) {
    console.log("USAGE:");
    console.log("  start_year(YYYY) start_month(0-11) start_day(1-31) start_hour(0-23)");
    console.log("  end_year(YYYY) end_month(0-11) end_day(1-31) end_hour(0-23)");
    return
}

var start_year  = process.argv[2];
var start_month = process.argv[3];
var start_day   = process.argv[4];
var start_hour  = process.argv[5];

var end_year  = process.argv[6];
var end_month = process.argv[7];
var end_day   = process.argv[8];
var end_hour  = process.argv[9];
// COMMAND LINE INPUT }}}

// {{{ WHERE TO WALK
var lowestLevelToKeep = 6;

var rangeToWalk = [(new Date(start_year, start_month, start_day, start_hour)).getTime(),
    (new Date(end_year, end_month, end_day, end_hour)).getTime()];

if (rangeToWalk[0] >= rangeToWalk[1]) {
    console.log("we already have that time span");
    return;
}

// WHERE TO WALK }}}

function saveToCouch(id, data) {
    db.save(id, {
        data: data
    }, function (err, res) {
        if (err) {
            //Handle error
            console.log("saving ERROR");
        } else {
            // Handle success
            console.log("saving success:", id);
        }
    });
}

function async_function_example(arg, callback) {
  console.log('do something with \''+arg+'\', return 0.1 sec later');
  setTimeout(function() { callback(arg); }, 100);
}

//Heavy inspiration from: http://book.mixu.net/ch7.html
function sendQuerySync(item, callback) {
    var query = makeQuery(item, item + STEP_SIZE);

    sendDatabaseQuery(query, function (queryResult) {
        // Bin the new data
        console.log("- data received. binning data...");
        if(queryResult == null) {
            callback();
            return;
        }
        try {
            binData.addRawData(queryResult);

            // Delete the bottom few levels
            binData.removeAllLevelsBelow(lowestLevelToKeep);
        } catch (e) {
            console.log(magenta+"=*= ERROR =*="+reset, e.message);
            throw e;
        }
        console.log("...done binning");
        callback();
    });
}

function series(item, func) {
    if(item) {
        func(item, function() {
            return series(walk_steps.shift(), func);
        });
    } else {
        console.log("saving now");
        return saveIt(final);
    }
}

var walk_steps = [];
for(var i = rangeToWalk[0]; i < rangeToWalk[1]; i = i + STEP_SIZE) {
    walk_steps.push(i);
}

// Run the series
series(walk_steps.shift(), sendQuerySync);

// Final task (same in all the examples)
function final() {
    // TODO: save it out to couchdb
    console.log('Done');
    //process.exit(0);
}

function createIDString(girder, key, level, ms_start) {
    // returns the ID which the couchdb database will use.
    return "" + girder + "-" + key + "-" + level + "-" + ms_start;
}

function saveIt(callback) {
    for (var ke in binData.getKeys()) { // for each key
        var k = binData.getKeys()[ke];

        for (var l = lowestLevelToKeep; l < MAX_NUMBER_OF_BIN_LEVELS; l++) { // for each level
            if (!binData.bd()[k]) { continue; }

            for (var c in binData.bd()[k].levels[l]) { // for each bin container
                var id = createIDString(WHICH_GIRDER, k, l, c);
                var dat = binData.bd()[k].levels[l][c];
                console.log("saving:", id, "to couchDB");

                saveToCouch(id, dat);
            }
        }
    }
}

/* vim: set foldmethod=marker: */
