'use strict';

var sensible = (function() {

  var sensible = {};

  sensible.dimensions = function() {

    var dimensions = {};

    // names of the dimensions to be created
    var list = ['researcher', 'accesses'];

    return {

      add : function(name, accessor) {
        dimensions[name] = sensible.ndx.dimension(accessor);
        return dimensions[name];
      },

      get : function(name) {
        return dimensions[name];
      },

      list : function() {
        return dimensions;
      },

    }

  }();

  sensible.groups = function() {

    var groups = {};

    return {
      add : function(name, dcGroup) {
        groups[name] = dcGroup;
      },

      get : function(name) {
        return groups[name];
      }
    }

  }();

  sensible.charts = function() {

    var _charts = {};

    return {

        add : function(name, dcChart) {
            _charts[name] = dcChart;
        },

        get : function(name) {
          return _charts[name];
        },

        has : function(name) {
          return console.log('lolo ' + name);
        }

    }

  }();


  return sensible;


})();

function extract_researcher(path) {
  return (RegExp('bearer\_token' + '=' + '(.+?)(&|$)').exec(path)||[,null])[1];
}

function extract_resource(path) {
  return (RegExp('\/connector_raw\/v1\/(.*)\/').exec(path)||[,null])[1];
}

var DATA_URL = 'http://raman.imm.dtu.dk:8082/albert/apps/auditor_viewer/static/data/fake.json';
var DATA_RESEARCHERS_URL = 'http://raman.imm.dtu.dk:8082/albert/apps/auditor_viewer/static/data/fake_researchers.json';
/*
var panel = $('#sensible-notification');
panel.hide();

var compositeChart = dc.compositeChart('#sensible-uniqueness-chart');

d3.json(DATA_RESEARCHERS_URL)
  .on('load', function(data) {

    // clean data
    data.children.forEach(function(d) {

      d.time = new Date(d3.time.format.utc(d.time));
      d.month = d3.time.month(d.time);
      d.researcher = extract_researcher(d.path);
      d.resource = extract_resource(d.path);

    });

    sensible.ndx = crossfilter(data.children);
    sensible.dimensions.add('accesses', function(d) { return d._id; });
    sensible.dimensions.add('researcher', function(d) { return d.researcher; });
    sensible.dimensions.add('month', function(d) { return d.month});



  })
  .get();

d3.json(DATA_URL)
  .on('progress', function() {
    panel
      .show()
      .removeClass('alert-danger').addClass('alert-info')
      .empty().html('<p><strong>Info</strong> Fetching data from server. Please, be patient.</p>').delay(2000);
  })
  .on('load', function(data) {
    panel.hide(600).removeClass('alert-info').removeClass('alert-error').empty();

    // clean data
    data.children.forEach(function(d) {

      d.time = new Date(d3.time.format.utc(d.time));
      d.month = d3.time.month(d.time);
      d.researcher = extract_researcher(d.path);
      d.resource = extract_resource(d.path);

    });

    sensible.ndx = crossfilter(data.children);

    sensible.dimensions.add('accesses', function(d) { return d._id; });
    sensible.dimensions.add('researcher', function(d) { return d.researcher; });
    sensible.dimensions.add('month', function(d) { return d.month});
    sensible.dimensions.add('resource', function(d) {return d.resource;});

    sensible.groups.add('accessesCount', sensible.dimensions.get('accesses').groupAll().reduceCount());
    sensible.groups.add('researcherAccessCount', sensible.dimensions.get('researcher').group().reduceCount());
    sensible.groups.add('resourceCount', sensible.dimensions.get('resource').group().reduceCount());

    sensible.groups.add('accessUniqueness', sensible.dimensions.get('accesses').group().reduce(
      function (p, v) {
        ++p.count;
        p.absUniqueness += 10;
      },
      function (p, v) {
        --p.count;
        p.absUniqueness -= 10;
      },
      function (p, v) {
        return { count : 0, absUniqueness : 0};
      }
    ));

    // determine a histogram of percent changes
    sensible.dimensions.add('fluctuation', function(d) {
      return Math.round((d.me - d.them) / d.them * 100);
    });
    sensible.groups.add('fluctuation', sensible.dimensions.get('fluctuation').group());

    sensible.groups.add('researcherCount', sensible.ndx.groupAll().reduce(
      function (p, v) {
        if (v.researcher in p.researchers) {
          p.researchers[v.researcher] += 1;
        }
        else {
          p.researchers[v.researcher] = 1;
          p.count += 1;
        }
        return p;
      },

      function (p, v) {
        p.researchers[v.researcher] -= 1;
        if (p.researchers[v.researcher] === 0) {
          delete p.researchers[v.researcher];
          p.count -= 1;
        }
        return p;
      },

      function (p, v) {
        return { researchers : {}, count : 0};
      }

    ));

    sensible.groups.add('monthCount', sensible.dimensions.get('month').group().reduceCount());

    sensible.charts.add('accessCount', dc.numberDisplay('#audit-accesses'));
    sensible.charts.get('accessCount')
      .valueAccessor(function(d) {return d;})
      .group(sensible.groups.get('accessesCount'));

    sensible.charts.add('researcherCount', dc.numberDisplay('#audit-researcher'));
    sensible.charts.get('researcherCount')
      .valueAccessor(function(d) {
          return d.count;
      })
      .group(sensible.groups.get('researcherCount'));

    sensible.charts.add('accessHistogram', dc.barChart('#sensible-accesses-chart'));
    sensible.charts.get('accessHistogram')
        .dimension(sensible.dimensions.get('month'))
        .group(sensible.groups.get('monthCount'))
        .height(200)
        .width(600)
        .transitionDuration(1000)
        //.gap(1)
        .elasticY(true)
        .renderHorizontalGridLines(true)
        .x(d3.time.scale().domain([new Date(2014, 0, 1), new Date(2014, 11, 31)]))
        .round(d3.time.month.round)
        .alwaysUseRounding(true)
        .xUnits(d3.time.months)
        .yAxisLabel('Number of accesses')
        .xAxisLabel('Month');

    var monthFormatter = d3.time.format("%b %y");
    sensible.charts.get('accessHistogram').xAxis().tickFormat(function(d){
      return monthFormatter(d);
    });

    sensible.charts.get('accessHistogram').yAxis().ticks(4);

    sensible.charts.add('researcherAccesses', dc.rowChart('#sensible-researcher-chart'));
    sensible.charts.get('researcherAccesses')
        .height(400)
        .width(300)
        .margins({top: 10, right: 50, bottom: 30, left: 0})
        .dimension(sensible.dimensions.get('researcher'))
        .group(sensible.groups.get('researcherAccessCount'));

    sensible.charts.add('resourceChart', dc.rowChart('#sensible-resource-chart'));
    sensible.charts.get('resourceChart')
        .height(400)
        .width(300)
        .margins({top: 10, right: 50, bottom: 30, left: 0})
        .dimension(sensible.dimensions.get('resource'))
        .group(sensible.groups.get('resourceCount'));

    compositeChart.compose([sensible.charts.add('accessHistogram')]);

    dc.renderAll();


  })
  .on('error', function(error) {
    panel
      .show()
      .removeClass('alert-info').addClass('alert-danger')
      .empty().html('<p><strong>Error!</strong> Could not fetch data from server. Please try again.</p>').delay(2000).hide(600);
  })
  .get();
*/
