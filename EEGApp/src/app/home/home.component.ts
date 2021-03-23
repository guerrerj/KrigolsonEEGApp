import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less']
})
export class HomeComponent implements OnInit {

  // user: firebase.User;

  user: any;

  constructor(private auth: AuthService, 
    private router: Router) { }

  ngOnInit() {
    this.auth.getUserState()
      .subscribe( user => {
        this.user = user;
      })
  }

  login() {
    try {this.router.navigate(['/login']);}
    catch(e){
    	console.log(e);
    }
  }

  logout() {
    this.auth.logout();
  }

  register() {
    this.router.navigate(['/registration']);
  }
}