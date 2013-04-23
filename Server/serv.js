var http = require('http');
var fs = require('fs');
var mysql = require('mysql');
var _ = require('underscore');
var d3 = require("d3");
require("../binnedData.js");

// CONSTANTS TODO: get rid of these once they're no longer required
var MAX_NUMBER_OF_BIN_LEVELS = 34; // keep sync'd with ../binnedChart.js

//var app = http.createServer(); //(handler); //if we want to serve html, too. // for html
var io = require('socket.io').listen(8080); //(app) for html
io.configure(function () { io.set('log level', 2); });
//app.listen(8080); // for html


var jsonData = [ { "ESGgirder1" : -47.8500 }, { "ESGgirder1" : -39.3800 }, { "ESGgirder1" : -39.3800 }, { "ESGgirder1" : -44.9100 }, { "ESGgirder1" : -44.9100 } ];

var jsonData = fs.readFileSync(__dirname + '/esg_time.js').toString(); // block while getting the girder contents.

var listOfGirders = ['ESGgirder18'];
var sensorBins = []; // an array of binData in the following form:
                     // sensorBins = [ { sensor: 'ESGgirder18', binData: [just like in binnedChart.js] },
                     //                { sensor: 'another', binData: [etc.]},
                     //                { etc ... }]

// initialize sensorBins
var i = 0;
for (var li in listOfGirders) {
  var l = listOfGirders[li];
  sensorBins[l] = { keys : ['average', 'maxes', 'mins', 'q1', 'q3'] };
  i = i + 1;
}


// Bin 'bin' into abstracted bins
function binAll (bin) {
  for (var keyValue in bin.keys) {
    var key = bin.keys[keyValue];
    bin[key].levels[0] = bin.rawData.levels[0]; // update raw data from the source
  }

  // for each level other than raw data level, for each key, bin the data from the lower level
  for (j = 1; j < MAX_NUMBER_OF_BIN_LEVELS; j++){ // for each bin level
    for (var keyValue in bin.keys) { // for each of 'average', 'max', 'min', etc.
      var key = bin.keys[keyValue];

      // store new data
      var newData = binTheDataWithFunction(bin, j-1, key, bin[key].func);

      // get range of new data
      var range = [_.min(newData, function (d) { return d.date; }).date,
                   _.max(newData, function (d) { return d.date; }).date];

      // filter for old data which is outside the range of the new data
      // (newly binned data gets preference over previously binned data)
      var oldFiltered = _.filter(bin[key].levels[j], function (d) { return d.date < range[0] || d.date > range[1]; });

      // combine and sort old and new
      var combo = oldFiltered.concat(newData).sort(function (a, b) { return a.date - b.date; });

      // store combination
      bin[key].levels[j] = combo;
    }
  }
}

// Bin the data in a level into abstracted bins
var binTheDataWithFunction = function (bin, curLevel, key, func) {
  var bDat = new Array();
  var i = 0;
  for(i = 0; i < bin[key].levels[curLevel].length; i = i + 2){
    if (bin[key].levels[curLevel][i+1]){
      var newdate = bin.q1.levels[curLevel][i/*+1*/].date;

      if (key === 'q1' || key === 'q3') {
        //console.log( bin.q1.levels[curLevel][i+1].date );

        bDat.push({ val:  func(
              bin.q1.levels[curLevel][i].val,
              bin.q1.levels[curLevel][i+1].val,
              bin.q3.levels[curLevel][i].val,
              bin.q3.levels[curLevel][i+1].val)
            , date: newdate }); // This is messy and depends on a lot of things
      }else{
        bDat.push( { val: func(
              bin[key].levels[curLevel][i].val,
              bin[key].levels[curLevel][i+1].val)
            , date: newdate });
      }
    }else{
      var newdate = bin[key].levels[curLevel][i].date;
      bDat.push( { val: bin[key].levels[curLevel][i].val
                 , date: newdate } );
    }
  }
  return bDat;
};

