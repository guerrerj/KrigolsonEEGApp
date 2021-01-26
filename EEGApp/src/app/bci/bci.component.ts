import { Component, Input, AfterViewInit, AfterViewChecked,OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil,catchError } from 'rxjs/operators';
import { channelNames, EEGSample } from 'muse-js';
import { Chart } from 'chart.js';
import { DataService } from '../shared/dataService';
import { bciBackgroundColors, bciBorderColors, bciStackedBackgroundColors, bciChannelLabels,bciFreqLabel, bciFreqStackedChartOptions,
			bciChannelFreqStackedChartOptions, bciGetSettings, bciSettings, bciSpectraDataSet, } from '../shared/bciChartOptions';
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
  templateUrl: 'bci.component.html',
  styleUrls: ['bci.component.less']
})

export class BciComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked {

  @Input() data: Observable<EEGSample>;

  displayedFreq = 'Select Frequency';
  selectedFreq: number;
  selectedElectrode = 'Select Electrode';
  selectedElectrodeIdx = 1; //
  isWarning = false;
  warningMessage: string;

  readonly destroy = new Subject<void>();
  readonly channelNames = channelNames;

  chart: Chart;
  bciChart: Chart;
  bciBelowAvgChart: Chart;
  settings: bciSettings;
  bciSettings: bciSettings;
  bciBelowAvgSettings: bciSettings;
  freqOfChannel: Array<Array<number>>; // take 10 subscribed values for setings.nChannels at one frequency
  AvgfreqOfChannel: Array<Array<number>>; // 10 respective avg of above collected 10 values
  avgOfTenAvgList=Array(10).fill(0);      // same as above , use as a temp
  stdList=Array(10).fill(0);  //10 std values of the 10 avg values
  onCounter: number=0;    
  offCounter:number=0;  
  switcher: number=0;  
  increment = '2 Std';
  numOfStd:number=2;
  comparison = 'Compare last 4';
  numOfComparison: number=4;

  // x: Observable<number>=10;
  x:number=8;
  y:number= 78;
  radius: number = 8;	
  
  constructor(private incomingData: DataService) {}

