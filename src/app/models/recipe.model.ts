export interface Recipe {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  ingredients: Ingredient[];
  instructions: string[];
  tags: string[];
  isFavorite: boolean;
  userId: string;
  username: string;
  userAvatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  category?: string;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}
