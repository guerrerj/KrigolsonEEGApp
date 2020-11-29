import { ChangeDetectorRef, OnDestroy, Injectable } from '@angular/core';

import { MuseClient, MuseControlResponse, zipSamples, EEGSample } from 'muse-js';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { map, share, tap, takeUntil } from 'rxjs/operators';


/* This service is responsible for connecting the web app to the muse
   and publishing the data to all the components in the project
*/
@Injectable()
export class DataService implements  OnDestroy {

  constructor(private cd: ChangeDetectorRef) {
    this.onInit(); // Link muse connection status to service variable connected
  }

  connecting = new BehaviorSubject(false);
  connected = new BehaviorSubject(false);
  data: Observable<EEGSample> | null;
  batteryLevel: Observable<number> | null;
  controlResponses: Observable<MuseControlResponse>;
  destroy = new Subject<void>();

  private muse = new MuseClient();

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

  // main function that connects to muse
  // Is run asynchronously and sets appropriate
  // connected flags and subscribes data variable
  async connect(): Promise<any> {
    this.connecting.next(true);

    try {
      await this.muse.connect();
      this.controlResponses = this.muse.controlResponses;
      await this.muse.start(); // start taking readings from muse

      // Subscribe to the data of the muse
      this.data = this.muse.eegReadings.pipe(
        zipSamples,
        takeUntil(this.destroy),
        tap(() => this.cd.detectChanges()),
        share()
      );

      // Subscribe to the battery level of the muse
      this.batteryLevel = this.muse.telemetryData.pipe(
        takeUntil(this.destroy),
        map(t => t.batteryLevel)
      );
      await this.muse.deviceInfo();
    } catch (err) {
      // Log errors
      console.log("Error is " , err);
    } finally {
      // set connecting to false after connection is successful
      this.connecting.next(false);
    }
  }

  disconnect(): void {
    this.muse.disconnect();
  }

}
