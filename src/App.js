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
      year: '2019',
      // data: [  // example data
      //   { date: '2018-06-01', bike: "25", run: "0", workout: "60", comments: "been there, done that" },
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
      streaks: { current: { start: '', length: 0 }, longest: { start: '', length: 0 } },
    };
  }

  loadSheet(year) {
    // TODO error handling
    return new Promise((resolve) => {
      const sheetUrl = 'https://docs.google.com/spreadsheets/d/1CK1dlXslA7_wRth0SYvTf4wY2xgzk2gKGD1uw6SVyKg/edit?usp=sharing';

      const callback = (sheets) => {
        resolve(sheets[year].elements);
      };
      Tabletop.init({ key: sheetUrl, callback, wanted: [year] });
    });
  }

  normalize(rawData) {
    return rawData.map(day => ({
      date: day.date,
      bike: Number(day.bike || 0),
      run: Number(day.run || 0),
      workout: Number(day.workout || 0),
      comments: day.comments,
    }))
    // filter out the days with no activity
    .filter(day => (day.bike + day.run + day.workout > 0));
  }

  calculateYearlyTotals(data) {
    return data.reduce((total, day) => {
      total.bike += day.bike;
      total.run += day.run;
      total.workout += day.workout;
      return total;
    }, { bike: 0, run: 0, workout: 0 });
  }

  calculateStreaksOfActivity(data) {
    const dayDiff = (dateFrom, dateTo) => Math.abs(new Date(dateTo) - new Date(dateFrom)) / (1000 * 60 * 60 * 24);

    // find the longest streak of activity
    const streaks = data.reduce((acc, curr) => {
      if (!acc.start) {
        return { start: curr.date, length: 1, longest: { start: curr.date, length: 1 } };
      }
      if (dayDiff(acc.start, curr.date) === acc.length) { // streak continues
        acc.length++;
      } else { // streak interrupted
        if (acc.length > acc.longest.length) {
          acc.longest = { start: acc.start, length: acc.length };
        }
        acc.start = curr.date;
        acc.length = 1;
      }
      return acc;
    }, {});

    // see if the current streak is the longest one
    const longest = (streaks.length > streaks.longest.length)
      ? { start: streaks.start, length: streaks.length }
      : streaks.longest;

    const current = dayDiff(streaks.start, new Date()) <= streaks.length + 1
      ? { start: streaks.start, length: streaks.length }
      : { length: 0 };

    return { longest, current };
  }

  componentWillMount() {
    this.fetchData(this.state.year);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.year !== prevState.year) {
      this.fetchData(this.state.year);
    }
    if (this.state.filter !== prevState.filter) {
      this.setState(state => ({
        filteredData: this.calculateFilteredData(state.data, state.filter)
      }));
    }
  }

  fetchData(year) {
    this.loadSheet(year)
      .then(rawData => {
        // console.log(rawData);
        // debugger;

        const data = this.normalize(rawData);
        const totals = this.calculateYearlyTotals(data);
        const streaks = this.calculateStreaksOfActivity(data);
        const filter = 'all';
        const filteredData = this.calculateFilteredData(data, filter);
        this.setState({ data, totals, streaks, filter, filteredData });

        ReactTooltip.rebuild();
      })
      .catch(e => console.error(e));
  }

  calculateFilteredData(data, filter) {
    // weights: 5km by bike is my equivalent of a 1km run or a 10min workout
    const bikeWeight = ['all', 'bike'].includes(filter) ? 1 : 0;
    const runWeight = ['all', 'run'].includes(filter) ? 5 : 0;
    const workoutWeight = ['all', 'workout'].includes(filter) ? 0.5 : 0;

    // calculate the "day score"
    return data.map(day => ({
      ...day,
      score: day.bike * bikeWeight + day.run * runWeight + day.workout * workoutWeight,
    }));
  }

  classForValue(day) {
    if (!day) return 'color-empty';

    if (day.score === 0) return 'color-empty';
    if (day.score < 10) return 'color-github-1';
    if (day.score < 25) return 'color-github-2';
    if (day.score < 50) return 'color-github-3';
    return 'color-github-4';
  }

  render() {
    const customTooltipDataAttrs = (value) => {
      if (!value || !value.date) return;

      const lines = [ value.date ];
      value.bike && lines.push(`${value.bike} km by bike`);
      value.run && lines.push(`${value.run} km ran`);
      value.workout && lines.push(`${value.workout} min of workout`);
      value.comments && lines.push(value.comments);

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
              startDate={new Date(`${this.state.year}-01-01`)}
              endDate={new Date(`${this.state.year}-12-31`)}
              values={this.state.filteredData}
              classForValue={this.classForValue}
              showWeekdayLabels
              tooltipDataAttrs={customTooltipDataAttrs}
              weekdayLabels={['', 'Mo', '', 'We', '', 'Fri', '']}
            />
          </div>
          <div className="Filters">
            <div>
              <input type="radio"
                checked={this.state.filter === 'all'}
                onChange={() => this.setState({ filter: 'all' })}
              />
              <span role="img" aria-label="all"> &#x1F30D;</span>
            </div>
            <div>
              <input type="radio"
                checked={this.state.filter === 'bike'}
                onChange={() => this.setState({ filter: 'bike' })}
              />
              <span role="img" aria-label="bike"> &#x1F6B4;</span>
            </div>
            <div>
              <input type="radio"
                checked={this.state.filter === 'run'}
                onChange={() => this.setState({ filter: 'run' })}
              />
              <span role="img" aria-label="run"> &#x1F3C3;</span>
            </div>
            <div>
              <input type="radio"
                checked={this.state.filter === 'workout'}
                onChange={() => this.setState({ filter: 'workout' })}
              />
              <span role="img" aria-label="workout"> &#x1F3CB;</span>
            </div>
          </div>
        </div>

        <div className="Totals">
          Total of {this.state.totals.bike} km by &#x1F6B4;, {this.state.totals.run} km by &#x1F3C3;
          and {Math.floor(this.state.totals.workout / 60)} hours of &#x1F3CB; this year.<br/>
          Current streak of activity is {this.state.streaks.current.length} days. Longest is {this.state.streaks.longest.length} days.
        </div>

        <div style={{ marginTop: '20px' }}>
          <input type="radio"
            checked={this.state.year === '2018'}
            onChange={() => this.setState({ year: '2018' })}
          /> 2018
          <input type="radio"
            checked={this.state.year === '2019'}
            onChange={() => this.setState({ year: '2019' })}
          /> 2019
        </div>

        <ReactTooltip effect="solid" multiline />
      </div>
    );
  }
}

export default App;
