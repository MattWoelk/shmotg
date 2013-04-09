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
  // HELPER METHODS }}}

  //{{{ INITIALIZATION (runs once)
  // INITIALIZATION }}}

  //{{{ MY (runs whenever something changes)
  // MY }}}
  var my = function () {
  }

  //{{{ METHODS

  my.addRawData = function (data) {
    return my;
  }

  my.addBinnedData = function (data) {
    return my;
  }

  // METHODS }}}

  return my;
}

/* vim: set foldmethod=marker: */
