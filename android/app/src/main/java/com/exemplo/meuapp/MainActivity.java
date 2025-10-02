package com.exemplo.meuapp; // O pacote do seu App

import android.os.Bundle;
import android.webkit.WebSettings; // Importado para controle de cache
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // ------------------------------------------------------------------
    // SOLUÇÃO DEFINITIVA: FORÇAR O WEBDIEW A NÃO USAR CACHE LOCAL
    // ------------------------------------------------------------------
    if (this.bridge != null && this.bridge.getWebView() != null) {
      // Usa LOAD_NO_CACHE para sempre buscar o conteúdo mais recente
      // da URL do Firebase Hosting, ignorando arquivos temporários.
      this.bridge.getWebView().getSettings().setCacheMode(WebSettings.LOAD_NO_CACHE);
    }
    // ------------------------------------------------------------------
  }
}
