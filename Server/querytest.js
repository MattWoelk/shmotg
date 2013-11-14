var mysql = require('mysql');
var fs = require('fs');

query = 'SELECT ESGgirder18, SampleIndex, Miliseconds, Time FROM SPBRTData_0A LIMIT 10';
query = 'SELECT CAST(Time as datetime) FROM SPBRTData_0A LIMIT 10';
query = 'SELECT CONVERT_TZ(Time) FROM SPBRTData_0A LIMIT 10';
query = 'SELECT Time FROM SPBRTData_0A LIMIT 10';
//query = 'SELECT Time FROM SPBRTData_0A WHERE Time BETWEEN NOW() AND (NOW() - INTERVAL 5 YEAR) LIMIT 10';
//query = 'SELECT Time FROM SPBRTData_0A WHERE Time BETWEEN "Sun Jan 01 2012 00:57:34 GMT-0600 (CST)" AND "Sun Jan 01 2012 00:57:35 GMT-0600 (CST)" LIMIT 201';
query =
'SELECT Time FROM SPBRTData_0A WHERE Time BETWEEN "2012-01-02 10:00:01" AND "2012-01-02 10:00:02" LIMIT 10';

query = 'Show databases'

var mysqlconnection = mysql.createConnection({
  host     : 'shm1.ee.umanitoba.ca',
  user     : 'mattwoelk',
  password : fs.readFileSync(__dirname + '/ps').toString().trim(),
  database : 'SPB_SHM_2012MM01',
});

mysqlconnection.connect(); // perhaps not necessary; seems to be working without it

mysqlconnection.query(query, function (err, rows, fields) {
  if (err) throw err;
  console.log(query, "\n\n", "rows:\n", rows, "\n\nfields:\n", fields, "\n\n");
});

mysqlconnection.end();
