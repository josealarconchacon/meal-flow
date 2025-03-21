import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error-message',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="message" class="error-container">
      <div class="error-message">
        <span class="error-icon">⚠️</span>
        {{ message }}
      </div>
    </div>
  `,
  styles: [
    `
      .error-container {
        padding: 10px;
        margin: 10px 0;
      }

      .error-message {
        background-color: #ffebee;
        color: #c62828;
        padding: 12px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        font-size: 14px;
      }

      .error-icon {
        margin-right: 8px;
      }
    `,
  ],
})
export class ErrorMessageComponent {
  @Input() message: string | null = null;
}
