import React, { Component } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import Tabletop from 'tabletop';

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
      totals: {
        bike: 0,
        run: 0,
        workout: 0,
      }
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
        .filter(day => (day.bike + day.run + day.workout > 0))
        // calculate the "day score"
        .map(day => ({
          ...day,
          // units: bike [km], run [km], workout [min]
          // weights: 5km by bike is my equivalent of a 1km run or a 10min workout
          score: day.bike + day.run * 5 + day.workout * 0.5,
        }));

        const totals = data.reduce((total, day) => {
          total.bike += day.bike;
          total.run += day.run;
          total.workout += day.workout;
          return total;
        }, { bike: 0, run: 0, workout: 0 });

        this.setState({ data, totals });
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

  onDayClick(value) {
    if (!value) return;
    alert(`Date: ${value.date}\n\nBike: ${value.bike} km\nRun: ${value.run} km\nWorkout: ${value.workout} min`);
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Unstoppable.</h1>
        </header>
        <div className="HeatmapContainer">
          <CalendarHeatmap
            startDate={new Date('2018-01-01')}
            endDate={new Date('2018-12-31')}
            values={this.state.data}
            classForValue={this.classForValue}
            onClick={this.onDayClick}
            showWeekdayLabels
          />
          <p>
            Total of {this.state.totals.bike} km by &#x1F6B4;, {this.state.totals.run} km &#x1F3C3;
            and {Math.floor(this.state.totals.workout / 60)} hours &#x1F3CB; this year.
          </p>
        </div>
      </div>
    );
  }
}

export default App;
