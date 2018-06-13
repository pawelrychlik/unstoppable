import React, { Component } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';

import logo from './logo.svg';
import './App.css';
import './react-calendar-heatmap.css';

class App extends Component {
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
            values={[
              { date: '2018-06-01', count: 1 },
              { date: '2018-06-03', count: 4 },
              { date: '2018-06-06', count: 2 },
              // ...and so on
            ]}
            classForValue={(value) => {
              if (!value) {
                return 'color-empty';
              }
              return `color-github-${value.count}`;
            }}
          />
        </div>
      </div>
    );
  }
}

export default App;
