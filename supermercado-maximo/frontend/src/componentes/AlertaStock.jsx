/**
 * AlertaStock — muestra badge en el menú cuando hay productos con stock bajo.
 * Se integra en MenuLateral para visibilidad permanente.
 */
import { useContext } from 'react';
import { InventarioContexto } from '../contextos/InventarioContexto';

export function AlertaStockBadge() {
  const { productosAlerta } = useContext(InventarioContexto);
  if (!productosAlerta || productosAlerta.length === 0) return null;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-rojo)',
      color: 'var(--color-blanco)',
      borderRadius: '50%',
      width: '18px',
      height: '18px',
      fontSize: '0.65rem',
      fontWeight: '800',
      marginLeft: '6px',
      flexShrink: 0,
      lineHeight: 1,
    }}>
      {productosAlerta.length > 9 ? '9+' : productosAlerta.length}
    </span>
  );
}

/**
 * AlertaStockPanel — panel expandible con la lista de productos en alerta.
 * Úsalo en la página de Inicio o Inventario.
 */
export function AlertaStockPanel() {
  const { productosAlerta } = useContext(InventarioContexto);

  if (!productosAlerta || productosAlerta.length === 0) return null;

  return (
    <div style={{
      background: 'rgba(229,57,53,0.06)',
      border: '1.5px solid rgba(229,57,53,0.25)',
      borderRadius: 'var(--radio)',
      padding: '1rem 1.25rem',
      marginBottom: '1.5rem',
    }}>
      <h3 style={{
        fontFamily: 'var(--fuente-titulo)',
        fontSize: '0.95rem',
        fontWeight: 700,
        color: 'var(--color-rojo)',
        marginBottom: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
      }}>
         Productos con stock bajo ({productosAlerta.length})
      </h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {productosAlerta.map(p => (
          <span key={p.id} style={{
            background: 'rgba(229,57,53,0.1)',
            border: '1px solid rgba(229,57,53,0.2)',
            color: 'var(--color-rojo)',
            borderRadius: '20px',
            padding: '3px 10px',
            fontSize: '0.78rem',
            fontWeight: 600,
          }}>
            {p.nombre} — {p.stockActual}/{p.stockMinimo}
          </span>
        ))}
      </div>
    </div>
  );
}
