import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  firstValueFrom,
  from,
} from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { FirebaseMealService, MealPlanEntry } from './firebase-meal.service';
import { Recipe } from '../models/recipe.model';
import { RecipeService } from './recipe.service';

interface GroceryItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category?: string;
  isChecked: boolean;
}

export interface MealPlanWithRecipe extends MealPlanEntry {
  recipe?: Recipe | null;
}

@Injectable({
  providedIn: 'root',
})
export class MealPlanService {
  private groceryList = new BehaviorSubject<GroceryItem[]>([]);
  private isBrowser: boolean;

  constructor(
    private firebaseMealService: FirebaseMealService,
    private recipeService: RecipeService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    console.log('MealPlanService initialized');
    this.isBrowser = isPlatformBrowser(platformId);
    this.loadGroceryList();
  }

  private loadGroceryList(): void {
    if (!this.isBrowser) {
      this.groceryList.next([]);
      return;
    }

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

  getMealPlan(): Observable<MealPlanWithRecipe[]> {
    console.log('Getting meal plan');
    return this.firebaseMealService.getMealPlan().pipe(
      tap((meals) => console.log('Received meals from Firebase:', meals)),
      switchMap(async (meals) => {
        console.log('Attaching recipes to meals');
        const mealsWithRecipes = await this.attachRecipesToMeals(meals);
        console.log('Meals with recipes:', mealsWithRecipes);
        return mealsWithRecipes;
      })
    );
  }

  getMealsByDate(date: string): Observable<MealPlanWithRecipe[]> {
    console.log(`Getting meals for date: ${date}`);
    return this.firebaseMealService.getMealsByDate(date).pipe(
      tap((meals) =>
        console.log('Received meals for date from Firebase:', meals)
      ),
      switchMap(async (meals) => {
        console.log('Attaching recipes to meals for date');
        const mealsWithRecipes = await this.attachRecipesToMeals(meals);
        console.log('Meals with recipes for date:', mealsWithRecipes);
        return mealsWithRecipes;
      })
    );
  }

  private async attachRecipesToMeals(
    meals: MealPlanEntry[]
  ): Promise<MealPlanWithRecipe[]> {
    console.log('Starting to attach recipes to meals:', meals);
    const mealsWithRecipes = await Promise.all(
      meals.map(async (meal) => {
        console.log(`Fetching recipe for meal with recipeId: ${meal.recipeId}`);
        const recipe = await this.recipeService.getRecipeById(meal.recipeId);
        console.log(`Recipe found for ${meal.recipeId}:`, recipe);
        return {
          ...meal,
          recipe,
        };
      })
    );
    console.log('Finished attaching recipes to meals:', mealsWithRecipes);
    return mealsWithRecipes;
  }

  async addRecipeToMealPlan(
    recipeId: string,
    date: string,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks'
  ): Promise<void> {
    try {
      console.log(
        `Adding recipe ${recipeId} to meal plan for ${date} as ${mealType}`
      );

      // First, remove any existing meal for the same date and meal type
      const existingMeals = await firstValueFrom(
        this.firebaseMealService.getMealsByDate(date).pipe(
          tap((meals) => console.log('Found existing meals for date:', meals)),
          map((meals) => meals.filter((meal) => meal.mealType === mealType))
        )
      );

      console.log('Existing meals for this slot:', existingMeals);

      if (existingMeals && existingMeals.length > 0) {
        console.log('Removing existing meals');
        for (const meal of existingMeals) {
          if (meal.id) {
            console.log(`Removing meal with ID: ${meal.id}`);
            await this.firebaseMealService.removeMealFromPlan(meal.id);
          }
        }
      }

      // Add the new meal
      console.log('Adding new meal to plan');
      const result = await this.firebaseMealService.addMealToPlan({
        recipeId,
        date,
        mealType,
      });
      console.log('Successfully added meal with ID:', result);
    } catch (error) {
      console.error('Error in addRecipeToMealPlan:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }
      throw error;
    }
  }

  async removeFromMealPlan(
    date: string,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks'
  ): Promise<void> {
    try {
      console.log(`Removing meal from plan for ${date} and type ${mealType}`);
      const meals = await firstValueFrom(
        this.firebaseMealService.getMealsByDate(date).pipe(
          tap((meals) => console.log('Found meals to remove:', meals)),
          map((meals) => meals.filter((meal) => meal.mealType === mealType))
        )
      );

      if (meals) {
        console.log('Meals to remove:', meals);
        for (const meal of meals) {
          if (meal.id) {
            console.log(`Removing meal with ID: ${meal.id}`);
            await this.firebaseMealService.removeMealFromPlan(meal.id);
          }
        }
      }
    } catch (error) {
      console.error('Error removing from meal plan:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }
      throw error;
    }
  }

  async clearMealPlan(): Promise<void> {
    try {
      await this.firebaseMealService.clearMealPlan();
      this.clearGroceryList();
    } catch (error) {
      console.error('Error clearing meal plan:', error);
      throw error;
    }
  }

  // Grocery list methods (keeping these with localStorage for now)
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
}
