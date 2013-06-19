// {{{ SETUP
var http = require('http');
var fs = require('fs');
var mysql = require('mysql');
_ = require('underscore');
d3 = require("d3");
require("../binnedData.js");
require("./database.js");

//console.log("USAGE:");
//console.log("  start_year(YYYY) start_month(0-11) start_day(1-31) start_hour(0-23) start_minute(0-59)");
//console.log("  end_year(YYYY) end_month(0-11) end_day(1-31) end_hour(0-23) start_minute(0-59)");

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
if (process.argv[13] === undefined) {
    return // not enough inputs
}

var start_year  = process.argv[2];
var start_month = process.argv[3];
var start_day   = process.argv[4];
var start_hour  = process.argv[5];
var start_minute  = process.argv[6];
var start_second  = process.argv[7];

var end_year  = process.argv[8];
var end_month = process.argv[9];
var end_day   = process.argv[10];
var end_hour  = process.argv[11];
var end_minute  = process.argv[12];
var end_second  = process.argv[13];

var rangeToWalk = [(new Date(start_year, start_month, start_day, start_hour, start_minute, start_second)).getTime(),
                   (new Date(end_year  , end_month  , end_day  , end_hour  , end_minute  , end_second  )).getTime()];

// COMMAND LINE INPUT }}}

var query = makeQuery(rangeToWalk[0], rangeToWalk[1]);

//console.log(query);

return sendDatabaseQuery(query, function (queryResult) {
    // Bin the new data
    var tmpData = binnedData();
    try {
        tmpData.addRawData(queryResult);
    } catch (e) {
        throw e;
    }

    var a = JSON.stringify(tmpData.bd());

    console.log(a);
    process.exit(1);
});
