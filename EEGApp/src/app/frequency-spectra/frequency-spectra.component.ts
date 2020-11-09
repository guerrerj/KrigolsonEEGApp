import { backgroundColors, borderColors } from './../shared/chartOptions';
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


import {options,  bandLabels, spectraDataSet } from '../shared/chartOptions';
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
    sliceFFTLow: number;
    sliceFFTHigh: number;
}

function getSettings(): ISettings {
    return {
      cutOffLow: 2,
      cutOffHigh: 50,
      interval: 100,
      bins: 256,
      duration: 1024,
      srate: 256,
      name: 'Frequency Spectrum',
      secondsToSave: 10,
      nChannels: 4,
      sliceFFTLow: 1,
      sliceFFTHigh: 100
    };
  }

const samplingFrequency = 256;

@Component({
  selector: 'app-frequency-spectra',
  templateUrl: 'frequency-spectra.component.html',
  styleUrls: ['frequency-spectra.component.less'],
})
export class FrequencySpectraComponent implements OnInit, OnDestroy, AfterViewInit {

  @Input() data: Observable<EEGSample>;
  @Input() enableAux: boolean;

  settings: ISettings;


  readonly destroy = new Subject<void>();
  readonly channelNames = channelNames;

  private lines: TimeSeries[];
  chart: Chart;

  constructor(private view: ElementRef) {}

  ngOnInit() {
    this.settings = getSettings();
    this.settings.nChannels = this.enableAux ? 5 : 4;

    const canvas = document.getElementById('freqSpectra') as HTMLCanvasElement;
    const dataSets = [];
    const spectraLabels = ['TP9', 'AF7', 'AF8', 'TP10', 'AUX'];
    Array(this.settings.nChannels).fill(0).map((ch, i) => {
          const temp =  Object.assign({}, spectraDataSet);
          temp.backgroundColor = backgroundColors[i];
          temp.borderColor = borderColors[i];
          temp.label = spectraLabels[i];
          temp.data  = Array(100).fill(0);
          dataSets.push(temp);
        });
    this.chart = new Chart(canvas, {
          type: 'line',
          data: {
            datasets: [dataSets[0], dataSets[1], dataSets[2], dataSets[3]],
            labels: [],
        },
        options: {
          events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'],
          tooltips: {
            enabled: true,
            intersect: true,
            mode: 'point',
            callbacks: {
              label(tooltipItem: any, data) {
                  let label = data.datasets[tooltipItem.datasetIndex].label || '';

                  if (label) {
                      label += ': ';
                  }
                  label += Math.round(tooltipItem.yLabel * 100) / 100;
                  return label;
              }
            }
          },
          hover: {
            animationDuration: 0
          },
          responsiveAnimationDuration: 0,
          title: {
            display: true,
            text: 'Frequency Spectra per Electrode'
          },
          scales: {
            yAxes: [{
              scaleLabel: {
              display: true,
              labelString: 'Power (uV)'
            }}],
            xAxes: [{
              scaleLabel: {
                display: true,
                labelString: 'Frequency (Hz)'
              }
            }]
         }
         },
        });


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
      .subscribe(data => {
        this.addData(data);
      });
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    this.destroy.next();
  }

  addData(spectraData: any) {
    for (let i = 0; i < this.settings.nChannels; i++) {
      spectraData.psd[i].forEach(() => this.chart.data.datasets[i].data.pop());
      spectraData.psd[i].forEach((val: number) => this.chart.data.datasets[i].data.push(val));
      if (this.chart.data.labels.length < spectraData.freqs.length)
      {
        this.chart.data.labels.forEach(() => this.chart.data.labels.pop());
        spectraData.freqs.forEach((val: number) => this.chart.data.labels.push(val));
      }
    }
    this.chart.update();
  }
}

