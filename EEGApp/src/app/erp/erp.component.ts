import { backgroundColors, borderColors, ERPChartOptions, FreqSpectraChartOptions, ISettings, spectraDataSet } from './../shared/chartOptions';
import { DataService } from './../shared/dataService';
import { Component, ElementRef, HostListener, Input, OnInit, ViewChild, AfterViewChecked } from '@angular/core';
import { filter, groupBy, map, mergeMap, timeout } from 'rxjs/operators';
import { MessagesService } from '../shared/messages.servce';
import { EEGSample } from 'muse-js';
import { Observable, Subscription } from 'rxjs';
import { bandpass } from '../shared/bandpass.filter';
import { channelLabels, getSettings } from '../shared/chartOptions';
import * as Chart from 'chart.js';

export enum KEY_CODE  {
  SPACE = ' ',
  U_KEY = 'u'
}

export enum STAGES {
  ONE = 1,
  TWO = 3,
  THREE = 5,
  FOUR = 7,
  FIVE = 9,
  SIX = 11,
  SEVEN = 13,
  EIGHT = 15,
  NINE = 17,
  TEN = 19,
  ELEVEN = 21,
  TWELVE = 23,
  THIRTEEN = 25,
  FOURTEEN = 27,
  FIFTEEN = 29
}

const samplingFrequency = 256;
@Component({
  selector: 'app-erp',
  templateUrl: './erp.component.html',
  styleUrls: ['./erp.component.less']
})
export class ErpComponent implements OnInit, AfterViewChecked {

  @ViewChild('oddBallCanvas', {static: true})
  canvas: ElementRef<HTMLCanvasElement>;

  @Input() data: Observable<EEGSample>;

  readonly oddBallChance = 0.25;
  readonly fixationDelay = 0.3;
  readonly fixationDeviation = 0.1;
  readonly circleTime = 500; // ms
  readonly colorOptions = ['black', 'silver', 'gray', 'maroon', 'red', 'purple',
   'fuchsia', 'green', 'lime', 'olive', 'yellow', 'navy', 'blue', 'teal', 'aqua', 'orange'];
  readonly radius = 30;
  readonly startAngle = 0;
  readonly endAngle = 2 * Math.PI;
  readonly headingFont = '25px  Lobster';
  readonly smallFont = '15px Lobster';
  readonly normalFont = '20px Lobster';
  readonly textColor = 'black';
  readonly numberBlocks = 10;
  readonly numberTrials = 20;
  readonly textDelay = 1000; // ms
  readonly canvasColor = '#C7A27C';
  readonly targetVal = 2;
  readonly constVal = 1;
  readonly channels = 4;
  readonly minFreq = 0.1;
  readonly maxFreq = 15;
  readonly maxVariation = 75;

  centerX: number;
  centerY: number;
  textY: number;
  textSize = 0;
  lastText = '';
  hAlign = 'center';
  playing: boolean;
  interval: any;
  targetColor: string;
  controlColor: string;
  currentBlock: number;
  currentTrial: number;
  trialType: number;
  drawColor: string;
  startTime: number;
  currentResponse: number;
  reactionTime: number;
  targetTracker: Array<any>;
  isTarget: boolean;
  isControl: boolean;
  shouldPlot: boolean;
  displayedBand = 'Select Frequency Band'; // which band to display
  selectedBand: string;
  selectedElectrode = 'Select Electrode';
  selectedElectrodeIdx: number; // which electrode to display
  settings: ISettings;
  chart: any;
  targetAvgLine: number[];
  controlAvgLine: number[];
  controlChunkIndices: Array<any>;
  targetChunkIndices: Array<any>;

  experimentalData: Array<any>;
  key: any;
  stage: number;

  private context: CanvasRenderingContext2D;
  private subscription: Subscription;
  private samples: Array<any>;

  constructor(private incomingData: DataService, private messagesService: MessagesService) { }

