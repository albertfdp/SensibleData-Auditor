var auditor = (function() {

  var auditor = {};
  auditor.agg = {},
  auditor.agg.ndx = crossfilter(),
  auditor.dimensions = {},
  auditor.groups = {},
  auditor.agg.dimensions = {},
  auditor.agg.groups = {},
  auditor.charts = {},
  auditor.composite = {},
  auditor.raw = {},
  auditor.dynatable = undefined,
  auditor.accessorValue = false,
  auditor.levels = {
    info : $('.sensible-level-one-info'),
    week : $('.sensible-level-one'),
    raw : $('.sensible-level-two')
  };

  auditor.levels.info.show();
  auditor.levels.week.hide();
  auditor.levels.raw.hide();

  auditor.PROBE_SYMBOLS = {
    bluetooth : '\uf116',
    location : '\uf1ff',
    facebook : '\uf231',
    celllog : '\uf1e6',
    sms : '\uf2e1',
    questionnaires : '\uf12e',
    wifi : '\uf25c'
  };

  auditor.width = $('#dashboard').width();

  auditor.charts.numberAccesses = dc.numberDisplay('#audit-accesses');
  auditor.charts.numberAccessesAverage = dc.numberDisplay('#audit-accesses-avg');
  auditor.charts.numberResearchers = dc.numberDisplay('#audit-researcher');
  auditor.charts.accessHistogram = dc.compositeChart('#chart-histogram-accesses');

  auditor.options = {
      BASE_URL : 'http://raman.imm.dtu.dk:8081/albert/sensible-dtu/audit/',
      RESEARCHERS_URL : 'researchers',
      USER_URL : 'accesses',
      ACCESSES_WEEKLY : 'weekly',
      ACCESSES_DAILY : 'daily',
      RAW : 'raw',
      formatter : d3.time.format("%Y/%a/%W"),
  };

  auditor.weeks = function() {
    var list = [];
    for (var i = 0; i <= 53; i++) {
        list.push(i);
    }
    return list;
  }

  auditor.accessor = function() {

    if (auditor.accessorValue) {
      auditor.composite.user.valueAccessor(function(d) { return d.value.accesses; });
      auditor.composite.avg.valueAccessor(function(d) { return d.value.avgAccesses / 10; });
      auditor.charts.accessHistogram.yAxisLabel('Number of observations');
      if (auditor.charts.probesCount && auditor.charts.researchers) {
        auditor.charts.probesCount.valueAccessor(function(d) { return d.value.accesses; });
        auditor.charts.researchers.valueAccessor(function(d) { return d.value.accesses; });
      }
    } else {
      auditor.composite.user.valueAccessor(function(d) { return d.value.requests; }).render();
      auditor.composite.avg.valueAccessor(function(d) { return d.value.requests; }).render();
      auditor.charts.accessHistogram.yAxisLabel('Number of accesses');
      if (auditor.charts.probesCount && auditor.charts.researchers) {
        auditor.charts.probesCount.valueAccessor(function(d) { return d.value.requests; });
        auditor.charts.researchers.valueAccessor(function(d) { return d.value.requests; });
      }
    }
    auditor.accessorValue = !auditor.accessorValue;
    dc.renderAll();
  };

  auditor.message = function() {

    var bar = $('#audit-message');

    return {

      info : function(message) {
        bar.addClass('alert alert-info').text(message).fadeIn();
      },

      error : function(message) {
        bar.addClass('alert alert-danger').text(message).fadeIn();
      },

      hide : function () {
        bar.fadeOut().removeClass('alert alert-warning alert-error').empty();
      }

    }

  }();

  auditor.url = function() {

    return {

      weekly : function() {
        return auditor.options.BASE_URL + auditor.options.USER_URL + '/' +
          auditor.options.ACCESSES_WEEKLY + '?';
      }(),

      daily : function() {
        return auditor.options.BASE_URL + auditor.options.USER_URL + '/' +
          auditor.options.ACCESSES_DAILY + '?';
      }(),

      researcher : function() {
        return auditor.options.BASE_URL + auditor.options.RESEARCHERS_URL + '?';
      }(),

      requests : function() {
        return auditor.options.BASE_URL + auditor.options.RESEARCHERS_URL + '/requests?';
      }(),

      avg : function() {
        return auditor.options.BASE_URL + auditor.options.RESEARCHERS_URL
          + '/' + auditor.options.ACCESSES_WEEKLY +'?';
      }(),

      raw : function() {
        return auditor.options.BASE_URL + auditor.options.USER_URL
          + '/' + auditor.options.RAW +'?';
      }(),

    }

    return auditor.url;

  }();

  auditor.reduceAdd = function(p, v) {
    if (v.average) {
      p.avgAccesses += v.accesses;
      p.avgRequests += v.requests;
      p.users += v.users;
    } else {
      p.accesses += v.accesses;
      p.requests += v.requests;
    }
    return p;
  };

  auditor.reduceRemove = function(p, v) {
    if (v.average) {
      p.avgAccesses -= v.accesses;
      p.avgRequests -= v.requests;
      p.users -= v.users;
    } else {
      p.accesses -= v.accesses;
      p.requests -= v.requests;
    }
    return p;
  };

  auditor.reduceInit = function(p, v) {
    return { accesses : 0, requests : 0, users : 0,
      avgAccesses : 0, avgRequests : 0};
  };

  auditor.update = function(week, year) {
    auditor.message.info('Loading data ...');
    var url = auditor.url.daily + $.param({'bearer_token' : SENSIBLE_BEARER_TOKEN, 'week' : week, 'year' : year}),
        agg_url = auditor.url.researcher + $.param({'bearer_token' : SENSIBLE_BEARER_TOKEN, 'week' : week, 'year' : year});
    queue()
      .defer(d3.json, url)
      .defer(d3.json, agg_url)
      .await(auditor.onLoad);
  };

  auditor.onHistogramClick = function(d) {
    if ((auditor.composite.user.filters().indexOf(auditor.composite.user.keyAccessor()(d)) > -1)
        && (auditor.composite.avg.filters().indexOf(auditor.composite.avg.keyAccessor()(d)) > -1)) {

      auditor.composite.user.filterAll().redraw();
      auditor.composite.avg.filterAll().redraw();

    } else {

      auditor.levels.week.hide();
      auditor.levels.info.hide();
      auditor.levels.raw.hide();

      auditor.update(d.key[0], d.key[1]);
      auditor.composite.user
        .filterAll()
        .filter(auditor.composite.user.keyAccessor()(d))
        .redraw();
      auditor.composite.avg
        .filterAll()
        .filter(auditor.composite.avg.keyAccessor()(d))
        .redraw();
    }

  };

  auditor.queryRaw = function(d, week, year) {

    var url = auditor.url.raw + $.param({'bearer_token' : SENSIBLE_BEARER_TOKEN,
      'researcher' : d.key, 'week' : week, 'year' : year});

    // abort if there is a running query
    if (auditor.raw.hasOwnProperty('xhr')) auditor.raw.xhr.abort();

    auditor.raw.xhr = d3.json(url)
      .on('load', function(data) {

        if (!data) {
          auditor.message.error('Could not load data. Please, contact admin.');
          return;
        } else {
          auditor.message.hide();
        }

        $('#researcher-raw tbody').empty();
        if (auditor.dynatable == undefined) {

          auditor.dynatable = $('#researcher-raw')
          .dynatable({
            writers: {
              date: function(record) {
                objDate = new Date(record.time.$date);
                d  = objDate.getDate();
                m  = objDate.getMonth() + 1;
                y  = objDate.getFullYear();

                h = objDate.getHours();
                mm = objDate.getMinutes();

                // ensure we have 2 digits for days/months
                d  = (d.toString().length < 2) ? '0' + d : d;
                m  = (m.toString().length < 2) ? '0' + m : m;
                h  = (h.toString().length < 2) ? '0' + h : h;
                mm  = (mm.toString().length < 2) ? '0' + mm : mm;

                return d + '-' + m + '-' + y + ' ' + h + ':' + mm;
              }
            },
            dataset: {
              records: data.results
            }
          })
          .data('dynatable');
        }
        auditor.dynatable.records.updateFromJson({records: data.results});
        auditor.dynatable.records.init();
        auditor.dynatable.process();
        auditor.levels.raw.show();
      }).get();

  };

  auditor.onLoad = function(error, data, agg) {

    if (error) auditor.message.error('Could not load data. Please, contact admin.');
    else auditor.message.hide();

    auditor.levels.week.show();
    auditor.levels.info.hide();
    auditor.levels.raw.hide();

    auditor.charts.probesCount = dc.rowChart('#chart-probe-accesses');
    auditor.charts.researchers = dc.rowChart('#chart-researcher-accesses');
    auditor.charts.researcherHistogram = dc.compositeChart('#chart-histogram-week-accesses');

    var week = d3.time.format("%Y-%j").parse(data.meta.year + '-' + ((data.meta.week * 7) + 1));
    var nextWeek = new Date(week.getFullYear(), week.getMonth(), week.getDate() + 6);


    auditor.ndx = crossfilter();
    auditor.meta = data.meta;
    data.results.forEach(function(d) {
      var allAccesses = [];
      var formatter = d3.time.format("%Y-%j");
      var date = new Date(formatter.parse(d.year + '-' + d.day));
      d.researchers.forEach(function(r) {
        var p = {};
        p.date = date;
        p.year = d.year;
        p.day = d.day;
        p.accesses = r.accesses;
        p.probe = r.probe;
        p.requests = r.requests;
        p.researcher = r.researcher;
        p.average = false;
        allAccesses.push(p);
      });
      auditor.ndx.add(allAccesses);
    });

    agg.results.forEach(function(d) {
      var formatter = d3.time.format("%Y-%j");
      d.date = new Date(formatter.parse(d.year + '-' + d.day));
      d.average = true;
    });
    auditor.ndx.add(agg.results);

    auditor.dimensions.date = auditor.ndx.dimension(function(d) {
      return d.date;
    });

    auditor.dimensions.researcher = auditor.ndx.dimension(function(d) {
      return d.researcher;
    });

    auditor.dimensions.probe = auditor.ndx.dimension(function(d) {
      return d.probe;
    });

    auditor.groups.date = auditor.dimensions.date.group()
      .reduce(auditor.reduceAdd, auditor.reduceRemove, auditor.reduceInit);

    auditor.groups.accesses = auditor.dimensions.researcher.group()
      .reduce(auditor.reduceAdd, auditor.reduceRemove, auditor.reduceInit);

    auditor.groups.probe = auditor.dimensions.probe.group()
      .reduce(auditor.reduceAdd, auditor.reduceRemove, auditor.reduceInit);


    auditor.charts.researchers
      .height(600)
      .width(auditor.width / 2)
      .dimension(auditor.dimensions.researcher)
      .elasticX(true)
      .valueAccessor(function(d) {
        return d.value.accesses;
      })
      .colors(d3.scale.ordinal().domain([true, false]).range(['#27ae60', '#e74c3c']))
      .colorAccessor(function(d) {
        return d.value.accesses < (d.value.avgAccesses / 10);
      })
      .group(auditor.groups.accesses)
      .labelOffsetY(35)
      .render();

    auditor.charts.researchers.onClick = function(d) {
      auditor.levels.raw.hide();
      auditor.message.info('Loading raw data ...');
      auditor.queryRaw(d, auditor.meta.week, auditor.meta.year);

      if (auditor.charts.researchers
        .filters().indexOf(auditor.charts.researchers.keyAccessor()(d)) > -1) {

          auditor.agg.dimensions.weekly.researcher.filterAll();
          auditor.charts.researchers.filterAll().redraw();

      } else {

          auditor.agg.dimensions.weekly.researcher.filter(d.key);
          auditor.charts.researchers
            .filterAll().filter(auditor.charts.researchers.keyAccessor()(d))
            .redraw();

      }

      dc.redrawAll();

    };

    auditor.charts.probesCount
      .height(600)
      .width(auditor.width / 2)
      .margins({top: 10, right: 5, bottom: 30, left: 10})
      .dimension(auditor.dimensions.probe)
      .elasticX(true)
      .valueAccessor(function(d) {
          return d.value.accesses;
      })
      .label(function(d) {
        return auditor.PROBE_SYMBOLS[d.key] + ' - ' + d.key;
      })
      .ordinalColors(['rgb(166,206,227)','rgb(31,120,180)','rgb(178,223,138)','rgb(51,160,44)','rgb(251,154,153)','rgb(227,26,28)','rgb(253,191,111)','rgb(255,127,0)','rgb(202,178,214)'])
      //.ordinalColors(colorbrewer.Dark2[6])
      //.ordinalColors(['rgb(251,180,174)','rgb(179,205,227)','rgb(204,235,197)','rgb(222,203,228)','rgb(254,217,166)','rgb(255,255,204)','rgb(229,216,189)','rgb(253,218,236)','rgb(242,242,242)'])
      .group(auditor.groups.probe)
      .labelOffsetY(35)
      .render();

    auditor.charts.researcherHistogram
      .height(300)
      .width(auditor.width)
      .x(d3.time.scale().domain([week, nextWeek]))
      .xUnits(d3.time.days)
      .elasticY(true)
      .dimension(auditor.dimensions.date)
      .yAxisLabel('Number of accesses')
      .brushOn(true)
      .compose([
        dc.lineChart(auditor.charts.researcherHistogram)
          .valueAccessor(function(d) {
            return d.value.accesses;
          })
          .group(auditor.groups.date)
          .brushOn(true)
          .colors(d3.scale.ordinal().range(['#16A085'])),
        dc.lineChart(auditor.charts.researcherHistogram)
          .valueAccessor(function(d) {
            return d.value.avgAccesses / 10;
          })
          .group(auditor.groups.date)
          .colors(d3.scale.ordinal().range(['#22313F']))
      ]).render();

      auditor.xAxisLabel(auditor.charts.researchers, 'Number of accesses');
      auditor.xAxisLabel(auditor.charts.probesCount, 'Number of accesses');

  }

  auditor.dashboard = function(error, weekly, researcher, requests) {

    if (error) {
      auditor.message.error('Could not load data. Please, contact admin.');
      return;
    } else {
      auditor.message.hide();
    }

    weekly.results.forEach(function(d) {
      d.date = new Date(auditor.options.formatter.parse(d.year + '/Mon/' + d.week));
      d.weekNumber = d.week;
      d.average = false;
    });

    researcher.results.forEach(function(d) {
      d.date = new Date(auditor.options.formatter.parse(d._id.year + '/Mon/' + d._id.week));
      d.year = d._id.year;
      d.weekNumber = d._id.week;
      d.researcher = d._id.researcher;
      d.accesses = d.value.accesses;
      d.users = d.value.users;
      d.requests = d.value.requests;
      d.average = true;
      delete d._id;
      delete d.value;
    });

    auditor.agg.ndx.add(weekly.results);
    auditor.agg.ndx.add(researcher.results);

    auditor.agg.dimensions.weekly = {};

    auditor.agg.dimensions.weekly.weekNumber = auditor.agg.ndx.dimension(function(d) {
      return [d.weekNumber, d.year];
    });

    auditor.agg.dimensions.weekly.researcher = auditor.agg.ndx.dimension(function(d) {
      return d.researcher;
    });

    auditor.agg.dimensions.avg = auditor.agg.ndx.dimension(function(d) {
      return d.average;
    });

    auditor.agg.groups.unique = auditor.agg.dimensions.weekly.weekNumber.groupAll().reduce(
      function(p, v) {
        if (!v.average) {
          if (v.researcher in p.researchers)
            p.researchers[v.researcher]++;
          else p.researchers[v.researcher] = 1;
            p.requests += v.requests;
            p.accesses += v.accesses;
          }
          return p;
        },
      function(p, v) {
        if (!v.average) {
          p.researchers[v.researcher]--;
          if (p.researchers[v.researcher] === 0)
            delete p.researchers[v.researcher];
          p.requests -= v.requests;
          p.accesses -= v.accesses;
        }
        return p;
      },
      function() { return { researchers : {}, requests : 0, accesses : 0}}
    );

    auditor.charts.numberAccesses
      .valueAccessor(function(d) { return d.accesses; })
      .group(auditor.agg.groups.unique)
      .render();

    auditor.charts.numberAccessesAverage
      .valueAccessor(function(d) { return d.requests; })
      .group(auditor.agg.groups.unique)
      .render();

    auditor.charts.numberResearchers
      .valueAccessor(function(d) { return Object.keys(d.researchers).length; })
      .group(auditor.agg.groups.unique)
      .render();

    auditor.agg.groups.weekly = {};
    auditor.agg.groups.weekly.wAccesses = auditor.agg.dimensions.weekly.weekNumber.group()
      .reduce(auditor.reduceAdd, auditor.reduceRemove, auditor.reduceInit);
    auditor.agg.groups.weekly.researcher = auditor.agg.dimensions.weekly.researcher.group()
      .reduce(auditor.reduceAdd, auditor.reduceRemove, auditor.reduceInit);

    /*
     *  Histogram of accesses
     */
    auditor.composite.user = dc.barChart(auditor.charts.accessHistogram)
      .group(auditor.agg.groups.weekly.wAccesses, 'User')
      .centerBar(true)
      .title(function(d) { return d.value.accesses; })
      .keyAccessor(function(d) { return d.key[0]; })
      .valueAccessor(function(d) { return d.value.accesses; })
      .colors(d3.scale.ordinal().range(['#16A085']));
    auditor.composite.user.onClick = auditor.onHistogramClick;

    auditor.composite.avg = dc.lineChart(auditor.charts.accessHistogram)
      .group(auditor.agg.groups.weekly.wAccesses, 'Average')
      .valueAccessor(function(d) { return d.value.avgAccesses / 10; })
      .keyAccessor(function(d) { return d.key[0]; })
      .title(function(d) { return d.key + ': ' + d.value.accesses + '/' + d.value.avgAccesses; })
      .colors(d3.scale.ordinal().range(['#22313F']));


    auditor.charts.accessHistogram
      .width(auditor.width)
      .height(300)
      .transitionDuration(1000)
      .margins({top: 10, right: 0, bottom: 50, left: 60})
      .dimension(auditor.agg.dimensions.weekly.weekNumber)
      .group(auditor.agg.groups.weekly.wAccesses)
      .x(d3.scale.ordinal().domain(auditor.weeks()))
      .legend(dc.legend().x(1000).y(20).itemHeight(13).gap(5))
      .elasticY(true)
      .yAxisLabel('Number of observations')
      .xUnits(dc.units.ordinal)
      .renderHorizontalGridLines(true)
      .brushOn(false)
      .title(function(d) { return d.key + ': ' + d.value.accesses + '/' + d.value.avgAccesses; })
      .compose([auditor.composite.user, auditor.composite.avg])
      .xAxisLabel('Week')
      .render();

  };

  auditor.xAxisLabel = function(chart, text) {
    chart.svg()
      .append('text')
      .attr('class', 'x-axis-label')
      .attr('text-anchor', 'middle')
      .attr('x', chart.width() / 2)
      .attr('y', chart.height() - 1)
      .text(text);
  };


  return auditor;

}());

$('#sidebar').affix({
  offset: {
    top: 0
  }
});

$('#accesses-controls').on('change', auditor.accessor);


auditor.message.info('Loading data ...');

queue()
  .defer(d3.json, auditor.url.weekly + $.param({'bearer_token' : SENSIBLE_BEARER_TOKEN}))
  .defer(d3.json, auditor.url.avg + $.param({'bearer_token' : SENSIBLE_BEARER_TOKEN}))
  .defer(d3.json, auditor.url.requests + $.param({'bearer_token' : SENSIBLE_BEARER_TOKEN}))
  .await(auditor.dashboard);
