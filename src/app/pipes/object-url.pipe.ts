import { Pipe, PipeTransform, OnDestroy } from '@angular/core';

@Pipe({
  name: 'objectURL',
  standalone: true,
})
export class ObjectURLPipe implements PipeTransform, OnDestroy {
  private urls: string[] = [];

  transform(file: File): string {
    const url = URL.createObjectURL(file);
    this.urls.push(url);
    return url;
  }

  ngOnDestroy(): void {
    // Clean up object URLs when the pipe is destroyed
    this.urls.forEach((url) => URL.revokeObjectURL(url));
  }
}
