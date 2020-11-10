import { Component, ChangeDetectorRef, OnInit, OnDestroy, Injectable } from '@angular/core';

import { MuseClient, MuseControlResponse, zipSamples, EEGSample } from 'muse-js';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { map, share, tap, takeUntil } from 'rxjs/operators';

import { XYZ } from '../head-view/head-view.component';

// @Component({
//   selector: 'app-connect-muse',
//   templateUrl: './connect-muse.component.html',
//   styleUrls: ['./connect-muse.component.less']
// })
@Injectable()
export class DataService implements  OnDestroy {

  constructor(private cd: ChangeDetectorRef) {
    this.onInit();
    console.log("Initialization of data service class");
  }

  time = 2;
  connecting = new BehaviorSubject(false);
  connected = new BehaviorSubject(false);
  data: Observable<EEGSample> | null;
  batteryLevel: Observable<number> | null;
  controlResponses: Observable<MuseControlResponse>;
  accelerometer: Observable<XYZ>;
  destroy = new Subject<void>();

  private muse = new MuseClient();


  onUserInput(event: any): void {
    this.time = event.target.value;
  }

  onInit(): void {
    this.muse.connectionStatus.pipe(
      takeUntil(this.destroy)
    )
      .subscribe(status => {
        this.connected.next(status);
        this.data = null;
        this.batteryLevel = null;
      });
  }

  ngOnDestroy(): void {
    this.destroy.next();
  }

  async connect(): Promise<any> {
    console.log("This is the connecting object", this.connecting);
    this.connecting.next(true);
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
      console.log("Error is " , err);
    } finally {
      this.connecting.next(false);
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