  ngOnInit(): void {
    // Get settings for the charts
    this.settings = bciGetSettings();

    const canvas = document.getElementById('freqChart') as HTMLCanvasElement;
    const dataSets = [];

    Array(this.settings.nChannels).fill(0).map((ch, i) => {
          const temp =  Object.assign({}, bciSpectraDataSet);
          temp.backgroundColor = bciBackgroundColors[i];
          temp.borderColor = bciBorderColors[i];
          temp.label = bciChannelLabels[i];
          temp.data  = Array(this.settings.maxDisplayedFreq).fill(0);
          dataSets.push(temp);
        });

    this.chart = new Chart(canvas, {
          type: 'bar',
          data: {
            datasets: dataSets,
            labels: [1,2,3,4,5,6,7,8,9,10],
        },
         options: bciFreqStackedChartOptions
      });


    this.freqOfChannel = Array(4).fill(0).map(ch => new Array(10).fill(0));
    this.AvgfreqOfChannel = Array(4).fill(0).map(ch => new Array(10).fill(0));
    // this.TP9Freq8 = Array(2).fill(0).map(ch => new Array(10).fill(0));
    // the complete bci chart 
	this.bciSettings = bciGetSettings();
    this.bciSettings.name='Energy Indicator';
    this.bciSettings.nChannels=2;
    const bciCanvas = document.getElementById('bciChart') as HTMLCanvasElement;
    const bciDataSets = [];

    Array(this.bciSettings.nChannels).fill(0).map((ch, i) => {
          const temp =  Object.assign({}, bciSpectraDataSet);
          temp.backgroundColor = bciStackedBackgroundColors[i];
          temp.borderColor = bciStackedBackgroundColors[i];
          temp.label = bciFreqLabel[i];
          temp.data  = Array(10).fill(0);
          bciDataSets.push(temp);
        });

    this.bciChart = new Chart(bciCanvas, {
          type: 'bar',
          data: {
            datasets: bciDataSets,
            labels: [1,2,3,4,5,6,7,8,9,10],        
        },
         options: bciChannelFreqStackedChartOptions
      });

    this.bciBelowAvgSettings = bciGetSettings();
    this.bciBelowAvgSettings.name='BCI Control Bar Indicator';
    const bciBelowAvgCanvas = document.getElementById('bciBelowAvg') as HTMLCanvasElement;
    const bciBelowAvgDataSets = [];
    this.bciBelowAvgSettings.nChannels=2;

    Array(this.bciBelowAvgSettings.nChannels).fill(0).map((ch,i)=>{
    	const temp = Object.assign({}, bciSpectraDataSet);
    	temp.backgroundColor = bciBackgroundColors[i];
    	temp.borderColor = bciBorderColors[i];
    	temp.label = bciChannelLabels[i];
    	temp.data = Array(10).fill(0);
    	bciBelowAvgDataSets.push(temp);
    });
    this.bciBelowAvgChart = new Chart (bciBelowAvgCanvas,{
    	type:'bar',
    	data:{
    		datasets: bciDataSets,
    		labels:[],
    	},
    	options: bciChannelFreqStackedChartOptions
    });

	const gameCanvas=document.getElementById('gameArea') as HTMLCanvasElement;
    const ctx = gameCanvas.getContext('2d');
     ctx.fillStyle="black";
		ctx.fillRect(0,0, gameCanvas.width, gameCanvas.height);
		ctx.fillStyle="red";
   	ctx.beginPath();
	 ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
	 ctx.fill();

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
          this.addBciData(data);

        });
      }
  }
  		ngOnDestroy(): void {
    	this.destroy.next();
  }
 


  addBciData(spectraData: any): void {
     // console.log('spectraData: ', spectraData);
    let tenAvg: number;
    let std: number;
    let avgOfTenAvg:number;
    let jump:number;
 
    if (this.data === undefined){
      this.isWarning = true;
      this.warningMessage = 'You need to connect your muse to the web app!';
      return;
    }
    if (this.displayedFreq.includes('Select') || this.selectedElectrode.includes('Select')){
        this.isWarning = true;
        this.warningMessage = 'Please choose an electrode and a frequency band !';
        return;
    }

    console.log('this.selectedFreq:',  this.selectedFreq, 'this.selectedElectrodeIdx: ' ,this.selectedElectrodeIdx);

    for (let i = 0; i < this.settings.nChannels; i++) {
	      this.freqOfChannel[i].shift();
	      this.freqOfChannel[i].push(spectraData.psd[i][this.selectedFreq]);
	      // console.log('spectraData.psd[', i, '][',this.selectedFreq,']', spectraData.psd[i][this.selectedFreq]);
	      // console.log('freqOfChannel[', i, '][',this.selectedFreq,']', this.freqOfChannel[i][9]);
	      tenAvg=this.incomingData.average(this.freqOfChannel[i]);
	      this.AvgfreqOfChannel[i].shift();
	      this.AvgfreqOfChannel[i].push(this.incomingData.average(this.freqOfChannel[i]));
	      //fill in the data for all 4 channel , ie. 1st chart
	      this.chart.data.datasets[i].data.shift();
	      this.chart.data.datasets[i].data.push(this.incomingData.average(this.freqOfChannel[i]));
	      avgOfTenAvg = this.incomingData.average(this.AvgfreqOfChannel[i]);
	      this.avgOfTenAvgList.shift();
	      this.avgOfTenAvgList.push(this.incomingData.average(this.AvgfreqOfChannel[i]));
	      std = + this.incomingData.standardDeviation(this.AvgfreqOfChannel[i]);
	      this.stdList.shift();
	      this.stdList.push(std);
	      if(this.selectedElectrodeIdx==i){
	      		if (tenAvg<=avgOfTenAvg){
	      			this.bciChart.data.datasets[0].data.shift()
	      			this.bciChart.data.datasets[0].data.push(this.incomingData.average(this.freqOfChannel[this.selectedElectrodeIdx]));
	      			this.bciChart.data.datasets[1].data.shift();
	      			this.bciChart.data.datasets[1].data.push(0);
	      		}
	      		if (tenAvg>avgOfTenAvg){
	      			this.bciChart.data.datasets[0].data.shift();
	      			this.bciChart.data.datasets[0].data.push(this.incomingData.average(this.freqOfChannel[this.selectedElectrodeIdx]));
	      			this.bciChart.data.datasets[1].data.shift();
	      			this.bciChart.data.datasets[1].data.push(tenAvg-avgOfTenAvg);
	      		}
	      		for (let j=10-this.numOfComparison; j<10; j++){
	      			let bar=<number>this.AvgfreqOfChannel[this.selectedElectrodeIdx][j];
	      			let avgOfTenBar=<number>this.avgOfTenAvgList[j];
	      			jump=bar-avgOfTenBar;
	      	      	if(jump > this.stdList[j] * this.numOfStd){
	      	      	 	this.onCounter++;
	      	      	}
	      	      	if(jump < 0 && Math.abs(jump) > this.numOfStd *this.stdList[j] ){
	      	      		this.offCounter++;
	      	      	}
	      		}
			    if (this.offCounter>=this.numOfComparison && this.switcher==1){
			      		this.switcher=0; 
			    }
			    if (this.onCounter>=this.numOfComparison && this.switcher==0){
			      	   this.switcher=1;
			    }
			    console.log('this.onCounter: ',this.onCounter, 'this.offCounter: ', this.offCounter,  'switcher: ', this.switcher);
			    this.onCounter=0;
			    this.offCounter=0;  
	      }  	
    }
	    this.chart.update();
    	this.bciChart.update();
    	this.bciBelowAvgChart.update();
    	this.playGame();
    }

  setElectrode(val: string): void{
    this.selectedElectrode = val;
    this.selectedElectrodeIdx = (val.toLowerCase() === 'all') ? -1 : bciChannelLabels.indexOf(val);
    // console.log('electrodeIdx:',this.selectedElectrodeIdx);
  }
  setFrequency(val: any): any {
    this.selectedFreq = +val;
    val==0? this.displayedFreq = 'Freq 8' :  (val==1 ? this.displayedFreq= 'Freq 9' :  
    (val ==2 ? this.displayedFreq = 'Freq 10' : ( val==3 ? this.displayedFreq='Freq 11' : this.displayedFreq = 'Freq 12')));
    // console.log('selectedFreq: ' ,this.selectedFreq, 'displayedFreq: ', this.displayedFreq);
  }

  setNumOfStd(val:any):any{
  	this.numOfStd = val;
  	// console.log('numOfStd :' , this.numOfStd);
  	val==0? this.increment = val+' Std': (val==1? this.increment=val+' Std' : (val==2? this.increment=val+' Std': this.increment=val+' Std'));
  }
  setComparison(val: any): any {
  	this.numOfComparison = val;
  	val== 5? this.comparison = 'Compare last '+ val: (val==4? this.comparison='Compare last '+val : this.comparison= 'Compare last '+val);
  	// console.log('this.numOfComparison: ' , this.numOfComparison);
  }

  playGame(){ 
  	const gameCanvas=document.getElementById('gameArea') as HTMLCanvasElement;
    const ctx = gameCanvas.getContext('2d');
    ctx.fillStyle="black";
	ctx.fillRect(0,0, gameCanvas.width, gameCanvas.height);
  	if(this.switcher==1){
  		this.x+=2;
  		ctx.fillStyle="green";
  	}
  	if(this.x>308){
  		this.x=-8;
  	}
  	if(this.switcher==0){
  		ctx.fillStyle="red";
  	}
  	 ctx.beginPath();
	 ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
	 ctx.fill();
  }



}


