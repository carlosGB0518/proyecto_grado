import LayoutBase from '../layouts/LayoutBase';
import '../estilos/inicio.css';

const Inicio = () => {
  return (
    <LayoutBase>
      <div className="inicio-container">
        <h1 className="inicio-titulo">Bienvenido al Sistema POS del Supermercado</h1>
        <p className="inicio-parrafo">
          Desde aquí puedes gestionar las ventas, inventario, caja, clientes y más. Usa el menú lateral para navegar entre los módulos del sistema.
        </p>

        <div className="tarjetas-grid">
          <div className="tarjeta">
            <h2 className="tarjeta-titulo">Ventas del Día</h2>
            <p className="tarjeta-dato ventas">$0.00</p>
          </div>

          <div className="tarjeta">
            <h2 className="tarjeta-titulo">Productos en Bajo Stock</h2>
            <p className="tarjeta-dato stock">3 productos</p>
          </div>

          <div className="tarjeta">
            <h2 className="tarjeta-titulo">Clientes Registrados</h2>
            <p className="tarjeta-dato clientes">15 clientes</p>
          </div>
        </div>
      </div>
    </LayoutBase>
  );
};

export default Inicio;
