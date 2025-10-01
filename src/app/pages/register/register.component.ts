// src/app/pages/register/register.component.ts
import { Component, inject, Renderer2, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterModule
  ],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  
  // Injeções para manipulação do Modal Bootstrap
  private renderer = inject(Renderer2);
  private el = inject(ElementRef);
  
  // Formulário de Cadastro
  registerForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  errorMessage: string | null = null;
  loading: boolean = false;

  async onSubmit() {
    this.errorMessage = null;
    if (this.registerForm.valid) {
      this.loading = true;
      const { name, email, password } = this.registerForm.getRawValue();
      
      try {
        await this.authService.register(name!, email!, password!);
        
        // Exibe o Modal de Sucesso antes de redirecionar
        this.showSuccessModalAndRedirect();
        
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          this.errorMessage = 'Este email já está cadastrado. Por favor, faça login ou use outro email.';
        } else {
          this.errorMessage = 'Ocorreu um erro ao realizar o cadastro. Tente novamente.';
          console.error('Firebase Register Error:', error);
        }
      } finally {
        this.loading = false;
      }
    }
  }

  /**
   * Exibe o modal Bootstrap e configura o redirecionamento para /login ao fechar.
   */
  private showSuccessModalAndRedirect(): void {
    const modalElement = this.el.nativeElement.querySelector('#successModal');
    
    // Inicializa o Modal do Bootstrap via JavaScript
    const modal = new (window as any).bootstrap.Modal(modalElement);
    modal.show();
    
    // Ouve o evento de fechamento do modal e redireciona
    this.renderer.listen(modalElement, 'hidden.bs.modal', () => {
      this.router.navigateByUrl('/login');
    });
  }
}