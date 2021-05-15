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
import { HomeComponent } from './home/home.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireStorageModule } from '@angular/fire/storage';

// import { FirebaseService} from './service/firebase.service';
import { RegistrationComponent } from './auth/registration/registration.component';
import { LoginComponent } from './auth/login/login.component';
import { ModalComponent } from './shared/modal/modal.component';



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
    HomeComponent,
    RegistrationComponent,
    LoginComponent,
    ModalComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    FontAwesomeModule,
    AngularFireModule.initializeApp({
    apiKey: "AIzaSyDDM2BtjOiRlUJ-eEzTlUkEyjEdGNILID8",
    authDomain: "krigolsonlab-49287.firebaseapp.com",
    projectId: "krigolsonlab-49287",
    storageBucket: "krigolsonlab-49287.appspot.com",
    messagingSenderId: "321523846501",
    appId: "1:321523846501:web:b94291907699d1caab258c"
  }),
    AngularFirestoreModule,
    AngularFireAuthModule,
    AngularFireStorageModule
  ],
  providers: [DataService, ChartService, MessagesService],
  bootstrap: [AppComponent]
})
export class AppModule { }
