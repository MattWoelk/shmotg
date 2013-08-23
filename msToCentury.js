///////////////////////////////////////
// Custom Time Axis                  //
// ----------------                  //
// - Allows for smooth scrolling at  //
//   smaller-than-millisecond zoom   //
//   levels                          //
// - Provides time axis labeling     //
//   see customTimeFormat            //
// - Depends on underscore.js, d3.js //
///////////////////////////////////////
// USAGE
// ----------------
// xAxis = d3.svg.axis()
//   .tickFormat(msToCenturyTickFormat)
//   .tickValues(msToCenturyTickValues(xScale, width))
//   .tickSubdivide(msToCenturyTickSubDivide(xScale, width))
//   .scale(xScale).orient("bottom");
///////////////////////////////////////

var MIN_DISTANCE_BETWEEN_X_AXIS_LABELS = 100;

function dt (num) {
  var newdate = new Date();
  newdate.setTime(num);
  return newdate;
}

function millisecond(val) {
  var newdate = new Date();
  newdate.setTime(roundDownToNearestTime(val, times.ms));
  return newdate;
}

function roundUpToNearestTime(val, tim) {
  return Math.ceil(val/tim) * tim;
}

function roundDownToNearestTime(val, tim) {
  return Math.floor(val/tim) * tim;
}

function getNumberOfDaysInCurrentMonth(dat) {
  var curmo = dat.getMonth();
  var addYear;
  if (( curmo + 1 ) / 12.0 >= 1.0) {
    // we rolled over to the next year
    addYear = dat.getFullYear() + 1;
  } else {
    addYear = dat.getFullYear();
  }
  var newdate = new Date(
      addYear,
      (curmo + 1) % 12,
      1,
      1,
      1,
      1,
      1);
  newdate = dt(newdate.getTime() - 4000000);
  return newdate.getDate();
}

var times = {
  ms: 1, //milliseconds
  s: 1000, //seconds
  m: 6e4, //minutes
  h: 36e5, //hours
  d: 864e5, //days
  // These are approximations:
  mo: 2592e6, //months
  y: 31536e6, //years
};

