import { DataService } from './../shared/dataService';
import { Component, OnInit, Input, AfterViewChecked, OnDestroy } from '@angular/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { EEGSample, channelNames } from 'muse-js';
import { faRecordVinyl } from '@fortawesome/free-solid-svg-icons';
import { getSettings, ISettings, channelLabels, FreqExperChartOptions, orderedBandLabels, bandsDataSet, FreqCompareAvgChartOptions } from './../shared/chartOptions';
import { takeUntil } from 'rxjs/operators';
import { catchError } from 'rxjs/operators';
import { Chart} from 'chart.js';
import { backgroundColors, borderColors, spectraDataSet } from '../shared/chartOptions';
import {
  bandpassFilter,
  epoch,
  fft,
  powerByBand
} from '@neurosity/pipes';
import { MessagesService } from '../shared/messages.servce';

@Component({
  selector: 'app-frequency-experiments',
  templateUrl: './frequency-experiments.component.html',
  styleUrls: ['./frequency-experiments.component.less']
})
export class FrequencyExperimentsComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() data: Observable<EEGSample>;

  faRecordVinyl = faRecordVinyl;

  isRecording1 = false;
  isRecording2 = false;
  shouldSaveToCsv = false;
  timeToRecord = 60; // amount of time to record (seconds)
  settings: ISettings;
  displayedBand = 'Select Frequency Band'; // which band to display
  selectedBand: string;
  selectedElectrode = 'Select Electrode';
  selectedElectrodeIdx = 1; // which electrode to display
  chart1: any;
  chart2: any;
  avgChart: any;
  isSamples1: boolean;
  shouldCompare: boolean;

  readonly destroy = new Subject<void>();
  readonly freqBands = 4;
  readonly numAvgs = 2;
  private samples1: any;
  private samples2: any;
  private cleanedSamples1: any;
  private cleanedSamples2: any;
  private timeoutVar: any;

  private subscription: Subscription;

  constructor(private inDataService: DataService, private messagesService: MessagesService) { }

  ngOnInit(): void {
    this.shouldCompare = false;
    this.samples1 = [];
    this.samples2 = [];
    this.cleanedSamples1 = [];
    this.cleanedSamples2 = [];
    // Update settings for charts
    this.settings = getSettings();
    this.settings.interval = 100; // get new data every 100 mss
    this.settings.name = 'Frequency Experiments';
    // get drawing canvas elements
    const canvas1 = document.getElementById('freqChartExperiments1') as HTMLCanvasElement;
    const canvas2 = document.getElementById('freqChartExperiments2') as HTMLCanvasElement;
    const avgCanvas = document.getElementById('compareAvgChart') as HTMLCanvasElement;
    // Prepare dummy data
    const dataSet = Object.assign({}, spectraDataSet);
    dataSet.backgroundColor = backgroundColors[0];
    dataSet.borderColor = borderColors[0];
    dataSet.data  = Array(this.settings.maxFreq).fill(0);

    const compareDataSet = [];
    for( let i = 0; i < 2; i++){
      const temp = {...spectraDataSet};
      temp.backgroundColor = backgroundColors[i];
      temp.borderColor = borderColors[i];
      temp.data = Array(this.numAvgs).fill(0);
      temp.label = (i + 1).toString();
      compareDataSet.push(temp);
    }


    // Initialize charts with empty data
    this.chart1 = new Chart(canvas1, {
      type: 'line',
      data: {
        datasets: [{...dataSet}],
    },
      options: FreqExperChartOptions
    });

    dataSet.backgroundColor = backgroundColors[1];
    dataSet.borderColor = borderColors[1];
    this.chart2 = new Chart(canvas2, {
      type: 'line',
      data: {
        datasets: [{...dataSet}],
    },
      options: FreqExperChartOptions
    });

    this.avgChart = new Chart(avgCanvas, {
      type: 'bar',
      data: {
        datasets: compareDataSet,
      },
      options: FreqCompareAvgChartOptions
    });

  }

  ngAfterViewChecked(): void {
    // Check for incoming data
    if (this.inDataService.data != null && this.data == null)
    {
      this.inDataService.data.pipe(samples => this.data = samples);
    }
  }

  startRecording(isSamples1 = true): void {
    if (this.data === undefined){
      // Need to ensure that device is connected and data is present
      this.messagesService.setWarning('You need to connect your muse to the web app before recording!');
      return;
    }

    if (this.displayedBand.includes('Select') || this.selectedElectrode.includes('Select')){
        // Need to tell user to fill in options first if they haven't done so
        this.messagesService.setWarning('You need to choose an electrode and a frequency band before recording!');
        return;
    }

    if (this.isRecording1 && !isSamples1 || this.isRecording2 && isSamples1) {
      this.messagesService.setWarning('You can only record one set of data at a time.');
      return;
    }

    this.isSamples1 = isSamples1;
    (this.isSamples1) ? this.isRecording1 = true : this.isRecording2 = true;
    if (this.shouldCompare){
      this.samples1 = [];
      this.samples2 = [];
      this.shouldCompare = false;
    }
    this.subscription =  this.data.pipe(
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
      powerByBand(),
      catchError(async (err) => console.log(err))
    ).subscribe(sample => {
      (this.isSamples1) ?  this.samples1.push(sample) : this.samples2.push(sample);
    });

    // Set callback to end subscription after timeToRecord is finished
    this.timeoutVar = setTimeout(() => {
      this.stopRecording();
    }, this.timeToRecord * 1000);
  }

  // Used to end subsription after recording ends
  stopRecording(): void {
    this.displayCharts();
    clearTimeout(this.timeoutVar); // Clear timeout incase it was called from ui
    (this.isSamples1) ? this.isRecording1 = false : this.isRecording2 = false;
    this.subscription.unsubscribe();
    if (this.shouldSaveToCsv) // Save if it is decided to save
    {
       this.saveToCsv();
    }
    if (this.samples1.length > 0 && this.samples2.length > 0 ){
     this.populateComparisonChart();
    }
  }

  populateComparisonChart(): void {
    this.shouldCompare = true;
    for (let i = 0; i < 2; i++){
      this.avgChart.data.datasets[i].data.length = 0;
      this.avgChart.data.datasets[i].data.push( (i === 0) ?  this.inDataService.average(this.cleanedSamples1):
      this.inDataService.average(this.cleanedSamples2));
    }
    this.avgChart.update();
  }

  // Used to update the charts after recording is finished
  displayCharts(): void {
    const dataSet = this.getcleanedSampleValues();
    if (this.isSamples1){
      this.chart1.data.datasets[0].data.length = 0;
      this.chart1.data.labels.length = 0;
      dataSet.forEach((val: number) => this.chart1.data.datasets[0].data.push(val));
      dataSet.forEach(( _, idx) => this.chart1.data.labels.push(idx + 1));

      // Update chart title with time changed to seconds
      this.chart1.options.title.text = this.capitalize(this.selectedBand) + ' Power Over ' + this.timeToRecord + ' Seconds';
      this.chart1.update();
      // Update cleaned samples data
      this.cleanedSamples1 = dataSet;
    }
    else {
      this.chart2.data.datasets[0].data.length = 0;
      this.chart2.data.labels.length = 0;
      dataSet.forEach((val: number ) => this.chart2.data.datasets[0].data.push(val));
      dataSet.forEach(( _, idx) => this.chart2.data.labels.push(idx + 1));

      this.chart2.options.title.text = this.capitalize(this.selectedBand) + ' Power Over ' + this.timeToRecord + ' Seconds';
      this.chart2.update();
      // Update cleaned samples data
      this.cleanedSamples2 = dataSet;
    }
  }

  // Used to get a specific set of data from the samples as a number array
  getcleanedSampleValues(band = ''): number[] {
    const cleanedDataSet = [];
    // In case all electrodes were selected
    const all = -1;
    if (this.isSamples1) {
         // push samples 1 data
         this.samples1.forEach((samp: any) =>  cleanedDataSet.push((this.selectedElectrodeIdx === all) ?
               // Get average value in case of all electrodes are selected
               this.inDataService.average(samp[(band.length > 1) ? band : this.selectedBand])          :
               samp[(band.length > 1) ? band : this.selectedBand][this.selectedElectrodeIdx]));
    }else{
        // push samples 2 data
        this.samples2.forEach((samp: any) => cleanedDataSet.push((this.selectedElectrodeIdx === all) ?
                // Get average value in case all electrodes are selected
                this.inDataService.average(samp[(band.length > 1) ? band : this.selectedBand ]) :
                samp[(band.length > 1) ? band : this.selectedBand ][this.selectedElectrodeIdx]
          ));

    }
    return cleanedDataSet;
  }

  // Used to show sample1 count number to user
  get sample1Count(): number {
    return this.samples1.length;
  }

  // Used to show sample2 count number to user
  get sample2Count(): number{
    return this.samples2.length;
  }

  // Used to set the chosen electrode for chart
  setElectrode(val: string): void{
    this.selectedElectrode = val;
    // update electrode index used for
    this.selectedElectrodeIdx = (val.toLowerCase() === 'all') ? -1 : channelLabels.indexOf(val);
  }

  // Used to set the chosen frequency band by user
  setFrequencyBand(val: string): void {
    this.selectedBand = val.toLowerCase();
    this.displayedBand = val;
  }

  // Let the user set the amount of time to record data for
  setTimeToRecord(val: number): void {
    if (isNaN(val)) {
      return;
    }
    this.timeToRecord = val;
  }

  // Meant for capitalizing the first letter of a word
  capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Used to set whether the recordings should be saved to csv
  setSaveCSV(csvElem: any): void{
    if (csvElem.checked){
      this.shouldSaveToCsv = true;
      csvElem.checked = true;
    }else{
      this.shouldSaveToCsv = false;
      csvElem.checked = false;
    }
  }

  // Used to save a set of samples to csv
  saveToCsv(): void {
    const samples = [];
    orderedBandLabels.forEach(nam => samples.push(this.getcleanedSampleValues(nam.toLowerCase())));
    const a = document.createElement('a');
    let csvData = orderedBandLabels[0] + ',' + samples[0].join(',') + '\n';
    csvData += orderedBandLabels[1] + ',' + samples[1].join(',') + '\n';
    csvData += orderedBandLabels[2] + ',' + samples[2].join(',') + '\n';
    csvData += orderedBandLabels[3] + ',' + samples[3].join(',') + '\n';
    const file = new Blob([csvData], { type: 'text/csv' });
    a.href = URL.createObjectURL(file);
    document.body.appendChild(a);
    a.download = 'recording.csv';
    a.click();
    document.body.removeChild(a);
  }

  ngOnDestroy(): void {
    this.destroy.next();
  }

  // Used to check if there are any messages to display
  checkWarning(): boolean {
    return this.messagesService.isWarning;
  }

  // Clear messages after they have been displayed
  resetWarning(): void {
    this.messagesService.resetWarning();
  }

  // Used to get the warning message
  get getWarningMessage(): string {
    return this.messagesService.warningMessage;
  }
}
