require("./binnedData.js");
require("./binnedDatas.js");
_ = require('underscore');
d3 = require("d3");

red = '\033[31m';
yellow = '\033[33m';
magenta = '\033[35m';
blue = '\033[36m';
reset = '\033[0m';

function dt (num) {
  var newdate = new Date();
  newdate.setTime(num);
  return newdate;
}

function inAButNotInB(arr1, arr2) {
  return _.filter(arr1, function (d) {
    return !_.contains(arr2, d);
  });
}

function assert(a, b, test) {
  if(inAButNotInB(a, b).length === 0 && inAButNotInB(b, a).length === 0) {
    console.log("+ Passed:", test);
  } else {
    console.log("- "+red+"Failed"+reset+":", test);
    console.log("  Result is", a);
    console.log("  Should be", b);
  }
}

////////////////////////////////

var brds = binnedDatas();
assert(brds(), [], 'initialization');

var brds = binnedDatas().addRawData([
  {ms: 1000, val: 10},
  {ms: 1005, val: 10},
]);

assert(brds.bds(), [1000, 1005], 'adding raw and reading raw');
