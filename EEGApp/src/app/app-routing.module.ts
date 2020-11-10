import { FormsModule } from '@angular/forms';
import { TimeSeriesComponent } from './time-series/time-series.component';
import { FrequencySpectraComponent } from './frequency-spectra/frequency-spectra.component';
import { FrequencyBandsComponent } from './frequency-bands/frequency-bands.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

const routes: Routes = [
  {path: 'frequency-bands', component : FrequencyBandsComponent},
  {path: 'frequency-spectra', component: FrequencySpectraComponent},
  {path: 'time-series', component: TimeSeriesComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes), CommonModule, FormsModule],
  exports: [RouterModule]
})
export class AppRoutingModule { }
