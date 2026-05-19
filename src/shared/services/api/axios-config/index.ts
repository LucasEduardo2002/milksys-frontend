import axios from 'axios';
import { Environment } from '../../../environment';

const Api = axios.create({
  baseURL: Environment.URL_BASE, // URL base do JSON Server
});

Api.interceptors.response.use(
   response => {
    console.log('✅ Resposta bem-sucedida:', response);
    return response; // sempre retorne a resposta
  },
  error => {
    // Interceptador de erros
    if (axios.isAxiosError(error)) {
      console.error('Erro na requisição Axios:', error.message);
      console.error('Status HTTP:', error.response?.status);
    } else {
      console.error('Erro inesperado:', error);
    }

    // Você pode até lançar um erro customizado aqui, se quiser
    return Promise.reject(error);
  }
);


export { Api };