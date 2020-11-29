import { Component, OnInit, Input } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { EEGSample, channelNames } from 'muse-js';

@Component({
  selector: 'app-recorder',
  templateUrl: './recorder.component.html',
  styleUrls: ['./recorder.component.less']
})
export class RecorderComponent implements OnInit {
  @Input() data: Observable<EEGSample>;

  recording = false;

  private samples: number[][];
  private subscription: Subscription;

  constructor() { }

  ngOnInit(): void {
  }

  startRecording(): void {
    this.recording = true;
    this.samples = [];
    this.subscription = this.data.subscribe(sample => {
      this.samples.push([sample.timestamp, ...sample.data]);
    });
  }

  stopRecording(): void {
    this.recording = false;
    this.subscription.unsubscribe();
    this.saveToCsv(this.samples);
  }

  get sampleCount(): number {
    return this.samples.length;
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
}
