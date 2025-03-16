import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Recipe } from '../../../../models/recipe.model';

@Component({
  selector: 'app-meal-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="meal-slot">
      <h3 class="text-sm font-medium text-gray-500 mb-2">{{ mealType }}</h3>
      <div *ngIf="meal; else emptyMeal" class="relative group">
        <div
          class="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div class="pr-8">
            <h4 class="font-medium text-gray-900 mb-1 line-clamp-1">
              {{ meal.title }}
            </h4>
            <p class="text-sm text-gray-600">
              {{ meal.prepTime + meal.cookTime }} min
            </p>
          </div>
          <button
            (click)="onRemove.emit()"
            class="absolute top-2 right-2 opacity-100 sm:opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 transition-opacity touch-target"
            [attr.aria-label]="'Remove ' + mealType.toLowerCase()"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      <ng-template #emptyMeal>
        <div
          (click)="onAdd.emit()"
          class="p-3 border-2 border-dashed border-gray-200 rounded-lg text-center text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors cursor-pointer touch-target"
        >
          <i class="fas fa-plus mb-1"></i>
          <div class="text-sm">Add {{ mealType }}</div>
        </div>
      </ng-template>
    </div>
  `,
})
export class MealCardComponent {
  @Input() mealType!: string;
  @Input() meal?: Recipe;
  @Output() onAdd = new EventEmitter<void>();
  @Output() onRemove = new EventEmitter<void>();
}
