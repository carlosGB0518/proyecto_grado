import { useEffect, useState } from 'react';
import LayoutBase from '../layouts/LayoutBase';
import api from '../services/api';
import { supabase } from '../supabase';
import '../estilos/facturacion.css';

function Facturacion() {
  const [facturas, setFacturas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [descargando, setDescargando] = useState({});

  useEffect(() => {
    const cargarFacturas = async () => {
      const { data, error } = await supabase
        .from('facturas')
        .select('id, venta_id, uuid, numero_factura, estado, pdf_url, xml_url, creada_en')
        .order('id', { ascending: false });

      if (error) {
        console.error('Error cargando facturas:', error.message);
      } else {
        setFacturas(data);
      }
      setCargando(false);
    };

    cargarFacturas();
  }, []);

  const descargarArchivo = async (tipo, numeroFactura) => {
    if (!numeroFactura) {
      alert('⚠️ No hay número de factura disponible.');
      return;
    }

    const key = `${tipo}-${numeroFactura}`;
    setDescargando((prev) => ({ ...prev, [key]: true }));

    try {
      const res = await fetch(`${api}/api/facturas/${numeroFactura}/${tipo}`);
      if (!res.ok) throw new Error(`Error descargando ${tipo.toUpperCase()}`);

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Factura_${numeroFactura}.${tipo}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`❌ Error descargando ${tipo}:`, err);
      alert(`❌ Error al descargar ${tipo.toUpperCase()}. Revisa la consola.`);
    } finally {
      setDescargando((prev) => ({ ...prev, [key]: false }));
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const badgeEstado = (estado) => {
    const mapa = {
      emitida: 'fact-badge-emitida',
      pendiente: 'fact-badge-pendiente',
      error: 'fact-badge-error',
    };
    return mapa[estado?.toLowerCase()] || 'fact-badge-pendiente';
  };

  return (
    <LayoutBase>
      <div className="facturacion-container">
        <div className="facturacion-header">
          <div>
            <h1 className="facturacion-titulo">🧾 Facturación Electrónica</h1>
            <p className="facturacion-subtitulo">
              Historial de facturas emitidas mediante Factus. Descarga PDF o XML por factura.
            </p>
          </div>
          <div className="facturacion-stats">
            <div className="fact-stat">
              <span className="fact-stat-valor">{facturas.length}</span>
              <span className="fact-stat-label">Total facturas</span>
            </div>
            <div className="fact-stat">
              <span className="fact-stat-valor">
                {facturas.filter((f) => f.estado === 'emitida').length}
              </span>
              <span className="fact-stat-label">Emitidas</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {cargando ? (
            <div className="facturacion-estado">⏳ Cargando facturas...</div>
          ) : facturas.length === 0 ? (
            <div className="facturacion-estado">No hay facturas registradas.</div>
          ) : (
            <div className="facturacion-tabla-wrapper">
              <table className="tabla-base">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Venta</th>
                    <th>N° Factura</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>Descargas</th>
                  </tr>
                </thead>
                <tbody>
                  {facturas.map((f) => (
                    <tr key={f.id}>
                      <td className="fact-id">#{f.id}</td>
                      <td>{f.venta_id ? `#${f.venta_id}` : '—'}</td>
                      <td>
                        <span className="fact-numero">{f.numero_factura || '—'}</span>
                      </td>
                      <td>
                        <span className={`fact-badge ${badgeEstado(f.estado)}`}>
                          {f.estado || 'Pendiente'}
                        </span>
                      </td>
                      <td className="fact-fecha">{formatearFecha(f.creada_en)}</td>
                      <td>
                        {f.numero_factura ? (
                          <div className="fact-acciones">
                            <button
                              className="fact-btn-pdf"
                              onClick={() => descargarArchivo('pdf', f.numero_factura)}
                              disabled={descargando[`pdf-${f.numero_factura}`]}
                              title="Descargar PDF"
                            >
                              {descargando[`pdf-${f.numero_factura}`] ? '⏳' : '📄'} PDF
                            </button>
                            <button
                              className="fact-btn-xml"
                              onClick={() => descargarArchivo('xml', f.numero_factura)}
                              disabled={descargando[`xml-${f.numero_factura}`]}
                              title="Descargar XML"
                            >
                              {descargando[`xml-${f.numero_factura}`] ? '⏳' : '🧾'} XML
                            </button>
                          </div>
                        ) : (
                          <span className="fact-sin-numero">Sin número</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </LayoutBase>
  );
}

export default Facturacion;
