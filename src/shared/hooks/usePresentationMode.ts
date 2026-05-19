import { useCallback, useRef, useState, useEffect } from 'react';

export interface PresentationData {
  coletas: any[];
  dataFiltro: string;
  totalLeiteDoDia: number;
}

export const usePresentationMode = (onError?: (msg: string) => void) => {
  const [isPresentationActive, setIsPresentationActive] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const presentationConnectionRef = useRef<any>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const STORAGE_KEY = 'painel-recepcao-presentation-active';

  // Verifica suporte à API ao montar
  useEffect(() => {
    const nav = navigator as any;
    const supported = !!(
      (typeof window !== 'undefined' && (window as any).PresentationRequest) ||
      (nav && nav.presentation && typeof nav.presentation.request === 'function')
    );
    
    // Debug logs
    console.log('[Presentation API Debug]');
    console.log('  navigator.presentation:', nav.presentation);
    console.log('  typeof navigator.presentation.request:', typeof nav?.presentation?.request);
    console.log('  Suporte detectado:', supported);

    const storedActive = window.localStorage.getItem(STORAGE_KEY) === 'true';
    if (storedActive) {
      setIsPresentationActive(true);
    }
    
    setIsSupported(supported);
  }, []);

  // Inicializa BroadcastChannel para sincronização entre abas
  useEffect(() => {
    try {
      broadcastChannelRef.current = new BroadcastChannel('painel-recepcao');
    } catch (error) {
      console.warn('BroadcastChannel não suportado:', error);
    }

    return () => {
      broadcastChannelRef.current?.close();
    };
  }, []);

  const startPresentation = useCallback(async () => {
    try {
      console.log('[startPresentation] Iniciando...');

      // Usa a própria URL do PainelRecepcao com parâmetro de modo apresentação
      const currentUrl = window.location.href.split('?')[0];
      const presentationUrl = `${currentUrl}?presentationMode=true`;
      console.log('[startPresentation] URL de apresentação:', presentationUrl);

      let connection: any = null;
      const nav = navigator as any;

      // 1) Tentativa: navigator.presentation.request (algumas implementações)
      if (nav && nav.presentation && typeof nav.presentation.request === 'function') {
        console.log('[startPresentation] Usando navigator.presentation.request');
        connection = await nav.presentation.request(presentationUrl);
      }

      // 2) Fallback: PresentationRequest (mais comum em navegadores que implementam a API)
      if (!connection && typeof (window as any).PresentationRequest === 'function') {
        try {
          console.log('[startPresentation] Tentando PresentationRequest');
          const PR = (window as any).PresentationRequest;
          const req = new PR(presentationUrl);
          if (typeof req.start === 'function') {
            connection = await req.start();
          } else if (typeof req.request === 'function') {
            connection = await req.request();
          } else {
            console.warn('[startPresentation] PresentationRequest não expõe start/request');
          }
        } catch (e) {
          console.error('[startPresentation] PresentationRequest falhou', e);
          throw e;
        }
      }

      if (!connection) {
        console.warn('[startPresentation] Nenhuma API de apresentação disponível/estabelecida');
        onError?.('Nenhum display secundário disponível ou Presentation API não suportada pelo navegador.');
        return;
      }

      console.log('[startPresentation] Conexão estabelecida');
      presentationConnectionRef.current = connection;
      setIsPresentationActive(true);
      window.localStorage.setItem(STORAGE_KEY, 'true');

      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'START_PRESENTATION',
          url: presentationUrl,
        });
      }

      // Listener para quando a apresentação é encerrada
      if (typeof connection.addEventListener === 'function') {
        connection.addEventListener('close', () => {
          console.log('[Presentation] Apresentação encerrada');
          setIsPresentationActive(false);
          presentationConnectionRef.current = null;
          window.localStorage.removeItem(STORAGE_KEY);
        });

        connection.addEventListener('terminate', () => {
          console.log('[Presentation] Apresentação terminada');
          setIsPresentationActive(false);
          presentationConnectionRef.current = null;
          window.localStorage.removeItem(STORAGE_KEY);
        });

        connection.addEventListener('error', (event: any) => {
          console.error('[Presentation Error]', event);
          setIsPresentationActive(false);
          window.localStorage.removeItem(STORAGE_KEY);
          onError?.('Erro ao conectar ao display secundário.');
        });
      }
    } catch (error: any) {
      console.error('[startPresentation Error]', error);

      if (error && error.name === 'NotAllowedError') {
        console.log('[Presentation] Usuário cancelou');
        return;
      }
      if (error && error.name === 'NotFoundError') {
        onError?.('Nenhum display secundário disponível. Conecte um monitor ou projetor via HDMI.');
        return;
      }
      onError?.(`Erro: ${error?.message || 'Falha ao iniciar apresentação'}`);
    }
  }, [onError]);

  const updatePresentation = useCallback((data: PresentationData) => {
    // Envia atualização via BroadcastChannel para todas as abas
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'UPDATE_DATA',
        data,
      });
    }
  }, []);

  const stopPresentation = useCallback(() => {
    console.log('[stopPresentation] Encerrando transmissão');

    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'STOP_PRESENTATION',
      });
    }

    if (presentationConnectionRef.current) {
      try {
        if (typeof presentationConnectionRef.current.terminate === 'function') {
          presentationConnectionRef.current.terminate();
        }

        if (typeof presentationConnectionRef.current.close === 'function') {
          presentationConnectionRef.current.close();
        }
      } catch (error) {
        console.error('[stopPresentation] Erro ao fechar conexão', error);
      }
      presentationConnectionRef.current = null;
    }

    window.localStorage.removeItem(STORAGE_KEY);
    setIsPresentationActive(false);
  }, []);

  return {
    isPresentationActive,
    isSupported,
    startPresentation,
    updatePresentation,
    stopPresentation,
  };
};
