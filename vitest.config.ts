import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(root, 'src');

export default defineConfig({
  resolve: {
    alias: {
      '@': src,
      '@components': path.resolve(src, 'components'),
      '@screens': path.resolve(src, 'screens'),
      '@navigation': path.resolve(src, 'navigation'),
      '@context': path.resolve(src, 'context'),
      '@hooks': path.resolve(src, 'hooks'),
      '@services': path.resolve(src, 'services'),
      '@theme': path.resolve(src, 'theme'),
      '@utils': path.resolve(src, 'utils'),
      '@data': path.resolve(src, 'data'),
      '@constants': path.resolve(src, 'constants'),
      '@types': path.resolve(src, 'types'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.integration.test.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'json-summary', 'json', 'lcov'],
      all: true,
      include: [
        'src/services/**/*.ts',
        'src/utils/**/*.ts',
        'src/constants/**/*.ts',
      ],
      exclude: [
        '**/*.test.ts',
        '**/*.integration.test.ts',
        'src/services/secureStorageService.ts',
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 64,
        'src/utils/**': {
          lines: 90,
          statements: 90,
          functions: 90,
          branches: 85,
        },
        'src/constants/**': {
          lines: 90,
          statements: 90,
          functions: 90,
          branches: 90,
        },
        'src/services/**': {
          lines: 80,
          statements: 80,
          functions: 78,
          branches: 60,
        },
      },
    },
  },
});
