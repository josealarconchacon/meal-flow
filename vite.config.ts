import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  plugins: [
    angular({
      tsconfig: './tsconfig.app.json',
      inlineStylesExtension: 'scss',
    }),
  ],
  optimizeDeps: {
    include: ['@angular/animations', '@angular/animations/browser'],
  },
  resolve: {
    preserveSymlinks: true,
  },
});
