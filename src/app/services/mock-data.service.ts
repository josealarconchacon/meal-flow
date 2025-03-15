import { Injectable } from '@angular/core';
import { Recipe } from '../models/recipe.model';

@Injectable({
  providedIn: 'root',
})
export class MockDataService {
  private recipes: Recipe[] = [
    {
      id: '1',
      title: 'Grilled Chicken Salad',
      description:
        'A healthy and delicious grilled chicken salad with fresh vegetables and homemade dressing.',
      prepTime: 15,
      cookTime: 20,
      servings: 4,
      difficulty: 'Easy',
      imageUrl: 'assets/images/grilled-chicken-salad.jpg',
      ingredients: [
        {
          id: '1',
          name: 'Chicken breast',
          amount: 2,
          unit: 'pieces',
          category: 'Meat',
        },
        {
          id: '2',
          name: 'Mixed greens',
          amount: 4,
          unit: 'cups',
          category: 'Produce',
        },
        {
          id: '3',
          name: 'Cherry tomatoes',
          amount: 1,
          unit: 'cup',
          category: 'Produce',
        },
        {
          id: '4',
          name: 'Cucumber',
          amount: 1,
          unit: 'piece',
          category: 'Produce',
        },
        {
          id: '5',
          name: 'Olive oil',
          amount: 2,
          unit: 'tbsp',
          category: 'Pantry',
        },
      ],
      instructions: [
        'Season chicken breasts with salt and pepper',
        'Grill chicken for 6-8 minutes per side',
        'Chop vegetables and prepare the salad base',
        'Slice grilled chicken and arrange on top',
        'Drizzle with dressing and serve',
      ],
      nutritionInfo: {
        calories: 350,
        protein: 28,
        carbs: 12,
        fat: 18,
        fiber: 4,
      },
      dietaryInfo: ['High Protein', 'Low Carb', 'Gluten-Free'],
      category: 'Main Course',
      tags: ['Healthy', 'Salad', 'Chicken', 'Quick'],
      rating: 4.5,
      reviews: 128,
      isFavorite: false,
    },
    {
      id: '2',
      title: 'Vegetarian Buddha Bowl',
      description:
        'A nourishing bowl filled with quinoa, roasted vegetables, and tahini dressing.',
      prepTime: 20,
      cookTime: 30,
      servings: 2,
      difficulty: 'Medium',
      imageUrl: 'assets/images/buddha-bowl.jpg',
      ingredients: [
        { id: '6', name: 'Quinoa', amount: 1, unit: 'cup', category: 'Grains' },
        {
          id: '7',
          name: 'Sweet potato',
          amount: 1,
          unit: 'large',
          category: 'Produce',
        },
        {
          id: '8',
          name: 'Chickpeas',
          amount: 1,
          unit: 'can',
          category: 'Pantry',
        },
        { id: '9', name: 'Kale', amount: 2, unit: 'cups', category: 'Produce' },
        {
          id: '10',
          name: 'Tahini',
          amount: 2,
          unit: 'tbsp',
          category: 'Pantry',
        },
      ],
      instructions: [
        'Cook quinoa according to package instructions',
        'Roast sweet potato and chickpeas',
        'Massage kale with olive oil',
        'Prepare tahini dressing',
        'Assemble bowls with all ingredients',
      ],
      nutritionInfo: {
        calories: 450,
        protein: 15,
        carbs: 65,
        fat: 20,
        fiber: 12,
      },
      dietaryInfo: ['Vegetarian', 'Vegan', 'Gluten-Free'],
      category: 'Main Course',
      tags: ['Vegetarian', 'Bowl', 'Healthy', 'Plant-based'],
      rating: 4.8,
      reviews: 95,
      isFavorite: false,
    },
  ];

  getRecipes(): Recipe[] {
    return this.recipes;
  }

  getRecipeById(id: string): Recipe | undefined {
    return this.recipes.find((recipe) => recipe.id === id);
  }

  getFavoriteRecipes(): Recipe[] {
    return this.recipes.filter((recipe) => recipe.isFavorite);
  }

  toggleFavorite(id: string): void {
    const recipe = this.recipes.find((r) => r.id === id);
    if (recipe) {
      recipe.isFavorite = !recipe.isFavorite;
    }
  }

  filterRecipes(filters: {
    dietary?: string[];
    difficulty?: string;
    maxPrepTime?: number;
    category?: string;
  }): Recipe[] {
    return this.recipes.filter((recipe) => {
      let matches = true;

      if (filters.dietary?.length) {
        matches =
          matches &&
          filters.dietary.every((diet) => recipe.dietaryInfo.includes(diet));
      }

      if (filters.difficulty) {
        matches = matches && recipe.difficulty === filters.difficulty;
      }

      if (filters.maxPrepTime) {
        matches = matches && recipe.prepTime <= filters.maxPrepTime;
      }

      if (filters.category) {
        matches = matches && recipe.category === filters.category;
      }

      return matches;
    });
  }
}
