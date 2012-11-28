//get vim to automatically reload queries_not_unique.txt:
//  set autoread

var http = require('http');
var fs = require('fs');
var mysql = require('mysql');
  // https://npmjs.org/package/mysql

var app = http.createServer(); //(handler); //if we want to serve html, too.
var io = require('socket.io').listen(app)
app.listen(8080);

var handler = function (req, res) {
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
  socket.emit('news', { hello: 'world' });
  socket.on('swen', function (data) {
    console.log(data); // { my: 'data'}
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
  password : fs.readFileSync('ps').toString().trim(),
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

//HOW THE DATABASES ARE SET UP:
//[ { Database: 'information_schema' },
//  { Database: 'SPB_SHM_2012MM01'   },
//  { Database: 'SPB_SHM_2012MM02'   },
//  { Database: 'SPB_SHM_2012MM03'   },
//  { Database: 'SPB_SHM_2012MM04'   },
//  { Database: 'test'               } ]

//Show tables FROM SPB_SHM_2012MM01
//[ { Tables_in_spb_shm_2012mm01: 'SPBRTData_0A'     } ,
//  { Tables_in_spb_shm_2012mm01: 'SPBRTData_0B'     } ,
//  { Tables_in_spb_shm_2012mm01: 'SPBRTData_0C'     } ,
//  { Tables_in_spb_shm_2012mm01: 'SPBRTData_0D'     } ,
//  { Tables_in_spb_shm_2012mm01: 'SPBRTData_0E'     } ,
//  { Tables_in_spb_shm_2012mm01: 'SPBRTData_0F'     } ,
//  { Tables_in_spb_shm_2012mm01: 'SPBRTData_AA'     } ,
//  { Tables_in_spb_shm_2012mm01: 'SPBRTData_CC'     } ,
//  { Tables_in_spb_shm_2012mm01: 'SPBRTData_DD'     } ,
//  { Tables_in_spb_shm_2012mm01: 'SPBRTData_Offset' } ,
//  { Tables_in_spb_shm_2012mm01: 'SPBRTData_Raw_AA' } ,
//  { Tables_in_spb_shm_2012mm01: 'SPBRTData_Raw_CC' } ,
//  { Tables_in_spb_shm_2012mm01: 'SPBRTData_Raw_DD' } ,
//  { Tables_in_spb_shm_2012mm01: 'SPBRTData_Truck'  } ,
//  { Tables_in_spb_shm_2012mm01: 'SPBRTData_temp'   } ,
//  { Tables_in_spb_shm_2012mm01: 'SPBRTData_temp2'  } ]

//Describe SPBRTData_Truck
//[{ Field: 'NumStartTime_DD' } ,
// { Field: 'NumEndTime_DD'   } ,
// { Field: 'NumStartTime_CC' } ,
// { Field: 'NumEndTime_CC'   } ,
// { Field: 'NumStartTime_AA' } ,
// { Field: 'NumEndTime_AA'   } ,
// { Field: 'LaneNumber'      } ,
// { Field: 'MaxSensorDD'     } ,
// { Field: 'MaxSGDD'         } ,
// { Field: 'MaxSensorCC'     } ,
// { Field: 'MaxSGCC'         } ,
// { Field: 'MaxSensorAA'     } ,
// { Field: 'MaxSGAA'         } ,
// { Field: 'ESGgirder1'      } ,
// { Field: 'ESGgirder2'      } ,
// { Field: 'ESGgirder3'      } ,
// { Field: 'ESGgirder4'      } ,
// { Field: 'ESGgirderDummy1' } ,
// { Field: 'ESGgirder5'      } ,
// { Field: 'ESGgirder6'      } ,
// { Field: 'ESGgirder7'      } ,
// { Field: 'ESGgirder8'      } ,
// { Field: 'ESGgirder9'      } ,
// { Field: 'ESGgirder10'     } ,
// { Field: 'ESGgirder11'     } ,
// { Field: 'ESGgirder12'     } ,
// { Field: 'ESGgirder13'     } ,
// { Field: 'ESGgirder14'     } ,
// { Field: 'ESGgirder15'     } ,
// { Field: 'ESGgirder16'     } ,
// { Field: 'ESGgirder17'     } ,
// { Field: 'ESGgirder18'     } ,
// { Field: 'ESGgirder19'     } ,
// { Field: 'ESGgirder20'     } ,
// { Field: 'ESGgirder21'     } ,
// { Field: 'ESGgirder22'     } ,
// { Field: 'ESGgirder23'     } ,
// { Field: 'ESGgirder24'     } ,
// { Field: 'ESGgirderDummy2' } ,
// { Field: 'ESGstrap1'       } ,
// { Field: 'ESGstrap2'       } ,
// { Field: 'ESGstrap3'       } ,
// { Field: 'ESGstrap4'       } ,
// { Field: 'ESGstrap5'       } ,
// { Field: 'ESGstrap6'       } ,
// { Field: 'TempDummy1'      } ,
// { Field: 'TempFOSDummy1'   } ,
// { Field: 'ESGgirder25'     } ,
// { Field: 'ESGgirder26'     } ,
// { Field: 'ESGgirderDummy3' } ,
// { Field: 'ESGgirder27'     } ,
// { Field: 'ESGgirder28'     } ,
// { Field: 'ESGgirder29'     } ,
// { Field: 'ESGgirder30'     } ,
// { Field: 'ESGgirder31'     } ,
// { Field: 'ESGgirder32'     } ,
// { Field: 'ESGgirder33'     } ,
// { Field: 'ESGgirder34'     } ,
// { Field: 'ESGgirder35'     } ,
// { Field: 'ESGgirder36'     } ,
// { Field: 'ESGgirder37'     } ,
// { Field: 'ESGgirder38'     } ,
// { Field: 'ESGgirderDummy4' } ,
// { Field: 'ESGgirder39'     } ,
// { Field: 'ESGgirder40'     } ,
// { Field: 'ESGgirder41'     } ,
// { Field: 'ESGgirder42'     } ,
// { Field: 'ESGgirder43'     } ,
// { Field: 'ESGgirder44'     } ,
// { Field: 'ESGgirder45'     } ,
// { Field: 'ESGgirder46'     } ,
// { Field: 'ESGgirder47'     } ,
// { Field: 'ESGgirder48'     } ,
// { Field: 'ESGstrap7'       } ,
// { Field: 'ESGstrap8'       } ,
// { Field: 'ESGstrap9'       } ,
// { Field: 'ESGstrap10'      } ,
// { Field: 'ESGstrap11'      } ,
// { Field: 'ESGstrap12'      } ,
// { Field: 'LVDT1'           } ,
// { Field: 'LVDT2'           } ,
// { Field: 'LVDT3'           } ,
// { Field: 'LVDT4'           } ,
// { Field: 'TempDummy3'      } ,
// { Field: 'TempDummy4'      } ,
// { Field: 'TempFOSDummy4'   } ]

//SELECT ESGgirder1 FROM SPBRTData_Truck 
//[{ ESGgirder1: 6.616                  } ,
// { ESGgirder1: 9.0565                 } ,
// { ESGgirder1: 6.178                  } ,
/////// ... MANY IN BETWEEN ... ///////
// { ESGgirder1: 7.5185                 } ,
// { ESGgirder1: 14.7555                } ,
// { ESGgirder1: 48.1155                } ,
// { ESGgirder1: 25.4355                } ,
// { ESGgirder1: 60.6755                } ]
