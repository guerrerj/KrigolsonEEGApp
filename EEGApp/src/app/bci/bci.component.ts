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
			bciFreqStackedChartOptions,bciGetSettings, bciSettings, bciSpectraDataSet, } from '../shared/bciChartOptions';
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

  // settings: ISettings;
  settings: bciSettings;
  bciSettings: bciSettings;
  bciBelowAvgSettings: bciSettings;

  readonly destroy = new Subject<void>();
  readonly channelNames = channelNames;

  chart: Chart;
  bciChart: Chart;
  bciBelowAvgChart: Chart;

  freq8: Array<Array<number>>;
  freq8Avg: Array<Array<number>>;
  // TP9Freq8: Array<Array<number>>;
  
  constructor(private incomingData: DataService) {}

  ngOnInit(): void {
    // Get settings for the charts
    this.settings = bciGetSettings();
    this.settings.name = 'Alpha Channel Signals(8-12)';

    const canvas = document.getElementById('freqChart') as HTMLCanvasElement;
    const dataSets = [];

    Array(this.settings.nChannels).fill(0).map((ch, i) => {
          const temp =  Object.assign({}, spectraDataSet);
          temp.backgroundColor = backgroundColors[i];
          temp.borderColor = borderColors[i];
          temp.label = channelLabels[i];
          temp.data  = Array(this.settings.maxFreq).fill(0);
          // temp.data  = Array(10).fill(0);
          dataSets.push(temp);
        });
    this.chart = new Chart(canvas, {
          type: 'bar',
          data: {
            datasets: [dataSets[0],dataSets[1],dataSets[2],dataSets[3]],
            labels: [8,9,10,11,12],
        },
         options: bciFreqSpectraChartOptions
      });
//recover com
// this.bciSettings = getSettings();
//     this.bciSettings.name='BCI Control Bar';

//     const bciCanvas2 = document.getElementById('bciChart') as HTMLCanvasElement;
//     const bciDataSets = [];

//     Array(this.bciSettings.nChannels).fill(0).map((ch, i) => {
//           const temp =  Object.assign({}, bciSpectraDataSet);
//           temp.backgroundColor = backgroundColors[i];
//           temp.borderColor = borderColors[i];
//           temp.label = bciChannelLabels[i];
//           temp.data  = Array(10).fill(0);
//           bciDataSets.push(temp);
//         });

//     this.bciChart = new Chart(bciCanvas2, {
//           type: 'bar',
//           data: {
//             datasets: bciDataSets,
//             labels: [1,2,3,4,5,6,7,8,9,10],
            
//         },
//         // options: bciFreqSpectraChartOptions
//       });

    this.freq8 = Array(4).fill(0).map(ch => new Array(10).fill(0));
    this.freq8Avg = Array(4).fill(0).map(ch => new Array(10).fill(0));
    // this.TP9Freq8 = Array(2).fill(0).map(ch => new Array(10).fill(0));
    // the complete bci chart 
	this.bciSettings = getSettings();
    this.bciSettings.name='BCI Control Bar';

    const bciCanvas = document.getElementById('bciChart') as HTMLCanvasElement;
    const bciDataSets = [];

    Array(this.bciSettings.nChannels).fill(0).map((ch, i) => {
          const temp =  Object.assign({}, bciSpectraDataSet);
          temp.backgroundColor = backgroundColors[i];
          temp.borderColor = borderColors[i];
          temp.label = bciChannelLabels[i];
          temp.data  = Array(10).fill(0);
          bciDataSets.push(temp);
        });

    this.bciChart = new Chart(bciCanvas, {
          type: 'bar',
          data: {
            datasets: bciDataSets,
            labels: [1,2,3,4,5,6,7,8,9,10],
            
        },
        // options: bciFreqSpectraChartOptions
      });

    //the bci color changing chart
    this.bciBelowAvgSettings = getSettings();
    this.bciBelowAvgSettings.name='BCI Control Bar Indicator';
    const bciBelowAvgCanvas = document.getElementById('bciBelowAvg') as HTMLCanvasElement;
    const bciBelowAvgDataSets = [];

    Array(2).fill(0).map((ch,i)=>{
    	const temp = Object.assign({}, bciSpectraDataSet);
    	temp.backgroundColor = backgroundColors[i];
    	temp.borderColor = borderColors[i];
    	temp.label = bciChannelLabels[i];
    	temp.data = Array(10).fill(0);
    	bciBelowAvgDataSets.push(temp);
    });
    this.bciBelowAvgChart = new Chart (bciBelowAvgCanvas,{
    	type:'bar',
    	data:{
    		datasets: bciDataSets,
    		labels:[1,2,3,4,5,6,7,8,9,10],
    	},
    	options: bciFreqStackedChartOptions
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

 	
 
  avgOfTenAvgList=Array(5).fill(0);
  stdList=Array(5).fill(0); 
  onCounter: number=0;
  offCounter:number=0;
  switcher: number=0;

  addChannelData(spectraData: any): void {
    //console.log('spectraData: ', spectraData);
    let tenAvg: number;
    let std: number;
    let avgOfTenAvg:number;
    let jump:number;
    
    for (let i = 0; i < this.settings.nChannels; i++) {
	      // spectraData.psd[i].forEach((val: number) => this.bciChart.data.datasets[i].data.push(val));
	      // spectraData.psd[i].forEach(function(val: number) {
	      // this.bciChart.data.datasets[i].data.push(spectraData.psd[i][8]);
	      console.log('psd[', i, '][8]', spectraData.psd[i][8]);
	      this.freq8[i].shift();
	      this.freq8[i].push(spectraData.psd[i][8]);
	      console.log('TP9Freq8:     ', this.freq8[i]);
	      tenAvg=this.incomingData.average(this.freq8[i]);
	      this.freq8Avg[i].shift();
	      this.freq8Avg[i].push(tenAvg);
	      console.log('freq8Avg:     ', this.freq8Avg[i]);
	      this.chart.data.datasets[i].data.shift();
	      this.chart.data.datasets[i].data.push(tenAvg);
	      console.log('this.bciChart.data.datasets[i].data:  ',this.bciChart.data.datasets[i].data);

	      avgOfTenAvg= this.incomingData.average(this.freq8Avg[i]);
	      this.avgOfTenAvgList.shift();
	      this.avgOfTenAvgList.push(avgOfTenAvg);
	      // avgOfTenAvg = this.incomingData.average(this.bciChart.data.datasets[i].data);
	      std = + this.incomingData.standardDeviation(this.freq8Avg[i]);
	      this.stdList.shift();
	      this.stdList.push(std);
	   
	      console.log('avgOfTenAvgList:  ',this.avgOfTenAvgList);
	      console.log('freq8Avg[i]:'  ,this.freq8Avg[i]);
	      console.log('stdList:  ',this.stdList);

	      for (let j=0; j<5; j++){
	      	let a=<number>this.freq8Avg[i][j+5];
	      	let b=<number>this.avgOfTenAvgList[j];
	      	jump=a-b;
	      
	      	      if(jump>this.stdList[j]){
	      	      	 this.onCounter++;
	      	      }
	      	      if(jump<0 && Math.abs(jump)>2*this.stdList[j]){
	      	      	this.offCounter++;
	      	      }
	      	      this.onCounter>this.offCounter ? this.switcher=1: this.switcher=0;
	      	console.log('jump: ', jump, 'freq8Avg[i][j+5]:',this.freq8Avg[i][j+5],'avgOfTenAvgList[j]: ',this.avgOfTenAvgList[j]);
	      	console.log('std',i,': ', this.stdList[j]);
	      }
	      // if (this.offCounter>4 && this.switcher==1){
	      // 		this.switcher=0;
	      // 	}

	      // if (this.onCounter>4 && this.switcher==0){
	      // 	   this.switcher=1;
	      // }
	      console.log('this.onCounter: ',this.onCounter, 'this.offCounter: ', this.offCounter,  'switcher: ', this.switcher);
	
	      this.onCounter=0;
	      this.offCounter=0;  

	      if (i==0){
	      		if (tenAvg<avgOfTenAvg){
	      			// this.bciChart.data.datasets[0].data.shift()
	      			// this.bciChart.data.datasets[0].data.push(tenAvg);
	      		}
	      		if (tenAvg>avgOfTenAvg){
	      			// this.bciChart.data.datasets[0].data.shift();
	      			// this.bciChart.data.datasets[0].data.push(avgOfTenAvg);
	      			// this.bciChart.data.datasets[1].data.shift();
	      			// this.bciChart.data.datasets[1].data.push(tenAvg-avgOfTenAvg);
	      		}

	      }
	      // this.bciChart.data.datasets[0].data.push(this.average(this.freq8));
	     
	      // study chart make moving chart by time
	      
	    	// console.log('average ',i,':  ',average);
	    	
    }
	 	// display the average as bar chart
	    // console.log('TP9Freq8:     ',this.freq8);
	    // console.log('freq8Avg:  ',this.freq8Avg);
	    this.chart.update();
    	this.bciChart.update();
    	this.bciBelowAvgChart.update();

    }

   
    
  
}


