// {{{ SETUP
var http = require('http');
var fs = require('fs');
var mysql = require('mysql');
_ = require('underscore');
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

var mysqlconnection = mysql.createConnection({
  host     : 'shm1.ee.umanitoba.ca',
  user     : 'mattwoelk',
  password : fs.readFileSync(__dirname + '/ps').toString().trim(),
  database : 'SPB_SHM_2012MM01',
});

// {{{ CONNECTION
mysqlconnection.connect(); // perhaps not necessary; seems to be working without it

// DISCONNECTS FROM THE MYSQL DATABASE
handleDisconnect = function(connection) {
  connection.on('error', function(err) {
    if (!err.fatal) {
      return;
    }

    if (err.code !== 'PROTOCOL_CONNECTION_LOST') {
      throw err;
    }

    console.log('Re-connecting lost connection: ' + err.stack);

    connection = mysql.createConnection(connection.config);
    handleDisconnect(connection);
    connection.connect();
  });
}

handleDisconnect(mysqlconnection);
// CONNECTION }}}

// {{{ PUBLIC METHODS
makeQuery = function(a, b) {
    var dtr = dt(a); // date to request
    var dtr2 = dt(b); // second date to request

    // query = 'SELECT ESGgirder18, SampleIndex, Miliseconds, Time FROM SPBRTData_0A LIMIT 1000';
    var queryHead = 'SELECT ESGgirder18, SampleIndex, Time FROM SPBRTData_0A WHERE Time BETWEEN';
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

sendDatabaseQuery = function(query, doWithResult, st, en, res) {
  mysqlconnection.query(query, function (err, rows, fields) {
    if (err) {console.log("err: ", err); return err;}
    console.log(red+query, blue+rows.length+reset);
    //console.log("ROWS: ", rows);
    var send_object = rows.map(function (d) {
      return { val: d.ESGgirder18 ,
               ms: dateAndSampleIndexStringToMilliseconds(
                 d.Time + "",
                 d.SampleIndex)
             };
    });

    doWithResult(send_object, st, en, res); // send_object is always raw data
  });
}

pad = function(integ) {
  var i = "" + integ;
  if (i.length === 1) { i = "0" + i; } // pad with a zero if necessary
  return i;
}
// PUBLIC METHODS }}}
/* vim: set foldmethod=marker: */
