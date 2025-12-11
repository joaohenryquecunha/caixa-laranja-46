import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Função para verificar se é um erro removeChild que deve ser ignorado
const isRemoveChildError = (error: any): boolean => {
  if (!error) return false;
  
  const errorMessage = error.message || error.toString() || '';
  const errorName = error.name || '';
  
  // Verificar se é um erro relacionado a removeChild
  return errorMessage.includes('removeChild') || 
         errorMessage.includes('removeChild') ||
         (errorName === 'NotFoundError' && errorMessage.includes('removeChild'));
};

// Global error handler para capturar erros do removeChild e outros erros de DOM
// O terceiro parâmetro 'true' faz com que capture erros na fase de captura (antes de propagar)
window.addEventListener('error', (event) => {
  // Capturar erros de removeChild que podem causar tela preta
  if (isRemoveChildError(event.error)) {
    console.warn('Erro removeChild capturado e suprimido:', event.error);
    event.preventDefault(); // Prevenir que o erro quebre a aplicação
    event.stopPropagation(); // Impedir que o erro se propague
    return true;
  }
}, true);

// Listener para erros não capturados em Promises
window.addEventListener('unhandledrejection', (event) => {
  if (isRemoveChildError(event.reason)) {
    console.warn('Promise rejeitada com erro removeChild capturada:', event.reason);
    event.preventDefault(); // Prevenir que a rejeição quebre a aplicação
  }
});

createRoot(document.getElementById("root")!).render(<App />);
