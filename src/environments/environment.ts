/**
 * Default (development) environment. Used when running `ng serve` or
 * `ng build --configuration development`.
 *
 * The production build swaps this file for environment.prod.ts via
 * `fileReplacements` in angular.json. Both files MUST export the same
 * shape — the TypeScript compiler can't help us if they drift.
 */
export const environment = {
  production: false,
  /**
   * Base URL for both HTTP requests (ApiService) and the Socket.IO
   * connection (app.config.ts). No trailing slash.
   */
  apiUrl: 'http://localhost:3000',
};
