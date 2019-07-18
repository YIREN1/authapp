import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HttpModule } from '@angular/http';


import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { HomeComponent } from './components/home/home.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProfileComponent } from './components/profile/profile.component';
import { SigninSignupComponent } from './components/signin-signup/signin-signup.component';

import { ValidateService } from './services/validate.service';
import { AuthService } from './services/auth.service';

import { AuthGuard } from './guards/auth.guard';
import { Page404Component } from './page404/page404.component';


const appRoutes: Routes = [
  {path:'', component:HomeComponent}, //canActivate:[AnonAuthGuard]},
  {path:'dashboard', component:DashboardComponent, canActivate:[AuthGuard]},
  {path:'profile/:profilename', component:ProfileComponent},
  {path:'**', component: Page404Component, pathMatch: 'full'} // All unmatched routes
];

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    HomeComponent,
    DashboardComponent,
    ProfileComponent,
    SigninSignupComponent,
    Page404Component,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RouterModule.forRoot(appRoutes),
    FormsModule,
    NgbModule,
    HttpModule,
  ],
  providers: [
    ValidateService,
    AuthService,
    AuthGuard,
  ],
  bootstrap: [AppComponent],
  entryComponents: [SigninSignupComponent],
})
export class AppModule { }
