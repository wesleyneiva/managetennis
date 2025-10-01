import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, updateDoc, deleteDoc, query, where, addDoc } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs'; // IMPORTANTE: Adicionamos 'of'
import { switchMap, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Game } from '../models/game.model';

// Definindo o tipo para as estatísticas para maior clareza
type GameStats = { total: number, victories: number, defeats: number };

@Injectable({
  providedIn: 'root'
})
export class GameService {

  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private gamesCollection = collection(this.firestore, 'games');

  constructor() { }

  /**
   * Obtém todos os jogos do usuário logado em tempo real.
   */
  getGames(): Observable<Game[]> {
    return this.authService.user$.pipe(
      switchMap(user => {
        if (!user) {
          // Usa 'of' para retornar um Observable de array vazio tipado corretamente
          return of([]);
        }

        const userGamesQuery = query(
          this.gamesCollection,
          where('userId', '==', user.uid)
        );

        return collectionData(userGamesQuery, { idField: 'id' }) as Observable<Game[]>;
      })
    );
  }

  /**
   * Calcula e retorna as estatísticas de jogos (Total, Vitórias e Derrotas)
   * para o usuário logado.
   * CORREÇÃO: Utiliza 'of' para tipagem correta.
   */
  getStatistics(): Observable<GameStats> {
    return this.authService.user$.pipe(
      switchMap(user => {
        if (!user) {
          // Se não há usuário, retorna as estatísticas zeradas usando 'of'
          return of({ total: 0, victories: 0, defeats: 0 }); 
        }
        
        const q = query(
          this.gamesCollection,
          where('userId', '==', user.uid)
        );
        
        return collectionData(q, { idField: 'id' }).pipe(
          map(games => {
            const gameList = games as Game[];
            const total = gameList.length;
            const victories = gameList.filter(g => g.result === 'Vitoria').length;
            const defeats = gameList.filter(g => g.result === 'Derrota').length;
            
            return { total, victories, defeats };
          })
        );
      })
    );
  }
  
  /**
   * Adiciona um novo jogo ao Firestore.
   */
  addGame(gameData: Omit<Game, 'id'>): Promise<any> {
    return addDoc(this.gamesCollection, gameData);
  }

  /**
   * Atualiza um jogo existente.
   */
  updateGame(game: Game): Promise<void> {
    const gameDocRef = doc(this.firestore, `games/${game.id}`);
    
    // Remove o ID antes de enviar para o Firestore
    const { id, ...dataToUpdate } = game;
    return updateDoc(gameDocRef, dataToUpdate);
  }

  /**
   * Deleta um jogo pelo ID.
   */
  deleteGame(id: string): Promise<void> {
    const gameDocRef = doc(this.firestore, `games/${id}`);
    return deleteDoc(gameDocRef);
  }
}