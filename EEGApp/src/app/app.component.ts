import { DataService } from './shared/dataService';
import { Component, OnInit, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';

@Component({
  providers: [DataService],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit {
  title = 'EEGApp';
  connectedCopy = false;
  connectingCopy = false;
  batteryLevel = 0;
  @ViewChild('headerModal') headerModal: TemplateRef<any>;
  @ViewChild('vc', {read: ViewContainerRef}) vc: ViewContainerRef;
  backdrop: any;

  constructor(private data: DataService){}

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

  }
}
