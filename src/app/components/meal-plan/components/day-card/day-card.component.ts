import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MealCardComponent } from '../meal-card/meal-card.component';
import { DayPlan } from '../../models/day-plan.model';

@Component({
  selector: 'app-day-card',
  standalone: true,
  imports: [CommonModule, MealCardComponent],
  template: `
    <div
      class="bg-white rounded-lg shadow-sm overflow-hidden"
      [class.hidden]="selectedDate && selectedDate !== day.date"
      [class.block]="!selectedDate || selectedDate === day.date"
    >
      <div class="text-center p-3 bg-gray-50 border-b border-gray-200">
        <div class="font-medium text-gray-900">{{ day.label }}</div>
        <div class="text-sm text-gray-500">{{ formattedDate }}</div>
      </div>

      <div class="p-3 space-y-3">
        <app-meal-card
          mealType="Breakfast"
          [meal]="day.meals.breakfast"
          (onAdd)="onAddMeal.emit({ date: day.date, mealType: 'breakfast' })"
          (onRemove)="
            onRemoveMeal.emit({ date: day.date, mealType: 'breakfast' })
          "
        ></app-meal-card>

        <app-meal-card
          mealType="Lunch"
          [meal]="day.meals.lunch"
          (onAdd)="onAddMeal.emit({ date: day.date, mealType: 'lunch' })"
          (onRemove)="onRemoveMeal.emit({ date: day.date, mealType: 'lunch' })"
        ></app-meal-card>

        <app-meal-card
          mealType="Dinner"
          [meal]="day.meals.dinner"
          (onAdd)="onAddMeal.emit({ date: day.date, mealType: 'dinner' })"
          (onRemove)="onRemoveMeal.emit({ date: day.date, mealType: 'dinner' })"
        ></app-meal-card>

        <app-meal-card
          mealType="Snacks"
          [meal]="day.meals.snacks"
          (onAdd)="onAddMeal.emit({ date: day.date, mealType: 'snacks' })"
          (onRemove)="onRemoveMeal.emit({ date: day.date, mealType: 'snacks' })"
        ></app-meal-card>
      </div>
    </div>
  `,
})
export class DayCardComponent {
  @Input() day!: DayPlan;
  @Input() selectedDate: string | null = null;
  @Output() onAddMeal = new EventEmitter<{ date: string; mealType: string }>();
  @Output() onRemoveMeal = new EventEmitter<{
    date: string;
    mealType: string;
  }>();

  get formattedDate(): string {
    return new Date(this.day.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}