  ngOnInit(): void {
    this.context = this.canvas.nativeElement.getContext('2d');
    this.centerX = this.context.canvas.width / 2;
    this.centerY = this.context.canvas.height / 2;
    this.textY = this.context.canvas.height / 5;
    this.stage = 1;
    this.playing = false;
    this.clearCanvas();
    this.resetGame();


    // Get the chart options such as adding dummy data and configurations
    const canvas = document.getElementById('plotReactionChart') as HTMLCanvasElement;
    const dataSets = [];

    for (let i = 0; i < 2; i++){
      const temp =  Object.assign({}, spectraDataSet);
      temp.backgroundColor = backgroundColors[i];
      temp.borderColor = borderColors[i];
      temp.label = (i === 0) ? 'Control Ball': 'Target Ball';
      temp.data  = Array(this.channels).fill(0);
      dataSets.push(temp);
    }

    // Instantiate the chart with the options
    this.chart = new Chart(canvas, {
          type: 'line',
          data: {
            datasets: dataSets,
            labels: [],
        },
        options: ERPChartOptions
      });
  }

  ngAfterViewChecked(): void {
    if (this.incomingData.data != null && this.data == null)
    {
      this.incomingData.data.pipe(samples => this.data = samples);
    }
  }


  @HostListener('document:keypress', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): any {
    if ( event.key === KEY_CODE.SPACE && this.stage  < STAGES.THREE ){
      this.stage += 1;
    }
    if ( event.key.toLowerCase() === KEY_CODE.U_KEY && this.stage === (STAGES.THREE + 1) ){
      this.stage += 1;
    }

    if ( event.key === KEY_CODE.SPACE && this.stage === STAGES.ELEVEN ){
      this.stage += 2;
      this.currentResponse = 1;
      this.reactionTime = Date.now() - this.startTime;
    }
    if ( event.key === KEY_CODE.SPACE && this.stage  > STAGES.FIFTEEN ){
    }
    event.preventDefault();
  }

  startGame(): void {
    if (this.playing){
      return;
    }
    this.animate();
  }

  animate(): void {
    if (this.data === undefined){
      this.messagesService.setWarning('You must first connect to the muse before playing.');
      return;
    }
    if (this.selectedElectrodeIdx === undefined){
      this.messagesService.setWarning('You must choose an electrode before playing.');
      return;
    }
    this.playing = true;
    this.draw();
    requestAnimationFrame(this.animate.bind(this));
  }

  // Used to record live eeg data
  startRecording(): void {
    this.subscription =  this.data.pipe(
      mergeMap(sampleSet =>
        sampleSet.data.slice(0, this.channels).map((value, electrode) => ({
          timestamp: sampleSet.timestamp, value, electrode
        }))),
      groupBy(sample => sample.electrode),
      mergeMap(group => {
        const bandpassFilter = bandpass(samplingFrequency, this.minFreq, this.maxFreq);
        const conditionalFilter = value =>  bandpassFilter(value);
        return group.pipe(
          filter(sample => !isNaN(sample.value)),
          map(sample => ({ ...sample, value: conditionalFilter(sample.value) })),
        );
      })
    )
      .subscribe(sample => {
        this.samples[sample.electrode].push(sample.value);
        if (this.isTarget || this.isControl){
          this.targetTracker[sample.electrode][this.currentBlock - 1].push((this.isTarget) ? this.targetVal : this.constVal);
        } else {
          this.targetTracker[sample.electrode][this.currentBlock - 1].push(0);
        }
      });

  }
  // Used to reset all variables
  resetGame(): void {
    this.currentBlock = 1;
    this.currentTrial = 1;
    this.experimentalData = [];
    this.samples = [[], [], [], []];
    this.isTarget = false;
    this.isControl = false;
    this.targetTracker = [[], [], [], []];
    this.targetChunkIndices = [];
    this.controlChunkIndices = [];
    this.shouldPlot = true;
    for (let i = 0; i < this.channels; i++) {
      for (let b = 0; b < this.numberBlocks; b++) {
        this.targetTracker[i].push([]);
      }
   }
  }
  // Used to stop recording data
  stopRecording(): void {
    this.subscription.unsubscribe();
  }

