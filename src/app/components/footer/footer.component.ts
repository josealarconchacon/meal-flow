import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="bg-gray-800 text-gray-300">
      <div class="container mx-auto px-4 py-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="space-y-3">
            <h3 class="text-lg font-semibold text-white">About MealFlow</h3>
            <p class="text-sm leading-relaxed">
              Your personal meal planning assistant. Make cooking easier,
              healthier, and more enjoyable with our recipe management and meal
              planning tools.
            </p>
          </div>

          <div class="space-y-3">
            <h3 class="text-lg font-semibold text-white">Quick Links</h3>
            <ul class="grid grid-cols-2 gap-2">
              <li>
                <a
                  routerLink="/recipes"
                  class="text-sm hover:text-white transition-colors"
                  >Recipes</a
                >
              </li>
              <li>
                <a
                  routerLink="/meal-plan"
                  class="text-sm hover:text-white transition-colors"
                  >Meal Plans</a
                >
              </li>
              <li>
                <a
                  routerLink="/grocery-list"
                  class="text-sm hover:text-white transition-colors"
                  >Shopping Lists</a
                >
              </li>
              <li>
                <a
                  routerLink="/categories"
                  class="text-sm hover:text-white transition-colors"
                  >Categories</a
                >
              </li>
            </ul>
          </div>

          <div class="space-y-3">
            <h3 class="text-lg font-semibold text-white">Contact</h3>
            <p class="text-sm">
              Need help? Contact our support team at
              <a
                href="mailto:support&#64;mealflow.com"
                class="hover:text-white transition-colors"
              >
                support&#64;mealflow.com
              </a>
            </p>
          </div>
        </div>

        <!-- Bottom Bar -->
        <div
          class="mt-8 pt-6 border-t border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm"
        >
          <p class="text-center sm:text-left">© {{ currentYear }} MealFlow</p>
          <nav class="flex flex-wrap justify-center gap-6">
            <a routerLink="/privacy" class="hover:text-white transition-colors"
              >Privacy</a
            >
            <a routerLink="/terms" class="hover:text-white transition-colors"
              >Terms</a
            >
            <a routerLink="/cookies" class="hover:text-white transition-colors"
              >Cookies</a
            >
          </nav>
        </div>
      </div>
    </footer>
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
        text-decoration: underline;
      }
    `,
  ],
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
