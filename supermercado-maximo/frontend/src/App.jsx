import { Routes, Route, Navigate } from 'react-router-dom';

import RutaPrivada      from './componentes/RutaPrivada';
import Login            from './paginas/Login';
import Inicio           from './paginas/Inicio';
import Caja             from './paginas/Caja';
import ControlCaja      from './paginas/ControlCaja';
import Inventario       from './paginas/Inventario';
import Facturacion      from './paginas/Facturacion';
import Proveedores      from './paginas/Proveedores';
import Pedidos          from './paginas/Pedidos';
import Ventas           from './paginas/Ventas';
import Clientes         from './paginas/Clientes';
import Reportes         from './paginas/Reportes';
import GestionUsuarios  from './paginas/GestionUsuarios';
import GestionVencimientos from './paginas/GestionVencimientos'; /*ruta fechas*/

function App() {
  return (
    <Routes>
      {/* ── Pública ─────────────────────────────────── */}
      <Route path="/login" element={<Login />} />

      {/* ── Todos los roles autenticados ────────────── */}
      <Route path="/" element={
        <RutaPrivada><Inicio /></RutaPrivada>
      } />

      {/* ── CAJERO · SUPERVISOR · ADMINISTRADOR ─────── */}
      <Route path="/caja" element={
        <RutaPrivada roles={['cajero','supervisor','administrador']}>
          <Caja />
        </RutaPrivada>
      } />
      <Route path="/control-caja" element={
        <RutaPrivada roles={['cajero','supervisor','administrador']}>
          <ControlCaja />
        </RutaPrivada>
      } />
      <Route path="/clientes" element={
        <RutaPrivada roles={['cajero','supervisor','administrador']}>
          <Clientes />
        </RutaPrivada>
      } />
      <Route path="/facturacion" element={
        <RutaPrivada roles={['cajero','supervisor','administrador']}>
          <Facturacion />
        </RutaPrivada>
      } />

      {/* ── SUPERVISOR · ADMINISTRADOR ──────────────── */}
      <Route path="/ventas" element={
        <RutaPrivada roles={['supervisor','administrador']}>
          <Ventas />
        </RutaPrivada>
      } />
      <Route path="/reportes" element={
        <RutaPrivada roles={['supervisor','administrador']}>
          <Reportes />
        </RutaPrivada>
      } />
 
      
      <Route path="/vencimientos" element={
        <RutaPrivada roles={['supervisor','administrador']}>
          <GestionVencimientos />
        </RutaPrivada>
      } />

      {/* ── ADMINISTRADOR ───────────────────────────── */}
      <Route path="/inventario" element={
        <RutaPrivada roles={['administrador']}>
          <Inventario />
        </RutaPrivada>
      } />
      <Route path="/proveedores" element={
        <RutaPrivada roles={['administrador']}>
          <Proveedores />
        </RutaPrivada>
      } />
      <Route path="/pedidos" element={
        <RutaPrivada roles={['administrador']}>
          <Pedidos />
        </RutaPrivada>
      } />
      <Route path="/usuarios" element={
        <RutaPrivada roles={['administrador']}>
          <GestionUsuarios />
        </RutaPrivada>
      } />

      {/* ── Comodín: cualquier ruta desconocida → login ─ */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
