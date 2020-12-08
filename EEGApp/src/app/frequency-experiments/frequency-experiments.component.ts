import { DataService } from './../shared/dataService';
import { Component, OnInit, Input, AfterViewChecked, OnDestroy } from '@angular/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { EEGSample, channelNames } from 'muse-js';
import { faRecordVinyl } from '@fortawesome/free-solid-svg-icons';
import { FreqBandsChartOptions, orderedLabels, orderedBandLabels, bandsDataSet, getSettings, ISettings } from './../shared/chartOptions';
import { SmoothieChart  } from 'smoothie';
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

  isRecording = false;
  isfreqExperiment = true;
  shouldSaveToCsv = false;
  numOfRecordings = 2;
  timeToRecord = 10000;
  timeLeft = 60; // amount of time to record
  settings: ISettings;
  interval: any;

  readonly destroy = new Subject<void>();
  private samples: number[][];
  private subscription: Subscription;

  constructor(private incomingData: DataService) { }

  ngOnInit(): void {
    this.settings = getSettings();
    this.settings.interval = 200; // get new data every 200 ms
  }
  ngAfterViewChecked(): void {
    // Check for incoming data
    if (this.incomingData.data != null && this.data == null)
    {
      this.incomingData.data.pipe(samples => this.data = samples);
    }
  }

  startRecording(): void {
    this.isRecording = true;
    this.samples = [];
    if (this.data === undefined){
      console.log("no data");
      return;
    }

    if (this.isfreqExperiment)
    {
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
        console.log(sample);
        this.samples.push([sample]);
      });

      // Set callback to end subscription after timeToRecord is finished
      this.interval = setInterval(() => {
        this.stopRecording();
        console.log('final samples',this.samples);
      }, this.timeToRecord); // Decrement time left every second

    }else{
        this.subscription = this.data.subscribe(sample => {
        this.samples.push([sample.timestamp, ...sample.data]);
      });
    }
  }

  stopRecording(): void {
    this.isRecording = false;
    this.subscription.unsubscribe();
    clearInterval(this.interval);
    if (this.shouldSaveToCsv)
    {
      this.saveToCsv(this.samples);
    }
  }

  get sampleCount(): number {
    return this.samples.length;
  }

  startTimer(): void{
    this.interval = setInterval(() => {
      if (this.timeLeft > 0){
        this.timeLeft--;
      } else {
        this.timeLeft = this.timeToRecord;
      }
    }, 1000); // Decrement time left every second
  }

  pauseTimer(): void{
    clearInterval(this.interval);
  }

  saveToCsv(samples: number[][]): void {
    const a = document.createElement('a');
    const headers = ['time', ...channelNames].join(',');
    const csvData = headers + '\n' + samples.map(item => item.join(',')).join('\n');
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

/*alpha: (5) [2.569982389031302, 15.14440788348325, 17.55433274587539, 7.181179309261739, 0]
beta: (5) [1.7436693188655892, 37.99818623287761, 24.80340867739527, 3.1623906261245724, 0]
delta: (5) [5.946120003354078, 10.302180909412138, 16.71709873684125, 15.409359852569004, 0]
gamma: (5) [0.39259916805923056, 4.389336660060236, 2.400139004318033, 0.5785944315001026, 0]
theta: (5) [4.350190319551667, 13.144579376229432, 11.427628831177307, 9.010487076024834, 0]
__proto__: Object
 */