  // Used to reset each trial
  resetTrial(): void {
    this.startTime = 0;
    this.currentResponse = 0;
    this.reactionTime = 0;
  }
  // main function that adds new content to the canvas based on the current state
  draw(): void {
    switch (this.stage){
      case (STAGES.ONE):
        this.startRecording();
        this.addText(this.headingFont, 'Welcome to the Oddball Game: Press space to continue.');
        this.textY += 25;
        this.addText(this.smallFont, 'Press space to continue');
        this.stage++;
        break;
      case (STAGES.TWO):
        this.clearCanvas();
        this.addText(this.normalFont, `You are going to see ${this.numberBlocks} Blocks of ${this.numberTrials} Trials of circles that appear and`);
        this.addNewLine();
        this.addText(this.normalFont, 'disappear in the middle of the screen. If you see a circle with the same color');
        this.addNewLine();
        this.addText(this.normalFont, 'as the circle below, press the space bar as quickly as you can. ');
        this.addNewLine();
        this.addText(this.smallFont, 'Press spacebar to continue');
        this.targetColor = this.colorOptions[Math.floor((Math.random() * this.colorOptions.length))];
        this.drawColor = this.targetColor;
        this.drawCircle();
        this.stage++;
        break;
      case (STAGES.THREE):
        this.clearCanvas();
        this.addText(this.normalFont, 'If you see a circle with the same color as the circle below, do not ');
        this.addNewLine();
        this.addText(this.normalFont, 'press the space bar or respond in any way. Press the U key to affirm you ');
        this.addNewLine();
        this.addText(this.normalFont, 'understand the instructions and proceed to the next screen.');
        this.controlColor = this.colorOptions[Math.floor((Math.random() * this.colorOptions.length))];
        while (this.controlColor === this.targetColor){
          this.controlColor = this.colorOptions[Math.floor((Math.random() * this.colorOptions.length))];
        }
        this.drawColor = this.controlColor;
        this.drawCircle();
        this.stage++;
        break;
      case (STAGES.FOUR):
        this.clearCanvas();
        this.addText(this.normalFont, 'Block ' + this.currentBlock);
        this.stage++;
        setTimeout(() => { this.stage++; }, this.textDelay);
        break;
      case (STAGES.FIVE):
        this.clearCanvas();
        this.addText(this.normalFont, 'Get Ready');
        this.stage++;
        setTimeout(() => { this.stage++; }, this.textDelay);
        break;
      case (STAGES.SIX):
        this.clearCanvas();
        this.addText(this.normalFont, '3');
        this.stage++;
        setTimeout(() => { this.stage++ ; }, this.textDelay);
        break;
      case (STAGES.SEVEN):
        this.clearCanvas();
        this.addText(this.normalFont, '2');
        this.stage++;
        setTimeout(() => { this.stage++; }, this.textDelay);
        break;
      case (STAGES.EIGHT):
        this.clearCanvas();
        this.addText(this.normalFont, '1');
        this.stage++;
        setTimeout(() => { this.stage++; }, this.textDelay);
        break;
      case (STAGES.NINE):
        this.clearCanvas();
        if (Math.random() < this.oddBallChance){
          this.drawColor = this.targetColor;
          this.trialType = 1;
        }else{
          this.trialType = 2;
          this.drawColor = this.controlColor;
        }
        this.textY = this.centerY;
        this.addText(this.normalFont, '+');
        const fixationTime = (Math.random() * this.fixationDeviation + this.fixationDelay) * 1000;
        this.stage ++;
        setTimeout(() => { this.stage ++; }, fixationTime);
        break;
      case (STAGES.TEN):
        this.resetTrial();
        this.clearCanvas();
        this.drawCircle();
        if (this.drawColor === this.targetColor){
          this.isTarget = true;
        }
        if (this.drawColor === this.controlColor){
          this.isControl = true;
        }

        this.startTime = Date.now();
        this.stage += 2;
        break;
      case (STAGES.ELEVEN):
        const dt = Date.now() - this.startTime;
        if (dt > this.circleTime){
          this.stage += 2;
        }
        break;
      case (STAGES.TWELVE):
        this.experimentalData.push([this.currentBlock, this.currentTrial, this.trialType, this.currentResponse, this.reactionTime]);
        if (this.currentBlock === this.numberBlocks && this.currentTrial === this.numberTrials){
          this.stage += 2;
        }else if (this.currentTrial === this.numberTrials){
          this.currentTrial = 1;
          this.currentBlock += 1;
          this.stage = STAGES.FOUR;
        } else if ( this.currentTrial < this.numberTrials ){
          this.currentTrial += 1;
          this.stage = STAGES.NINE;
        }
        break;

      case (STAGES.THIRTEEN):
        this.clearCanvas();
        this.addText(this.normalFont, 'Thanks for playing.');
        this.stage++;
        setTimeout(() => { this.stage++; }, 3000);
        break;

      case (STAGES.FOURTEEN):
        this.clearCanvas();
        this.stopRecording();
        console.log('This is the target variables', this.targetTracker[0][0].filter(elem => elem > 1));
        console.log("This samles length", this.samples[0].length);
        console.log(" all tracker data", this.targetTracker);
        this.findChunks();
        this.processChunks(true);
        this.processChunks(false);
        this.plotReaction();
        this.stage++;
        setTimeout(() => { this.resetGame(); this.stage = 1; }, 3000);
    }
  }

