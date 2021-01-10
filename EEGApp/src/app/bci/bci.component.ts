import { DataService } from '../shared/dataService';
import { backgroundColors, borderColors,  channelLabels, FreqSpectraChartOptions, getSettings, ISettings, spectraDataSet } from '../shared/chartOptions';
import { Component, Input, AfterViewInit, AfterViewChecked } from '@angular/core';
import { OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { channelNames, EEGSample } from 'muse-js';
import { takeUntil } from 'rxjs/operators';
import { catchError } from 'rxjs/operators';
import { Chart } from 'chart.js';

import { bciBackgroundColors, bciBorderColors,  bciChannelLabels, bciFreqSpectraChartOptions,
	      bciGetSettings, bciSettings,bciSpectraDataSet } from '../shared/bciChartOptions';
import {
  bandpassFilter,
  epoch,
  fft,
  sliceFFT
} from '@neurosity/pipes';

// If you have inner observable use mergemap to allow you to  subscribe to directly to it after applying map operation

const chartStyles = {
  wrapperStyle: {
    display: 'flex',
    flexWrap: 'wrap',
    padding: '20px'
  }
};

@Component({
  selector: 'app-bci',
  templateUrl: './bci.component.html',
  styleUrls: ['./bci.component.less']
})


export class BciComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked {

  @Input() data: Observable<EEGSample>;

  settings: ISettings;
  bciSettings: bciSettings;

  readonly destroy = new Subject<void>();
  readonly channelNames = channelNames;

  chart: Chart;
  bciChart: Chart;

  freq8: Array<Array<number>>;
  freq8Avg: Array<Array<number>>;

  constructor(private incomingData: DataService) {}

  ngOnInit(): void {
    // Get settings for the charts
    this.settings = getSettings();
    this.settings.name = 'Frequency Spectrum';
    this.bciSettings = getSettings();
    this.bciSettings.name='BCI Control bar';

    this.freq8 = Array(4).fill(0).map(ch => new Array(10).fill(0));
    this.freq8Avg = Array(4).fill(0).map(ch => new Array(10).fill(0));

    // Get the chart options such as adding dummy data and configurations
    const canvas = document.getElementById('freqChart') as HTMLCanvasElement;
    const dataSets = [];

    Array(this.settings.nChannels).fill(0).map((ch, i) => {
          const temp =  Object.assign({}, spectraDataSet);
          temp.backgroundColor = backgroundColors[i];
          temp.borderColor = borderColors[i];
          temp.label = channelLabels[i];
          temp.data  = Array(this.settings.maxFreq).fill(0);
          dataSets.push(temp);
        });
    // Instantiate the chart with the options
    this.chart = new Chart(canvas, {
          type: 'line',
          data: {
            datasets: [dataSets[0], dataSets[1], dataSets[2], dataSets[3]],
            labels: [],
        },
        options: FreqSpectraChartOptions
      });

    const canvas2 = document.getElementById('bciChart') as HTMLCanvasElement;
    const bciDataSets = [];

    Array(this.bciSettings.nChannels).fill(0).map((ch, i) => {
          const temp =  Object.assign({}, bciSpectraDataSet);
          temp.backgroundColor = backgroundColors[i];
          temp.borderColor = borderColors[i];
          temp.label = channelLabels[i];
          temp.data  = Array(10).fill(0);
          bciDataSets.push(temp);
        });

    this.bciChart = new Chart(canvas2, {
          type: 'bar',
          data: {
            datasets: bciDataSets,
            labels: [1,2,3,4,5,6,7,8,9,10],
        },
        options: bciFreqSpectraChartOptions
      });
  }

  ngAfterViewInit(): void {
  }

  ngAfterViewChecked(): void {
    // Check if the data is available to start processing it

    if (this.incomingData.data != null && this.data == null) {
      this.incomingData.data.pipe(samples => this.data = samples);
      this.data.pipe(
        takeUntil(this.destroy),
        bandpassFilter({
          cutoffFrequencies: [this.settings.cutOffLow, this.settings.cutOffHigh],
          nbChannels: this.settings.nChannels }),
        epoch({
          duration: this.settings.duration,
          interval: this.settings.interval,
          samplingRate: this.settings.srate
        }),
        fft({bins: this.settings.bins }),
        sliceFFT([this.settings.sliceFFTLow, this.settings.sliceFFTHigh]),
        catchError(async (err) => console.log(err))
      )
        // Finally after data has been processed, subscribe the component to it
        .subscribe(data => {
          this.addData(data);
          this.addChannelData(data);

        });
      }
  }

  ngOnDestroy(): void {
    this.destroy.next();
  }

  // Add the processed data to the charts
  addData(spectraData: any): void {
    for (let i = 0; i < this.settings.nChannels; i++) {
      // remove old data by setting length to 0
      this.chart.data.datasets[i].data.length = 0;
      spectraData.psd[i].forEach((val: number) => this.chart.data.datasets[i].data.push(val));
      // add labels if they have not been added up until 31 labels
      if (this.chart.data.labels.length < this.settings.maxFreq - 1)
      {
        this.chart.data.labels.length = 0;
        // get the freq labels that are below the maxFreq required
        const freqs  = spectraData.freqs.filter((x: number) => x < this.settings.maxFreq);
        freqs.forEach((val: number) => this.chart.data.labels.push(val));
      }
    }
    this.chart.update();
  }


  addChannelData(spectraData: any): void {
    //console.log('spectraData: ', spectraData);
    let std: string;
    let average: number;

    let counter: number;
    let switcher: number;

    for (let i = 0; i < this.settings.nChannels; i++) {
	      // this.bciChart.data.datasets[i].data.length=0;
	      // spectraData.psd[i].forEach((val: number) => this.bciChart.data.datasets[i].data.push(val));
	      // spectraData.psd[i].forEach(function(val: number) {
	      // this.bciChart.data.datasets[i].data.push(spectraData.psd[i][8]);
	      // console.log('psd[', i, '][8]', spectraData.psd[i][8]);
	      this.freq8[i].shift();
	      this.freq8[i].push(spectraData.psd[i][8]);
	      // console.log('TP9Freq8:     ', this.freq8[i]);
	      this.freq8Avg[i].shift();
	      this.freq8Avg[i].push(this.incomingData.average(this.freq8[i]));
	      // console.log('freq8Avg:     ', this.freq8Avg[i]);
	      this.bciChart.data.datasets[i].data.shift();
	      this.bciChart.data.datasets[i].data.push(this.incomingData.average(this.freq8[i]));
	      console.log('datasets', i, '.data:  ', this.bciChart.data.datasets[i].data);
	      console.log('this.bciChart.data.datasets[i].data:  ',this.bciChart.data.datasets[i].data);
	      average = this.incomingData.average(this.bciChart.data.datasets[i].data);

	      // this.bciChart.data.datasets[0].data.push(this.average(this.freq8));
	      std = this.incomingData.standardDeviation(this.freq8Avg[i]);
	      // study chart make moving chart by time
	        console.log('std',i,': ', std);
	    	console.log('average ',i,':  ',average);
	    	
    }
	 	// display the average as bar chart
	    // console.log('TP9Freq8:     ',this.freq8);
	    // console.log('freq8Avg:  ',this.freq8Avg);
    	this.bciChart.update();

    }

   
    
  
}


