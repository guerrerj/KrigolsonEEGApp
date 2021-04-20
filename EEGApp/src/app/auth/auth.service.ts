// import { Injectable } from '@angular/core';
// import { Router } from '@angular/router';
// import { User } from './user.model'; // optional

// import  auth  from "../../../node_modules/firebase"
// import { AngularFireAuth } from '@angular/fire/auth';
// import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';

// import { Observable, of } from 'rxjs';
// import { switchMap } from 'rxjs/operators';
// import * as firebase from '../../../node_modules/firebase/app';

// @Injectable({
//   providedIn: 'root'
// })

// export class AuthService {

// user$: Observable<User>;

//     constructor(
//         private afAuth: AngularFireAuth,
//         private afs: AngularFirestore,
//         private router: Router
//     ) {  this.user$ = this.afAuth.authState.pipe(
//         switchMap(user => {
//             // Logged in
//           if (user) {
//             return this.afs.doc<User>(`users/${user.uid}`).valueChanges();
//           } else {
//             // Logged out
//             return of(null);
//           }
//         })
//       )
//     }

//   async googleSignin() {
//     const provider = new firebase.default.auth.GoogleAuthProvider();
//     const credential = await this.afAuth.signInWithPopup(provider);
//     return this.updateUserData(credential.user);
//   }

//   private updateUserData(user) {
//     // Sets user data to firestore on login
//     const userRef: AngularFirestoreDocument<User> = this.afs.doc(`users/${user.uid}`);

//     const data = { 
//       uid: user.uid, 
//       email: user.email, 
//       userName: user.userName, 
//       university: user.university
//     } 

//     return userRef.set(data, { merge: true })

//   }

//   async signOut() {
//     await this.afAuth.signOut();
//     // this.router.navigate(['/']);
//   }
   
// }


import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { ThrowStmt } from '@angular/compiler';
import { BehaviorSubject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private eventAuthError = new BehaviorSubject<string>("");
  eventAuthError$ = this.eventAuthError.asObservable();

  newUser: any;

  constructor(
    private afAuth: AngularFireAuth,
    private db: AngularFirestore,
    private router: Router) { }

  getUserState() {
    return this.afAuth.authState;
  }

  login( email: string, password: string) {
    this.afAuth.signInWithEmailAndPassword(email, password)
      .catch(error => {
        this.eventAuthError.next(error);
      })
      .then(userCredential => {
        if(userCredential) {
          this.router.navigate(['/home']);
        }
      })
  }

  createUser(user) {
    console.log(user);
    this.afAuth.createUserWithEmailAndPassword( user.email, user.password)
      .then( userCredential => {
        this.newUser = user;
        console.log(userCredential);
        userCredential.user.updateProfile( {
          displayName: user.firstName + ' ' + user.lastName
        });

        this.insertUserData(userCredential)
          .then(() => {
            this.router.navigate(['/home']);
          });
      })
      .catch( error => {
        this.eventAuthError.next(error);
      });
  }

  insertUserData(userCredential: firebase.default.auth.UserCredential) {
    return this.db.doc(`Users/${userCredential.user.uid}`).set({
      email: this.newUser.email,
      firstname: this.newUser.firstName,
      lastname: this.newUser.lastName,
      role: 'network user'
    })
  }

  logout() {
    return this.afAuth.signOut();
  }
}