  // Used to find the required chunks of sample data
  findChunks(): void {
    this.shouldPlot = true;
    // Capture control indexes
    let indexOffset = 0; // Used to combine block data to one set of indices
    let chunkIndex = 0;
    for (let b = 0; b < this.numberBlocks; b++){
      if (b > 0){
        // Plus one to account for 0 being a valid index in the next block
        indexOffset += this.targetTracker[this.selectedElectrodeIdx][b - 1].length + 1;
      }
      let index = this.targetTracker[this.selectedElectrodeIdx][b].indexOf(this.constVal, 0);
      console.log("This is the first index", index);
      // Want the index fifty locations less than value
      this.controlChunkIndices.push([(index > 50) ? index - 50 + indexOffset : 0 + indexOffset]);
      let tempIndex = 0;

      while ( index > 0) {
        tempIndex = (tempIndex + 1) % 2;
        if (tempIndex === 1){
          index = this.targetTracker[this.selectedElectrodeIdx][b].indexOf(0, index);
          this.controlChunkIndices[chunkIndex].push((index < 0 ) ?
                   this.targetTracker[this.selectedElectrodeIdx][b].length - 1 + indexOffset : index + 199 + indexOffset);
          chunkIndex += 1;
        }
        if (tempIndex === 0) {
          index = this.targetTracker[this.selectedElectrodeIdx][b].indexOf(this.constVal, index);
          if (index < 0){
            break;
          }
          this.controlChunkIndices.push([(index > 50) ? index - 50 + indexOffset : 0 + indexOffset]);
        }
      }
    }
    // Capture target indexes
    chunkIndex = 0;
    indexOffset = 0; // Used to combine block data to one set of indices
    for (let b = 0; b < this.numberBlocks; b++){
      // Update index offset
      if (b > 0){
        // Plus one to account for 0 being a valid index in the next block
        indexOffset += this.targetTracker[this.selectedElectrodeIdx][b - 1].length + 1;
        console.log("index offset in target", indexOffset);
      }

      let index = this.targetTracker[this.selectedElectrodeIdx][b].indexOf(this.targetVal, 0);
      this.targetChunkIndices.push([(index > 50) ? index - 50 + indexOffset : 0 + indexOffset]);
      let tempIndex = 0;

      while ( index > 0) {
        tempIndex = (tempIndex + 1) % 2;
        if (tempIndex === 1){
          index = this.targetTracker[this.selectedElectrodeIdx][b].indexOf(0, index);
          this.targetChunkIndices[chunkIndex].push((index < 0 ) ? this.targetTracker[
            this.selectedElectrodeIdx][b].length - 1 + indexOffset : index + 199 + indexOffset);
          chunkIndex += 1;
        }
        if (tempIndex === 0) {
          index = this.targetTracker[this.selectedElectrodeIdx][b].indexOf(this.targetVal, index);
          if (index < 0){
            break;
          }
          this.targetChunkIndices.push([(index > 50) ? index - 50 + indexOffset : 0 + indexOffset]);
        }
      }
    }
    console.log("This is the chunk control indices", this.controlChunkIndices);
    console.log("This is the target control indices", this.targetChunkIndices);
    console.log("These are the samples", this.samples);

  }

