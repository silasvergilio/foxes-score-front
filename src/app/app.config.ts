import {
  ApplicationConfig,
  importProvidersFrom,
  provideZoneChangeDetection,
} from '@angular/core';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';

const config: SocketIoConfig = {
  url: window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://foxes-score-backend-601c21db8b30.herokuapp.com',
  options: {
    reconnectionDelay: 1000,
    reconnection: true,
    transports: ['websocket'],
    agent: false,
    upgrade: false,
    rejectUnauthorized: false,
  },
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    importProvidersFrom(SocketIoModule.forRoot(config)),
  ],
};
