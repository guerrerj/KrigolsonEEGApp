import { MessagesService } from './../shared/messages.servce';
import { orderedLabels } from './../shared/chartOptions';
import { DataService } from './../shared/dataService';
import { Component, ElementRef, Input, AfterViewInit, AfterViewChecked } from '@angular/core';
import { OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { SmoothieChart, TimeSeries } from 'smoothie';
import { channelNames, EEGSample } from 'muse-js';
import { map, groupBy, filter, mergeMap, takeUntil } from 'rxjs/operators';
import { bandpass } from './../shared/bandpass.filter';

import { ChartService } from '../shared/chart.service';
import { faRecordVinyl } from '@fortawesome/free-solid-svg-icons';

const samplingFrequency = 256;

@Component({
  selector: 'app-time-series',
  templateUrl: 'time-series.component.html',
  styleUrls: ['time-series.component.less'],
})
export class TimeSeriesComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked {

  @Input() data: Observable<EEGSample>;
  @Input() filter: boolean;
  channels = 4;
  canvases: SmoothieChart[];
  minFreq = 1;
  maxFreq = 30;
  isRecording = false;
  faRecordVinyl = faRecordVinyl;
  readonly destroy = new Subject<void>();
  readonly channelNames = orderedLabels;
  readonly colors = this.chartService.getColors();
  readonly amplitudes = [];
  readonly uVrms = [0, 0, 0, 0, 0];
  readonly uMeans = [0, 0, 0, 0, 0];
  readonly minTimeScale = 1;
  readonly maxTimeScale = 20;
  readonly minAmpScale = 1;
  readonly maxAmpScale = 10000;

  readonly options = this.chartService.getChartSmoothieDefaults({
    millisPerPixel: 6, // Speed at which chart pans by
    maxValue: 500,
    minValue: -500
  });


  private lines: TimeSeries[];
  private samples: number [][];
  private subscription: Subscription;

  constructor(private view: ElementRef, private chartService: ChartService, private incomingData: DataService,
              private messagesService: MessagesService) {
  }

  // used as property to get the current amplitude scaling factor
  get amplitudeScale(): number {
    return this.canvases[0].options.maxValue;
  }

  // Set the new amplitude scaling factor for the chart
  setAmplitudeScale(value: number): void  {
    if (isNaN(value)) {
      return;
    }
    if (value < this.minAmpScale || value > this.maxAmpScale){
     return;
    }

    for (const canvas of this.canvases) {
      canvas.options.maxValue = value;
      canvas.options.minValue = -value;
    }
  }

  get timeScale(): number {
    return this.canvases[0].options.millisPerPixel;
  }

  // Set the new time scale on the charts
  setTimeScale(value: number) : void {
    if (isNaN(value)) {
      return; // Nothing to do if scaler is not a number
    }
    if (value < this.minTimeScale || value > this.maxTimeScale)
    {
      return; // nothing to do if scaler value is out of bounds
    }

    for (const canvas of this.canvases) {
      canvas.options.millisPerPixel = value;
    }
  }

  // Set whether eeg data is filtered or not
  setFilter(filterElem: any): void{
    if (filterElem.checked){
      this.filter = true;
      filterElem.checked = true;
    }else{
      this.filter = false;
      filterElem.checked = false;
    }
  }

  ngOnInit(): void {
    // Get the data from the service
    this.canvases = Array(this.channels).fill(0).map(() => new SmoothieChart(this.options));
    this.lines = Array(this.channels).fill(0).map(() => new TimeSeries());
    this.addTimeSeries();
    this.filter = true;
  }

  ngAfterViewInit(): void {

  }

  ngAfterViewChecked(): void {
    if (this.incomingData.data != null && this.data == null)
    {
      this.incomingData.data.pipe(samples => this.data = samples);
      this.data.pipe(
        takeUntil(this.destroy),
        mergeMap(sampleSet =>
          sampleSet.data.slice(0, this.channels).map((value, electrode) => ({
            timestamp: sampleSet.timestamp, value, electrode
          }))),
        groupBy(sample => sample.electrode),
        mergeMap(group => {
          const bandpassFilter = bandpass(samplingFrequency, this.minFreq, this.maxFreq);
          const conditionalFilter = value => this.filter ? bandpassFilter(value) : value;
          return group.pipe(
            filter(sample => !isNaN(sample.value)),
            map(sample => ({ ...sample, value: conditionalFilter(sample.value) })),
          );
        })
      )
        .subscribe(sample => {
          this.draw(sample.timestamp, sample.value, sample.electrode);
        });

      const delay = 1000;
      const channels = this.view.nativeElement.querySelectorAll('canvas');
      this.canvases.forEach((canvas, index) => {
        canvas.streamTo(channels[index], delay);
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy.next();
  }

  addTimeSeries(): void {
    this.lines.forEach((line, index) => {
      this.canvases[index].addTimeSeries(line, {
        lineWidth: 2,
        strokeStyle: this.colors[index].borderColor
      });
    });
  }

  draw(timestamp: number, amplitude: number, index: number): void {
    // Get the ordered index to send data to the correct canvas
    const orderedIndex = this.channelNames.indexOf(channelNames[index]);
    this.uMeans[orderedIndex] = 0.995 * this.uMeans[orderedIndex] + 0.005 * amplitude;
    this.uVrms[orderedIndex] = Math.sqrt(0.995 * this.uVrms[orderedIndex] ** 2 + 0.005 * (amplitude - this.uMeans[orderedIndex]) ** 2);

    this.lines[orderedIndex].append(timestamp, amplitude);
    this.amplitudes[orderedIndex] = amplitude.toFixed(2);
  }

  // Used to record live eeg data
  startRecording(): void {
    if (this.data === undefined){
      this.messagesService.setWarning('You need to connect to the muse before recording.');
      return;
    }
    this.isRecording = true;
    this.samples = [];
    this.subscription = this.data.subscribe(sample => {
      this.samples.push([sample.timestamp, ...sample.data]);
    });
  }

  // Used to stop recording data
  stopRecording(): void {
    this.isRecording = false;
    this.subscription.unsubscribe();
    this.saveToCsv();
  }

  // Used to read samples count
  get sampleCount(): number {
    return this.samples.length;
  }

  // Used to save eeg data to csv
  saveToCsv(): void {
    const a = document.createElement('a');;
    const headers = ['time', ...channelNames].join(',');
    const csvData = headers + '\n' + this.samples.map(item => item.join(',')).join('\n');
    const file = new Blob([csvData], {type: 'text/csv'});
    a.href = URL.createObjectURL(file);
    document.body.appendChild(a);
    a.download = 'recording.csv';
    a.click();
    document.body.removeChild(a);
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
