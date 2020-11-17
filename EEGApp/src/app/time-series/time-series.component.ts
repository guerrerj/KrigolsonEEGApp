import { orderedLabels } from './../shared/chartOptions';
import { DataService } from './../shared/dataService';
import { Component, ElementRef, Input, AfterViewInit, AfterViewChecked } from '@angular/core';
import { OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { SmoothieChart, TimeSeries } from 'smoothie';
import { channelNames, EEGSample } from 'muse-js';
import { map, groupBy, filter, mergeMap, takeUntil } from 'rxjs/operators';
import { bandpass } from './../shared/bandpass.filter';

import { ChartService } from '../shared/chart.service';

const samplingFrequency = 256;

@Component({
  selector: 'app-time-series',
  templateUrl: 'time-series.component.html',
  styleUrls: ['time-series.component.less'],
})
export class TimeSeriesComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked {

  @Input() data: Observable<EEGSample>;
  @Input() enableAux: boolean;

  filter = false;

  channels = 4;
  canvases: SmoothieChart[];

  readonly destroy = new Subject<void>();
  readonly channelNames = orderedLabels;
  readonly amplitudes = [];
  readonly uVrms = [0, 0, 0, 0, 0];
  readonly uMeans = [0, 0, 0, 0, 0];
  readonly minTimeScale = 1;
  readonly maxTimeScale = 20;
  readonly minAmpScale = 1;
  readonly maxAmpScale = 10000;

  readonly options = this.chartService.getChartSmoothieDefaults({
    millisPerPixel: 3, // Speed at which chart pans by
    maxValue: 500,
    minValue: -500
  });
  readonly colors = this.chartService.getColors();

  private lines: TimeSeries[];

  constructor(private view: ElementRef, private chartService: ChartService, private incomingData: DataService) {
  }

  get amplitudeScale(): number {
    return this.canvases[0].options.maxValue;
  }

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

  setTimeScale(value: number) : void {
    if (isNaN(value)) {
      return;
    }
    if (value < this.minTimeScale || value > this.maxTimeScale)
    {
      return;
    }

    for (const canvas of this.canvases) {
      canvas.options.millisPerPixel = value;
    }
  }



  ngOnInit(): void {
    // Get the data from the service
    this.channels = this.enableAux ? 5 : 4;
    this.canvases = Array(this.channels).fill(0).map(() => new SmoothieChart(this.options));
    this.lines = Array(this.channels).fill(0).map(() => new TimeSeries());
    this.addTimeSeries();
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
          const bandpassFilter = bandpass(samplingFrequency, 1, 30);
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
}
