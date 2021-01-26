import { FreqBandsChartOptions, orderedLabels, orderedBandLabels, bandsDataSet, ISettings, getSettings } from './../shared/chartOptions';
import { DataService } from './../shared/dataService';
import { Component,  Input, AfterViewInit, AfterViewChecked } from '@angular/core';
import { OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { SmoothieChart  } from 'smoothie';
import { channelNames, EEGSample } from 'muse-js';
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

// If you have inner observable use mergemap to allow you to  subscribe to directly to it after applying map operation



@Component({
  selector: 'app-frequency-bands',
  templateUrl: 'frequency-bands.component.html',
  styleUrls: ['frequency-bands.component.less'],
})
export class FrequencyBandsComponent implements OnInit, OnDestroy, AfterViewChecked {
  // Declare input fields that users interact with
  @Input() data: Observable<EEGSample>;

  settings: ISettings;
  canvases: SmoothieChart[];

  readonly destroy = new Subject<void>();
  readonly channelNames = channelNames;
  readonly freqBands = 4;

  chart: any;

  constructor(private incomingData: DataService) { }


  ngOnInit(): void {
    const canvas = document.getElementById('freqChart') as HTMLCanvasElement;
    const dataSets = [];
    this.settings = getSettings();
    this.settings.interval = 500; // Update chart every 500 ms
    this.settings.name = 'Bands';

    Array(this.freqBands).fill(0).map((ch, i) => {
          const temp =  Object.assign({}, spectraDataSet);
          temp.backgroundColor = backgroundColors[i];
          temp.borderColor = borderColors[i];
          temp.label = orderedBandLabels[i];
          temp.data = Array(this.settings.nChannels).fill(0);
          dataSets.push(temp);
        });
    this.chart = new Chart(canvas, {
      type: 'bar',
      data: {
        datasets: dataSets,
        labels: orderedLabels
    },
      options: FreqBandsChartOptions
    });
  }


  ngAfterViewChecked(): void {
    // Check for incoming data
    if (this.incomingData.data != null && this.data == null)
    {
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
        powerByBand(),
        catchError(async (err) => console.log(err))
      )
        .subscribe(data => {
          this.addData(data);
        });
      this.chart.update();
      }
    }

  ngOnDestroy(): void {
    this.destroy.next();
  }

  addData(data: any): void {
    for (let i = 0; i < this.freqBands; i++) {
       for (let k = 0; k < this.settings.nChannels; k++) {
         this.chart.data.datasets[i].data.pop();
       }
    }
    for (let k = 0; k < this.settings.nChannels; k++ ){
      // A data set represents a freq band
      // Split the data by bands (delta, theta, alpha, beta)
      const orderedIndex = this.channelNames.indexOf(orderedLabels[k]); // so we can create the necesary order of data
      this.chart.data.datasets[0].data.push(data.delta[orderedIndex]);
      this.chart.data.datasets[1].data.push(data.theta[orderedIndex]);
      this.chart.data.datasets[2].data.push(data.alpha[orderedIndex]);
      this.chart.data.datasets[3].data.push(data.beta[orderedIndex]);
    }
    this.chart.update();
  }
}
