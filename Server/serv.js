//get Vim to automatically reload queries_not_unique.txt: set autoread

var http = require('http');
var fs = require('fs');
var mysql = require('mysql');

//var app = http.createServer(); //(handler); //if we want to serve html, too. // for html
var io = require('socket.io').listen(8080); //(app) for html
io.configure(function () { io.set('log level', 2); });
//app.listen(8080); // for html


var jsonData = [ { "ESGgirder1" : -47.8500 }, { "ESGgirder1" : -39.3800 }, { "ESGgirder1" : -39.3800 }, { "ESGgirder1" : -44.9100 }, { "ESGgirder1" : -44.9100 } ];

var jsonData = fs.readFileSync(__dirname + '/ESGgirder1_from_SPBRTData_0A.js').toString(); // block while getting the girder contents.


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

io.sockets.on('connection', function (socket) {
  socket.emit('news', jsonData);
  socket.on('ack', function (data) {
    console.log("client: " + data); //ack
  });
});






//var server = http.createServer(function(req, res) {
//  res.writeHead(200);
//  console.log("connection!");
//  res.end(); // if this isn't there, the client will just hang and wait for a long time
//}).listen(8080);

/*
var send_to_user = "";

var mysqlconnection = mysql.createConnection({
  host     : 'shm1.ee.umanitoba.ca',
  user     : 'mattwoelk',
  password : fs.readFileSync(__dirname + '/ps').toString().trim(),
  database : 'SPB_SHM_2012MM01',
});

mysqlconnection.connect(); // perhaps not necessary; seems to be working without it

//mysqlconnection.query('SHOW databases', function (err, rows, fields) {
//  if (err) throw err;
//  console.log("rows:\n", rows, "\n\nfields:\n", fields);
//});

query = 'Show databases'; // did not use 'database' in mysqlconnection options
query = 'Show tables FROM SPB_SHM_2012MM01'; // did not use 'database' in mysqlconnection options
//query = 'SELECT * FROM SPBRTData_Truck'; // this is a giant dump of data which takes forever to happen
query = 'Describe SPBRTData_Truck';
var girder = 1;
query = 'SELECT ESGgirder' + girder + ' FROM SPBRTData_Truck';
query = 'SELECT ESGgirder' + girder + ' FROM SPBRTData_Truck LIMIT 10'; // grab 10 entries (LIMIT 10)
query = 'SELECT NumStartTime_DD, NumEndTime_DD, NumStartTime_CC, NumStartTime_CC, ESGgirder' + girder + ' FROM SPBRTData_Truck LIMIT 15';
query = 'SELECT ESGgirder' + girder + ' FROM SPBRTData_Truck LIMIT 10'; // grab 10 entries (LIMIT 10)
query = 'SELECT ESGgirder' + girder + ' FROM SPBRTData_0A LIMIT 10'; // grab 10 entries (LIMIT 10)

mysqlconnection.query(query, function (err, rows, fields) {
  if (err) throw err;
  console.log(query, "\n\n", "rows:\n", rows, "\n\nfields:\n", fields, "\n\n");
  send_to_user = JSON.stringify(rows);
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

