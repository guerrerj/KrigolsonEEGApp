import { ChartOptions } from 'chart.js';

/* This file contains the settings and options
used by different chart providers (i.e chart.js and smoothie.js)
for each application
*/
export const bandLabels = ['Alpha', 'Beta', 'Delta', 'Gamma', 'Theta'];
export const orderedBandLabels = ['Delta', 'Theta', 'Alpha', 'Beta', 'Aux'];
export const channelLabels = ['TP9', 'AF7', 'AF8', 'TP10', 'Aux'];
export const orderedLabels = ['AF7', 'AF8', 'TP9', 'TP10', 'Aux'];


export const backgroundColors: string[] = [
  'rgba(255, 99, 132, 0.2)',
  'rgba(54, 162, 235, 0.2)',
  'rgba(255, 206, 26, 0.2)',
  'rgba(75, 92, 192, 0.2)',
  'rgba(153, 102, 255, 0.2)',
];

export const borderColors: string[] = ['rgba(255, 99, 132, 1)',
'rgba(54, 162, 235, 1)',
'rgba(255, 206, 26, 1)',
'rgba(75, 92, 192, 1)',
'rgba(153, 102, 255, 1)',
];

interface ISpectraDataSet {
  label: string;
  data: number[];
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  fill: any;
  lineTension: number;
}
export const spectraDataSet: ISpectraDataSet = {
  data: [],
  backgroundColor: '' ,
  borderColor: '',
  borderWidth: 1,
  fill: false,
  label: '',
  lineTension: 0.4
};

interface IBandsDataSet {
  label: string[];
  data: number[];
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  fill: any;
  lineTension: number;
}
export const bandsDataSet: IBandsDataSet = {
  data: [],
  backgroundColor: '' ,
  borderColor: '',
  borderWidth: 1,
  fill: false,
  label: [],
  lineTension: 0.4
};

export const spectraLabels = []

export const FreqSpectraChartOptions: Partial<ChartOptions> = {
  events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'],
  tooltips: {
    enabled: true,
    intersect: true,
    mode: 'point',
    callbacks: {
      label(tooltipItem: any, data) : string {
          let label = data.datasets[tooltipItem.datasetIndex].label || '';

          if (label) {
              label += ': ';
          }
          label += Math.round(tooltipItem.yLabel * 100) / 100;
          return label;
      }
    }
  },
  hover: {
    animationDuration: 0
  },
  responsiveAnimationDuration: 0,
  title: {
    display: true,
    text: 'Frequency Spectra per Electrode'
  },
  scales: {
    yAxes: [{
      scaleLabel: {
      display: true,
      labelString: 'Power (uV)'
    }}],
    xAxes: [{
      scaleLabel: {
        display: true,
        labelString: 'Frequency (Hz)'
      }
    }]
 }
};


export const FreqBandsChartOptions: Partial<ChartOptions> = {
  title: {
    display: true,
    text: 'Frequency Bands per Electrode'
  },
  responsiveAnimationDuration: 0,
  scales: {
      yAxes: [{
        scaleLabel: {
        display: true,
        labelString: 'Power (uV)'
      }}],
      xAxes: [{
        scaleLabel: {
          display: true,
          labelString: 'Frequency Bands'
        }
      }]
  }
};
