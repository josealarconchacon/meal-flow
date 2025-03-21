import { Routes } from '@angular/router';
import { RecipeListComponent } from './components/recipe-list/recipe-list.component';
import { MealPlanComponent } from './components/meal-plan/meal-plan.component';
import { GroceryListComponent } from './components/grocery-list/grocery-list.component';
import { QuickPostComponent } from './components/recipe-list/quick-post/quick-post.component';
import { UserProfileComponent } from './components/nav/user-profile.component';
import { EmailLinkSigninComponent } from './components/auth/email-link-signin.component';

export const routes: Routes = [
  { path: '', redirectTo: '/recipes', pathMatch: 'full' },
  { path: 'recipes', component: RecipeListComponent },
  { path: 'meal-plan', component: MealPlanComponent },
  { path: 'grocery-list', component: GroceryListComponent },
  { path: 'community', component: QuickPostComponent },
  { path: 'profile', component: UserProfileComponent },
  { path: 'sign-in', component: EmailLinkSigninComponent },
  // Add more routes as we create more components
  { path: '**', redirectTo: '/recipes' },
];
