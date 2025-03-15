import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MealPlanService } from '../../services/meal-plan.service';

interface GroceryItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category?: string;
  isChecked: boolean;
}

@Component({
  selector: 'app-grocery-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <div class="max-w-3xl mx-auto">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-2xl font-bold text-gray-900">Grocery List</h1>
          <div class="flex gap-2">
            <button
              (click)="clearCheckedItems()"
              class="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Clear Checked
            </button>
            <button
              (click)="clearAllItems()"
              class="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
            >
              Clear All
            </button>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="mb-6">
          <div class="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span
              >{{ completedItemsCount }} of {{ totalItemsCount }} items</span
            >
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div
              class="bg-green-600 h-2.5 rounded-full transition-all duration-300"
              [style.width.%]="progressPercentage"
            ></div>
          </div>
        </div>

        <!-- Categories -->
        <div class="space-y-6">
          <div
            *ngFor="let category of groupedItems | keyvalue"
            class="bg-white rounded-lg shadow-sm p-4"
          >
            <h2 class="text-lg font-semibold text-gray-900 mb-3">
              {{ category.key || 'Uncategorized' }}
            </h2>
            <ul class="space-y-2">
              <li
                *ngFor="let item of category.value"
                class="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0"
              >
                <input
                  type="checkbox"
                  [checked]="item.isChecked"
                  (change)="toggleItem(item.id)"
                  class="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                />
                <span
                  [class]="
                    item.isChecked
                      ? 'flex-1 text-gray-500 line-through'
                      : 'flex-1 text-gray-900'
                  "
                >
                  {{ item.amount }} {{ item.unit }} {{ item.name }}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Empty State -->
        <div
          *ngIf="totalItemsCount === 0"
          class="text-center py-12 bg-white rounded-lg shadow-sm"
        >
          <i class="fas fa-shopping-basket text-4xl text-gray-300 mb-4"></i>
          <h3 class="text-xl font-semibold text-gray-600 mb-2">
            Your grocery list is empty
          </h3>
          <p class="text-gray-500">
            Add recipes to your meal plan to generate a grocery list
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class GroceryListComponent implements OnInit {
  groceryItems: GroceryItem[] = [];
  groupedItems: { [key: string]: GroceryItem[] } = {};

  constructor(private mealPlanService: MealPlanService) {}

  ngOnInit(): void {
    this.mealPlanService.getGroceryList().subscribe((items) => {
      this.groceryItems = items;
      this.groupItemsByCategory();
    });
  }

  get totalItemsCount(): number {
    return this.groceryItems.length;
  }

  get completedItemsCount(): number {
    return this.groceryItems.filter((item) => item.isChecked).length;
  }

  get progressPercentage(): number {
    return this.totalItemsCount === 0
      ? 0
      : (this.completedItemsCount / this.totalItemsCount) * 100;
  }

  toggleItem(itemId: string): void {
    this.mealPlanService.toggleGroceryItem(itemId);
  }

  clearCheckedItems(): void {
    const uncheckedItems = this.groceryItems.filter((item) => !item.isChecked);
    this.mealPlanService.updateGroceryList(uncheckedItems);
  }

  clearAllItems(): void {
    this.mealPlanService.clearGroceryList();
  }

  private groupItemsByCategory(): void {
    this.groupedItems = this.groceryItems.reduce(
      (groups: { [key: string]: GroceryItem[] }, item) => {
        const category = item.category || 'Other';
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(item);
        return groups;
      },
      {}
    );
  }
}
