DATA_USER_URL = 'http://raman.imm.dtu.dk:8081/albert/sensible-dtu/audit/researchers/user';
DATA_RESEARCHERS_URL = 'http://raman.imm.dtu.dk:8081/albert/sensible-dtu/audit/researchers';

var PROBE_SYMBOLS = {
  bluetooth : '\uf116',
  location : '\uf1ff',
  facebook : '\uf231',
  calllog : '\uf1e6',
  sms : '\uf2e1',
  questionnaire : '\uf12e'
}

queue()
  .defer(d3.json, DATA_USER_URL + '?bearer_token=' + SENSIBLE_BEARER_TOKEN)
  .defer(d3.json, DATA_RESEARCHERS_URL + '?bearer_token=' + SENSIBLE_BEARER_TOKEN)
  .await(dashboard);

var sensible = {};
    sensible.dimensions = {},
    sensible.groups = {},
    sensible.charts = {},
    sensible.composite = {};

function dashboard(error, data, agg) {

  if (error) return showErrorMessage(error);

  console.log(data.result);

  sensible.ndx = crossfilter();
  // parse the data
  data.result.forEach(function(d) {
    var formatter = d3.time.format("%Y-%j");
    d.user = true;
    d.date = new Date(formatter.parse(d.date.y + '-' + d.date.d));
  });
  agg.result.forEach(function(d) {
    var formatter = d3.time.format("%Y-%j");
    d.user = false;
    d.date = new Date(formatter.parse(d.date.y + '-' + d.date.d));
  });

  sensible.ndx.add(data.result);
  sensible.ndx.add(agg.result);

  sensible.dimensions.date = sensible.ndx.dimension(function(d) {
    return d.date;
  });

  sensible.dimensions.researcher = sensible.ndx.dimension(function(d) {
    return d.researcher;
  });

  sensible.dimensions.probeSeries = sensible.ndx.dimension(function(d) {
    return [d.date, d.probe];
  });

  sensible.dimensions.probe = sensible.ndx.dimension(function(d) {
    return d.probe;
  });

  sensible.groups.accesses = sensible.dimensions.date.group().reduce(
      reduceAdd, reduceRemove, reduceInit);

  sensible.groups.accessPerResearcher = sensible.dimensions.researcher.group()
    .reduce(reduceAdd, reduceRemove, reduceInit);

  sensible.groups.probeHistogram = sensible.dimensions.probeSeries.group()
    .reduce(reduceAdd, reduceRemove, reduceInit);

  sensible.groups.probe = sensible.dimensions.probe.group()
    .reduce(reduceAdd, reduceRemove, reduceInit);

  var WIDTH = 1200;
  var HEIGHT = 300;
  var gap = 60, translate = 55;

  sensible.charts.numberAccesses = dc.numberDisplay('#audit-accesses');
  sensible.charts.numberAccessesAverage = dc.numberDisplay('#audit-accesses-avg');
  sensible.charts.numberResearchers = dc.numberDisplay('#audit-researcher');
  //sensible.charts.numberObservations = dc.numberDisplay('#audit-observations');

  sensible.dimensions.date = sensible.ndx.dimension(function(d) { return d3.time.month(d.date); });
  sensible.groups.accesses = sensible.dimensions.date.group().reduce(reduceAdd, reduceRemove, reduceInit);
  sensible.charts.composite = dc.compositeChart('#sensible-composite-chart');
  sensible.charts.accessHistogram = dc.barChart('#sensible-accesses-chart');

  sensible.groups.unique = sensible.ndx.groupAll().reduce(
    function (p, v) {
      if (v.user) {
        if (v.researcher in p.researchers)
          p.researchers[v.researcher]++;
        else p.researchers[v.researcher] = 1;
        p.requestCount += v.requestCount;
        p.dataCount += v.dataCount;
      }
      return p;
    },
    function (p, v) {
      if (v.user) {
        p.researchers[v.researcher]--;
        if (p.researchers[v.researcher] === 0)
          delete p.researchers[v.researcher];
        p.requestCount -= v.requestCount;
        p.dataCount -= v.dataCount;
      }
      return p;
    },
    function () { return { researchers : {}, requestCount : 0, dataCount : 0}}
  );


  sensible.charts.numberAccesses
    .valueAccessor(function(d) { return d.requestCount;})
    .group(sensible.groups.unique);
  sensible.charts.numberAccessesAverage
    .valueAccessor(function(d) { return d.dataCount;})
    .group(sensible.groups.unique);
  sensible.charts.numberResearchers
    .valueAccessor(function(d) {
      return Object.keys(d.researchers).length;
    })
    .group(sensible.groups.unique);

  sensible.composite.user = dc.barChart(sensible.charts.composite)
    .gap(gap)
    .group(sensible.groups.accesses, "User")
    .valueAccessor(function (d) {
      return d.value.userCount;
    });
  sensible.composite.average = dc.barChart(sensible.charts.composite)
    .gap(gap)
    .group(sensible.groups.accesses, "Average")
    .valueAccessor(function (d) {
      return (d.value.count / d.value.users);
    })
    .colors(d3.scale.ordinal().range(['#e34a33']));

  sensible.charts.composite
    .width(WIDTH)
    .height(HEIGHT)
    .transitionDuration(1000)
    .margins({top: 10, right: 0, bottom: 30, left: 50})
    .dimension(sensible.dimensions.date)
    .group(sensible.groups.accesses)
    .elasticY(true)
    .yAxisLabel('Data points accessed')
    .rangeChart(sensible.charts.accessHistogram)
	  //.x(d3.time.scale().domain(getDateRange(group)))
    .legend(dc.legend().x(80).y(20).itemHeight(13).gap(5))
    .x(d3.time.scale().domain([new Date(2013, 6, 1), new Date(2014, 6, 31)]))
	  .xUnits(d3.time.months)
	  .round(d3.time.month.round)
	  .renderHorizontalGridLines(true)
    .compose([sensible.composite.user, sensible.composite.average])
      .brushOn(false)
     .renderlet(function (chart) {
	       chart.selectAll("g._1").attr("transform", "translate(" + translate + ", 0)");
      });




  sensible.charts.accessHistogram
    .height(60)
    .width(1200)
    .centerBar(true)
    //.renderArea(true)
    //.dashStyle([3,1,1,1])
    .dimension(sensible.dimensions.date)
    .group(sensible.groups.accesses)
    .x(d3.time.scale().domain([new Date(2013, 6, 1), new Date(2014, 6, 31)]))
    .margins({top: 10, right: 0, bottom: 30, left: 50})
    .xUnits(d3.time.days)
    .elasticY(true)
    //.renderTitle(true)
    //.legend(dc.legend().x(80).y(20).itemHeight(13).gap(5))
    .brushOn(true)
    .valueAccessor(function(d) {
      return d.value.userRequests;
    }).yAxis().ticks(0);

  sensible.charts.researchers = dc.rowChart('#sensible-researchers');
  sensible.charts.researchers
    .height(400)
    .width(380)
    .margins({top: 10, right: 10, bottom: 30, left: 0})
    .dimension(sensible.dimensions.researcher)
    .elasticX(true)
    .valueAccessor(function(d) {
      return d.value.requests;
    })
    .ordinalColors(colorbrewer.Spectral[9])
    .group(sensible.groups.accessPerResearcher);

  sensible.charts.probes = dc.rowChart('#sensible-probes');
  sensible.charts.probes
    .height(400)
    .width(380)
    .margins({top: 10, right: 10, bottom: 30, left: 0})
    .dimension(sensible.dimensions.probe)
    .elasticX(true)
    .valueAccessor(function(d) {
      return d.value.requests;
    })
    .label(function(d) {
      return PROBE_SYMBOLS[d.key] + ' - ' + d.key;
    })
    .ordinalColors(colorbrewer.Dark2[6])
    .group(sensible.groups.probe);

  sensible.charts.probes = dc.seriesChart('#sensible-probes-histogram');
  sensible.charts.probes
    .height(400)
    .width(400)
    .chart(function(c) {
      return dc.lineChart(c)
        .interpolate('basis')
        .dashStyle([3,1,1,1])
        .renderDataPoints({radius: 5, fillOpacity: 0.8, strokeOpacity: 0.8});
      })
    .seriesAccessor(function(d) {
        return d.key[1];
    })
    .keyAccessor(function(d) {return d.key[0];})
    .margins({top: 10, right: 10, bottom: 30, left: 20})
    .dimension(sensible.dimensions.probeSeries)
    .x(d3.time.scale().domain([new Date(2013, 6, 1), new Date(2014, 6, 31)]))
    .xUnits(d3.time.days)
    .elasticY(true)
    .brushOn(false)
    //.rangeChart(sensible.charts.accessHistogram)
    .renderHorizontalGridLines(true)
    .legend(dc.legend().x(80).y(20).itemHeight(13).gap(5).horizontal(1).legendWidth(140).itemWidth(70))
    .valueAccessor(function(d) {
      return +d.value.requests;
    })
    .group(sensible.groups.probeHistogram);
    sensible.charts.probes.yAxis().tickFormat(function(d) {
        return d;
    });
  sensible.charts.probes.xAxis().tickFormat(d3.time.format("%b"));


  $('#control-accesses').on('change', function(event) {
    var target = event.target;
    if (target.id == 'requests') {
      Object.keys(sensible.charts).forEach(function(chart) {

        if (chart == 'composite') {
          sensible.composite.user
            .valueAccessor(function(d) { return d.value.userRequests;});
          sensible.composite.average
            .valueAccessor(function(d) { return d.value.requests;});
          sensible.charts[chart].compose([sensible.composite.user, sensible.composite.average]).render();
        } else {
          sensible.charts[chart].valueAccessor(function(d) { return d.value.requests;}).render();
        }
      });
    } else {
      Object.keys(sensible.charts).forEach(function(chart) {
        if (chart == 'composite') {
          sensible.composite.user
            .valueAccessor(function(d) { return d.value.userCount;});
          sensible.composite.average
            .valueAccessor(function(d) { return d.value.count / d.value.users;});
          sensible.charts[chart].compose([sensible.composite.user, sensible.composite.average]).render();
        } else {
          sensible.charts[chart].valueAccessor(function(d) { return d.value.count;}).render();
        }
      });
    }
  });

  dc.renderAll();


}

function showErrorMessage(error) {
  $('#audit-error').addClass('alert alert-danger')
    .append('<p><strong>Error!</strong> Something went wrong.<p>')
    .append('<p>' + error.status + ' ' + error.statusText + '</p>');
  console.error(error);
}

function reduceAdd(p, v) {
  if (v.user) {
    p.userCount += v.dataCount;
    p.userRequests += v.requestCount;
  } else {
    p.requests += v.requestCount;
    p.count += v.dataCount;
    p.users += v.users;
  }
  return p;
}

function reduceRemove(p, v) {
  if (v.user) {
    p.userCount -= v.dataCount;
    p.userRequests -= v.requestCount;
  } else {
    p.requests -= v.requestCount;
    p.count -= v.dataCount;
    p.users -= v.users;
  }
  return p;
}

function reduceInit() { return {count : 0, requests: 0, users : 0, userCount : 0, userRequests : 0}};
