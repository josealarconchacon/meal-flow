import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-edit-name-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Edit Display Name</h2>
    <mat-dialog-content>
      <mat-form-field appearance="fill" style="width: 100%;">
        <mat-label>Display Name</mat-label>
        <input
          matInput
          [(ngModel)]="displayName"
          placeholder="Enter your name"
        />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-button color="primary" [mat-dialog-close]="displayName">
        Save
      </button>
    </mat-dialog-actions>
  `,
})
export class EditNameDialogComponent {
  displayName: string;

  constructor(
    public dialogRef: MatDialogRef<EditNameDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { displayName: string }
  ) {
    this.displayName = data.displayName;
  }
}
