export const Environment = {

  /**
   * Placeholder exibido nas inputs
   */
  INPUT_DE_BUSCA: 'Pesquisar...',

  /**
   * Url base de consultado dos dados dessa aplicação
   */
  URL_BASE: typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL
    ? String(import.meta.env.VITE_API_URL)
    : (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3001` : 'http://localhost:3001'),

  /**
   * Endereço do broker MQTT/WebSocket desta máquina
   */
  MQTT_WS_URL: typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_MQTT_WS_URL
    ? String(import.meta.env.VITE_MQTT_WS_URL)
    : (typeof window !== 'undefined' ? `ws://${window.location.hostname}:8082` : 'ws://localhost:8082'),
};

//local host:  http://localhost:3001
//servidor: 'http://10.1.1.33:3001