import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FrequencyBandsComponent } from './frequency-bands/frequency-bands.component';
import { FrequencySpectraComponent } from './frequency-spectra/frequency-spectra.component';
import { HeadViewComponent } from './head-view/head-view.component';
import { HeadsetInfoComponent } from './headset-info/headset-info.component';
import { RecorderComponent } from './recorder/recorder.component';
import { TimeSeriesComponent } from './time-series/time-series.component';
import { ConnectMuseComponent } from './connect-muse/connect-muse.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent,
    FrequencyBandsComponent,
    FrequencySpectraComponent,
    HeadViewComponent,
    HeadsetInfoComponent,
    RecorderComponent,
    TimeSeriesComponent,
    ConnectMuseComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
