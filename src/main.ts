import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import 'chart.js'; 

// Inicializa a aplicação usando o AppComponent como raiz
// e o appConfig para injetar todos os providers (Firebase, Rotas, etc.).
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));