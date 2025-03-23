import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <app-header class="app-header"></app-header>
      <main class="app-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [
    `
      .app-container {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }

      .app-header {
        position: sticky;
        top: 0;
        z-index: 1000;
        background: white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .app-content {
        flex: 1;
        background-color: #f8f9fa;
        min-height: calc(100vh - 64px); /* Adjust based on header height */
        width: 100%;
      }
    `,
  ],
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
})
export class AppComponent {
  title = 'meal-flow';
}
