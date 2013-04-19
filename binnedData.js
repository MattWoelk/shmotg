// This is binnedData. A convenient way of storing binned data

binnedData = function () {

  //{{{ VARIABLES
  var bd = { // where all of the data is stored
    keys : ['average', 'maxes', 'mins', 'q1', 'q3'],
    rawData : {
      color: '#000',
      opacity: 0.5,
      levels: [], // stores all of the values for each level in an array.
                  // example: [[{val: 1.7, ms: ms_since_epoch}, {val: 2.3, ms: ms_since_epoch}], [etc.]]
    },
    average : {
      color : '#F00',
      opacity: 1,
      func   : function (a, b) { return (a+b)/2; },
      levels: [],
    },
    maxes : {
      color : '#000FB5',
      opacity: 1,
      func   : function (a, b) { return d3.max([a,b]); },
      levels: [],
    },
    mins : {
      color : '#00B515',
      opacity: 1,
      func   : function (a, b) { return d3.min([a,b]); },
      levels: [],
    },
    q1 : {
      color : '#800',
      opacity: 1,
      func   : function (a, b, c, d) { return average(getTwoSmallest([a, b, c, d])); }, // average the two smallest values from q1 and q3
      levels: [],
    },
    q3 : {
      color : '#800',
      opacity: 1,
      func   : function (a, b, c, d) { return average(getTwoLargest([a, b, c, d])); }, // average the two largest values from q1 and q3
      levels: [],
    },
    quartiles : {
      color : '#800',
      opacity: 0.3,
      //func   : function (a, b, c, d) { return average(getTwoLargest([a, b, c, d])); }, // average the two largest values from q1 and q3
      levels: [],
    },
  }; // where everything is stored

  // VARIABLES }}}

  //{{{ HELPER METHODS

  function rebin () {
    for (var keyValue in bd.keys) {
      var key = bd.keys[keyValue];
      bd[key].levels[0] = bd.rawData.levels[0]; // update raw data from the source
    }

    // for each level other than raw data level, for each key, bin the data from the lower level
    for (j = 1; j < MAX_NUMBER_OF_BIN_LEVELS; j++){ // for each bin level
      for (var keyValue in bd.keys) { // for each of 'average', 'max', 'min', etc.
        var key = bd.keys[keyValue];

        // store new data
        var newData = binTheDataWithFunction(bd, j-1, key, bd[key].func);

        // get range of new data
        var range = [_.min(newData, function (d) { return d.ms; }).ms,
                     _.max(newData, function (d) { return d.ms; }).ms];

        // filter for old data which is outside the range of the new data
        // (newly binned data gets preference over previously binned data)
        var oldFiltered = _.filter(bd[key].levels[j], function (d) { return d.ms < range[0] || d.ms > range[1]; });

        // combine and sort old and new
        var combo = oldFiltered.concat(newData).sort(function (a, b) { return a.ms - b.ms; });

        // store combination
        bd[key].levels[j] = combo;
      } // for each key
    } // for each bin level
  }

  // Bin the data in a level into abstracted bins
  function binTheDataWithFunction (bin, curLevel, key, func) {
    var bDat = new Array();
    var i = 0;
    for(i = 0; i < bin[key].levels[curLevel].length; i = i + 2){
      if (bin[key].levels[curLevel][i+1]){
        var newdate = bin.q1.levels[curLevel][i/*+1*/].ms;

        if (key === 'q1' || key === 'q3') {
          bDat.push({ val:  func(
                bin.q1.levels[curLevel][i].val,
                bin.q1.levels[curLevel][i+1].val,
                bin.q3.levels[curLevel][i].val,
                bin.q3.levels[curLevel][i+1].val)
              , ms: newdate }); // This is messy and depends on a lot of things
        }else{
          bDat.push( { val: func(
                bin[key].levels[curLevel][i].val,
                bin[key].levels[curLevel][i+1].val)
              , ms: newdate });
        }
      }else{
        var newdate = bin[key].levels[curLevel][i].ms;
        bDat.push( { val: bin[key].levels[curLevel][i].val
                   , ms: newdate } );
      }
    }
    return bDat;
  };

  function getTwoLargest (array) {
    var arr = array.slice();
    first = d3.max(arr);
    arr.splice(arr.indexOf(first),1);
    second = d3.max(arr);
    return [first, second];
  };

  function average (array) {
    return d3.sum(array)/array.length;
  };

  function getTwoSmallest (array) {
    var arr = array.slice();
    first = d3.min(arr);
    arr.splice(arr.indexOf(first),1);
    second = d3.min(arr);
    return [first, second];
  };

  function combineAndSortArraysOfDateValObjects (arr1, arr2) {
    // Add the objects from arr2 (array) to arr1 (array)
    //   if the object from arr2 has a ms value which no
    //   object in arr1 has.
    var result = arr1.concat(_.filter(arr2, function(d) {
      var b = !_.some(arr1, function(g) {
        return d.ms === g.ms;
      });
      return b;
    }));

    // sort the result
    result.sort(function (a, b) { return a.ms - b.ms; });
    return result;
  }

  // HELPER METHODS }}}

  //{{{ INITIALIZATION (runs once)
  // INITIALIZATION }}}

  //{{{ MY (runs whenever something changes)

  var my = function () {
  }

  // MY }}}

  //{{{ PUBLIC METHODS

  my.addRawData = function (rData) {
    // data must be in the following form: (example)
    // [ {val: value_point, ms: ms_since_epoch},
    //   {val: value_point, ms: ms_since_epoch},
    //   {etc...},
    // ],

    if (!bd.rawData.levels[0]) {
      bd.rawData.levels[0] = [];
    }

    for (var i in rData) {
      var dat = rData[i];
      if (_.find(bd.rawData.levels[0], function (d) { return d.ms === dat.ms; })) {
        // We already have that data point
      } else {
        // Add a new object to the bd level
        bd.rawData.levels[0].push({ms: dat.ms, val: dat.val});
      }
    }

    bd.rawData.levels[0].sort(function (a, b) { return a.ms - b.ms; });

    rebin();
    return my;
  }

  my.addBinnedData = function (bData) {
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

    for (var key in bData) { // for each of max_val, min_val, etc.
      for (var lvl in bData[key].levels) { // for each level
        //if we don't have a level for this already, initialize one
        if (!bd[key].levels[lvl]) {
          bd[key].levels[lvl] = [];
        }

        bd[key].levels[lvl] = combineAndSortArraysOfDateValObjects(bd[key].levels[lvl], bData[key].levels[lvl]);
      } // for each received data point
    }; // for each of max_val, min_val, etc.

    rebin();
    return my;
  }

  my.haveDataInRange = function(ms_range, level) {
    // Determine the number of samples which we should have in the given range.

    if (level === 0) {
      key = "rawData";
    } else {
      key = "average";
    }

    var dateRange = my.getDateRange(key, level, ms_range);

    if (dateRange.length === 0) {
      return false;
    }

    var firstSample = dateRange[0];
    var oneSample = 1000 / 200; // milliseconds per sample
    var sampleSize = Math.pow(2, level) * oneSample;

    if (firstSample > ms_range[0] + sampleSize) {
      return false;
    }

    var actualRange = ms_range[1] - firstSample;
    var numberWeShouldHave = Math.floor(actualRange / sampleSize);

    var numberWeHave = dateRange.length;

    return numberWeHave >= numberWeShouldHave;
  }

  my.getMinRaw = function () {
    return d3.min(bd.rawData.levels[0], function(d) { return d.val; });
  }

  my.getMaxRaw = function () {
    return d3.max(bd.rawData.levels[0], function(d) { return d.val; });
  }

  my.getColor = function (key) {
    return bd[key].color;
  }

  my.getOpacity = function (key) {
    return bd[key].opacity;
  }

  my.getDateRange = function (key, lvl, range) {
    // filter an array so that we don't render much more
    // than the required amount of line and area
    return _.filter(bd[key].levels[lvl], function (d, i) {
      return d.ms <= range[1] && d.ms >= range[0];
    });
  }

  my.getKeys = function () {
    return bd.keys.slice(0); // give a copy of the array
  }

  // PUBLIC METHODS }}}

  return my;
}

/* vim: set foldmethod=marker: */
