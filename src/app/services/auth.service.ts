import { Injectable, inject } from '@angular/core';
import { 
  Auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  user, // Observable do status de autenticação
  UserCredential, // Tipo de retorno do login/cadastro
  updateProfile // Para atualizar o displayName
} from '@angular/fire/auth';

import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { User } from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore);

  // Observable que rastreia o estado de autenticação do usuário
  user$: Observable<User | null> = user(this.auth);

  constructor() { }

  /**
   * Realiza o cadastro de um novo usuário e salva seu nome no Firebase.
   * @param name Nome do usuário.
   * @param email Email do usuário.
   * @param password Senha do usuário.
   * @returns Uma Promise que resolve com a UserCredential.
   */
  async register(name: string, email: string, password: string): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      
      const user = userCredential.user;

      // 1. Atualiza o displayName no Firebase Auth
      await updateProfile(user, { displayName: name });

      // 2. Salva o nome do usuário no Firestore (como um registro simples)
      const userDocRef = doc(this.firestore, `users/${user.uid}`);
      await setDoc(userDocRef, { 
        name: name,
        email: email,
        createdAt: new Date().toISOString()
      });

      return userCredential;
    } catch (error) {
      console.error("Erro no cadastro:", error);
      throw error;
    }
  }

  /**
   * Realiza o login do usuário.
   * CORREÇÃO DE TIPAGEM: Agora retorna Promise<UserCredential> para acesso a .user
   * @param email Email do usuário.
   * @param password Senha do usuário.
   * @returns Uma Promise que resolve com a UserCredential.
   */
  async login(email: string, password: string): Promise<UserCredential> {
    try {
      return await signInWithEmailAndPassword(this.auth, email, password);
    } catch (error) {
      console.error("Erro no login:", error);
      throw error;
    }
  }

  /**
   * Realiza o logout do usuário.
   */
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error) {
      console.error("Erro no logout:", error);
      throw error;
    }
  }

  /**
   * Obtém o nome do usuário do Firestore (Útil para o modal de boas-vindas).
   * Embora o Home Component use um fallback simples, esta função seria a forma ideal
   * de buscar dados adicionais.
   */
  // public getUserData(uid: string): Observable<any> {
  //   const userDocRef = doc(this.firestore, `users/${uid}`);
  //   return docData(userDocRef);
  // }
}