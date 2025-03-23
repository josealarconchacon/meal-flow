import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-delete-account-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Delete Account</h2>
    <mat-dialog-content>
      <p>
        Are you sure you want to delete your account? This action cannot be
        undone.
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-button color="warn" [mat-dialog-close]="true">
        Delete Account
      </button>
    </mat-dialog-actions>
  `,
})
export class DeleteAccountDialogComponent {
  constructor(public dialogRef: MatDialogRef<DeleteAccountDialogComponent>) {}
}
