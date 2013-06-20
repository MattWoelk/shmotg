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
if (process.argv[3] === undefined) {
    return // not enough inputs
}

var rangeToWalk = [process.argv[2], process.argv[3]];

// COMMAND LINE INPUT }}}

var query = makeQuery(rangeToWalk[0], rangeToWalk[1]);

//console.log(query);

return sendDatabaseQuery(query, function (queryResult) {
    var a = JSON.stringify(queryResult);
    //process.stdout.write(a);
    console.log(a);
    process.exit(1);
});
