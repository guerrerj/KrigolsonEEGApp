import { DataService } from './../shared/dataService';
import { Component, OnInit, Input, AfterViewChecked, OnDestroy } from '@angular/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { EEGSample, channelNames } from 'muse-js';
import { faRecordVinyl } from '@fortawesome/free-solid-svg-icons';
import { getSettings, ISettings, channelLabels, FreqExperChartOptions, orderedBandLabels } from './../shared/chartOptions';
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
  isSamples1: boolean;

  isWarning = false;
  warningMessage: string;

  readonly destroy = new Subject<void>();
  readonly freqBands = 4;
  private samples1: any;
  private samples2: any;

  private subscription: Subscription;

  constructor(private incomingData: DataService) { }

  ngOnInit(): void {
    this.settings = getSettings();
    this.settings.interval = 200; // get new data every 200 ms
    this.settings.name = 'Frequency Experiments';
    const canvas1 = document.getElementById('freqChartExperiments1') as HTMLCanvasElement;
    const canvas2 = document.getElementById('freqChartExperiments2') as HTMLCanvasElement;
    const dataSet = Object.assign({}, spectraDataSet);
    dataSet.backgroundColor = backgroundColors[0];
    dataSet.borderColor = borderColors[0];
    dataSet.data  = Array(this.settings.maxFreq).fill(0);

    this.chart1 = new Chart(canvas1, {
      type: 'line',
      data: {
        datasets: [dataSet],
    },
      options: FreqExperChartOptions
    });

    this.chart2 = new Chart(canvas2, {
      type: 'line',
      data: {
        datasets: [dataSet],
    },
      options: FreqExperChartOptions
    });

  }

  ngAfterViewChecked(): void {
    // Check for incoming data
    if (this.incomingData.data != null && this.data == null)
    {
      this.incomingData.data.pipe(samples => this.data = samples);
    }
    // Check if is warning add timeout to reset
    if (this.isWarning){
      setTimeout(()=>{
        this.resetWarning();
      }, 5000); // five seconds delay
    }
  }

  startRecording(isSamples1 = true): void {
    if (this.data === undefined){
      // Need to ensure that device is connected
      this.isWarning = true;
      this.warningMessage = 'You need to connect your muse to the web app before recording!';
      return;
    }

    if (this.displayedBand.includes('Select') || this.selectedElectrode.includes('Select')){
        // Need to tell user to fill in options first
        this.isWarning = true;
        this.warningMessage = 'You need to choose an electrode and a frequency band before recording!';
        return;
    }

    this.isSamples1 = isSamples1;
    (this.isSamples1) ? this.isRecording1 = true : this.isRecording2 = true;
    this.samples1 = [];
    this.samples2 = [];

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
    setTimeout(() => {
      this.stopRecording();
      this.displayCharts();
    }, this.timeToRecord * 1000);
  }

  // Used to end subsription after recording ends
  stopRecording(): void {
    (this.isSamples1) ? this.isRecording1 = false : this.isRecording2 = false;
    this.subscription.unsubscribe();
    if (this.shouldSaveToCsv)
    {
       this.saveToCsv();
    }
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
    }
    else {
      this.chart2.data.datasets[0].data.length = 0;
      dataSet.forEach((val: number ) => this.chart2.data.datasets[0].data.push(val));
      dataSet.forEach(( _, idx) => this.chart2.data.labels.push(idx + 1));

      this.chart2.options.title.text = this.capitalize(this.selectedBand) + ' Power Over ' + this.timeToRecord + ' Seconds';
      this.chart2.update();
    }
  }

  // Used to get a specific set of data from the samples
  getcleanedSampleValues(useDefaults = true, band = '', idx = -1): number[] {
    const cleanedDataSet = [];
    (this.isSamples1) ?
        this.samples1.forEach(samp =>  cleanedDataSet.push(
          samp[(useDefaults) ? this.selectedBand : band ][ (useDefaults) ? this.selectedElectrodeIdx : idx])) :
        this.samples2.forEach(samp => cleanedDataSet.push(
          samp[(useDefaults) ? this.selectedBand : band ][ (useDefaults) ? this.selectedElectrodeIdx : idx]));
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
    this.selectedElectrodeIdx = channelLabels.indexOf(val);
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

  // Reset any warning messages displayed to user
  resetWarning(): void{
    this.isWarning = false;
    this.warningMessage = '';
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
    orderedBandLabels.forEach(nam => samples.push(this.getcleanedSampleValues(false, nam.toLowerCase(), this.selectedElectrodeIdx)));
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
}
