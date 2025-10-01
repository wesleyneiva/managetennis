// src/app/pages/login/login.component.ts
import { Component, inject, Renderer2, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule 
  ],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Injeções para manipulação do Modal Bootstrap
  private renderer = inject(Renderer2);
  private el = inject(ElementRef);
  
  // Formulário de Login
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  errorMessage: string | null = null;
  loading: boolean = false;

  async onSubmit() {
    this.errorMessage = null;
    if (this.loginForm.valid) {
      this.loading = true;
      const { email, password } = this.loginForm.getRawValue();
      
      try {
        const userCredential = await this.authService.login(email!, password!);

        // Simula a obtenção do nome (usando email antes do @ como fallback)
        // OBS: Se o nome real for buscado no Firestore, esta lógica deve ser ajustada.
        const userName = userCredential.user?.displayName || email!.split('@')[0];

        // Exibe o modal de boas-vindas antes de redirecionar para /home
        this.showWelcomeModalAndRedirect(userName);

      } catch (error: any) {
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
          this.errorMessage = 'Email ou senha inválidos. Por favor, verifique suas credenciais.';
        } else {
          this.errorMessage = 'Ocorreu um erro ao fazer login. Tente novamente.';
          console.error('Firebase Login Error:', error);
        }
      } finally {
        this.loading = false;
      }
    }
  }

  /**
   * Exibe o modal de boas-vindas com o nome do usuário e configura o redirecionamento.
   */
  private showWelcomeModalAndRedirect(userName: string): void {
    const modalElement = this.el.nativeElement.querySelector('#welcomeModal');
    
    // 1. Atualiza a mensagem no modal com o nome do usuário
    const nameSpan = modalElement.querySelector('#welcomeName');
    if (nameSpan) {
      this.renderer.setProperty(nameSpan, 'textContent', userName);
    }
    
    // 2. Cria e exibe a instância do modal
    const modal = new (window as any).bootstrap.Modal(modalElement);
    modal.show();
    
    // 3. Configura o redirecionamento ao fechar o modal
    this.renderer.listen(modalElement, 'hidden.bs.modal', () => {
      this.router.navigateByUrl('/home');
    });
  }
}