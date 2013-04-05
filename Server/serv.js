var http = require('http');
var fs = require('fs');
var mysql = require('mysql');
var d3 = require("d3");
var MAX_NUMBER_OF_BIN_LEVELS = 34; // keep sync'd with ../binnedChart.js

//var app = http.createServer(); //(handler); //if we want to serve html, too. // for html
var io = require('socket.io').listen(8080); //(app) for html
io.configure(function () { io.set('log level', 2); });
//app.listen(8080); // for html


var jsonData = [ { "ESGgirder1" : -47.8500 }, { "ESGgirder1" : -39.3800 }, { "ESGgirder1" : -39.3800 }, { "ESGgirder1" : -44.9100 }, { "ESGgirder1" : -44.9100 } ];

var jsonData = fs.readFileSync(__dirname + '/esg_time.js').toString(); // block while getting the girder contents.

var sensorBins = []; // an array of binData in the following form:
                     // sensorBins = [ { sensor: 'ESGgirder18', binData: [just like in binnedChart.js] },
                     //                { sensor: 'another', binData: [etc.]},
                     //                { etc ... }]


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

      // TODO: see if we have the requested data at the requested bin level
      //       AND make sure it's gapless.
      //       - Make it its own function, because binnedChart.js will need it, too.

      // TODO: if we don't have what we need, calculate what raw data we need from the server

      // TODO: request raw data where needed from database
      // TODO: - (temporary) generate random data where needed

      // TODO: add the data to out raw data

      // Bin the data

      // if we don't have a binData for this sensor yet, make one
      if (!sensorBins[req.sensor]) {
        sensorBins[req.sensor] = {};
      }

      binAll(sensorBins[req.sensor]);

      // Send randomly generated data (temporary)
      var randomPoint = function () {
        return Math.random() * 2 + 94; // between 94 and 96
      };
      var randomPointRaw = function () {
        return Math.random() * 8 + 91; // between 91 and 99
      };

      var msPerSample = 1000 / 200; // 5
      var msPerBin = Math.pow(2, req.bin_level) * msPerSample;
      var howManyPointsToGenerate = (parseInt(req.ms_end) - parseInt(req.ms_start)) / msPerBin;

      var send_req = [];

      if (req.bin_level === 0) {
        // make raw data
        var dat = req.ms_start - (req.ms_start % msPerBin);
                //ms: (req.ms_start % msPerBin) + (i * msPerBin),
        for(i=0;i<howManyPointsToGenerate;i++) {
          send_req.push({
            sensor: req.sensor,
            ms: dat + (i * msPerBin),
            val: randomPointRaw(),
          })
        }
      } else {
        // make binned data
        for(i=0;i<howManyPointsToGenerate;i++) {
          var val = randomPoint();
          var val_q1 = val - (Math.random() * 1.2);
          var val_q3 = val + (Math.random() * 1.2);
          var val_min = val_q1 - (Math.random() * 2);
          var val_max = val_q3 + (Math.random() * 2);
          var dat = req.ms_start - (req.ms_start % msPerBin) - 5; // TODO: magic hack
          send_req.push({
            sensor: req.sensor,
            ms: dat + (i * msPerBin),
            bin_level: req.bin_level,
            max_val: val + (Math.random() * 2) + 2,
            min_val: val - (Math.random() * 2) - 2,
            avg_val: val,
            q1_val: val - (Math.random() * 2),
            q3_val: val + (Math.random() * 2),
          })
        }
      }

      // Send requested data to client
      var toBeSent = {
        id: id,
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

