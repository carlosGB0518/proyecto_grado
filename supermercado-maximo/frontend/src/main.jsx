import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { UsuarioProvider } from './contextos/UsuarioContexto';
import { InventarioProvider } from './contextos/InventarioContexto';

import './index.css';          // Reset base (elimina oscuro de Vite)
import './estilos/global.css'; // Variables y estilos de marca Supermercado Máximo

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <UsuarioProvider>
      <InventarioProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </InventarioProvider>
    </UsuarioProvider>
  </React.StrictMode>
);
