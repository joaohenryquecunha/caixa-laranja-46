import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global error handler para capturar erros do removeChild e outros erros de DOM
window.addEventListener('error', (event) => {
  // Capturar erros de removeChild que podem causar tela preta
  if (event.error && event.error.message && event.error.message.includes('removeChild')) {
    console.warn('Erro removeChild capturado e suprimido:', event.error);
    event.preventDefault(); // Prevenir que o erro quebre a aplicação
    return true;
  }
  
  // Capturar NotFoundError relacionados a removeChild
  if (event.error && event.error.name === 'NotFoundError' && 
      event.error.message && event.error.message.includes('removeChild')) {
    console.warn('NotFoundError removeChild capturado e suprimido:', event.error);
    event.preventDefault();
    return true;
  }
}, true);

// Listener para erros não capturados em Promises
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message && event.reason.message.includes('removeChild')) {
    console.warn('Promise rejeitada com erro removeChild capturada:', event.reason);
    event.preventDefault(); // Prevenir que a rejeição quebre a aplicação
  }
});

createRoot(document.getElementById("root")!).render(<App />);
