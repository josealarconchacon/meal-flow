import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
  name: 'firestoreDate',
  standalone: true,
})
export class FirestoreDatePipe implements PipeTransform {
  constructor(private datePipe: DatePipe) {}

  transform(
    timestamp: { seconds: number; nanoseconds: number } | null | undefined,
    format: string = 'short'
  ): string | null {
    if (!timestamp) return null;

    const date = new Date(timestamp.seconds * 1000);
    return this.datePipe.transform(date, format);
  }
}
