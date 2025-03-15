import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Recipe } from '../../models/recipe.model';
import { RecipeService } from '../../services/recipe.service';
import { RecipeDetailModalComponent } from '../recipe-detail-modal/recipe-detail-modal.component';

@Component({
  selector: 'app-recipe-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RecipeDetailModalComponent],
  template: `
    <div class="container mx-auto px-4 py-8">
      <!-- Search and Filter Section -->
      <div class="mb-8">
        <div
          class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6"
        >
          <div class="relative flex-1">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (ngModelChange)="filterRecipes()"
              placeholder="Search recipes..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <i
              class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            ></i>
          </div>
          <div class="flex gap-2">
            <button
              *ngFor="let category of categories"
              (click)="toggleCategory(category)"
              [class]="
                selectedCategories.includes(category)
                  ? 'px-4 py-2 bg-indigo-600 text-white rounded-full text-sm'
                  : 'px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200'
              "
            >
              {{ category }}
            </button>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            *ngFor="let tag of commonTags"
            (click)="toggleTag(tag)"
            [class]="
              selectedTags.includes(tag)
                ? 'px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs border border-green-200'
                : 'px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs border border-gray-200 hover:bg-gray-200'
            "
          >
            {{ tag }}
          </button>
        </div>
      </div>

      <!-- Recipe Grid -->
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <div
          *ngFor="let recipe of filteredRecipes"
          class="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
          (click)="openRecipeDetail(recipe)"
        >
          <div class="relative">
            <img
              [src]="recipe.imageUrl"
              [alt]="recipe.title"
              class="w-full h-48 object-cover"
            />
            <button
              (click)="toggleFavorite(recipe.id, $event)"
              class="absolute top-2 right-2 text-white text-xl"
            >
              <i
                [class]="
                  recipe.isFavorite
                    ? 'fas fa-heart text-red-500'
                    : 'far fa-heart'
                "
              ></i>
            </button>
          </div>
          <div class="p-4">
            <h3 class="font-semibold text-lg mb-2">{{ recipe.title }}</h3>
            <p class="text-gray-600 text-sm mb-3 line-clamp-2">
              {{ recipe.description }}
            </p>
            <div
              class="flex items-center justify-between text-sm text-gray-500"
            >
              <span class="flex items-center">
                <i class="far fa-clock mr-1"></i>
                {{ recipe.prepTime + recipe.cookTime }} min
              </span>
              <span class="flex items-center">
                <i class="fas fa-utensils mr-1"></i>
                {{ recipe.servings }} servings
              </span>
            </div>
            <div class="mt-3 flex flex-wrap gap-1">
              <span
                *ngFor="let tag of recipe.tags.slice(0, 3)"
                class="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
              >
                {{ tag }}
              </span>
              <span
                *ngIf="recipe.tags.length > 3"
                class="px-2 py-1 text-gray-400 text-xs"
              >
                +{{ recipe.tags.length - 3 }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="filteredRecipes.length === 0" class="text-center py-12">
        <i class="fas fa-search text-4xl text-gray-300 mb-4"></i>
        <h3 class="text-xl font-semibold text-gray-600 mb-2">
          No recipes found
        </h3>
        <p class="text-gray-500">
          Try adjusting your search or filters to find what you're looking for
        </p>
      </div>

      <!-- Recipe Detail Modal -->
      <app-recipe-detail-modal
        *ngIf="selectedRecipe"
        [isOpen]="!!selectedRecipe"
        [recipe]="selectedRecipe"
        (close)="closeRecipeDetail()"
        (favoriteToggled)="toggleFavorite($event)"
      ></app-recipe-detail-modal>
    </div>
  `,
  styles: [],
})
export class RecipeListComponent implements OnInit {
  recipes: Recipe[] = [];
  filteredRecipes: Recipe[] = [];
  selectedRecipe: Recipe | null = null;
  searchQuery: string = '';
  categories: string[] = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks'];
  commonTags: string[] = [
    'Vegetarian',
    'Vegan',
    'Gluten-Free',
    'Quick',
    'Healthy',
    'Low-Carb',
  ];
  selectedCategories: string[] = ['All'];
  selectedTags: string[] = [];

  constructor(private recipeService: RecipeService) {}

  ngOnInit(): void {
    this.loadRecipes();
    // Subscribe to recipe changes
    this.recipeService.getRecipesObservable().subscribe((recipes) => {
      this.recipes = recipes;
      this.filterRecipes();
    });
  }

  loadRecipes(): void {
    this.recipes = this.recipeService.getRecipes();
    this.filterRecipes();
  }

  filterRecipes(): void {
    let filtered = [...this.recipes];

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (recipe) =>
          recipe.title.toLowerCase().includes(query) ||
          recipe.description.toLowerCase().includes(query) ||
          recipe.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (!this.selectedCategories.includes('All')) {
      filtered = filtered.filter((recipe) =>
        this.selectedCategories.some(
          (category) => recipe.category.toLowerCase() === category.toLowerCase()
        )
      );
    }

    // Apply tag filters
    if (this.selectedTags.length > 0) {
      filtered = filtered.filter((recipe) =>
        this.selectedTags.every((tag) =>
          recipe.tags.map((t) => t.toLowerCase()).includes(tag.toLowerCase())
        )
      );
    }

    this.filteredRecipes = filtered;
  }

  toggleCategory(category: string): void {
    if (category === 'All') {
      this.selectedCategories = ['All'];
    } else {
      const index = this.selectedCategories.indexOf(category);
      if (index === -1) {
        this.selectedCategories = this.selectedCategories.filter(
          (c) => c !== 'All'
        );
        this.selectedCategories.push(category);
      } else {
        this.selectedCategories = this.selectedCategories.filter(
          (c) => c !== category
        );
        if (this.selectedCategories.length === 0) {
          this.selectedCategories = ['All'];
        }
      }
    }
    this.filterRecipes();
  }

  toggleTag(tag: string): void {
    const index = this.selectedTags.indexOf(tag);
    if (index === -1) {
      this.selectedTags.push(tag);
    } else {
      this.selectedTags.splice(index, 1);
    }
    this.filterRecipes();
  }

  toggleFavorite(recipeId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.recipes = this.recipes.map((recipe) =>
      recipe.id === recipeId
        ? { ...recipe, isFavorite: !recipe.isFavorite }
        : recipe
    );
    this.filterRecipes();

    if (this.selectedRecipe?.id === recipeId) {
      this.selectedRecipe = {
        ...this.selectedRecipe,
        isFavorite: !this.selectedRecipe.isFavorite,
      };
    }
  }

  openRecipeDetail(recipe: Recipe): void {
    this.selectedRecipe = recipe;
  }

  closeRecipeDetail(): void {
    this.selectedRecipe = null;
  }
}
