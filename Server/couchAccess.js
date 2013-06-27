var cradle = require('cradle')
var db = new(cradle.Connection)().database('bridge_test');

function saveToCouch(id, data){
    db.save(id, {
        data: data
    }, function (err, res) {
        if (err) {
            //Handle error
            console.log("saving ERROR");
        } else {
            // Handle success
            console.log("saving success");
        }
    });
}
