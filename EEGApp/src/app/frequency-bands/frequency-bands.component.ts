import { DataService } from './../shared/dataService';
import { Component, ElementRef, Input, AfterViewInit } from '@angular/core';
import { OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { SmoothieChart, TimeSeries } from 'smoothie';
import { channelNames, EEGSample, zipSamples } from 'muse-js';
import { map, groupBy, filter, mergeMap, takeUntil } from 'rxjs/operators';
import { bandpass } from '../shared/bandpass.filter';
import { catchError, multicast } from 'rxjs/operators';
import { saveAs } from 'file-saver';
import {Chart} from 'chart.js';


import { ChartService } from '../shared/chart.service';
import {channelLabels,  bandLabels, backgroundColors, borderColors, spectraDataSet } from '../shared/chartOptions';
import {
  bandpassFilter,
  epoch,
  fft,
  powerByBand
} from '@neurosity/pipes';

// If you have inner observable use mergemap to allow you to  subscribe to directly to it after applying map operation

const chartStyles = {
  wrapperStyle: {
    display: 'flex',
    flexWrap: 'wrap',
    padding: '20px'
  }
};

export interface ISettings {
    cutOffLow: number;
    cutOffHigh: number;
    interval: number;
    bins: number;
    duration: number;
    srate: number;
    name: string;
    secondsToSave: number;
    nChannels: number;
}

function getSettings(): ISettings {
    return {
      cutOffLow: 2,
      cutOffHigh: 50,
      interval: 100,
      bins: 256,
      duration: 1024,
      srate: 256,
      name: 'Bands',
      secondsToSave: 10,
      nChannels: 4
    };
  }

const samplingFrequency = 256;

@Component({
  selector: 'app-frequency-bands',
  templateUrl: 'frequency-bands.component.html',
  styleUrls: ['frequency-bands.component.less'],
})
export class FrequencyBandsComponent implements OnInit, OnDestroy, AfterViewInit {

  @Input() data: Observable<EEGSample>;
  @Input() enableAux: boolean;

  settings: ISettings;
  canvases: SmoothieChart[];

  readonly destroy = new Subject<void>();
  readonly channelNames = channelNames;

  private lines: TimeSeries[];
  chart: any;

  constructor(private incomingData: DataService) { }


  ngOnInit(): void {
    this.incomingData.data?.pipe(samples => this.data = samples);
    const canvas = document.getElementById('freqChart') as HTMLCanvasElement;
    const dataSets = [];
    this.settings = getSettings();
    this.settings.nChannels = this.enableAux ? 5 : 4;

    Array(this.settings.nChannels).fill(0).map((ch, i) => {
          const temp =  Object.assign({}, spectraDataSet);
          temp.backgroundColor = backgroundColors[i];
          temp.borderColor = borderColors[i];
          temp.data = Array(5).fill(0);
          dataSets.push(temp);
        });
    this.chart = new Chart(canvas, {
      type: 'bar',
      data: {
        datasets: dataSets,
        labels: bandLabels
    },
      options: {
        title: {
          display: true,
          text: 'Frequency Bands per Electrode'
        },
        responsiveAnimationDuration: 0,
        scales: {
            yAxes: [{
              scaleLabel: {
              display: true,
              labelString: 'Power (uV)'
            }}],
            xAxes: [{
              scaleLabel: {
                display: true,
                labelString: 'Frequency Bands'
              }
            }]
        }
      }
    });

  }

  ngAfterViewInit(): void {
    this.data?.pipe(
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

    if (this.data){
      this.chart.options.scales.yAxes[0] = {
        display: true
      };
      this.chart.update();
    }
  }

  ngOnDestroy(): void {
    this.destroy.next();
  }

  addData(data: any): void {
    for (let i = 0; i < this.settings.nChannels; i++) {
       for (let k = 0; k < 5; k++) {
         this.chart.data.datasets[i].data.pop();
       }
    }

    for (let i = 0; i < this.settings.nChannels; i++) {
      // Each dataset represents an electrode (channel)
      // Each point represents a different frequency range
        this.chart.data.datasets[i].data.push(data.alpha[i]);
        this.chart.data.datasets[i].data.push(data.beta[i]);
        this.chart.data.datasets[i].data.push(data.delta[i]);
        this.chart.data.datasets[i].data.push(data.gamma[i]);
        this.chart.data.datasets[i].data.push(data.theta[i]);

    }
    this.chart.update();
  }
}

/*
 alpha: Array(5)
0: 40.84046691651057
1: 12.754179973427679
2: 4.141376127546335
3: 39.73700365380607
4: 0
length: 5
__proto__: Array(0)
beta: Array(5)
0: 30.780450411331042
1: 12.689490200792124
2: 7.759923861193662
3: 27.426959089819903
4: 0
length: 5
__proto__: Array(0)
delta: Array(5)
0: 39.6124717185627
1: 16.64392480378922
2: 12.98435421752133
3: 37.94931095294599
4: 0
length: 5
__proto__: Array(0)
gamma: Array(5)
0: 15.806402962194925
1: 12.784433759160533
2: 3.2021110688840615
3: 13.272424487884615
4: 0
length: 5
__proto__: Array(0)
theta: Array(5)
0: 18.269318887490698
1: 13.792054599966892
2: 11.944001580018629
3: 26.305896986529106
4: 0
length: 5
 */