var handler = function (req, res) {
  // for html:
  //fs.readFile(__dirname + '/index.html',
  //function (err, data) {
  //  if (err) {
  //    res.writeHead(500);
  //    return res.end('Error loading index.html');
  //  }

    res.writeHead(200);
    res.end(data);
  //});
};

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


//var server = http.createServer(function(req, res) {
//  res.writeHead(200);
//  console.log("connection!");
//  res.end(); // if this isn't there, the client will just hang and wait for a long time
//}).listen(8080);

var send_to_user = "";

var mysqlconnection = mysql.createConnection({
  host     : 'shm1.ee.umanitoba.ca',
  user     : 'mattwoelk',
  password : fs.readFileSync(__dirname + '/ps').toString().trim(),
  database : 'SPB_SHM_2012MM01',
});

mysqlconnection.connect(); // perhaps not necessary; seems to be working without it

//query = 'Show databases'; // did not use 'database' in mysqlconnection options
//query = 'Show tables FROM SPB_SHM_2012MM01'; // did not use 'database' in mysqlconnection options
//query = 'SELECT * FROM SPBRTData_Truck'; // this is a giant dump of data which takes forever to happen
//query = 'Describe SPBRTData_Truck';
var girder = 1;
//query = 'SELECT ESGgirder' + girder + ' FROM SPBRTData_Truck';
//query = 'SELECT ESGgirder' + girder + ' FROM SPBRTData_Truck LIMIT 10'; // grab 10 entries (LIMIT 10)
//query = 'SELECT NumStartTime_DD, NumEndTime_DD, NumStartTime_CC, NumStartTime_CC, ESGgirder' + girder + ' FROM SPBRTData_Truck LIMIT 15';
//query = 'SELECT ESGgirder' + girder + ' FROM SPBRTData_Truck LIMIT 10'; // grab 10 entries (LIMIT 10)
//query = 'SELECT * FROM SPBRTData_0A LIMIT 10'; // grab 10 entries (LIMIT 10)
query = 'SELECT ESGgirder18, SampleIndex, Miliseconds, Time FROM SPBRTData_0A LIMIT 1000';

// TODO: make a query which selects a time range (more difficult than it should be)
//query = "SELECT ESGgirder18, SampleIndex, Miliseconds, Time FROM SPBRTData_0A WHERE Time between 'Mon Jan 02 2010 23:12:29 GMT-0600 (CST)' AND 'Mon Jan 02 2010 23:12:30 GMT-0600 (CST)' LIMIT 10";

//-- TODO: new data section --//
//var dat = Date.parse("Thu, 01 Jan 1970 00:00:00 GMT-0400");
//var dat = Date.parse("Mon Jan 02 2012 23:12:33 GMT-0600 (CST)");
//var dat = Date.parse("Thu Jan 01 1970 00:00:00 GMT-0500 (CST)");
//var dates = Date(dat);
//console.log(dat);
//console.log(dates);
//----------------------------//

function dateStringToMilliseconds (dateStr) {
  return d3.time.format("%a %b %d %Y %H:%M:%S")
    .parse(dateStr.substring(0, 24))
    .getTime();
}

function samplesToMilliseconds (sampleIndex) {
  var samplesPerSecond = 200;
  var msPerSample = 1000/samplesPerSecond;
  var mils = sampleIndex * msPerSample;
  return mils;
}

function dateAndSampleIndexStringToMilliseconds (dateStr, sampleIndex) {
  return dateStringToMilliseconds(dateStr) + samplesToMilliseconds(sampleIndex);
}

