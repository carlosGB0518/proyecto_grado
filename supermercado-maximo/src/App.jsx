import { Routes, Route } from 'react-router-dom';

import RutaPrivada from './componentes/RutaPrivada';

import Login from './paginas/Login';
import Registro from './paginas/Registro';
import Inicio from './paginas/Inicio';
import Caja from './paginas/Caja';
import Inventario from './paginas/Inventario';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/" element={<RutaPrivada><Inicio /></RutaPrivada>} />
      <Route path="/caja" element={<RutaPrivada><Caja /></RutaPrivada>} />
      <Route path="/inventario" element={<RutaPrivada><Inventario /></RutaPrivada>} />
    </Routes>
  );
}

export default App;
