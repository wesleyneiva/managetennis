import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, firstValueFrom, BehaviorSubject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

// Services e Models
import { AuthService } from '../../services/auth.service';
import { GameService } from '../../services/game.service';
import { Game, SetScore, GameResult } from '../../models/game.model';

// Importação do Gráfico e Tipagem
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';

// Tipo para estatísticas, incluindo porcentagens
export type GameStats = { 
  total: number, 
  victories: number, 
  defeats: number, 
  victoryRate: number, 
  defeatRate: number   
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, // Fornece o DatePipe para uso no template (ex: | date)
    ReactiveFormsModule, 
    FormsModule, 
    BaseChartDirective
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  
  private authService = inject(AuthService);
  private gameService = inject(GameService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  
  // CORREÇÃO FINAL DO ERRO NG02100: 
  // Usa-se o locale 'en-US' (que é garantido pelo Angular) 
  // e forçamos o formato 'dd/MM/yyyy' no método transform() do tooltip.
  private datePipe: DatePipe = new DatePipe('en-US');

  stats$!: Observable<GameStats>;
  
  userName$: Observable<string | undefined> = this.authService.user$.pipe(
    map(user => user?.displayName || user?.email?.split('@')[0] || 'Usuário')
  );

  allGames$!: Observable<Game[]>;
  games$!: Observable<Game[]>; 
  
  filterResult: GameResult | 'Todos' = 'Todos';
  
  // Variáveis de filtro por data
  selectedFilterYear: number | 'Todos' = 'Todos';
  selectedFilterMonth: number | 'Todos' = 'Todos'; // 1 (Jan) a 12 (Dez)

  // Lista de metadados para associar pontos do gráfico aos detalhes do jogo
  chartMetadata: { 
    opponentName: string, 
    result: GameResult, 
    createdAt: string 
  }[] = [];

  // Listas para os filtros na UI
  availableYears: number[] = [];
  monthOptions = [
    { value: 'Todos', label: 'Todos os Meses' },
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
  ];

  monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  // Formulário para adicionar novo jogo (mantido inalterado)
  newGameForm = this.fb.group({
    opponentName: ['', [Validators.required, Validators.minLength(2)]],
    set1P1Games: [0, [Validators.required, Validators.min(0), Validators.max(7)]],
    set1P2Games: [0, [Validators.required, Validators.min(0), Validators.max(7)]],
    set2P1Games: [0, [Validators.required, Validators.min(0), Validators.max(7)]],
    set2P2Games: [0, [Validators.required, Validators.min(0), Validators.max(7)]],
    set3P1Games: [0, [Validators.min(0), Validators.max(7)]],
    set3P2Games: [0, [Validators.min(0), Validators.max(7)]],
  });

  // --- CONFIGURAÇÕES DO GRÁFICO ---
  public lineChartData: ChartConfiguration<'line'>['data'] = {
    datasets: [
      {
        data: [], 
        label: 'Desempenho Acumulado',
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(59, 130, 246, 0.8)',
        fill: 'origin',
        tension: 0.3
      },
    ],
    labels: []
  };

  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: -10,
        max: 10,
        title: {
          display: false,
        }
      }
    },
    plugins: {
      legend: { display: false },
      // Configuração personalizada do TOOLTIP
      tooltip: {
        callbacks: {
          // Título do Tooltip: Jogo #X
          title: (context) => {
            // Usa o índice do primeiro item do contexto
            const index = context[0].dataIndex;
            return `Jogo #${index + 1}`;
          },
          // Rótulo do Tooltip: Detalhes do jogo
          label: (context) => {
            const index = context.dataIndex;
            
            // Verifica se o índice está dentro dos limites do array (correção anterior de timing)
            if (!this.chartMetadata || index < 0 || index >= this.chartMetadata.length) {
                return 'Carregando ou metadados indisponíveis...';
            }

            const meta = this.chartMetadata[index];
            const resultText = meta.result === 'Vitoria' ? 'Resultado: Vitória 🥳' : 'Resultado: Derrota 😔';
            
            // Usa a instância manual do DatePipe com formato personalizado
            const dateFormatted = this.datePipe.transform(meta.createdAt, 'dd/MM/yyyy');
            
            // Retorna um array de strings para múltiplas linhas no tooltip
            return [
                `Adversário: ${meta.opponentName}`,
                resultText,
                `Data: ${dateFormatted}`,
            ];
          }
        }
      }
    }
  };

  public lineChartType: 'line' = 'line';
  // ---------------------------------

  private filterTrigger = new BehaviorSubject<void>(undefined);

  ngOnInit(): void {
    // 1. Busca estatísticas e calcula porcentagens
    this.stats$ = this.gameService.getStatistics().pipe(
      map(stats => {
        const total = stats.total;
        const victoryRate = total > 0 ? Math.round((stats.victories / total) * 100) : 0;
        const defeatRate = total > 0 ? Math.round((stats.defeats / total) * 100) : 0;
        return { ...stats, victoryRate, defeatRate } as GameStats;
      })
    );

    // 2. Busca todos os jogos e prepara os streams
    this.allGames$ = this.gameService.getGames().pipe(
      map(games => {
        // Gera lista de anos disponíveis (para filtro de data)
        const years = new Set<number>();
        
        // Processa chart data usando uma cópia ordenada cronologicamente
        const sortedGamesForChart = [...games].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        this.processChartData(sortedGamesForChart);

        games.forEach(game => {
             years.add(new Date(game.createdAt).getFullYear());
        });
        this.availableYears = Array.from(years).sort((a, b) => b - a);
        
        // Retorna todos os jogos, ordenados do MAIS RECENTE (para exibição na lista)
        return games.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      })
    );
    
    // 3. O stream games$ aplica os filtros sempre que o filterTrigger é ativado (mantido inalterado)
    this.games$ = this.filterTrigger.pipe(
        switchMap(() => this.allGames$),
        map(games => {
            return games.filter(game => {
                let matchesResult = true;
                let matchesDate = true;

                // 1. Filtro por Resultado
                if (this.filterResult !== 'Todos') {
                    matchesResult = game.result === this.filterResult;
                }

                // 2. Filtro por Data (Ano e/ou Mês)
                if (this.selectedFilterYear !== 'Todos' || this.selectedFilterMonth !== 'Todos') {
                    const gameDate = new Date(game.createdAt);
                    const gameYear = gameDate.getFullYear();
                    const gameMonth = gameDate.getMonth() + 1; // 1-12

                    const yearMatch = this.selectedFilterYear === 'Todos' || gameYear === this.selectedFilterYear;
                    const monthMatch = this.selectedFilterMonth === 'Todos' || gameMonth === this.selectedFilterMonth;
                    
                    matchesDate = yearMatch && monthMatch;
                }

                return matchesResult && matchesDate;
            });
        })
    );
  }

  /**
   * Processa a lista de jogos para gerar os dados do gráfico de desempenho acumulado 
   * em tempo real e armazena os metadados para o tooltip.
   */
  private processChartData(games: Game[]): void {
    const data: number[] = [];
    const labels: string[] = [];
    let overallCumulativeScore = 0;
    
    // Zera o array de metadados antes de processar
    this.chartMetadata = [];

    // Itera sobre os jogos em ordem cronológica
    games.forEach((game, index) => {
        // Vitória = +1, Derrota = -1
        const scoreChange = game.result === 'Vitoria' ? 1 : (game.result === 'Derrota' ? -1 : 0);
        overallCumulativeScore += scoreChange;
        
        // Dados do gráfico: Score acumulado
        data.push(overallCumulativeScore);

        // Rótulos do gráfico: Número sequencial do jogo
        labels.push(`#${index + 1}`);
        
        // Armazena metadados para o tooltip
        this.chartMetadata.push({
            opponentName: game.opponentName,
            result: game.result,
            createdAt: game.createdAt
        });
    });

    // Atualiza as propriedades do gráfico
    this.lineChartData = {
      datasets: [{ ...this.lineChartData.datasets[0], data: data, label: this.lineChartData.datasets[0].label }],
      labels: labels
    };
  }
  
  // --- MÉTODOS DE FILTRO (mantidos inalterados) ---
  
  applyFilters(): void {
    this.filterTrigger.next();
  }

  setFilterResult(result: GameResult | 'Todos'): void {
    this.filterResult = result;
    this.applyFilters();
  }

  setFilterYear(year: string): void {
    this.selectedFilterYear = year === 'Todos' ? 'Todos' : parseInt(year, 10);
    this.applyFilters();
  }

  setFilterMonth(month: string): void {
    this.selectedFilterMonth = month === 'Todos' ? 'Todos' : parseInt(month, 10);
    this.applyFilters();
  }

  // --- LÓGICA DE PLACAR e OUTROS (mantidos inalterados) ---

  private getSetWinner(set: SetScore): 0 | 1 | 2 {
    const p1 = set.p1Games;
    const p2 = set.p2Games;
    
    if (p1 >= 6 && p1 >= p2 + 2) return 1;
    if (p2 >= 6 && p2 >= p1 + 2) return 2;
    if (p1 === 7 && p2 === 5) return 1;
    if (p2 === 7 && p1 === 5) return 2;
    if (p1 === 7 && p2 === 6) return 1;
    if (p2 === 7 && p1 === 6) return 2;
    
    return 0;
  }

  private analyzeGameResult(sets: SetScore[]): { setsWon: [number, number], result: GameResult, isFinished: boolean } {
    let p1SetsWon = 0;
    let p2SetsWon = 0;

    sets.forEach(set => {
      const winner = this.getSetWinner(set);
      if (winner === 1) p1SetsWon++;
      if (winner === 2) p2SetsWon++;
    });

    let result: GameResult = 'Pendente';
    let isFinished = false;

    if (p1SetsWon === 2) {
      result = 'Vitoria';
      isFinished = true;
    } else if (p2SetsWon === 2) {
      result = 'Derrota';
      isFinished = true;
    }
    
    return { setsWon: [p1SetsWon, p2SetsWon], result, isFinished };
  }

  async addNewGame(): Promise<void> {
    if (this.newGameForm.invalid) return;

    const user = await firstValueFrom(this.authService.user$);
    const userName = await firstValueFrom(this.userName$);

    if (!user || !userName) return;

    const formValue = this.newGameForm.getRawValue();

    const set1: SetScore = { p1Games: formValue.set1P1Games!, p2Games: formValue.set1P2Games! };
    const set2: SetScore = { p1Games: formValue.set2P1Games!, p2Games: formValue.set2P2Games! };
    let sets: SetScore[] = [set1, set2];
    
    const resultAfter2Sets = this.analyzeGameResult(sets);
    
    if (resultAfter2Sets.setsWon[0] === 1 && resultAfter2Sets.setsWon[1] === 1) {
      sets.push({ p1Games: formValue.set3P1Games || 0, p2Games: formValue.set3P2Games || 0 });
    }

    const finalResult = this.analyzeGameResult(sets);
    
    if (!finalResult.isFinished) {
      console.error("Erro: O placar inserido não resulta em uma vitória ou derrota (2 sets ganhos).");
      return;
    }

    const newGameData: Omit<Game, 'id'> = {
      opponentName: formValue.opponentName!,
      userName: userName,
      sets: sets,
      result: finalResult.result,
      isFinished: finalResult.isFinished,
      createdAt: new Date().toISOString(),
      userId: user.uid
    };

    try {
      await this.gameService.addGame(newGameData);
      
      this.newGameForm.reset({
        opponentName: '',
        set1P1Games: 0, set1P2Games: 0,
        set2P1Games: 0, set2P2Games: 0,
        set3P1Games: 0, set3P2Games: 0,
      });

    } catch (error) {
      console.error('Erro ao adicionar jogo:', error);
    }
  }

  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      this.router.navigateByUrl('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }
}
