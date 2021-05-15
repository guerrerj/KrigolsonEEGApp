import { DataService } from './shared/dataService';
import { Component, OnInit, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
// import { FirebaseService } from './service/firebase.service';
import { AuthService } from './auth/auth.service';
import { Router } from '@angular/router';

@Component({
  providers: [DataService],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit {
  title = 'EEG Explorer';
  connectedCopy = false;
  connectingCopy = false;
  batteryLevel = 0;
  @ViewChild('headerModal') headerModal: TemplateRef<any>;
  @ViewChild('vc', {read: ViewContainerRef}) vc: ViewContainerRef;
  backdrop: any;
  user: any;

  constructor(private data: DataService, public auth: AuthService, private router: Router){}

  showConnectModal(): void {
    const view = this.headerModal.createEmbeddedView(null);
    this.vc.insert(view);
    this.headerModal.elementRef.nativeElement.previousElementSibling.classList.remove('fade');
    this.headerModal.elementRef.nativeElement.previousElementSibling.classList.add('modal-open');
    this.headerModal.elementRef.nativeElement.previousElementSibling.style.display = 'block';
  }

  closeConnectModal(): void {
    this.vc.clear();
  }

  ngOnInit(): void {
    this.data.connected.subscribe(val => this.connectedCopy = val);
    this.data.connecting.subscribe(val => this.connectingCopy = val);
    // this.data.batteryLevel.subscribe(val => this.batteryLevel = val); will need to do it at another location
    this.auth.getUserState()
      .subscribe( user => {
        this.user = user;
      })
  }

  login(): void {
    try {this.router.navigate(['/login']);}
    catch(e){
      console.log(e);
    }
  }

  logout(): void {
    this.auth.logout();
  }

  register(): void {
    try{this.router.navigate(['/registration']);}
     catch(e){
      console.log(e);
    }
  }


}
