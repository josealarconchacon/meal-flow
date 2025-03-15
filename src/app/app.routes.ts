import { Routes } from '@angular/router';
import { RecipeListComponent } from './components/recipe-list/recipe-list.component';
import { MealPlanComponent } from './components/meal-plan/meal-plan.component';
import { GroceryListComponent } from './components/grocery-list/grocery-list.component';

export const routes: Routes = [
  { path: '', redirectTo: '/recipes', pathMatch: 'full' },
  { path: 'recipes', component: RecipeListComponent },
  { path: 'meal-plan', component: MealPlanComponent },
  { path: 'grocery-list', component: GroceryListComponent },
  // Add more routes as we create more components
  { path: '**', redirectTo: '/recipes' },
];
