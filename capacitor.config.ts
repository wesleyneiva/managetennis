    import type { CapacitorConfig } from '@capacitor/cli';

    const config: CapacitorConfig = {
      appId: 'com.exemplo.meuapp', // Seu App ID
      appName: 'Meu App Firebase', // Nome do seu App
      // 1. Caminho de build do Angular (ajuste conforme seu projeto)
      webDir: 'dist/tenis-app/browser',
      
      // 2. CONFIGURAÇÃO CRUCIAL PARA ATUALIZAÇÃO AUTOMÁTICA VIA FIREBASE HOSTING
      server: {
        // O app Android carregará esta URL sempre que for aberto.
        // Assim, ele sempre pega a versão mais recente que você implantou.
        url: 'https://mygame-9e93d.web.app/', // <-- Sua URL do Firebase Hosting
        cleartext: true, // Permitir conexões não-HTTPS (embora o Firebase seja HTTPS)
      }
    };

    export default config;
    