  // Used to clean chunks by subtracting mean and taking averages of chunks
  processChunks(isTarget: boolean): void {
    const channelData = this.samples[this.selectedElectrodeIdx];
    let minChunkLen = 100000;
    if (isTarget){
      this.targetAvgLine = [];
    }else{
      this.controlAvgLine = [];
    }

    const allChunks = [];
    for (const iPair of (isTarget) ? this.targetChunkIndices : this.controlChunkIndices){
      // Get the chunk
      let chunk = channelData.slice(iPair[0], iPair[1]);
      //console.log("This is the chunk", chunk);
      // save smallest chunk length
      minChunkLen = Math.min(minChunkLen, chunk.length);
      if (isTarget){
        //console.log("This is the chunk", chunk);
        console.log("difference", (Math.abs(Math.max(...chunk) - Math.min(...chunk))));
      }

      if (Math.abs(Math.max(...chunk) - Math.min(...chunk)) > this.maxVariation ) {
        // skipping chunks with a maximum creater than 75 microvolts
        continue;
      }
      const avg = this.incomingData.average(chunk.slice(0, 50));
      console.log("mean is ", avg);
      chunk = chunk.map(elem => elem - avg);
      allChunks.push(chunk);
    }

    const numChunks = allChunks.length;
    if (numChunks === 0){
      // no matching chunks
      console.log("no matching chunks");
      return;
    }
    for (let i = 0; i < minChunkLen; i++){
      let sum = 0;
      for (let ch = 0; ch < numChunks; ch++){
        sum += allChunks[ch][i];
      }
      (isTarget) ? this.targetAvgLine.push(sum / numChunks) : this.controlAvgLine.push(sum / numChunks);
    }

  }

  // Used to display averages on chart
  plotReaction(): void {
    // If no samples or no target circles then return
    if (this.samples[this.selectedElectrodeIdx] === undefined || this.targetTracker[this.selectedElectrodeIdx] === undefined){
      return;
    }
    this.chart.data.labels.length = 0;
    // Want to save labels for the shortest set of data so that the averages are comparable
    let useControlLabel = true;
    if (this.targetAvgLine.length < this.controlAvgLine.length) {
      useControlLabel = false;
    }
    for (let i = 0; i < 2; i++){
       // remove old data by setting length to 0
      this.chart.data.datasets[i].data.length = 0;

      if (i === 0){
        this.controlAvgLine.forEach((val: number, ind: number) => { this.chart.data.datasets[i].data.push(val);
                                                                    if (useControlLabel){ this.chart.data.labels.push(ind); }});
      }else{
        this.targetAvgLine.forEach((val: number, ind: number) => { this.chart.data.datasets[i].data.push(val);
                                                                   if (!useControlLabel){ this.chart.data.labels.push(ind); }});
      }

    }
    this.chart.update();
    //console.log("target control line", this.targetAvgLine);
    //console.log("control line", this.controlAvgLine);
  }

  // Used to add new lines to the game canvas
  addNewLine(): void {
    this.textY += 25;
  }

  // used to add text messages on the canvas
  addText(font: string, text: string): void {
    this.context.textAlign = this.hAlign as CanvasTextAlign;
    this.context.font = font;
    this.context.fillStyle = this.textColor;
    this.context.fillText(text, this.centerX, this.textY);
    this.lastText = text;
  }

  drawCircle(): void {
    this.context.arc(this.centerX, this.centerY, this.radius, this.startAngle, this.endAngle);
    this.context.fillStyle = this.drawColor;
    this.context.fill();
  }

  // Clear the canvas and reset important locators
  clearCanvas(): void{
    this.textY = this.context.canvas.height / 5;
    this.context.fillStyle = this.canvasColor;
    this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);
    this.isTarget = false;
    this.isControl = false;
  }

  // Used to check if there are any messages to display
  checkWarning(): boolean {
    return this.messagesService.isWarning;
  }

  // Clear messages after they have been displayed
  resetWarning(): void {
    this.messagesService.resetWarning();
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

  // Used to get the warning message
  get getWarningMessage(): string {
    return this.messagesService.warningMessage;
  }
}