mysqlconnection.query(query, function (err, rows, fields) {
  if (err) throw err;
  console.log(query, "\n\n", "rows:\n", rows, "\n\nfields:\n", fields, "\n\n");

  var send_object = rows.map(function (d) {
    return { val: d.ESGgirder18 ,
             ms: dateAndSampleIndexStringToMilliseconds(
               d.Time + "",
               d.SampleIndex)
           };
  });

  var send_to_user = JSON.stringify(send_object);

  //console.log(send_to_user); // to print out test file

  // TODO: binnedData is included: console.log(binnedData());

  io.sockets.on('connection', function (socket) {
    socket.emit('news', send_to_user);

    socket.on('ack', function (data) {
      console.log("client: " + data); //ack
    });

    socket.on('req', function (sendReq) {
      var received = JSON.parse(sendReq);
      var req = received.req;
      var id = received.id;
      console.log("client req: " + JSON.stringify(received));

      // See if we have the requested data at the requested bin level
      var range = [parseInt(req.ms_start), parseInt(req.ms_end)];

      // TODO: see if our binned data has the requested range
      //       Use missingBins to do so
      //       - it returns ranges. Request each range from the server.
      // TODO: if it does not, make a list of missing bins
        // TODO: request the raw data which would fill those bins from database
        // TODO: receive, bin, and store the data from the database
      // TODO: send the requested data to the client
      // TODO: MAYBE: remove lowest few levels to save space

      // if it doesn't yet exist at this level, initialize it.
      // TODO: get rid of this ??
//      if (!sensorBins[req.sensor].average.levels[req.bin_level]) {
//        sensorBins[req.sensor].average.levels[req.bin_level] = [];
//        sensorBins[req.sensor].q1.levels[req.bin_level] = [];
//        sensorBins[req.sensor].q3.levels[req.bin_level] = [];
//        sensorBins[req.sensor].mins.levels[req.bin_level] = [];
//        sensorBins[req.sensor].maxes.levels[req.bin_level] = [];
//      }
          // if we don't have a binData for this sensor yet, make one
//COMMENTED OUT THE NEW STUFF FOR NOW TODO: use the new stuff
//          if (!sensorBins[req.sensor].rawData ||
//              !sensorBins[req.sensor].rawData.levels[0]) {
//            sensorBins[req.sensor] = {rawData: { levels: [[]] },
//                                      average: { levels: [[]] },
//                                      mins: { levels:    [[]] },
//                                      maxes: { levels:   [[]] },
//                                      q1: { levels:      [[]] },
//                                      q3: { levels:      [[]] }, };
//          }
//
//      var filtered_range = _.filter(sensorBins[req.sensor].rawData.levels[req.bin_level], function (d) {
//        return d.date >= range[0] && d.date <= range[1];
//      });
//
//      var quantityInRange = filtered_range.length;
//      console.log("num: " + quantityInRange);
//
//      var enoughValuesInRange = function (rng, num, lvl) {
//        // returns true if we have enough values, or false if we don't
//        var msPerSample = 1000 / 200; // 5
//        var totalSamplesForRange = (rng[1] / rng[0]) / msPerSample;
//        var requiredNumberOfValues = totalSamplesForRange / Math.pow(2, lvl);
//        return num >= requiredNumberOfValues;
//      };
//
//      // TODO: if we don't have what we need, calculate what raw data we need from the server
//      if (!enoughValuesInRange(range, quantityInRange, req.bin_level)) {
//        console.log("NEED MORE");
//        // TODO: request raw data where needed from database
//        // TODO: - (temporary) generate random data where needed
//        var msPerSample = 1000 / 200; // 5
//        var totalSamplesForRange = (range[1] - range[0]) / msPerSample;
//        var rndmdata = [];
//        var dat = parseInt(req.ms_start) - (parseInt(req.ms_start) % msPerBin);
//                //ms: (req.ms_start % msPerBin) + (i * msPerBin),
//        for(i=0;i<totalSamplesForRange;i++) {
//          rndmdata.push({
//            sensor: req.sensor,
//            ms: dat + (i * msPerBin),
//            val: randomPointRaw(),
//          })
//        }
//
//        // TODO: add the data to our raw data
//        rndmdata.forEach(function (dat, i) { // for each piece of data we received
//
//          // See if there is not already an object with that date.
//          if (_.find(sensorBins[req.sensor].rawData.levels[0], function (d) { return d.date === dat.ms; })) {
//            // We already have that data point
//          } else {
//            // Add a new object to the binData array
//            sensorBins[req.sensor].rawData.levels[0].push({date: dat.ms, val: dat.val});
//          }
//        }); // for each received data point
//
//        // sort the array again ASSUMPTION: everything in datas is at the same bin level
//        sensorBins[req.sensor].rawData.levels[0].sort(function (a, b) { return a.date - b.date; });
//
//        console.log("sensor bin raw 0 length: " + sensorBins[req.sensor].rawData.levels[0].length);
//
//        // Bin the data
//        //binAll(sensorBins[req.sensor]);
//      }

      // Send randomly generated data (temporary)
      // TODO: remove
      var randomPoint = function () {
        return Math.random() * 2 + 94; // between 94 and 96
      };
      function randomPointRaw () {
        return Math.random() * 8 + 91; // between 91 and 99
      };

      var msPerSample = 1000 / 200; // 5
      var msPerBin = Math.pow(2, req.bin_level) * msPerSample;
      var howManyPointsToGenerate = (parseInt(req.ms_end) - parseInt(req.ms_start)) / msPerBin;

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

      var send_req = {};

      if (req.bin_level === 0) {
        // make raw data

        var dat = parseInt(req.ms_start) - (parseInt(req.ms_start) % msPerBin);
                //ms: (req.ms_start % msPerBin) + (i * msPerBin),
        send_req = [];
        for(i=0;i<howManyPointsToGenerate;i++) {
          send_req.push({
            val: randomPointRaw(),
            ms: dat + (i * msPerBin),
          })
        }
      } else {
        // make binned data

        // initialize the data structure to be sent
        var theKeys = ["average", "q1", "q3", "mins", "maxes"];
        for (var i = 0; i < theKeys.length; i++) {
          send_req[theKeys[i]] = {};
          send_req[theKeys[i]].levels = [];
          send_req[theKeys[i]].levels[req.bin_level] = [];
        }
        for(i=0;i<howManyPointsToGenerate;i++) {
          var val = randomPoint();
          var val_q1 = val - (Math.random() * 1.2);
          var val_q3 = val + (Math.random() * 1.2);
          var val_min = val_q1 - (Math.random() * 2);
          var val_max = val_q3 + (Math.random() * 2);
          var dat = parseInt(req.ms_start) - (parseInt(req.ms_start) % msPerBin) - 5; // TODO: magic hack

          send_req.average.levels[req.bin_level].push({ms: dat + (i * msPerBin), val: val});
          send_req.q1.levels[req.bin_level].push({ms: dat + (i * msPerBin), val: val_q1});
          send_req.q3.levels[req.bin_level].push({ms: dat + (i * msPerBin), val: val_q3});
          send_req.mins.levels[req.bin_level].push({ms: dat + (i * msPerBin), val: val_min});
          send_req.maxes.levels[req.bin_level].push({ms: dat + (i * msPerBin), val: val_max});
        }
      }

      // Send requested data to client
      var toBeSent = {
        id: id,
        sensor: req.sensor,
        bin_level: req.bin_level,
        req: send_req };

      socket.emit('req_data', JSON.stringify(toBeSent));
    });
  });
});


mysqlconnection.end();

/*
http.createServer(function(req, res) {
  res.writeHead(200);
  //res.writeHead(200, {'Content-Type': 'text/plain'});
  //res.writeHead(200, {'charset': 'UTF-8'});
  //res.writeHead(200);

  fs.readFile('index.html', function (err, contents) {
    res.write(contents);
    res.write(send_to_user);
    res.end();
  });
}).listen(8080);
*/

console.log('Server is running on port 8080');

