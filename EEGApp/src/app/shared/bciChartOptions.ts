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


export const bciBackgroundColors: string[] = [
  'rgba(255, 99, 132, 0.2)',
  'rgba(54, 162, 235, 0.2)',
  'rgba(255, 206, 26, 0.2)',
  'rgba(75, 92, 192, 0.2)',
  'rgba(153, 102, 255, 0.2)',
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
  
   
export const bciFreqSpectraChartOptions: Partial<ChartOptions> = {
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
    display: false,
    text: 'Frequency Spectra per Electrode'
  },
  scales: {
    yAxes: [{
      scaleLabel: {
      display: true,
      labelString: '10 Average Power (uV)'
    }}],
    xAxes: [{
      scaleLabel: {
        display: true,
        labelString: 'Frequency (Hz)'
      }
    }]
 }
};


export const bciFreqBandsChartOptions: Partial<ChartOptions> = {
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

export const bciFreqExperChartOptions: Partial<ChartOptions> = {
   title: {
     display: true,
     text: 'Power'
   },
   responsiveAnimationDuration: 0,
   scales: {
     yAxes: [{
       scaleLabel: {
         display: true,
         labelString: 'Power (uV)'
       }
     }],
     xAxes: [{
       scaleLabel: {
         display: true,
         labelString: 'Time (sample number)'
       }
     }]
   },
   legend: {
     display: false
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
  maxFreq: number;
}

export function bciGetSettings(): bciSettings {
  return {
    cutOffLow: 8,
    cutOffHigh: 12,
    interval: 200,
    bins: 256,
    duration: 1024,
    srate: 256,
    name: '',
    secondsToSave: 10,
    nChannels: 4,
    sliceFFTLow: 8,
    sliceFFTHigh: 12,
    maxFreq : 10
  };
}
