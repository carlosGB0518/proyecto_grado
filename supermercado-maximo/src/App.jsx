import { Routes, Route } from 'react-router-dom';
import PaginaInicio from './paginas/Inicio';
import PaginaRegistro from './paginas/Registro';
import PaginaInventario from './paginas/Inventario';
import PaginaCaja from './paginas/Caja';
import PaginaLogin from './paginas/Login';
import MenuLateral from './layouts/MenuLateral';
import Encabezado from './layouts/Encabezado';
import RutaPrivada from './componentes/RutaPrivada';


function App() {
  return (
    <div className="app">
      <Encabezado />
      <div className="contenido-principal" style={{ display: 'flex' }}>
        <MenuLateral />
        <div className="contenido" style={{ flexGrow: 1, padding: '1rem' }}>
          <Routes>
            <Route path="/" element={<PaginaInicio />} />
            <Route path="/inventario" element={<PaginaInventario />} />
            <Route path="/caja" element={<PaginaCaja />} />
            <Route path="/login" element={<PaginaLogin />} />
            <Route path="*" element={<h2>Página no encontrada</h2>} />
            <Route path="/registro" element={<PaginaRegistro />} />

          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;
