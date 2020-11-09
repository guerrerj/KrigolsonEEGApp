import { Injectable } from '@angular/core';


@Injectable()
export class ChartService {

  constructor() { }

  getChartSmoothieDefaults(overrides: any = {}): any {
    return Object.assign({
      responsive: true,
      millisPerPixel: 5,
      grid: {
        lineWidth: 4,
        fillStyle: 'transparent',
        strokeStyle: 'transparent',
        sharpLines: true,
        verticalSections: 0,
        borderVisible: false
      },
      labels: {
        disabled: true
      }
    }, overrides);
  }

  getColors() {
    return [
      { borderColor: 'rgba(112,185,252,1)', backgroundColor: 'rgba(112,185,252,1)' },
      { borderColor: 'rgba(116,150,161,1)', backgroundColor: 'rgba(116,150,161,1)' },
      { borderColor: 'rgba(162,86,178,1)', backgroundColor: 'rgba(162,86,178,1)' },
      { borderColor: 'rgba(144,132,246,1)', backgroundColor: 'rgba(144,132,246,1)' },
      { borderColor: 'rgba(138,219,229,1)', backgroundColor: 'rgba(138,219,229,1)' },
      { borderColor: 'rgba(207,181,59, 1)', backgroundColor: 'rgba(207,181,59, 1)' },
      { borderColor: 'rgba(148,159,177,1)', backgroundColor: 'rgba(148,159,177,1)' },
      { borderColor: 'rgba(77,83,96,1)', backgroundColor: 'rgba(77,83,96,1)' }
    ];
  }

  // Function to count by n to something
  customCount(start: number, end: number, step = 1) {
    const len = Math.floor((end - start) / step) + 1;
    return Array(len).fill(0).map((_, idx) => start + idx * step);
  }

// Average of values in data
  average(data: Array<number>) {
    const sum = data.reduce((sumTemp: number, value: number) => sumTemp + value, 0);
    return sum / data.length;
}



/*   // Generate xTics
  generateXTics(srate, duration, reverse = true) {
  let tics = [];
  if (reverse) {
    tics = customCount(
      (1000 / srate) * duration,
      1000 / srate,
      -(1000 / srate)
    )
  } else {
    tics = customCount(
      1000 / srate,
      (1000 / srate) * duration,
      1000/srate
    )
  }
  return (
    tics.map(function(each_element) {
      return Number(each_element.toFixed(0));
    })
  )
} */

// Standard deviation of values in values
  standardDeviation(values: Array<number>){
       const avg = this.average(values);
       const squareDiffs = values.map((value: number) => Math.pow((value - avg), 2));
       const avgSquareDiff = this.average(squareDiffs);
       const stdDev = Math.sqrt(avgSquareDiff).toFixed(0);
       return stdDev;
}

}
