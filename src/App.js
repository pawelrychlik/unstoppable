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
      //   { date: '2018-06-01', bike: "25", run: "0", workout: "0.75" },
      //   { date: '2018-06-03', bike: "48", run: "0", workout: "" },
      //   { date: '2018-06-06', bike: "3", run: "10", workout: "" },
      // ],
      data: [],
    };
  }

  loadSheet() {
    // TODO error handling
    return new Promise((resolve) => {
      const sheetUrl = 'https://docs.google.com/spreadsheets/d/1CK1dlXslA7_wRth0SYvTf4wY2xgzk2gKGD1uw6SVyKg/edit?usp=sharing';

      Tabletop.init({ key: sheetUrl, callback: resolve, simpleSheet: true });
    });
  }

  componentWillMount() {
    this.loadSheet()
      .then(data => {
        // console.log(data);
        this.setState({ data });
      })
      .catch(e => console.error(e));
  }

  classForValue(day) {
    if (!day) return 'color-empty';

    // units: bike [km], run [km], workout [h]
    // weights: 25km by bike is my equivalent of a 5km run or a 1h workout
    const dayScore = Number(day.bike || 0) + Number(day.run || 0) * 5 + Number(day.workout || 0) * 25;

    if (dayScore === 0) return 'color-empty';
    if (dayScore < 10) return 'color-github-1';
    if (dayScore < 25) return 'color-github-2';
    if (dayScore < 50) return 'color-github-3';
    return 'color-github-4';
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
          />
        </div>
      </div>
    );
  }
}

export default App;
