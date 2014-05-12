//var DATA_URL = 'http://raman.imm.dtu.dk:8081/albert/sensible-dtu/audit/accesses/';
//var DATA_RESEARCHERS_URL = 'http://raman.imm.dtu.dk:8081/albert/sensible-dtu/audit/researchers/';

var dimensions = {};
var groups = {};
var charts = {};
var filters = {};


queue()
  .defer(d3.json, DATA_URL)
  .defer(d3.json, DATA_RESEARCHERS_URL)
  .await(dashboard);

function dashboard(error, userData, aggData) {

  sensible.ndx = crossfilter();

  // clean the data
  userData.result.forEach(UserAccessesParser);
  aggData.result.forEach(AggAccessessParser);

  // add them to crossfilter
  sensible.ndx.add(userData.result);
  sensible.ndx.add(aggData.result);

  // create dimensions
  dimensions.researcher = sensible.ndx.dimension(function(d) { return d.researcher});
  dimensions.resource = sensible.ndx.dimension(function(d) { return d.probe});
  dimensions.days = sensible.ndx.dimension(function(d) { return d.day;});
  dimensions.user = sensible.ndx.dimension(function(d) { return d.user;});

  groups.dailyAccess = dimensions.days.group().reduce(reduceAdd, reduceRemove, reduceInit);
  groups.researcherAccesses = dimensions.researcher.group().reduce(reduceAdd, reduceRemove, reduceInit);
  groups.resourceAccesses = dimensions.resource.group().reduce(reduceAdd, reduceRemove, reduceInit);

  animateNumber($('#audit-accesses'), 0, 1000, 1500);
  animateNumber($('#audit-researcher'), 0, 5, 1500);
  animateNumber($('#audit-observations'), 0, 200, 1500);
  animateNumber($('#audit-unique'), 0, 30, 1500);

  charts.dailyAccess = dc.compositeChart('#sensible-accesses-chart');
  charts.accessesChart = dc.barChart('#sensible-accesses-date-chart');
  charts.researcherAccesses = dc.rowChart('#sensible-researcher-chart');
  charts.resourceAccesses = dc.rowChart('#sensible-resource-chart');


  /*charts.dailyAccess
    .margins({top: 10, right: 0, bottom: 30, left: 50})
    .dimension(dimensions.days)
    .group(groups.dailyAccess)
    .height(400)
    .width(700)
    .transitionDuration(1000)
    //.gap(1)
    .renderArea(true)
    .renderDataPoints({radius: 2, fillOpacity: 0.8, strokeOpacity: 0.8})
    .elasticY(true)
    .renderHorizontalGridLines(true)
    .x(d3.time.scale().domain([new Date(2014, 4, 1), new Date(2014, 4, 11)]))
    .round(d3.time.day.round)
    .valueAccessor(function(d) {
      return d.value.userAccesses;
    })
    //.alwaysUseRounding(true)
    .xUnits(d3.time.days)
    .yAxisLabel('Number of accesses')
    .xAxisLabel('Month');*/

  charts.dailyAccess
    .height(400)
    .width(750)
    .x(d3.time.scale().domain([new Date(2014, 4, 1), new Date(2014, 4, 11)]))
    .round(d3.time.day.round)
    .margins({top: 10, right: 0, bottom: 30, left: 50})
    .renderHorizontalGridLines(true)
    .xUnits(d3.time.days)
    .elasticY(true)
    .renderTitle(true)
    .legend(dc.legend().x(80).y(20).itemHeight(13).gap(5))
    .yAxisLabel('Data points accessed')
    .xAxisLabel('Week')
    .brushOn(false)
    .compose([

        dc.lineChart(charts.dailyAccess)

          .dimension(dimensions.days)
          .group(groups.dailyAccess, 'User accesses')

          .transitionDuration(1000)
          //.gap(1)
          .colors('red')
          .renderArea(true)
          .renderDataPoints({radius: 2, fillOpacity: 0.8, strokeOpacity: 0.8})
          .elasticY(true)
          .dashStyle([2,2])

          .valueAccessor(function(d) {
            return d.value.userAccesses;
          }),

        dc.lineChart(charts.dailyAccess)
          .group(groups.dailyAccess, 'Average accesses')
          .renderArea(true)
          .dashStyle([5,5])
          .valueAccessor(function(d) {
            return d.value.avgAccesses
          ;})
          .renderArea(true)
  ])


  charts.accessesChart
        .width(750)
        .height(60)
        .margins({top: 0, right: 0, bottom: 30, left: 50})
        .dimension(dimensions.days)
        .group(groups.dailyAccess)
        .centerBar(true)
        .gap(1)
        .x(d3.time.scale().domain([new Date(2014, 0, 1), new Date(2014, 11, 31)]))
        .round(d3.time.month.round)
        .alwaysUseRounding(true)
        .xUnits(d3.time.months);

  charts.researcherAccesses
    .height(400)
    .width(350)
    .margins({top: 10, right: 0, bottom: 30, left: 0})
    .dimension(dimensions.researcher)
    .elasticX(true)
    .valueAccessor(function(d) {
      return d.value.userAccesses;
    })
    .group(groups.researcherAccesses);

  charts.resourceAccesses
    .height(400)
    .width(350)
    .margins({top: 10, right: 50, bottom: 30, left: 0})
    .dimension(dimensions.resource)
    .valueAccessor(function(d) {
      return d.value.userAccesses;
    })
    .group(groups.resourceAccesses);

  Object.keys(charts).forEach(function(chart) {

    charts[chart].on('filtered', function(filtered) {

      if (chart == 'accessesChart') {
          var format = d3.time.format("%Y-%W");
          var range = [];
          filtered.filters()[0].forEach(function(d) {
            range.push(format(d));
          })
          filters[chart] = range;
      } else {
        filters[chart] = filtered.filters();
      }

      var urlParams = $.param(filters);
      console.log('querying to ' + urlParams);

      $.ajax({
        url : '/raw',
        success : function(data) {

        },
        error : function(error) {
          console.log(filters);
        },
        type : 'GET',
        dataType : 'json',
        singleton : true,
        delay : 1000,
      });

    });



  });

  dc.renderAll();

}

