import { FrequencyExperimentsComponent } from './frequency-experiments/frequency-experiments.component';
import { FormsModule } from '@angular/forms';
import { TimeSeriesComponent } from './time-series/time-series.component';
import { FrequencySpectraComponent } from './frequency-spectra/frequency-spectra.component';
import { FrequencyBandsComponent } from './frequency-bands/frequency-bands.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';


import { BciComponent } from './bci/bci.component';
import { EcgComponent } from './ecg/ecg.component';
import { ErpComponent } from './erp/erp.component';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  {path: 'home', component: HomeComponent},
  {path: 'frequency-bands', component : FrequencyBandsComponent},
  {path: 'frequency-spectra', component: FrequencySpectraComponent},
  {path: 'frequency-experiments', component: FrequencyExperimentsComponent},
  {path: 'time-series', component: TimeSeriesComponent},
  {path: 'bci', component: BciComponent},
  {path: 'ecg', component: EcgComponent},
  {path: 'erp', component: ErpComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes), CommonModule, FormsModule],
  exports: [RouterModule]
})
export class AppRoutingModule { }

