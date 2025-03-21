import { Injectable } from '@angular/core';
import { Recipe } from '../models/recipe.model';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserService } from './user.service';
import { take } from 'rxjs/operators';
import { FirebaseRecipeService } from './firebase-recipe.service';

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  private recipes: Recipe[] = [
    {
      id: '1',
      title: 'Classic Spaghetti Carbonara',
      description:
        'A traditional Italian pasta dish made with eggs, cheese, pancetta, and black pepper.',
      imageUrl:
        'https://images.unsplash.com/photo-1612874742237-6526221588e3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
      category: 'Dinner',
      prepTime: 15,
      cookTime: 20,
      servings: 4,
      difficulty: 'Medium',
      ingredients: [
        { name: 'spaghetti', amount: 1, unit: 'pound' },
        { name: 'pancetta', amount: 8, unit: 'ounces' },
        { name: 'eggs', amount: 4, unit: 'large' },
        { name: 'Pecorino Romano', amount: 1, unit: 'cup' },
        { name: 'black pepper', amount: 2, unit: 'teaspoons' },
      ],
      instructions: [
        'Bring a large pot of salted water to boil',
        'Cook spaghetti according to package instructions',
        'Meanwhile, cook diced pancetta until crispy',
        'Whisk eggs and cheese in a bowl',
        'Combine hot pasta with egg mixture and pancetta',
        'Season with black pepper and serve immediately',
      ],
      tags: ['Italian', 'Pasta', 'Quick'],
      isFavorite: false,
      userId: 'system',
      username: 'MealFlow',
      userAvatarUrl:
        'https://ui-avatars.com/api/?name=Meal+Flow&background=random',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Quinoa Buddha Bowl',
      description:
        'A healthy and colorful bowl packed with protein-rich quinoa, roasted vegetables, and tahini dressing.',
      imageUrl:
        'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
      category: 'Lunch',
      prepTime: 20,
      cookTime: 30,
      servings: 2,
      difficulty: 'Easy',
      ingredients: [
        { name: 'quinoa', amount: 1, unit: 'cup' },
        { name: 'sweet potato', amount: 1, unit: 'large' },
        { name: 'chickpeas', amount: 15, unit: 'ounces' },
        { name: 'kale', amount: 2, unit: 'cups' },
        { name: 'tahini', amount: 2, unit: 'tablespoons' },
      ],
      instructions: [
        'Cook quinoa according to package instructions',
        'Roast diced sweet potato and chickpeas',
        'Massage kale with olive oil',
        'Make tahini dressing',
        'Assemble bowls with all ingredients',
        'Drizzle with dressing and serve',
      ],
      tags: ['Vegetarian', 'Healthy', 'Gluten-Free'],
      isFavorite: false,
      userId: 'system',
      username: 'MealFlow',
      userAvatarUrl:
        'https://ui-avatars.com/api/?name=Meal+Flow&background=random',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      title: 'Blueberry Overnight Oats',
      description:
        'A nutritious and easy breakfast prepared the night before with oats, yogurt, and fresh blueberries.',
      imageUrl:
        'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
      category: 'Breakfast',
      prepTime: 10,
      cookTime: 0,
      servings: 1,
      difficulty: 'Easy',
      ingredients: [
        { name: 'rolled oats', amount: 0.5, unit: 'cup' },
        { name: 'almond milk', amount: 0.5, unit: 'cup' },
        { name: 'yogurt', amount: 0.25, unit: 'cup' },
        { name: 'blueberries', amount: 0.5, unit: 'cup' },
        { name: 'honey', amount: 1, unit: 'tablespoon' },
      ],
      instructions: [
        'Combine oats and almond milk in a jar',
        'Add yogurt and honey, stir well',
        'Top with blueberries',
        'Refrigerate overnight',
        'Enjoy in the morning!',
      ],
      tags: ['Vegetarian', 'Healthy', 'Quick', 'Make-Ahead'],
      isFavorite: false,
      userId: 'system',
      username: 'MealFlow',
      userAvatarUrl:
        'https://ui-avatars.com/api/?name=Meal+Flow&background=random',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  private recipesSubject = new BehaviorSubject<Recipe[]>(this.recipes);

  constructor(
    private userService: UserService,
    private firebaseRecipeService: FirebaseRecipeService
  ) {}

  getRecipes(): Observable<Recipe[]> {
    return this.firebaseRecipeService.getRecipes();
  }

  getRecipesObservable(): Observable<Recipe[]> {
    return this.recipesSubject.asObservable();
  }

  async getRecipeById(id: string): Promise<Recipe | null> {
    return await this.firebaseRecipeService.getRecipeById(id);
  }

  toggleFavorite(id: string): void {
    const recipe = this.recipes.find((r) => r.id === id);
    if (recipe) {
      recipe.isFavorite = !recipe.isFavorite;
      this.recipesSubject.next([...this.recipes]);
    }
  }

  searchRecipes(query: string): Recipe[] {
    query = query.toLowerCase();
    return this.recipes.filter(
      (recipe) =>
        recipe.title.toLowerCase().includes(query) ||
        recipe.description.toLowerCase().includes(query) ||
        recipe.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }

  filterByCategory(category: string): Recipe[] {
    return category === 'All'
      ? this.recipes
      : this.recipes.filter((recipe) => recipe.category === category);
  }

  filterByTags(tags: string[]): Recipe[] {
    return this.recipes.filter((recipe) =>
      tags.every((tag) =>
        recipe.tags.map((t) => t.toLowerCase()).includes(tag.toLowerCase())
      )
    );
  }

  async addRecipe(recipe: Omit<Recipe, 'id'>): Promise<string> {
    return await this.firebaseRecipeService.addRecipe(recipe);
  }

  async updateRecipe(id: string, recipe: Partial<Recipe>): Promise<void> {
    await this.firebaseRecipeService.updateRecipe(id, recipe);
  }

  async deleteRecipe(id: string): Promise<void> {
    await this.firebaseRecipeService.deleteRecipe(id);
  }
}
