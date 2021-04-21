import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less']
})
export class HomeComponent implements OnInit {

  user: any;

  constructor(private auth: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.auth.getUserState()
      .subscribe( user => {
        this.user = user;
      })
  }

  login(): void {
    try {this.router.navigate(['/login']);}
    catch (e) {
      console.log(e);
    }
  }

  logout(): void {
    this.auth.logout();
  }

  register(): void {
    this.router.navigate(['/registration']);
  }
}