function sReduceAdd(attr) {
  return function (p, v) {

    if (!v.user) {
      p.accessCount += v.count;
      p.dataAccesses += v.dataAccesses;
      p.index = p.dataCount / p.accessCount;
    }

    return p;

  };
}

function sReduceRemove(attr) {
  return function (p, v) {

    if (v.user) p.user += v.data;

    return p;

  };
}

function sReduceInit() {
  return { accessCount : 0, dataAccesses : 0, index : 0};
}

function reduceAdd (p, v) {
  if (v.user) {
    p.userAccesses += v.dataAccesses;
    p.count += v.count;
  }
  else {
    p.totalAccesses += v.dataAccesses;
    p.numUsers += v.count;
    p.avgAccesses = (p.numUsers > 0) ? p.totalAccesses / p.numUsers : 0;
  }
  return p;
}

function reduceRemove (p, v) {
  if (v.user) {
    p.userAccesses -= v.dataAccesses;
    p.count -= v.count;
  }
  else {
    p.totalAccesses -= v.dataAccesses;
    p.numUsers -= v.count;
    p.avgAccesses = (p.numUsers > 0) ? p.totalAccesses / p.numUsers : 0;
  }
  return p;
}

function reduceInit () {
  return { count : 0, totalCount : 0, userAccesses : 0, totalAccesses : 0, numUsers : 0, avgAccesses : 0, avgCount : 0};
}

function animateNumber(where, startNumber, endNumber, duration) {
  $({someValue : startNumber}).animate({someValue : endNumber}, {
    duration : duration,
    step : function () {
      // update the element text
      where.text(Math.floor(this.someValue + 1));
    },
    complete : function() {
      where.text(endNumber);
    }
  });
}

/**
 *  Parses a row of the aggregated accesses to the user
 *  data.
 */
function UserAccessesParser(d) {
  var formatter = d3.time.format("%Y-%m-%d");
  d.user = true;
  d.time = new Date(formatter.parse(d.date.y + "-" + d.date.m + "-" + d.date.d));
  d.day = d3.time.day(d.time);
  d.researcher = d.researcher;
  d.probe = d.probe;
  d.count = +d.count; // number of queries
  d.dataAccesses = +d.data;
}

function AggAccessessParser(d) {
  var formatter = d3.time.format("%Y-%m-%d");
  d.user = false;
  d.time = new Date(formatter.parse(d.date.y + "-" + d.date.m + "-" + d.date.d));
  d.day = d3.time.day(d.time);
  d.researcher = d.researcher;
  d.probe = d.probe;
  d.count = +d.accessesCount; // number of queries
  d.dataAccesses = +d.dataAccesses;
}
