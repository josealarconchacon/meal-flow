import { Recipe } from './recipe.model';

export interface MealPlan {
  id: string;
  userId: string;
  weekStartDate: string;
  days: MealPlanDay[];
}

export interface MealPlanDay {
  date: string;
  meals: {
    breakfast?: Recipe;
    lunch?: Recipe;
    dinner?: Recipe;
    snacks?: Recipe[];
  };
}

export interface GroceryList {
  id: string;
  mealPlanId: string;
  items: GroceryItem[];
  categories: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: string;
  isChecked: boolean;
  recipeId?: string;
}
