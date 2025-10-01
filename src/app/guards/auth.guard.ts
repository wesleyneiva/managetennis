import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.user$.pipe(
    take(1), // Pega o valor atual e completa
    map(user => {
      if (user) {
        return true; // Autenticado, permite acesso
      } else {
        return router.createUrlTree(['/login']); // Não autenticado, redireciona para login
      }
    })
  );
};