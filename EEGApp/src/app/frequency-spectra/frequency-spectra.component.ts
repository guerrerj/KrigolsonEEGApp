import { DataService } from './../shared/dataService';
import { backgroundColors, borderColors,  channelLabels, FreqSpectraChartOptions, getColors, getSettings, ISettings, orderedLabels } from './../shared/chartOptions';
import { Component, Input, AfterViewInit, AfterViewChecked } from '@angular/core';
import { OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { channelNames, EEGSample } from 'muse-js';
import { takeUntil } from 'rxjs/operators';
import { catchError } from 'rxjs/operators';
import { Chart } from 'chart.js';
import { ChartService } from '../shared/chart.service';



import {spectraDataSet } from '../shared/chartOptions';
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
  selector: 'app-frequency-spectra',
  templateUrl: 'frequency-spectra.component.html',
  styleUrls: ['frequency-spectra.component.less'],
})
export class FrequencySpectraComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked {

  @Input() data: Observable<EEGSample>;

  settings: ISettings;

  readonly destroy = new Subject<void>();
  readonly channelNames = orderedLabels;
  readonly colors = getColors();
  charts: Chart[];

  constructor(private incomingData: DataService) {}

  ngOnInit(): void {
    // Get settings for the charts
    this.settings = getSettings();
    this.settings.name = 'Frequency Spectrum';
    this.charts = [];

    // Get the charts options such as adding dummy data and configurations
    const dataSets = [];

    Array(this.settings.nChannels).fill(0).map((ch, i) => {
          const temp =  Object.assign({}, spectraDataSet);
          temp.backgroundColor = backgroundColors[i];
          temp.borderColor = borderColors[i];
          temp.data  = Array(this.settings.maxFreq).fill(0);
          dataSets.push(temp);
        });
    // Instantiate the charts with the options
    for (let i = 0; i < 4; i++){
        const canvas = document.getElementById('freqChart' + (i + 1)) as HTMLCanvasElement;
        console.log('canvas', canvas);
        this.charts.push(new Chart(canvas, {
          type: 'line',
          data: {
            datasets: [dataSets[i]],
            labels: [],
        },
        options: FreqSpectraChartOptions
      }));
    }
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
      this.charts[i].data.datasets[0].data.length = 0;
      spectraData.psd[i].forEach((val: number) => this.charts[i].data.datasets[0].data.push(val));

      // add labels if they have not been added up until 31 labels
      if (this.charts[i].data.labels.length < this.settings.maxFreq - 1)
      {
        this.charts[i].data.labels.length = 0;
        // get the freq labels that are below the maxFreq required
        const freqs  = spectraData.freqs.filter((x: number) => x < this.settings.maxFreq);
        freqs.forEach((val: number) => this.charts[i].data.labels.push(val));
      }
      this.charts[i].update();
    }

  }
}

