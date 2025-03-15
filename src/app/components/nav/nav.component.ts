import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="bg-white shadow-sm">
      <div class="container mx-auto px-4">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <a routerLink="/" class="flex items-center">
              <i class="fas fa-utensils text-indigo-600 text-2xl mr-2"></i>
              <span class="text-xl font-semibold text-gray-900">MealFlow</span>
            </a>
          </div>
          <div class="flex items-center space-x-4">
            <a
              routerLink="/recipes"
              routerLinkActive="text-indigo-600"
              class="text-gray-600 hover:text-gray-900"
              >Recipes</a
            >
            <a
              routerLink="/meal-plan"
              routerLinkActive="text-indigo-600"
              class="text-gray-600 hover:text-gray-900"
              >Meal Plan</a
            >
            <a
              routerLink="/grocery-list"
              routerLinkActive="text-indigo-600"
              class="text-gray-600 hover:text-gray-900"
              >Grocery List</a
            >
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      a {
        text-decoration: none;
      }
      a:hover {
        text-decoration: none;
      }
    `,
  ],
})
export class NavComponent {}