function getNumberOfDaysInCurrentYear(dat) {
  var newdateStart = new Date(dat.getFullYear()    , 0, 0);
  var newdateEnd   = new Date(dat.getFullYear() + 1, 0, 0);
  var diff = newdateEnd.getTime() - newdateStart.getTime();
  var oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

// custom formatting for x axis time
function msToCenturyTickFormat(ti) {
  function timeFormat(formats) {
    return function(date) {
      var newdate = new Date();
      newdate.setTime(date);
      var i = formats.length - 1, f = formats[i];
      while (!f[1](newdate)) f = formats[--i];
      return f[0](newdate);
    };
  }

  var customTimeFormat = timeFormat([
     [ d3.time.format("%Y")    , function() { return true; }                 ],
     [ d3.time.format("%b")    , function(d) { return d.getMonth(); }        ],
     [ function (d) { return d3.time.format("%a %-d")(d).toLowerCase(); } ,
                                 function(d) { return d.getDate() != 1; }    ],
     [ d3.time.format("%H:00") , function(d) { return d.getHours(); }        ],
     [ d3.time.format("%H:%M") , function(d) { return d.getMinutes(); }      ],
     [ d3.time.format("%Ss")   , function(d) { return d.getSeconds(); }      ],
     [ d3.time.format("%Lms")  , function(d) { return d.getMilliseconds(); } ]
    ]);

  return function(d) { return customTimeFormat(ti); }();
}

function onScreenSizeOfLabels(millisecondsPerLabel, screenWidth, distanceBtwnLabels) {
  return millisecondsPerLabel * screenWidth / distanceBtwnLabels;
}

function findLevel(dom, wid) {
  for (i = 0; i < rounding_scales.length; i++) {
    var ro = rounding_scales[i];
    var compr = onScreenSizeOfLabels(ro[0]*ro[1], wid, MIN_DISTANCE_BETWEEN_X_AXIS_LABELS);

    if (dom[1] - dom[0] <= compr ) {
      var result = makeTickRange(dom[0], dom[1], ro[1], ro[3], ro[2], ro[0]*ro[1], wid);

      // filter this for only what is actually on-screen.
      result = _.filter(result, function (num) {
        return num < dom[1] && num > dom[0];
      });

      return i;
    }
  }
  return -1;
}

function msToCenturyTickValues(scal, wid) {
  var dom = scal.domain();

  var lvl = findLevel(dom, wid);

  // This should never occur if the zoom limits are correct
  if (lvl === -1) {
    return [1e0, 1e1, 1e2, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e13, 1e14];
  }

  var ro = rounding_scales[lvl];
  var rng = makeTickRange(dom[0], dom[1], ro[1], ro[3], ro[2], ro[0]*ro[1], wid);

  // filter this for only what is actually on-screen.
  var result = _.filter(rng, function (num) {
    return num < dom[1] && num > dom[0];
  });

  return result;
}

function msToCenturySubTickValues(scal, wid) {
  var dom = scal.domain();

  var lvl = findLevel(dom, wid);

  // This should never occur if the zoom limits are correct
  if (lvl === -1) {
    return [1e0, 1e1, 1e2, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e13, 1e14];
  }

  var ro = rounding_scales[lvl];
  var rng = makeTickRange(dom[0], dom[1], ro[1], ro[3], ro[2], ro[0]*ro[1], wid);

  var res = []

  var numToInterpolate = msToCenturyTickSubDivide(scal, wid);

  var whichToGet = d3.range(1, numToInterpolate);

  for (var b = 0; b < whichToGet.length; b++) {
    res.push(rng[0] - whichToGet[b]*((rng[1]-rng[0]) / numToInterpolate));
  }

  for (var i in rng) {
    for (var b = 0; b < whichToGet.length; b++) {
      res.push(rng[i] + whichToGet[b]*((rng[1]-rng[0]) / numToInterpolate));
    }
  }

  // filter this for only what is actually on-screen.
  var result = _.filter(res, function (num) {
    return num < dom[1] && num > dom[0];
  });

  return result;
}

function msToCenturyTickSubDivide(scal, wid) {
  var dom = scal.domain();

  var lvl = findLevel(dom, wid);
  if (lvl === -1) { return 0; }

  var baseSize = rounding_scales[lvl][1];
  var tickSpace = rounding_ticks[baseSize];

  return (baseSize / tickSpace);
}

function makeTickRange(start, end, increment, incrementOf, baseFunc, smallInc, wid) {
  if ( incrementOf === d3.time.year ) {
    // For Years
    var startyear = d3.time.year.floor(dt(start));
    var endyear   = d3.time.year.ceil( dt(end  ));

    var curange = d3.range(startyear.getFullYear(), endyear.getFullYear());

    // Filter for proper increments
    curange = _.filter(curange, function (d, i) {
      return d % increment == 0;
    });

    curange = _.map(curange, function (d) { return new Date(d, 0); });

    return curange;

  } else if ( incrementOf === d3.time.month ) {
    // For Months
    var startyear = d3.time.year.floor(dt(start));
    var endyear   = d3.time.year.ceil( dt(end  ));

    var curange = d3.range(startyear.getFullYear(), endyear.getFullYear());

    // for each year, get all of the months for it
    curange = _.map(curange, function (d, i) {
      return _.map([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ,11], function (f) {
        // For each month of the year
        return new Date(d, f);
      });
    });
    curange = _.flatten(curange);

    curange = _.filter(curange, function (d, i) {
      // Filter for proper increments
      return i % increment == 0;
    });

    return curange;

  } else if (baseFunc === d3.time.month){
    // For Days
    var startyear = d3.time.year.floor(dt(start));
    var endyear   = d3.time.year.ceil( dt(end  ));

    var curange = d3.range(startyear.getFullYear(), endyear.getFullYear());

    // For each year, get all of the months for it
    curange = _.map(curange, function (year, i) {
      return _.map([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ,11], function (month) {
        // For each month of the year
        var monthDays = getNumberOfDaysInCurrentMonth(new Date(year, month));
        return _.map(d3.range(1, monthDays + 1), function (day) {
          // For each day of the month
          // Filter for proper increments
          //   and remove ones which are too close
          //   together near the ends of the months
          if ((day - 1) % increment == 0 && monthDays + 1 - day >= increment ) {
            return new Date(year, month, day);
          } else {
            return [];
          }
        });
      });
    });

    curange = _.flatten(curange);

    return curange;

  } else {
    // For everything smaller than days
    return d3.range( baseFunc.floor( dt(start) ).getTime(),
                     baseFunc.ceil(  dt( end ) ).getTime(),
                     roundUpToNearestTime(
                       smallInc*MIN_DISTANCE_BETWEEN_X_AXIS_LABELS/wid,
                       smallInc));
  }
}

// for major ticks every 'a' units,
// have a minor tick every 'b' units
// [a, b]
// b should always be a factor of a
var rounding_ticks = {
   1   : 0.5, // when we are showing 1 of something, display a tick every 0.5
   2   : 1  ,
   3   : 1  ,
   5   : 1  ,
   6   : 3  , // when we are showing 6 of something, display a tick every 3
   10  : 5  ,
   12  : 3  ,
   15  : 5  ,
   20  : 5  ,
   25  : 5  ,
   30  : 10 ,
   50  : 10 ,
   100 : 50 ,
   200 : 50 ,
   500 : 100,
}

// Data object to help make custom axis' tick values
// [ estimate size in milliseconds,
//   how many to increment,
//   precise time rounder for anchoring,
//   precise time rounder ]
var rounding_scales = [
  [ times.ms , 1   , d3.time.second , millisecond],
  [ times.ms , 2   , d3.time.second , millisecond],
  [ times.ms , 5   , d3.time.second , millisecond],
  [ times.ms , 10  , d3.time.second , millisecond],
  [ times.ms , 20  , d3.time.second , millisecond],
  [ times.ms , 50  , d3.time.second , millisecond],
  [ times.ms , 100 , d3.time.second , millisecond],
  [ times.ms , 200 , d3.time.second , millisecond],
  [ times.ms , 500 , d3.time.second , millisecond],
  [ times.s  , 1   , d3.time.minute , d3.time.second],
  [ times.s  , 2   , d3.time.minute , d3.time.second],
  [ times.s  , 5   , d3.time.minute , d3.time.second],
  [ times.s  , 15  , d3.time.minute , d3.time.second],
  [ times.s  , 30  , d3.time.minute , d3.time.second],
  [ times.m  , 1   , d3.time.hour   , d3.time.minute],
  [ times.m  , 2   , d3.time.hour   , d3.time.minute],
  [ times.m  , 5   , d3.time.hour   , d3.time.minute],
  [ times.m  , 15  , d3.time.hour   , d3.time.minute],
  [ times.m  , 30  , d3.time.hour   , d3.time.minute],
  [ times.h  , 1   , d3.time.day    , d3.time.hour],
  [ times.h  , 3   , d3.time.day    , d3.time.hour],
  [ times.h  , 6   , d3.time.day    , d3.time.hour],
  [ times.h  , 12  , d3.time.day    , d3.time.hour],
  [ times.d  , 1   , d3.time.month  , d3.time.day],
  [ times.d  , 2   , d3.time.month  , d3.time.day],
  [ times.d  , 5   , d3.time.month  , d3.time.day],
  [ times.d  , 10  , d3.time.month  , d3.time.day],
  [ times.d  , 15  , d3.time.month  , d3.time.day],
  [ times.mo , 1   , d3.time.year   , d3.time.month],
  [ times.mo , 2   , d3.time.year   , d3.time.month],
  [ times.mo , 3   , d3.time.year   , d3.time.month],
  [ times.mo , 6   , d3.time.year   , d3.time.month],
  [ times.mo , 12  , d3.time.year   , d3.time.month],
  [ times.y  , 1  , d3.time.year , d3.time.year],
  [ times.y  , 2  , d3.time.year , d3.time.year],
  [ times.y  , 5  , d3.time.year , d3.time.year],
  [ times.y  , 10 , d3.time.year , d3.time.year],
  [ times.y  , 25 , d3.time.year , d3.time.year],
  [ times.y  , 50 , d3.time.year , d3.time.year],
  [ times.y  , 100, d3.time.year , d3.time.year],
  [ times.y  , 100, d3.time.year , d3.time.year],
];

