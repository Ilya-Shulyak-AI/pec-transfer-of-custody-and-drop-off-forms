'use strict';

// This project uses standalone Node-based Playwright checks so it can depend on
// the lightweight `playwright` package without the separate `@playwright/test`
// runner. Use `npm test`, `npm run test:print`, or `npm run test:validation`.
module.exports = {
  testDir: './tests',
  testMatch: '**/*.pw.spec.js',
  reporter: [['list']],
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
};
