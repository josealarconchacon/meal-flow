import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Recipe, Ingredient } from '../models/recipe.model';
import { isPlatformBrowser } from '@angular/common';

interface MealPlanEntry {
  recipeId: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
}

interface GroceryItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category?: string;
  isChecked: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class MealPlanService {
  private mealPlan = new BehaviorSubject<MealPlanEntry[]>([]);
  private groceryList = new BehaviorSubject<GroceryItem[]>([]);
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.loadStoredData();
  }

  private loadStoredData(): void {
    if (this.isBrowser) {
      // Load saved meal plan from localStorage if available
      const savedMealPlan = localStorage.getItem('mealPlan');
      if (savedMealPlan) {
        try {
          this.mealPlan.next(JSON.parse(savedMealPlan));
        } catch (e) {
          console.error('Error parsing stored meal plan:', e);
          this.mealPlan.next([]);
        }
      }

      // Load saved grocery list from localStorage if available
      const savedGroceryList = localStorage.getItem('groceryList');
      if (savedGroceryList) {
        try {
          this.groceryList.next(JSON.parse(savedGroceryList));
        } catch (e) {
          console.error('Error parsing stored grocery list:', e);
          this.groceryList.next([]);
        }
      }
    }
  }

  getMealPlan(): Observable<MealPlanEntry[]> {
    return this.mealPlan.asObservable();
  }

  getMealsByDate(date: string): Observable<MealPlanEntry[]> {
    return this.mealPlan.pipe(
      map((meals) => meals.filter((meal) => meal.date === date))
    );
  }

  addRecipeToMealPlan(
    recipeId: string,
    date: string,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks'
  ): void {
    const currentMealPlan = this.mealPlan.value;

    // Remove any existing meal for the same date and meal type
    const filteredMealPlan = currentMealPlan.filter(
      (meal) => !(meal.date === date && meal.mealType === mealType)
    );

    // Add the new meal
    const updatedMealPlan = [...filteredMealPlan, { recipeId, date, mealType }];

    this.mealPlan.next(updatedMealPlan);
    this.saveMealPlan(updatedMealPlan);
  }

  removeFromMealPlan(
    date: string,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks'
  ): void {
    const updatedMealPlan = this.mealPlan.value.filter(
      (meal) => !(meal.date === date && meal.mealType === mealType)
    );

    this.mealPlan.next(updatedMealPlan);
    this.saveMealPlan(updatedMealPlan);
  }

  clearMealPlan(): void {
    this.mealPlan.next([]);
    if (this.isBrowser) {
      localStorage.removeItem('mealPlan');
    }
    this.clearGroceryList();
  }

  getGroceryList(): Observable<GroceryItem[]> {
    return this.groceryList.asObservable();
  }

  updateGroceryList(items: GroceryItem[]): void {
    this.groceryList.next(items);
    if (this.isBrowser) {
      localStorage.setItem('groceryList', JSON.stringify(items));
    }
  }

  toggleGroceryItem(itemId: string): void {
    const updatedItems = this.groceryList.value.map((item) =>
      item.id === itemId ? { ...item, isChecked: !item.isChecked } : item
    );
    this.updateGroceryList(updatedItems);
  }

  clearGroceryList(): void {
    this.groceryList.next([]);
    if (this.isBrowser) {
      localStorage.removeItem('groceryList');
    }
  }

  private saveMealPlan(mealPlan: MealPlanEntry[]): void {
    if (this.isBrowser) {
      localStorage.setItem('mealPlan', JSON.stringify(mealPlan));
    }
  }
}
