export interface SetScore {
  p1Games: number; // Jogos do jogador logado (nosso usuário)
  p2Games: number; // Jogos do adversário
}

export type GameResult = 'Vitoria' | 'Derrota' | 'Pendente';

export interface Game {
  id?: string;
  opponentName: string; // O nome que será preenchido
  userName: string;     // O nome do usuário logado (automatico)
  sets: SetScore[];
  result: GameResult;   // O resultado do jogo
  isFinished: boolean;
  createdAt: string;
  userId: string; // Para vincular ao usuário logado
}