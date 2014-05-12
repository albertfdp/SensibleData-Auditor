queue()
  .defer(d3.json, DATA_URL)
  .defer(d3.json, DATA_RESEARCHERS_URL)
  .await(dashboard);

var dimensions = {},
    groups = {},
    charts = {};

function dashboard(error, userData, aggData) {

  sensible.ndx = crossfilter();

  // clean the data
  userData.result.forEach(UserAccessesParser);
  aggData.result.forEach(AggAccessessParser);

  // add them to crossfilter
  sensible.ndx.add(userData.result);
  sensible.ndx.add(aggData.result);

  dimensions.days = sensible.ndx.dimension(function(d) { return d.day;});
  dimensions.researcher = sensible.ndx.dimension(function(d) {
    return d.researcher;
  });

  groups.dailyAccess = dimensions.days.group().reduceCount();

  charts.researchers = {};
  groups.researchers = {};
  dimensions.researcher.group().all().forEach(function(researcher) {
    if (researcher.key == "") return;


    $('<div id="' + researcher.key + '" class="col-md-4"><div class="panel panel-default"><div class="panel-heading">' + researcher.key + '</div><div class="panel-body"><div id="accesses-' + researcher.key + '"></div></div></div></div>').appendTo('#researchers');
    
    groups.researchers[researcher.key] = dimensions.days.group().reduceCount();

    charts.researchers[researcher.key] = dc.barChart('#accesses-' + researcher.key);
    charts.researchers[researcher.key]
      .height(200)
      .width(400)
      .x(d3.time.scale().domain([new Date(2014, 0, 1), new Date(2014, 31, 11)]))
      .round(d3.time.day.round)
      .margins({top: 10, right: 0, bottom: 30, left: 50})
      .renderHorizontalGridLines(true)
      .xUnits(d3.time.days)
      .elasticY(true)
      .renderTitle(true)
      .yAxisLabel('Data points accessed')
      .xAxisLabel('Week')
      .brushOn(true)
      .dimension(dimensions.days)
      .group(groups.researchers[researcher.key]);

  });

  charts.accessesChart = dc.lineChart('#sensible-accesses-chart');
  charts.accessesChart
    .height(200)
    .width(1200)
    .renderArea(true)
    .x(d3.time.scale().domain([new Date(2014, 0, 1), new Date(2014, 31, 11)]))
    .round(d3.time.day.round)
    .margins({top: 10, right: 0, bottom: 30, left: 50})
    .renderHorizontalGridLines(true)
    .xUnits(d3.time.days)
    .elasticY(true)
    .renderTitle(true)
    .yAxisLabel('Data points accessed')
    .xAxisLabel('Week')
    .brushOn(true)
    .dimension(dimensions.days)
    .group(groups.dailyAccess, 'User accesses');

  dc.renderAll();

}

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