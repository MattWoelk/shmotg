// {{{ SETUP
var http = require('http');
var fs = require('fs');
var mysql = require('mysql');
_ = require('underscore');
d3 = require("d3");
require("../binnedData.js");
require("./database.js");

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

var current_starts = [dt(rangeToWalk[0]).getFullYear(),
                      dt(rangeToWalk[0]).getMonth(),
                      dt(rangeToWalk[0]).getDate(),
                      dt(rangeToWalk[0]).getHours()];
var current_ends   = [dt(rangeToWalk[1]).getFullYear(),
                      dt(rangeToWalk[1]).getMonth(),
                      dt(rangeToWalk[1]).getDate(),
                      dt(rangeToWalk[1]).getHours()];

var stepSize = 60000; // 10000 is 2400 samples each time
// 60000 is 1 minute each time
// 100000 is 1:40 each time
// 600000 is ten minutes each time (works best for binning 1.0)

// WHERE TO WALK }}}

// TODO: walk through each section of the database
for (var i = rangeToWalk[0]; i < rangeToWalk[1]; i = i + stepSize) {
    var reset_it = false;

    if (i % 21600000 === 0) {
        // TODO: reset binData, and TODO TODO TODO: start a new file (ASYNCHRONOUSLY!)
        //                                          or start using a new bindata, which isn't as efficient
        current_starts = [dt(i).getFullYear(),
                          dt(i).getMonth(),
                          dt(i).getDate(),
                          dt(i).getHours()];
        current_ends   = [dt(i+21600000).getFullYear(),
                          dt(i+21600000).getMonth(),
                          dt(i+21600000).getDate(),
                          dt(i+21600000).getHours()]
        reset_it = true;
        //console.log(dt(i).getHours() + ":" + dt(i).getMinutes(), dt(i+21600000).getHours() + ":" + dt(i+21600000).getMinutes());
    }

    var query = makeQuery(i, i+stepSize);

    sendDatabaseQuery(query, function (queryResult, st, en, res) {
        // Bin the new data
        console.log("- data received. binning data...");
        try {
            // For each one, add its rawData to binData, and bin it all
            if (res) {
                // reset it, because we're starting a new file now
                binData = binnedData();
            }
            binData.addRawData(queryResult);

            // Delete the bottom few levels
            binData.removeAllLevelsBelow(lowestLevelToKeep);

            // Save the data-structure
            saveItOut(st, en);
        } catch (e) {
            console.log(magenta+"=*= ERROR =*="+reset, e.message);
            throw e;
        }
        console.log("...done binning");
    }, current_starts, current_ends, reset_it);
}

function saveItOut (st, en) {
    // Save binData to a file
    var x = binData.toString();

    var saveName = "/Users/woelk/scraped_2.1_6/scraped_piece_"+lowestLevelToKeep
    +"_"+st[0]+"-"+st[1]+"-"+st[2]+"-"+st[3]
    +"_"+en[0]+"-"+en[1]+"-"+en[2]+"-"+en[3]

    fs.writeFile(saveName, x, function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log("The file was saved to"+saveName);
        }
    });
}

/* vim: set foldmethod=marker: */
