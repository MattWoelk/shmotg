// This is binnedData. A convenient way of storing binned data

binnedData = function () {

  //{{{ VARIABLES
  var bd = { // where all of the data is stored
    keys : ['average', 'maxes', 'mins', 'q1', 'q3'],
    rawData : {
      color: '#000',
      opacity: 0.5,
      levels: [], // stores all of the values for each level in an array.
                  // example: [[{val: 1.7, date: ms_since_epoch}, {val: 2.3, date: ms_since_epoch}], [etc.]]
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

  rebin = function () {
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
        var range = [_.min(newData, function (d) { return d.date; }).date,
                     _.max(newData, function (d) { return d.date; }).date];

        // filter for old data which is outside the range of the new data
        // (newly binned data gets preference over previously binned data)
        var oldFiltered = _.filter(bd[key].levels[j], function (d) { return d.date < range[0] || d.date > range[1]; });

        // combine and sort old and new
        var combo = oldFiltered.concat(newData).sort(function (a, b) { return a.date - b.date; });

        // store combination
        bd[key].levels[j] = combo;
      } // for each key
    } // for each bin level
  }
  // HELPER METHODS }}}

  //{{{ INITIALIZATION (runs once)
  // INITIALIZATION }}}

  //{{{ MY (runs whenever something changes)
  // MY }}}
  var my = function () {
  }

  //{{{ METHODS

  my.addRawData = function (rData) {
    // data must be in the following form: (example)
    // [ {val: value_point, date: ms_since_epoch},
    //   {val: value_point, date: ms_since_epoch},
    //   {etc...},
    // ],

    // TODO: fix

    bd.rawData.levels[0] = rData;

    console.log(bd);

    rebin();
    return my;
  }

  my.addBinnedData = function (bData) {
    // data must be in the following form: (example)
    // { average: {
    //     levels: [
    //       [{val: value_point, date: ms_since_epoch},
    //        {val: value_point, date: ms_since_epoch},
    //        {etc...}],
    //       [{val: value_point, date: ms_since_epoch},
    //        {val: value_point, date: ms_since_epoch},
    //        {etc...}],
    //     ],
    //   },
    //   q1: {
    //     levels: [
    //       [{val: value_point, date: ms_since_epoch},
    //        {val: value_point, date: ms_since_epoch},
    //        {etc...}],
    //       [{val: value_point, date: ms_since_epoch},
    //        {val: value_point, date: ms_since_epoch},
    //        {etc...}],
    //     ],
    //   },
    //   etc: {},
    // }

    // TODO: fix

    rebin();
    return my;
  }

  // METHODS }}}

  return my;
}

/* vim: set foldmethod=marker: */