/* freqs: (100) [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100]
info:
samplingRate: 256
startTime: 1603739905165.75
__proto__: Object
psd: Array(5)
0: (100) [9.061837227100026, 23.41497965492784, 34.630647343189, 39.41668973741782, 13.53920997368622, 12.294492792861325, 45.34143349770491, 10.910077892357126, 19.518786774858995, 6.398284436053515, 34.70256817671577, 88.40912560852126, 38.45242889188789, 5.587863007062999, 8.384769986021679, 198.34551690996093, 36.76931541976072, 6.044134382372282, 14.415466442378419, 4.96040806428228, 29.36311982851569, 3.6017724704312974, 33.617144439814126, 3.2785305089000483, 7.088237777337024, 2.6288994971200554, 42.50977983764156, 112.35724008644192, 19.018324999929327, 5.128595154025066, 31.669099220313665, 149.42689218365976, 35.813063854900996, 0.7015819907527449, 15.627714589049669, 18.065243670236914, 43.27042447495262, 1.7338616507556999, 9.601257314953113, 13.51381694355913, 33.352644887794554, 3.2127553043058414, 29.885237488399746, 107.36515582273535, 19.561492853777303, 7.840302127734235, 29.46545141546495, 57.639581496803864, 12.35041644546913, 7.580712596907113, 21.321685232627317, 12.33699339230632, 24.4031775004505, 7.525738747479705, 3.687640537040635, 13.935182903518998, 27.239067877379867, 9.681086895198343, 16.23157855545058, 173.32639258834735, 6.814732560012225, 1.0806696110873781, 7.931943769425938, 1.378741362011867, 7.297664060845014, 2.2370388785865365, 9.627476478393653, 2.9746178111118153, 3.2432945807719697, 2.7645331457785156, 7.254427915911709, 9.50156363693749, 2.204719256935224, 2.950209410026316, 4.436448088550794, 37.15391059736956, 3.999906155781452, 3.122613532238221, 3.105127478772196, 3.0601617034188298, 3.2823934745509544, 2.8783060438832875, 2.8834721160001036, 2.7701999226181946, 2.929980208186544, 2.7345415702107405, 2.9107765573297204, 2.8983130401787065, 2.721421070644463, 2.6044144227924573, 2.7998093871136387, 2.832728831966567, 2.5643183447584996, 2.5689868534724445, 2.680702722954349, 2.4556127740525806, 2.416012320269625, 2.490835480960595, 2.516766165021884, 2.5279832444570247]
1: (100) [11.72273819267353, 9.385559753908776, 24.103683875847228, 49.76062313344572, 9.369574717026978, 20.193521739319586, 34.49864886077641, 12.96191987730782, 6.907434281620886, 14.05787975423351, 15.098692503616741, 50.20631303563156, 25.731475619787247, 37.62023227288182, 29.069828964004756, 293.3162271090832, 31.02607798220624, 40.76339312137882, 30.370554024547083, 15.750579678500374, 16.547894449480907, 11.418222728365102, 14.46601157192207, 17.047269812657905, 49.203764233127714, 34.74775390069006, 14.479136736748497, 88.9184434365877, 29.890594874627126, 15.295364986114999, 20.605861144079178, 42.14966064027833, 12.786106784778688, 20.314369545852845, 39.703608586690784, 25.797942852148115, 19.857026782807445, 11.05743854578007, 25.282076965966223, 12.315412102083602, 12.295876200886163, 17.595425169503624, 16.187982359676944, 179.73215146038524, 26.722001919503324, 38.65386202046812, 33.53067272442365, 60.91096536315612, 11.14826494487826, 17.623398821002375, 10.506675822288072, 8.10322086728695, 19.37244854529784, 14.05093847392545, 6.805412063559528, 22.899056692400187, 18.350869868503413, 9.035147798457647, 7.631452803072298, 209.68428052386022, 9.146089903191847, 9.269692891619885, 12.089347700483371, 6.965307125707235, 7.716249820705523, 4.151324751803308, 5.7053303121419265, 5.26796627166776, 3.1086581060575504, 2.258592817003419, 3.350130510059414, 3.471137263314932, 0.7053562860095907, 2.3594352655353608, 2.739676657374865, 38.81361078151574, 2.6388525695371663, 3.439705179263731, 2.921566984516306, 1.427615211201368, 1.313335446306233, 1.4855063998291045, 1.6200940971088558, 1.736096497075478, 2.1847770100009147, 1.9674847336559984, 1.7112105695295468, 2.523920980791047, 1.7415825686300908, 1.617125734390936, 1.458550280361928, 1.2598768676995749, 1.2374535664128732, 1.2476876792384122, 1.3112000711732932, 1.1205505753247618, 1.2432223779234748, 1.1429745332894483, 1.083130135308392, 1.177815853635522]
2: (100) [0.3831151993832854, 2.968798121015774, 6.9919169918165744, 9.885849071852572, 2.880388800876053, 8.196839137963062, 16.735723793080272, 2.686447965225365, 3.6586299550684345, 6.855524212746357, 5.773525687598106, 6.557356632211058, 4.6923984433857955, 3.5312024180628945, 11.593666091532919, 11.066007982854783, 17.779127060942756, 1.5648078119277098, 2.6117604108911214, 11.256920039288682, 30.826688187879483, 8.415949662068602, 6.255541042952091, 10.426742146065918, 5.088035660759222, 4.780414486231875, 6.604315728206337, 4.887631698859175, 4.139814345573714, 5.422520225548742, 5.8718400657149745, 2.9477036564401584, 1.3891343043970172, 7.1626952430289474, 5.778122744301919, 2.56064081838941, 3.100561373249362, 8.035373508620589, 9.095370491392739, 7.026546984181423, 2.195125715134371, 5.90628433512891, 10.821719021752486, 5.843924259806698, 12.971375313645574, 6.796315641837393, 3.6079036973090046, 3.679003653295152, 0.18091758582053305, 0.6809000956232779, 0.962274315421223, 4.093473124871935, 6.692722731539718, 5.498820453317759, 3.2663361609114365, 4.005793827644442, 3.2924319120278565, 1.136212153744818, 5.579464973478363, 166.30263096850473, 3.850358885487169, 2.0026899493844112, 1.6398706696678984, 2.9091785379706065, 1.834229522496388, 4.098352834938096, 7.517747358710561, 2.1829804146807246, 1.9733420364619851, 0.6813468422327509, 0.8154897587564534, 0.5436335720049756, 0.2742048894937246, 0.7841045789183485, 0.3763869198102138, 2.438257934768918, 0.6139710239207969, 0.5586626257122984, 0.6080519226358054, 0.22250878294488657, 0.6815499570728779, 0.2551123546232381, 0.31561629426600124, 0.2670719945907802, 0.26406718286227565, 0.31161239069487584, 0.27590838651564176, 0.4294549120450404, 0.2721835087212235, 0.21884494265372925, 0.31002790462220087, 0.23706531440606818, 0.26239016595165415, 0.2189666186148856, 0.21913082613176454, 0.23649325030903623, 0.23306788380413188, 0.20864858309204062, 0.2252260084711612, 0.20654370338088318]
3: (100) [10.237073848419685, 11.009199029493885, 40.98949028390242, 35.36513338729732, 5.032252550215416, 8.285258460815262, 36.98226307280743, 6.759199474329915, 31.33770249364949, 14.88088180168904, 31.10503322425705, 85.87077968739588, 42.83842644922982, 14.165517689212333, 18.399015346960468, 192.0280058475619, 30.677641919779884, 17.082503090715356, 10.565643642437456, 9.008113841353987, 16.177018678899604, 18.23240299056834, 23.132753223417414, 9.700246466029926, 10.590677997145768, 16.487270685432605, 37.5245608094912, 106.66665048834027, 23.868823420052312, 16.783146786155527, 37.16653958574907, 144.28856203071112, 32.83167148422163, 14.526026110113387, 25.279647965017002, 15.138528082442175, 35.16124940661537, 13.071858099625048, 5.710765023901885, 21.015463598947033, 26.479466162829564, 10.312729776895344, 23.4236199631132, 104.03854114631714, 19.918903850016502, 14.210975502398814, 28.9707311099519, 58.64910362179526, 13.375215687311208, 8.617122949751481, 27.54427846170842, 11.097606218524279, 18.445719397749958, 8.526237558456636, 15.411575500443796, 25.17744811979743, 17.73618082712312, 1.984720468377528, 5.508310308849253, 164.0506888296703, 2.8583560291450945, 9.337211515757755, 2.287309823044843, 6.0151981803412875, 3.797816189609982, 3.4595163237949205, 6.810913129583883, 2.556669888314344, 2.4956909215403322, 1.9000204468919788, 5.896344235201629, 8.148910498912095, 1.8274809429335943, 0.16638912953089222, 3.112372038274681, 37.61413220489982, 3.6092412817355837, 1.207139378088659, 1.1965392209528338, 1.8818542852194673, 2.1274216127026753, 1.196249494850886, 1.0855313881663977, 1.4060328776647175, 0.5879474802624979, 1.2683918068440694, 0.4029082982410452, 0.584624017646014, 0.9511865111056442, 1.026763317512036, 1.1548576457840836, 1.74654595380858, 0.7356860767907814, 0.7849001710371015, 1.044874642314155, 0.5474854530956738, 0.5443041034842923, 0.6918533538710299, 0.6921803968437714, 0.6553470029283464]
4: (100) [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
length: 5
__proto__: Array(0)
__proto__: Object */

/**
 * backgroundColor: (5) ["rgba(255, 99, 132, 0.2)", "rgba(54, 162, 235, 0.2)", "rgba(255, 206, 86, 0.2)", "rgba(75, 192, 192, 0.2)", "rgba(153, 102, 255, 0.2)"]
borderColor: (5) ["rgba(255, 99, 132, 1)", "rgba(54, 162, 235, 1)", "rgba(255, 206, 86, 1)", "rgba(75, 192, 192, 1)", "rgba(153, 102, 255, 1)"]
borderWidth: 1
data: (457) [0, 0, 0, 0, 0, Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), Array(100), …]
_meta: {1: {…}, 2: {…}, 3: {…}, 4: {…}}
__proto__: Object

0: 1
1: 2
2: 1
3: 2
4: 3
5: 4
6: 5
7: 6
8: 7
9: 8
10: 9
11: 10
12: 11
13: 12
14: 13
15: 14
16: 15
 */

 // Needed to pre-fill array before popping and adding values
