import { DataService } from './../shared/dataService';
import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { timeout } from 'rxjs/operators';

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
@Component({
  selector: 'app-erp',
  templateUrl: './erp.component.html',
  styleUrls: ['./erp.component.less']
})
export class ErpComponent implements OnInit {

  @ViewChild('oddBallCanvas', {static: true})
  canvas: ElementRef<HTMLCanvasElement>;

  readonly oddBallChance = 0.25;
  readonly fixationDelay = 0.3;
  readonly fixationDeviation = 0.1;
  readonly circleTime = 500; // ms
  readonly colorOptions = ['black', 'silver', 'gray', 'maroon', 'red', 'purple',
   'fuchsia', 'green', 'lime', 'olive', 'yellow', 'navy', 'blue', 'teal', 'aqua', 'orange'];
  readonly radius = 30;
  readonly startAngle = 0;
  readonly endAngle = 2 * Math.PI;
  readonly headingFont = '25px bold serif';
  readonly smallFont = '15px serif';
  readonly normalFont = '20px serif';
  readonly textColor = 'black';
  readonly numberBlocks = 2;
  readonly numberTrials = 4;
  readonly textDelay = 1000; // ms
  readonly canvasColor = '#C7A27C';

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


  experimentalData: Array<any>;
  key: any;
  stage: number;

  private context: CanvasRenderingContext2D;

  constructor(private dataService: DataService) { }

  ngOnInit(): void {
    this.context = this.canvas.nativeElement.getContext('2d');
    this.centerX = this.context.canvas.width / 2;
    this.centerY = this.context.canvas.height / 4 * 3;
    this.textY = this.context.canvas.height / 4;
    this.stage = 1;
    this.playing = true;
    this.currentBlock = 1;
    this.currentTrial = 1;
    this.experimentalData = [];
    this.clearCanvas();

  }

  @HostListener('document:keypress', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): any {
    if ( event.key === KEY_CODE.SPACE && this.stage  < STAGES.THREE ){
      event.preventDefault();
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
  }

  animate(): void {
    this.playing = true;
    this.draw();
    requestAnimationFrame(this.animate.bind(this));
  }

  resetTrial(): void {
    this.startTime = 0;
    this.currentResponse = 0;
    this.reactionTime = 0;
  }

  draw(): void {
    switch (this.stage){
      case (STAGES.ONE):
        this.addText(this.headingFont, 'Welcome to the Oddball Game: Press space to continue.');
        this.textY += 25;
        this.addText(this.smallFont, 'Press space to continue');
        this.stage++;
        break;
      case (STAGES.TWO):
        this.clearCanvas();
        this.addText(this.normalFont, 'You are going to see a series of circles that appear and disappear');
        this.addNewLine();
        this.addText(this.normalFont, 'in the middle of the screen. If you see a circle with the same color');
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
        this.playing = false;
        this.stage = 1;
        this.clearCanvas();
    }
  }

  addNewLine(): void {
    this.textY += 25;
  }

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
    this.textY = this.context.canvas.height / 4;
    this.context.fillStyle = this.canvasColor;
    this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);
  }

}
