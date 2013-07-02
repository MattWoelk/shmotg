var cradle = require('cradle')
var db = new(cradle.Connection)().database('bridge_test');

saveToCouch = function (sensorType, girderNumber, type, level, ms_start, data){
    var idString = makeIDString(sensorType, girderNumber, type, level, ms_start);

    db.save(idString, {
        data: data
    }, function (err, res) {
        if (err) {
            //Handle error
            console.log("saving ERROR");
        } else {
            // Handle success
            console.log("saving success!", idString);
        }
    });
}

makeIDString = function (sensorType, girderNumber, type, level, ms_start) {
    var typeConversion = {
        "average": "a",
        "q1": "1",
        "q3": "3",
        "mins": "i",
        "maxes": "m",
    }

    var result = ""
    if (sensorType === "girder") {
        result += "G";
    } else if (sensorType === "strap") {
        result += "S";
    }
    result += girderNumber;
    result += "-" + typeConversion[type];
    result += "-" + level;
    result += "-" + ms_start;
    return result;
}

getFromCouch = function (sensorType, girderNumber, type, level, ms_start){
    var idString = makeIDString(sensorType, girderNumber, type, level, ms_start);

    db.get(idString, function (err, doc) {
        console.log(doc.data);
        //console.log(doc.data[0].ms);
    });
}
