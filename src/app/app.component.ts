import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  // O RouterOutlet é essencial para que as rotas funcionem.
  imports: [CommonModule, RouterOutlet], 
  templateUrl: './app.component.html',
})
export class AppComponent {
  title = 'tenis-app';
}