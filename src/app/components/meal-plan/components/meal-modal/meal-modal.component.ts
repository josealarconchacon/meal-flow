import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
} from '@angular/forms';
import { Recipe } from '../../../../models/recipe.model';

@Component({
  selector: 'app-meal-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div
      class="fixed inset-0 z-50 overflow-hidden md:overflow-y-auto"
      *ngIf="isOpen"
    >
      <!-- Modal Backdrop -->
      <div
        class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        (click)="onClose.emit()"
      ></div>

      <!-- Modal Content -->
      <div
        class="relative min-h-screen flex items-start justify-center p-0 sm:p-4"
      >
        <div
          class="relative bg-white w-full h-screen md:h-auto md:rounded-xl md:shadow-xl md:max-w-3xl md:my-8 overflow-hidden"
        >
          <!-- Modal Header -->
          <div
            class="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between"
          >
            <h2 class="text-lg sm:text-xl font-semibold text-gray-900">
              {{ isCreatingRecipe ? 'Create New Recipe' : 'Select Recipe' }}
              <span class="block text-sm font-normal text-gray-500 mt-1">
                {{ mealType | titlecase }} for {{ formatDate(date) }}
              </span>
            </h2>
            <button
              (click)="onClose.emit()"
              class="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 transition-colors touch-target"
              aria-label="Close modal"
            >
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>

          <!-- Modal Body -->
          <div
            class="overflow-y-auto overscroll-contain h-[calc(100vh-72px)] md:h-[calc(90vh-180px)]"
          >
            <div class="p-4 sm:p-6">
              <!-- Mode Toggle -->
              <div class="flex justify-center mb-6">
                <div class="inline-flex bg-gray-100 rounded-lg p-1">
                  <button
                    (click)="isCreatingRecipe = false"
                    [class]="
                      !isCreatingRecipe
                        ? 'bg-white shadow-sm text-indigo-600'
                        : 'text-gray-600'
                    "
                    class="px-4 py-2 rounded-md text-sm font-medium transition-all"
                  >
                    Browse Recipes
                  </button>
                  <button
                    (click)="isCreatingRecipe = true"
                    [class]="
                      isCreatingRecipe
                        ? 'bg-white shadow-sm text-indigo-600'
                        : 'text-gray-600'
                    "
                    class="px-4 py-2 rounded-md text-sm font-medium transition-all"
                  >
                    Create New
                  </button>
                </div>
              </div>

              <!-- Recipe Browser -->
              <div *ngIf="!isCreatingRecipe">
                <!-- Search Bar -->
                <div class="mb-6">
                  <div class="relative">
                    <input
                      type="text"
                      [(ngModel)]="searchTerm"
                      (ngModelChange)="onSearch.emit($event)"
                      placeholder="Search recipes..."
                      class="w-full pl-10 pr-4 py-2.5 text-base rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <i
                      class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    ></i>
                  </div>
                </div>

                <!-- Recipe Grid -->
                <div class="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div
                    *ngFor="let recipe of recipes"
                    (click)="onSelectRecipe.emit(recipe)"
                    class="group relative bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-all cursor-pointer border border-gray-200 hover:border-indigo-300"
                  >
                    <div
                      class="aspect-w-16 aspect-h-9 mb-3 rounded-lg overflow-hidden bg-gray-200"
                    >
                      <img
                        [src]="recipe.imageUrl"
                        [alt]="recipe.title"
                        class="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    <h3
                      class="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1"
                    >
                      {{ recipe.title }}
                    </h3>
                    <div class="mt-2 flex items-center text-sm text-gray-600">
                      <i class="fas fa-clock mr-1.5"></i>
                      {{ recipe.prepTime + recipe.cookTime }} min
                      <span class="mx-2">•</span>
                      <span class="capitalize">{{ recipe.category }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Create Recipe Form -->
              <form
                *ngIf="isCreatingRecipe"
                [formGroup]="recipeForm"
                (ngSubmit)="createRecipe()"
                class="space-y-6"
              >
                <!-- Basic Info -->
                <div class="grid gap-6 grid-cols-1 lg:grid-cols-2">
                  <!-- Left Column -->
                  <div class="space-y-4">
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Title</label
                      >
                      <input
                        type="text"
                        formControlName="title"
                        class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Recipe title"
                      />
                    </div>

                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Description</label
                      >
                      <textarea
                        formControlName="description"
                        rows="3"
                        class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Recipe description"
                      ></textarea>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          class="block text-sm font-medium text-gray-700 mb-1"
                          >Category</label
                        >
                        <select
                          formControlName="category"
                          class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">Select</option>
                          <option value="breakfast">Breakfast</option>
                          <option value="lunch">Lunch</option>
                          <option value="dinner">Dinner</option>
                          <option value="snack">Snack</option>
                        </select>
                      </div>
                      <div>
                        <label
                          class="block text-sm font-medium text-gray-700 mb-1"
                          >Difficulty</label
                        >
                        <select
                          formControlName="difficulty"
                          class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>
                    </div>

                    <div class="grid grid-cols-3 gap-4">
                      <div>
                        <label
                          class="block text-sm font-medium text-gray-700 mb-1"
                          >Prep (min)</label
                        >
                        <input
                          type="number"
                          formControlName="prepTime"
                          class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label
                          class="block text-sm font-medium text-gray-700 mb-1"
                          >Cook (min)</label
                        >
                        <input
                          type="number"
                          formControlName="cookTime"
                          class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label
                          class="block text-sm font-medium text-gray-700 mb-1"
                          >Servings</label
                        >
                        <input
                          type="number"
                          formControlName="servings"
                          class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- Right Column -->
                  <div class="space-y-4">
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Image URL</label
                      >
                      <input
                        type="url"
                        formControlName="imageUrl"
                        class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="https://..."
                      />
                    </div>

                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Tags</label
                      >
                      <div class="relative">
                        <input
                          type="text"
                          [ngModel]="tagInput"
                          (ngModelChange)="updateTags($event)"
                          [ngModelOptions]="{ standalone: true }"
                          placeholder="Add tags (comma-separated)"
                          class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div class="mt-2 flex flex-wrap gap-2">
                        <span
                          *ngFor="let tag of recipeForm.get('tags')?.value"
                          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm bg-indigo-100 text-indigo-800"
                        >
                          {{ tag }}
                          <button
                            type="button"
                            (click)="removeTag(tag)"
                            class="ml-1.5 text-indigo-600 hover:text-indigo-900"
                          >
                            <i class="fas fa-times-circle"></i>
                          </button>
                        </span>
                      </div>
                    </div>

                    <div formArrayName="ingredients" class="space-y-2">
                      <div class="flex items-center justify-between">
                        <label class="block text-sm font-medium text-gray-700"
                          >Ingredients</label
                        >
                        <button
                          type="button"
                          (click)="addIngredient()"
                          class="text-sm text-indigo-600 hover:text-indigo-900"
                        >
                          <i class="fas fa-plus mr-1"></i> Add
                        </button>
                      </div>
                      <div
                        *ngFor="
                          let ingredient of ingredients.controls;
                          let i = index
                        "
                        [formGroupName]="i"
                        class="flex gap-2 items-start"
                      >
                        <input
                          formControlName="name"
                          placeholder="Name"
                          class="flex-1 px-3 py-1.5 text-sm rounded border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <input
                          type="number"
                          formControlName="amount"
                          placeholder="Amt"
                          class="w-20 px-2 py-1.5 text-sm rounded border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <input
                          formControlName="unit"
                          placeholder="Unit"
                          class="w-20 px-2 py-1.5 text-sm rounded border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          (click)="removeIngredient(i)"
                          class="text-red-500 hover:text-red-700 py-1.5"
                        >
                          <i class="fas fa-times"></i>
                        </button>
                      </div>
                    </div>

                    <div formArrayName="instructions" class="space-y-2">
                      <div class="flex items-center justify-between">
                        <label class="block text-sm font-medium text-gray-700"
                          >Instructions</label
                        >
                        <button
                          type="button"
                          (click)="addInstruction()"
                          class="text-sm text-indigo-600 hover:text-indigo-900"
                        >
                          <i class="fas fa-plus mr-1"></i> Add
                        </button>
                      </div>
                      <div
                        *ngFor="
                          let instruction of instructions.controls;
                          let i = index
                        "
                        class="flex gap-2 items-start"
                      >
                        <span class="text-sm font-medium text-gray-500 pt-1.5"
                          >{{ i + 1 }}.</span
                        >
                        <input
                          [formControlName]="i"
                          placeholder="Enter instruction step"
                          class="flex-1 px-3 py-1.5 text-sm rounded border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          (click)="removeInstruction(i)"
                          class="text-red-500 hover:text-red-700 py-1.5"
                        >
                          <i class="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Form Actions -->
                <div
                  class="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 sm:px-6 -mx-4 sm:-mx-6 mt-6"
                >
                  <div class="flex justify-end gap-3">
                    <button
                      type="button"
                      (click)="onClose.emit()"
                      class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      [disabled]="!recipeForm.valid"
                      class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Create Recipe
                    </button>
                  </div>
                </div>
              </form>

              <!-- Validation Messages -->
              <div
                *ngIf="isCreatingRecipe && !recipeForm.valid"
                class="mt-4 p-4 bg-red-50 rounded-lg"
              >
                <h4 class="text-sm font-medium text-red-800 mb-2">
                  Please fix the following:
                </h4>
                <ul
                  class="list-disc list-inside text-sm text-red-700 space-y-1"
                >
                  <li *ngIf="ingredients.length === 0">
                    Add at least one ingredient
                  </li>
                  <li *ngIf="instructions.length === 0">
                    Add at least one instruction
                  </li>
                  <li *ngIf="recipeForm.get('tags')?.value?.length === 0">
                    Add at least one tag
                  </li>
                  <li *ngIf="recipeForm.get('title')?.errors?.['required']">
                    Title is required
                  </li>
                  <li
                    *ngIf="recipeForm.get('description')?.errors?.['required']"
                  >
                    Description is required
                  </li>
                  <li *ngIf="recipeForm.get('imageUrl')?.errors?.['required']">
                    Image URL is required
                  </li>
                  <li *ngIf="recipeForm.get('category')?.errors?.['required']">
                    Category is required
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class MealModalComponent {
  @Input() isOpen = false;
  @Input() date = '';
  @Input() mealType = '';
  @Input() recipes: Recipe[] = [];
  @Output() onClose = new EventEmitter<void>();
  @Output() onSearch = new EventEmitter<string>();
  @Output() onSelectRecipe = new EventEmitter<Recipe>();
  @Output() onCreateRecipe = new EventEmitter<Recipe>();

  searchTerm = '';
  isCreatingRecipe = false;
  tagInput = '';
  recipeForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.recipeForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      imageUrl: ['', Validators.required],
      category: ['', Validators.required],
      prepTime: [0, [Validators.required, Validators.min(0)]],
      cookTime: [0, [Validators.required, Validators.min(0)]],
      servings: [1, [Validators.required, Validators.min(1)]],
      difficulty: ['Easy', Validators.required],
      ingredients: this.fb.array([], Validators.minLength(1)),
      instructions: this.fb.array([], Validators.minLength(1)),
      tags: [[], [Validators.required, Validators.minLength(1)]],
    });
  }

  get ingredients() {
    return this.recipeForm.get('ingredients') as FormArray;
  }

  get instructions() {
    return this.recipeForm.get('instructions') as FormArray;
  }

  addIngredient(): void {
    const ingredientForm = this.fb.group({
      name: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0)]],
      unit: ['', Validators.required],
    });
    this.ingredients.push(ingredientForm);
  }

  removeIngredient(index: number): void {
    this.ingredients.removeAt(index);
  }

  addInstruction(): void {
    this.instructions.push(this.fb.control('', Validators.required));
  }

  removeInstruction(index: number): void {
    this.instructions.removeAt(index);
  }

  updateTags(value: string): void {
    if (value.includes(',')) {
      const tags = value
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag);
      this.recipeForm.patchValue({
        tags: [...(this.recipeForm.get('tags')?.value || []), ...tags],
      });
      this.tagInput = '';
    }
  }

  removeTag(tagToRemove: string): void {
    const currentTags = this.recipeForm.get('tags')?.value || [];
    this.recipeForm.patchValue({
      tags: currentTags.filter((tag: string) => tag !== tagToRemove),
    });
  }

  createRecipe(): void {
    if (this.recipeForm.valid) {
      const formValue = this.recipeForm.value;
      const newRecipe: Recipe = {
        id: Date.now().toString(),
        ...formValue,
        isFavorite: false,
      };

      this.onCreateRecipe.emit(newRecipe);
      this.resetForm();
    }
  }

  resetForm(): void {
    this.recipeForm.reset({
      difficulty: 'Easy',
      servings: 1,
      prepTime: 0,
      cookTime: 0,
      tags: [],
    });
    this.ingredients.clear();
    this.instructions.clear();
    this.isCreatingRecipe = false;
  }

  formatDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}
