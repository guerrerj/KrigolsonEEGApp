import { MessagesService } from './shared/messages.servce';
import { ChartService } from './shared/chart.service';
import { DataService } from './shared/dataService';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FrequencyBandsComponent } from './frequency-bands/frequency-bands.component';
import { FrequencySpectraComponent } from './frequency-spectra/frequency-spectra.component';
import { HeadViewComponent } from './head-view/head-view.component';
import { HeadsetInfoComponent } from './headset-info/headset-info.component';
import { FrequencyExperimentsComponent } from './frequency-experiments/frequency-experiments.component';
import { TimeSeriesComponent } from './time-series/time-series.component';
import { FormsModule } from '@angular/forms';
import { BciComponent } from './bci/bci.component';
import { ErpComponent } from './erp/erp.component';
import { EcgComponent } from './ecg/ecg.component';
import { HomeComponent } from './home/home.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@NgModule({
  declarations: [
    AppComponent,
    FrequencyBandsComponent,
    FrequencySpectraComponent,
    HeadViewComponent,
    HeadsetInfoComponent,
    FrequencyExperimentsComponent,
    TimeSeriesComponent,
    BciComponent,
    ErpComponent,
    EcgComponent,
    HomeComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    FontAwesomeModule
  ],
  providers: [DataService, ChartService, MessagesService],
  bootstrap: [AppComponent]
})
export class AppModule { }
