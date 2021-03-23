import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';

import { AuthService} from '../auth/auth.service'
import { tap, map, take } from 'rxjs/operators';
import * as firebase from '../../../node_modules/firebase/app';
import  auth  from "../../../node_modules/firebase";
import { User } from '../auth/user.model'; // optional

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  // canActivate(
  //   route: ActivatedRouteSnapshot,
  //   state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
  //   return true;
  // }

  user$: Observable<User>;

 canActivate(next, state): Observable<boolean> {
    return this.user$.pipe(
      take(1),
      map(user => !!user), // <-- map to boolean
      tap(loggedIn => {
        if (!loggedIn) {
          console.log('access denied');
          // this.router.navigate(['/']);
        }
      })
    );
  }
}
