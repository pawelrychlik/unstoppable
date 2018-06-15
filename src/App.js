import React, { Component } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import Tabletop from 'tabletop';
import ReactTooltip from 'react-tooltip'

import logo from './logo.svg';
import './App.css';
import './react-calendar-heatmap.css';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      // data: [  // example data
      //   { date: '2018-06-01', bike: "25", run: "0", workout: "60" },
      //   { date: '2018-06-03', bike: "48", run: "0", workout: "" },
      //   { date: '2018-06-06', bike: "3", run: "10", workout: "" },
      // ],
      data: [],
      filteredData: [],
      totals: {
        bike: 0, // km
        run: 0, // km
        workout: 0, //mins
      },
      filter: 'all',
    };
  }

  loadSheet() {
    // TODO error handling
    return new Promise((resolve) => {
      const sheetUrl = 'https://docs.google.com/spreadsheets/d/1CK1dlXslA7_wRth0SYvTf4wY2xgzk2gKGD1uw6SVyKg/edit?usp=sharing';

      const callback = (sheets) => {
        resolve(sheets['2018'].elements);
      };
      Tabletop.init({ key: sheetUrl, callback, wanted: ['2018'] });
    });
  }

  componentWillMount() {
    this.loadSheet()
      .then(rawData => {
        // console.log(rawData);
        // debugger;

        const data = rawData.map(day => ({
          date: day.date,
          bike: Number(day.bike || 0),
          run: Number(day.run || 0),
          workout: Number(day.workout || 0),
        }))
        // filter out the days with no activity
        .filter(day => (day.bike + day.run + day.workout > 0));

        const totals = data.reduce((total, day) => {
          total.bike += day.bike;
          total.run += day.run;
          total.workout += day.workout;
          return total;
        }, { bike: 0, run: 0, workout: 0 });

        this.setState({ data, totals });

        this.applyFilters('all');
      })
      .catch(e => console.error(e));
  }

  classForValue(day) {
    if (!day) return 'color-empty';

    if (day.score === 0) return 'color-empty';
    if (day.score < 10) return 'color-github-1';
    if (day.score < 25) return 'color-github-2';
    if (day.score < 50) return 'color-github-3';
    return 'color-github-4';
  }

  onFilter = (e) => {
    const filter = e.currentTarget.value;
    this.setState({ filter });

    this.applyFilters(filter);
  }

  applyFilters(filter) {
    // weights: 5km by bike is my equivalent of a 1km run or a 10min workout
    const bikeWeight = ['all', 'bike'].includes(filter) ? 1 : 0;
    const runWeight = ['all', 'run'].includes(filter) ? 5 : 0;
    const workoutWeight = ['all', 'workout'].includes(filter) ? 0.5 : 0;

    // calculate the "day score"
    const filteredData = this.state.data.map(day => ({
      ...day,
      score: day.bike * bikeWeight + day.run * runWeight + day.workout * workoutWeight,
    }));
    this.setState({ filteredData });

    ReactTooltip.rebuild();
  }

  render() {
    const customTooltipDataAttrs = (value) => {
      if (!value || !value.date) return;

      const lines = [ value.date ];
      value.bike && lines.push(`${value.bike} km by bike`);
      value.run && lines.push(`${value.run} km ran`);
      value.workout && lines.push(`${value.workout} min of workout`);

      return { 'data-tip': lines.join('<br />') };
    };
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Unstoppable.</h1>
        </header>
        <div className="HeatmapContainer">
          <div className="Heatmap">
            <CalendarHeatmap
              startDate={new Date('2018-01-01')}
              endDate={new Date('2018-12-31')}
              values={this.state.filteredData}
              classForValue={this.classForValue}
              showWeekdayLabels
              tooltipDataAttrs={customTooltipDataAttrs}
            />
          </div>
          <div className="Filters">
            <div>
              <input type="radio" value="all" checked={this.state.filter === 'all'} onChange={this.onFilter} />
              <span role="img" aria-label="all"> &#x1F30D;</span>
            </div>
            <div>
              <input type="radio" value="bike" checked={this.state.filter === 'bike'} onChange={this.onFilter} />
              <span role="img" aria-label="bike"> &#x1F6B4;</span>
            </div>
            <div>
              <input type="radio" value="run" checked={this.state.filter === 'run'} onChange={this.onFilter} />
              <span role="img" aria-label="run"> &#x1F3C3;</span>
            </div>
            <div>
              <input type="radio" value="workout" checked={this.state.filter === 'workout'} onChange={this.onFilter} />
              <span role="img" aria-label="workout"> &#x1F3CB;</span>
            </div>
          </div>
        </div>

        <div className="Totals">
          Total of {this.state.totals.bike} km by &#x1F6B4;, {this.state.totals.run} km by &#x1F3C3;
          and {Math.floor(this.state.totals.workout / 60)} hours of &#x1F3CB; this year.
        </div>

        <ReactTooltip effect="solid" multiline />
      </div>
    );
  }
}

export default App;
