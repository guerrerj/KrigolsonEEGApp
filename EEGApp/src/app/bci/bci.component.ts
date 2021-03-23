import { Component, Input, AfterViewInit, AfterViewChecked,OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
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

import { MessagesService } from '../shared/messages.servce';
import { AuthService } from '../auth/auth.service';
import { AngularFireStorage, AngularFireStorageReference, AngularFireUploadTask } from '@angular/fire/storage';
import { ModalService } from '../service/modal.service';

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
  selectedFreq: number ;
  inputFreq: number;
  selectedElectrode = 'Select Electrode';
  selectedElectrodeIdx: number; //

  readonly destroy = new Subject<void>();
  readonly channelNames = channelNames;

  chart: Chart;
  bciChart: Chart;
  bciChart1: Chart;
  settings: bciSettings;
  bciSettings: bciSettings;
  bciOneSettings: bciSettings;
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
  // positon of the ball for game
  x: number=8;
  y: number= 78;
  radius: number = 8;	
  // gameCanvas:any document.getElementById('gameArea') as HTMLCanvasElement;
  // ctx: any gameCanvas.getContext('2d');


  isRecording = false;
  recordedData = [];
  ref: AngularFireStorageReference;
  task: AngularFireUploadTask;

  user: any;

  constructor(	private incomingData: DataService, 
  				private messagesService: MessagesService, 
  				public auth: AuthService,
  				private afStorage: AngularFireStorage,
  				private modalService: ModalService) {}

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
    // the complete bciChart 
	this.bciSettings = bciGetSettings();
    this.bciSettings.name='Energy Indicator';
    this.bciSettings.nChannels=2;
    this.bciSettings.maxDisplayedFreq =10;
    const bciCanvas = document.getElementById('bciChart') as HTMLCanvasElement;
    const bciDataSets = [];

    Array(this.bciSettings.nChannels).fill(0).map((ch, i) => {
          const temp =  Object.assign({}, bciSpectraDataSet);
          temp.backgroundColor = bciStackedBackgroundColors[i];
          temp.borderColor = bciStackedBackgroundColors[i];
          temp.label = bciFreqLabel[i];
          temp.data  = Array(this.bciSettings.maxDisplayedFreq).fill(0);
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


// bciChart1
    const bciCanvas1 = document.getElementById('bciOneChart') as HTMLCanvasElement;
    const bciDataSets1 = [];


    Array(this.bciSettings.nChannels).fill(0).map((ch, i) => {
          const temp =  Object.assign({}, bciSpectraDataSet);
          temp.backgroundColor = bciStackedBackgroundColors[i];
          temp.borderColor = bciStackedBackgroundColors[i];
          temp.label = bciFreqLabel[i];
          temp.data  = Array(this.settings.maxDisplayedFreq).fill(0);
          bciDataSets1.push(temp);
        });

    this.bciChart1 = new Chart(bciCanvas1, {
          type: 'bar',
          data: {
            datasets: bciDataSets1,
            labels: [],        
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


	this.checkConnection();

	this.auth.getUserState()
      .subscribe( user => {
        this.user = user;
        console.log(user);
      })

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
        	// console.log(data);
          this.addBciData(data);
        });
      }
  }
  		ngOnDestroy(): void {
    	this.destroy.next();
  }
 

  
  addBciData(spectraData: any): void {
    console.log('spectraData: ', spectraData);
    let tenAvg: number;
    let std: number;
    let avgOfTenAvg:number;
    let jump:number;
    // console.log('this.selectedFreq:',  this.selectedFreq, 'this.selectedElectrodeIdx: ' ,this.selectedElectrodeIdx);

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
	      this.chart.update();  
	      
	       avgOfTenAvg = this.incomingData.average(this.AvgfreqOfChannel[i]);
		   this.avgOfTenAvgList.shift();
		   this.avgOfTenAvgList.push(this.incomingData.average(this.AvgfreqOfChannel[i]));
	      if(this.selectedElectrodeIdx==i){
	      		if (tenAvg<=avgOfTenAvg){
	      			//second chart ten average , base + increment
	      			this.bciChart.data.datasets[0].data.shift();
	      			this.bciChart.data.datasets[0].data.push(this.incomingData.average(this.freqOfChannel[this.selectedElectrodeIdx]));
	      			this.bciChart.data.datasets[1].data.shift();
	      			this.bciChart.data.datasets[1].data.push(0);
	      			//third chart input , only one bar 
	      			this.bciChart1.data.datasets[0].data.length = 0;
    				this.bciChart1.data.datasets[1].data.length = 0;
    				this.bciChart1.data.datasets[0].data.shift();
	      			this.bciChart1.data.datasets[0].data.push(this.incomingData.average(this.freqOfChannel[this.selectedElectrodeIdx]));
	      			this.bciChart1.data.datasets[1].data.shift();
	      			this.bciChart1.data.datasets[1].data.push(0);
	      		}
	      		if (tenAvg>avgOfTenAvg){
	      			this.bciChart.data.datasets[0].data.shift();
	      			this.bciChart.data.datasets[0].data.push(this.incomingData.average(this.freqOfChannel[this.selectedElectrodeIdx]));
	      			this.bciChart.data.datasets[1].data.shift();
	      			this.bciChart.data.datasets[1].data.push(tenAvg-avgOfTenAvg);
	      			// third chart input, only one bar
					this.bciChart1.data.datasets[0].data.length = 0;
    				this.bciChart1.data.datasets[1].data.length = 0;
    				this.bciChart1.data.datasets[0].data.shift();
	      			this.bciChart1.data.datasets[0].data.push(this.incomingData.average(this.freqOfChannel[this.selectedElectrodeIdx]));
	      			this.bciChart1.data.datasets[1].data.shift();
	      			this.bciChart1.data.datasets[1].data.push(tenAvg-avgOfTenAvg);
    				// this.bciOneChart.update();
	      		}
		        std = + this.incomingData.standardDeviation(this.AvgfreqOfChannel[i]);
		        this.stdList.shift();
		        this.stdList.push(std);
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

			    if (this.isRecording){
			    	this.recordedData.push(spectraData.psd[this.selectedElectrodeIdx][this.selectedFreq]); //inside if(this.selectedElectrodeIdx==i)
			    	console.log(this.recordedData);
			    }
	      }  	
    }
    	this.bciChart.update();
    	this.bciChart1.update();
    	this.playGame();
    }

  link = document.createElement('a');
  startRecord():void{
  	if (this.data === undefined){
      // Need to ensure that device is connected and data is present
      this.messagesService.setWarning('You need to connect your muse to the web app before recording!');
      return;
    }
    if ( Number.isNaN(this.selectedFreq) || this.selectedElectrode.includes('Select')){
        this.messagesService.setWarning('Then choose an electrode and a frequency band !');
      return;
    }
    this.isRecording =true;
  }  


  stopRecord(modalID: string):void{  
  	let csvData = this.selectedElectrode + ',' + this.recordedData.join(',') + '\n';
  	if(this.recordedData && this.isRecording==true){
	  	this.link.href = URL.createObjectURL(new Blob([csvData],{type: 'text/cvs'}));
	  	this.link.innerText = 'user: ' + this.user.displayName;
	  	document.body.appendChild(this.link);
	  	this.link.download = 'recording.csv';	
	    this.link.click();
  	}


   this.openModal(modalID);

   	const current = new Date();
	current.setHours(0)
	current.setMinutes(0)
	current.setSeconds(0)
	current.setMilliseconds(0)
	const timestamp = current.getTime();

    const id = this.user.displayName+timestamp+Math.random().toString(36).substring(2);
    this.ref = this.afStorage.ref(id);
    this.task = this.ref.put(new Blob([csvData],{type: 'text/cvs'}));

    this.recordedData.length=0;
    this.isRecording =false;
    document.body.removeChild(this.link);
  	
  }


  openModal(modalID: string) {
        this.modalService.open(modalID);
    }

  closeModal(modalID: string) {
        this.modalService.close(modalID);
    }


  setElectrode(val: string): void{
    this.selectedElectrode = val;
    this.selectedElectrodeIdx = (val.toLowerCase() === 'all') ? -1 : bciChannelLabels.indexOf(val);
    // console.log('electrodeIdx:',this.selectedElectrodeIdx);
  }

  // setFrequency(val: any): any {
  //   this.selectedFreq = +val;
  //   val==8? this.displayedFreq = 'Freq 8' :  (val==9 ? this.displayedFreq= 'Freq 9' :  
  //   (val ==10 ? this.displayedFreq = 'Freq 10' : ( val==11 ? this.displayedFreq='Freq 11' :  this.displayedFreq = 'Freq 12')));
  //   // console.log('selectedFreq: ' ,this.selectedFreq, 'displayedFreq: ', this.displayedFreq);
  // }

  setFrequency (val:number):void {
  	if ( !Number.isNaN(val) ){
  		if (Number(val)>0 && Number(val)<31 ){
	  		this.inputFreq = Number(val);
	  		this.selectedFreq=this.inputFreq;
	  		// console.log(typeof(this.inputFreq),this.inputFreq);
	  		return
  		}
  		// console.log(typeof(val),val);
  		return
  	} 	
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

  checkConnection():void {
  		if ( Number.isNaN(this.selectedFreq) || this.selectedElectrode.includes('Select')){
        this.messagesService.setWarning('Please connect your muse EEG then choose an electrode and a frequency band !');
      return;
    }
  }

  checkWarning(): boolean {
    return this.messagesService.isWarning;
  }

  get warningMessage(): string {
    return this.messagesService.warningMessage;
  }

  resetWarning(): void {
    this.messagesService.resetWarning();
  }
  


}


