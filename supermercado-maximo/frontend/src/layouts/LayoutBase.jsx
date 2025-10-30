// layouts/LayoutBase.jsx
import Encabezado from './Encabezado';
import MenuLateral from './MenuLateral';

const LayoutBase = ({ children }) => {
  return (
    <div className="flex h-screen">
      <MenuLateral />
      <div className="flex flex-col flex-grow">
        <Encabezado />
        <main className="p-4 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default LayoutBase;
