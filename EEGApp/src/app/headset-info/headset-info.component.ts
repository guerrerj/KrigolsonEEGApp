import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { MuseControlResponse } from 'muse-js';
import { map, filter } from 'rxjs/operators';

@Component({
  selector: 'app-headset-info',
  templateUrl: './headset-info.component.html',
  styleUrls: ['./headset-info.component.less']
})
export class HeadsetInfoComponent implements OnInit, OnChanges {
  @Input() controlResponses: Observable<MuseControlResponse>;

  headsetName: Observable<string>;
  firmwareVersion: Observable<string>;
  hardwareVersion: Observable<string>;

  constructor() { }

  ngOnInit(): void {
  }

  ngOnChanges(): void {
    if (this.controlResponses) {
      const cr = this.controlResponses;
      this.headsetName = cr.pipe(map(response => response.hn), filter(Boolean)) as Observable<string>;
      this.firmwareVersion = cr.pipe(map(response => response.fw), filter(Boolean)) as Observable<string>;
      this.hardwareVersion = cr.pipe(map(response => response.hw), filter(Boolean)) as Observable<string>;
    }
  }
}
