import { Routes, Route } from 'react-router-dom';

import RutaPrivada from './componentes/RutaPrivada';

import Login from './paginas/Login';
import Registro from './paginas/Registro';
import Inicio from './paginas/Inicio';
import Caja from './paginas/Caja';
import Inventario from './paginas/Inventario';
import Facturacion from './paginas/Facturacion';
import Proveedores from './paginas/Proveedores';
import Pedidos from './paginas/Pedidos';

import Ventas from './paginas/Ventas'; // o la ruta correspondiente
import Clientes from './paginas/Clientes'; // 👈 Nueva importación

function App() {
  return (
    
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/" element={<RutaPrivada><Inicio /></RutaPrivada>} />
      <Route path="/caja" element={<RutaPrivada><Caja /></RutaPrivada>} />
      <Route path="/inventario" element={<RutaPrivada><Inventario /></RutaPrivada>} />
      <Route path="/ventas" element={<Ventas />} />
      <Route path="/clientes" element={<RutaPrivada><Clientes /></RutaPrivada>} /> 
      <Route path="/facturacion" element={<RutaPrivada><Facturacion /></RutaPrivada>} />
      <Route path="/proveedores" element={<RutaPrivada><Proveedores /></RutaPrivada>} />
      <Route path="/pedidos" element={<RutaPrivada><Pedidos /></RutaPrivada>} />
    </Routes>
    
  );
}

export default App;
