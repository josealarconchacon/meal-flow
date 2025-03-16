import { Recipe } from '../../../models/recipe.model';

export interface DayPlan {
  date: string;
  label: string;
  meals: {
    breakfast?: Recipe;
    lunch?: Recipe;
    dinner?: Recipe;
    snacks?: Recipe;
  };
}
