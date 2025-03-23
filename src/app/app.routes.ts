import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ProfileComponent } from './components/header/profile/profile.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'profile', component: ProfileComponent },
  {
    path: 'settings',
    loadComponent: () =>
      import('./components/header/profile/settings/settings.component').then(
        (m) => m.SettingsComponent
      ),
  },
];
