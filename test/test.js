// install dependencies:
// `npm install -g mocha`
// `npm install -g assert`
// start testing:
// `mocha`

var assert = require("assert");
d3 = require("d3");
_ = require("underscore");
var bd = require("../binnedData.js");
//var d3 = require("../d3/d3.js");
describe('Array', function(){
    describe('#inexOf()', function(){
        it('should return -1 when the value is not present', function(){
            assert.equal(-1, [1, 2, 3].indexOf(5));
            assert.equal(-1, [1, 2, 3].indexOf(0));
        });
        it('should return the index when the value is present', function(){
            assert.equal(0, [1, 2, 3].indexOf(1));
            assert.equal(1, [1, 2, 3].indexOf(2));
            assert.equal(2, [1, 2, 3].indexOf(3));
        });
    });
});

var d = [[{ms: 0, val: 1}, {ms: 5, val: 2}, {ms: 10, val: 4}]];
var allKeys = ['average', 'rawData', 'q1', 'q3', 'mins', 'maxes'];

describe('binnedData', function(){
    describe('write-read', function(){
        it('should return whatever is inserted', function(){
            var bd = binnedData();
            bd.addRawData(d[0]);
            assert.deepEqual(d[0], bd.getDateRange(['average'], 0, [-1000, 1000]));
        })
    })
})
