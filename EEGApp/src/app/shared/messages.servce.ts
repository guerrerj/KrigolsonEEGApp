import { ChangeDetectorRef, OnDestroy, Injectable, OnInit } from '@angular/core';

import { MuseClient, MuseControlResponse, zipSamples, EEGSample } from 'muse-js';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { map, share, tap, takeUntil } from 'rxjs/operators';


/* This service is responsible for displaying messages in the
  application (TODO: add logging functionality)
*/
@Injectable()
export class MessagesService {

  isWarning: boolean;
  warningMessage: string;

  constructor() {
    this.isWarning = false;
    this.warningMessage = '';
  }

  // Reset any warning messages displayed to user
  resetWarning(): void{
    this.isWarning = false;
    this.warningMessage = '';
  }

  // Set the warning message
  setWarning(message: string): void {
    this.isWarning = true;
    this.warningMessage = message;

    setTimeout(()=>{
        this.resetWarning();
      }, 5000); // five seconds delay
  }
}
