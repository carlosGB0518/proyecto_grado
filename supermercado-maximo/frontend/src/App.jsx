import { Routes, Route } from 'react-router-dom';

import RutaPrivada from './componentes/RutaPrivada';

import Login from './paginas/Login';
import Inicio from './paginas/Inicio';
import Caja from './paginas/Caja';
import Inventario from './paginas/Inventario';
import Facturacion from './paginas/Facturacion';
import Proveedores from './paginas/Proveedores';
import Pedidos from './paginas/Pedidos';
import Ventas from './paginas/Ventas';
import Clientes from './paginas/Clientes';
import GestionUsuarios from './paginas/GestionUsuarios';

function App() {
  return (
    <Routes>
      {/* Pública */}
      <Route path="/login" element={<Login />} />

      {/* Todos los roles autenticados */}
      <Route path="/" element={
        <RutaPrivada>
          <Inicio />
        </RutaPrivada>
      } />

      {/* CAJERO + SUPERVISOR + ADMINISTRADOR */}
      <Route path="/caja" element={
        <RutaPrivada roles={['cajero', 'supervisor', 'administrador']}>
          <Caja />
        </RutaPrivada>
      } />

      {/* CAJERO + SUPERVISOR + ADMINISTRADOR */}
      <Route path="/clientes" element={
        <RutaPrivada roles={['cajero', 'supervisor', 'administrador']}>
          <Clientes />
        </RutaPrivada>
      } />

      {/* CAJERO + SUPERVISOR + ADMINISTRADOR */}
      <Route path="/facturacion" element={
        <RutaPrivada roles={['cajero', 'supervisor', 'administrador']}>
          <Facturacion />
        </RutaPrivada>
      } />

      {/* SUPERVISOR + ADMINISTRADOR */}
      <Route path="/ventas" element={
        <RutaPrivada roles={['supervisor', 'administrador']}>
          <Ventas />
        </RutaPrivada>
      } />

      {/* ADMINISTRADOR */}
      <Route path="/inventario" element={
        <RutaPrivada roles={['administrador']}>
          <Inventario />
        </RutaPrivada>
      } />

      {/* ADMINISTRADOR */}
      <Route path="/proveedores" element={
        <RutaPrivada roles={['administrador']}>
          <Proveedores />
        </RutaPrivada>
      } />

      {/* ADMINISTRADOR */}
      <Route path="/pedidos" element={
        <RutaPrivada roles={['administrador']}>
          <Pedidos />
        </RutaPrivada>
      } />

      {/* ADMINISTRADOR — gestión de usuarios */}
      <Route path="/usuarios" element={
        <RutaPrivada roles={['administrador']}>
          <GestionUsuarios />
        </RutaPrivada>
      } />
    </Routes>
  );
}

export default App;
