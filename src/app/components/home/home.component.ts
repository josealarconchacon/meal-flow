import { Component } from '@angular/core';
import { QuickPostComponent } from './quick-post/quick-post.component';

@Component({
  selector: 'app-home',
  template: `
    <div class="home-container">
      <main class="main-content">
        <app-quick-post></app-quick-post>
      </main>
    </div>
  `,
  styles: [
    `
      .home-container {
        min-height: 100vh;
        background-color: #f8f9fa;
      }

      .main-content {
        max-width: 800px;
        margin: 2rem auto;
        padding: 0 1rem;
      }
    `,
  ],
  standalone: true,
  imports: [QuickPostComponent],
})
export class HomeComponent {}
