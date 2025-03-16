import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MealPlanService } from '../../services/meal-plan.service';
import { RecipeService } from '../../services/recipe.service';
import { Recipe } from '../../models/recipe.model';
import { DayPlan } from './models/day-plan.model';
import { DayCardComponent } from './components/day-card/day-card.component';
import { MealModalComponent } from './components/meal-modal/meal-modal.component';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

@Component({
  selector: 'app-meal-plan',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DayCardComponent,
    MealModalComponent,
  ],
  template: `
    <div class="container mx-auto px-4 py-4 sm:py-8">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div
          class="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6"
        >
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900">Meal Plan</h1>
          <div class="flex items-center gap-2">
            <button
              (click)="previousWeek()"
              class="p-2 text-gray-600 hover:text-gray-900 touch-target"
              aria-label="Previous week"
            >
              <i class="fas fa-chevron-left"></i>
            </button>
            <span
              class="text-base sm:text-lg font-medium text-gray-700 min-w-[150px] text-center"
            >
              {{ getWeekRange() }}
            </span>
            <button
              (click)="nextWeek()"
              class="p-2 text-gray-600 hover:text-gray-900 touch-target"
              aria-label="Next week"
            >
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
          <button
            (click)="clearWeek()"
            class="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 touch-target"
          >
            Clear Week
          </button>
        </div>

        <!-- Mobile Day Selector -->
        <div class="block sm:hidden w-full overflow-x-auto">
          <div class="flex gap-2 pb-2">
            <button
              *ngFor="let day of weekPlan"
              class="flex-shrink-0 px-4 py-2 rounded-lg text-sm transition-colors"
              [class]="
                day.date === selectedDate
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              "
              (click)="selectedDate = day.date"
            >
              <span class="font-medium">{{ day.label }}</span>
              <span class="text-xs block">{{ formatDate(day.date) }}</span>
            </button>
          </div>
        </div>

        <!-- Weekly Calendar -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
          <app-day-card
            *ngFor="let day of weekPlan"
            [day]="day"
            [selectedDate]="selectedDate"
            (onAddMeal)="handleAddMeal($event)"
            (onRemoveMeal)="handleRemoveMeal($event)"
          ></app-day-card>
        </div>
      </div>
    </div>

    <!-- Meal Selection Modal -->
    <app-meal-modal
      [isOpen]="showModal"
      [date]="selectedDate"
      [mealType]="selectedMealType"
      [recipes]="filteredRecipes"
      (onClose)="closeModal()"
      (onSearch)="filterRecipes($event)"
      (onSelectRecipe)="selectRecipe($event)"
      (onCreateRecipe)="handleCreateRecipe($event)"
    ></app-meal-modal>
  `,
})
export class MealPlanComponent implements OnInit, OnDestroy {
  weekPlan: DayPlan[] = [];
  currentWeekStart: Date = this.getStartOfWeek(new Date());
  selectedDate: string = '';
  selectedMealType: MealType | '' = '';
  showModal = false;
  allRecipes: Recipe[] = [];
  filteredRecipes: Recipe[] = [];
  private subscription = new Subscription();

  constructor(
    private mealPlanService: MealPlanService,
    private recipeService: RecipeService
  ) {}

  ngOnInit(): void {
    this.loadWeekPlan();
    this.loadRecipes();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadRecipes(): void {
    this.allRecipes = this.recipeService.getRecipes();
    this.filteredRecipes = [...this.allRecipes];
  }

  filterRecipes(searchTerm: string): void {
    const term = searchTerm.toLowerCase();
    this.filteredRecipes = this.allRecipes.filter((recipe) =>
      recipe.title.toLowerCase().includes(term)
    );
  }

  loadWeekPlan(): void {
    const weekPlan = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(this.currentWeekStart);
      currentDate.setDate(currentDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];

      weekPlan.push({
        date: dateStr,
        label: this.getDayLabel(currentDate),
        meals: {},
      });
    }
    this.weekPlan = weekPlan;

    // Subscribe to meal plan updates
    this.subscription.add(
      this.mealPlanService.getMealPlan().subscribe((mealPlan) => {
        this.weekPlan.forEach((day) => {
          const dayMeals = mealPlan.filter((meal) => meal.date === day.date);
          dayMeals.forEach((meal) => {
            const recipe = this.recipeService.getRecipeById(meal.recipeId);
            if (recipe) {
              day.meals[meal.mealType] = recipe;
            }
          });
        });
      })
    );
  }

  previousWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
    this.loadWeekPlan();
  }

  nextWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    this.loadWeekPlan();
  }

  clearWeek(): void {
    this.mealPlanService.clearMealPlan();
    this.loadWeekPlan();
  }

  handleAddMeal(event: { date: string; mealType: string }): void {
    this.openAddMeal(event.date, event.mealType as MealType);
  }

  handleRemoveMeal(event: { date: string; mealType: string }): void {
    this.removeMeal(event.date, event.mealType as MealType);
  }

  openAddMeal(date: string, mealType: MealType): void {
    this.selectedDate = date;
    this.selectedMealType = mealType;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedDate = '';
    this.selectedMealType = '';
  }

  selectRecipe(recipe: Recipe): void {
    if (this.selectedDate && this.selectedMealType) {
      this.mealPlanService.addRecipeToMealPlan(
        recipe.id,
        this.selectedDate,
        this.selectedMealType
      );
      this.closeModal();
    }
  }

  removeMeal(date: string, mealType: MealType): void {
    this.mealPlanService.removeFromMealPlan(date, mealType);
    this.loadWeekPlan();
  }

  getWeekRange(): string {
    const endDate = new Date(this.currentWeekStart);
    endDate.setDate(endDate.getDate() + 6);

    return `${this.formatDate(
      this.currentWeekStart.toISOString()
    )} - ${this.formatDate(endDate.toISOString())}`;
  }

  private getStartOfWeek(date: Date): Date {
    const result = new Date(date);
    result.setDate(date.getDate() - date.getDay());
    return result;
  }

  private getDayLabel(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  formatDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  handleCreateRecipe(recipe: Recipe): void {
    this.recipeService.addRecipe(recipe);
    this.loadRecipes();
    this.selectRecipe(recipe);
  }
}
