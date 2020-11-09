import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';

import { MuseClient, MuseControlResponse, zipSamples, EEGSample } from 'muse-js';
import { Observable, Subject } from 'rxjs';
import { map, share, tap, takeUntil } from 'rxjs/operators';

import { XYZ } from '../head-view/head-view.component';

@Component({
  selector: 'app-connect-muse',
  templateUrl: './connect-muse.component.html',
  styleUrls: ['./connect-muse.component.less']
})
export class ConnectMuseComponent implements OnInit, OnDestroy {

  constructor(private cd: ChangeDetectorRef) {
  }

  time = 2;
  connecting = false;
  connected = false;
  data: Observable<EEGSample> | null;
  batteryLevel: Observable<number> | null;
  controlResponses: Observable<MuseControlResponse>;
  accelerometer: Observable<XYZ>;
  destroy = new Subject<void>();

  private muse = new MuseClient();


  onUserInput(event: any): void {
    this.time = event.target.value;
  }

  ngOnInit(): void {
    this.muse.connectionStatus.pipe(
      takeUntil(this.destroy)
    )
      .subscribe(status => {
        this.connected = status;
        this.data = null;
        this.batteryLevel = null;
      });
  }

  ngOnDestroy(): void {
    this.destroy.next();
  }

  async connect(): Promise<any> {
    this.connecting = true;
   // this.snackBar.dismiss();
    try {
      await this.muse.connect();
      this.controlResponses = this.muse.controlResponses;
      await this.muse.start();
      this.data = this.muse.eegReadings.pipe(
        zipSamples,
        takeUntil(this.destroy),
        tap(() => this.cd.detectChanges()),
        share()
      );
      this.batteryLevel = this.muse.telemetryData.pipe(
        takeUntil(this.destroy),
        map(t => t.batteryLevel)
      );
      this.accelerometer = this.muse.accelerometerData.pipe(
        takeUntil(this.destroy),
        map(reading => reading.samples[reading.samples.length - 1])
      );
      await this.muse.deviceInfo();
    } catch (err) {
      // this.snackBar.open('Connection failed: ' + err.toString(), 'Dismiss');
    } finally {
      this.connecting = false;
    }
  }

  disconnect(): void {
    this.muse.disconnect();
  }

  get enableAux(): boolean {
    return this.muse.enableAux;
  }

  set enableAux(value: boolean) {
    this.muse.enableAux = value;
  }
}
