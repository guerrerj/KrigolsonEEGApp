import { ChartOptions } from 'chart.js';

/* This file contains the settings and options
used by different chart providers (i.e chart.js and smoothie.js)
for each application
*/
// export const bandLabels = ['Alpha', 'Beta', 'Delta', 'Gamma', 'Theta'];
// export const orderedBandLabels = ['Delta', 'Theta', 'Alpha', 'Beta'];
// export const channelLabels = ['TP9', 'AF7', 'AF8', 'TP10'];
// export const orderedLabels = ['AF7', 'AF8', 'TP9', 'TP10'];

export const bciBandLabels = ['Alpha', 'Beta', 'Delta', 'Gamma', 'Theta'];
export const bciOrderedBandLabels = ['Delta', 'Theta', 'Alpha', 'Beta'];
export const bciChannelLabels = ['TP9', 'AF7', 'AF8', 'TP10'];
export const bciOrderedLabels = ['AF7', 'AF8', 'TP9', 'TP10'];

export const bciFreqLabel = ['Base','Increment'];

export const bciStackedBackgroundColors: string [] = [
'rgba(48, 63, 159, 0.7)',
'rgba(255, 87, 34, 0.7)',
];

export const bciStackedBoarderColors: string [] = [
'rgba(48, 63, 159, 1)',
'rgba(255, 87, 34, 1)',
];


export const bciBackgroundColors: string[] = [
  'rgba(255, 99, 132, 0.8)',
  'rgba(54, 162, 235, 0.8)',
  'rgba(255, 206, 26, 0.8)',
  'rgba(75, 92, 192, 0.8)',
  'rgba(153, 102, 255, 0.8)',
];

export const bciBorderColors: string[] = ['rgba(255, 99, 132, 1)',
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
export const bciSpectraDataSet: ISpectraDataSet = {
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
export const bciBandsDataSet: IBandsDataSet = {
  data: [],
  backgroundColor: '' ,
  borderColor: '',
  borderWidth: 1,
  fill: false,
  label: [],
  lineTension: 0.4
};
  
export const bciChannelFreqStackedChartOptions: Partial<ChartOptions> = {
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
    text: '1 Channel & 1 Frequency Chart'
  },
  scales: {
    yAxes: [{
      stacked:true,
      scaleLabel: {
      display: true,
      labelString: '10 Average Power (uV)'
    }}],
    xAxes: [{
      stacked:true,
      scaleLabel: {
        display: false,
        labelString: 'Most Recent Value'
      }
    }]
 }
};   

export const bciFreqStackedChartOptions: Partial<ChartOptions> = {
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
    text: 'All Channels at selected Frequency Chart'
  },
  scales: {
    yAxes: [{
      stacked:true,
      scaleLabel: {
      display: true,
      labelString: '10 Average Power (uV)'
    }}],
    xAxes: [{
      stacked:true,
      scaleLabel: {
        display: true,
        labelString: 'Most Recent'
      }
    }]
 }
};


export interface bciSettings {
  cutOffLow: number;
  cutOffHigh: number;
  interval: number;
  bins: number;
  duration: number;
  srate: number;
  name: string;
  secondsToSave: number;
  nChannels: number;
  sliceFFTLow?: number;
  sliceFFTHigh?: number;
  maxDisplayedFreq: number;
}

export function bciGetSettings(): bciSettings {
  return {
    cutOffLow: 8,
    cutOffHigh: 13,
    interval: 120,
    bins: 256,
    duration: 1024,
    srate: 256,
    name: '',
    secondsToSave: 10,
    nChannels: 4,
    sliceFFTLow: 8,
    sliceFFTHigh: 13,
    maxDisplayedFreq : 10
  };
}

