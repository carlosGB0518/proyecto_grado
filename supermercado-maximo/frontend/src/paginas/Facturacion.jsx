import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import LayoutBase from '../layouts/LayoutBase';
import api from '../services/api';
import { supabase } from '../supabase';
import '../estilos/facturacion.css';

function Facturacion() {
  const [facturas, setFacturas]       = useState([]);
  const [cargando, setCargando]       = useState(true);
  const [descargando, setDescargando] = useState({});

  useEffect(() => { cargarFacturas(); }, []);

  const cargarFacturas = async () => {
    const { data, error } = await supabase
      .from('facturas')
      .select('id, venta_id, uuid, numero_factura, estado, pdf_url, xml_url, creada_en')
      .order('id', { ascending: false });
    if (error) console.error('Error cargando facturas:', error.message);
    else setFacturas(data || []);
    setCargando(false);
  };

  // ── PDF / XML desde backend ───────────────────────────────────────
  const descargarArchivo = async (tipo, numeroFactura) => {
    if (!numeroFactura) { alert('⚠️ No hay número de factura disponible.'); return; }
    const key = `${tipo}-${numeroFactura}`;
    setDescargando(p => ({ ...p, [key]: true }));
    try {
      const res = await fetch(`${api}/api/facturas/${numeroFactura}/${tipo}`);
      if (!res.ok) throw new Error(`Error descargando ${tipo.toUpperCase()}`);
      const tipoMime = tipo === 'xml' ? 'application/octet-stream' : 'application/pdf';
      const blob = new Blob([await res.blob()], { type: tipoMime });
      const url  = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = `Factura_${numeroFactura}.${tipo}`;
      document.body.appendChild(link); link.click(); link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(`❌ Error al descargar ${tipo.toUpperCase()}.`);
    } finally {
      setDescargando(p => ({ ...p, [key]: false }));
    }
  };

  // ── Excel legible ─────────────────────────────────────────────────
  const exportarExcel = async (factura) => {
    const key = `xls-${factura.id}`;
    setDescargando(p => ({ ...p, [key]: true }));
    try {
      // Traer venta + detalles desde Supabase
      const [{ data: venta }, { data: detalles }] = await Promise.all([
        supabase
          .from('ventas')
          .select('id, fecha, total, metodo_pago, cajero, clientes(nombre, numero_identificacion, telefono, correo, direccion)')
          .eq('id', factura.venta_id)
          .single(),
        supabase
          .from('ventas_detalle')
          .select('cantidad, precio_unitario, productos(nombre, codigo)')
          .eq('venta_id', factura.venta_id),
      ]);

      const cli = venta?.clientes;
      const wb  = XLSX.utils.book_new();

      // Hoja 1 — Información general
      const ws1 = XLSX.utils.aoa_to_sheet([
        ['SUPERMERCADO MÁXIMO'],
        ['FACTURA ELECTRÓNICA'],
        [''],
        ['N° Factura:',     factura.numero_factura || '—'],
        ['CUFE / UUID:',    factura.uuid || '—'],
        ['Estado:',         factura.estado || '—'],
        ['Fecha emisión:',  fmt(factura.creada_en)],
        [''],
        ['DATOS DE LA VENTA'],
        ['ID Venta:',       `#${venta?.id || '—'}`],
        ['Fecha venta:',    fmt(venta?.fecha)],
        ['Método de pago:', venta?.metodo_pago || '—'],
        ['Cajero:',         venta?.cajero || '—'],
        [''],
        ['DATOS DEL CLIENTE'],
        ['Nombre:',         cli?.nombre || 'Consumidor final'],
        ['Identificación:', cli?.numero_identificacion || '—'],
        ['Teléfono:',       cli?.telefono || '—'],
        ['Correo:',         cli?.correo || '—'],
        ['Dirección:',      cli?.direccion || '—'],
      ]);
      ws1['!cols'] = [{ wch: 20 }, { wch: 52 }];
      ws1['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
        { s: { r: 8, c: 0 }, e: { r: 8, c: 1 } },
        { s: { r: 14, c: 0 }, e: { r: 14, c: 1 } },
      ];
      XLSX.utils.book_append_sheet(wb, ws1, 'Información');

      // Hoja 2 — Productos
      const filas = (detalles || []).map(d => [
        d.productos?.codigo || '—',
        d.productos?.nombre || 'Producto eliminado',
        d.cantidad,
        d.precio_unitario,
        d.cantidad * d.precio_unitario,
      ]);

      const ws2 = XLSX.utils.aoa_to_sheet([
        [`Factura ${factura.numero_factura || '—'} — Supermercado Máximo`],
        [`Venta #${venta?.id || '—'}  |  Fecha: ${fmt(venta?.fecha)}  |  Pago: ${venta?.metodo_pago || '—'}`],
        [''],
        ['Código', 'Producto', 'Cantidad', 'Precio Unitario ($)', 'Subtotal ($)'],
        ...filas,
        [''],
        ['', '', '', 'TOTAL:', venta?.total || 0],
      ]);
      ws2['!cols'] = [{ wch: 14 }, { wch: 38 }, { wch: 10 }, { wch: 20 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, ws2, 'Productos');

      XLSX.writeFile(wb, `Factura_${factura.numero_factura || factura.id}.xlsx`);
    } catch (err) {
      console.error('❌ Error generando Excel:', err);
      alert('❌ Error al generar el Excel: ' + err.message);
    } finally {
      setDescargando(p => ({ ...p, [key]: false }));
    }
  };

  const fmt = (f) => !f ? '—' : new Date(f).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const badgeEstado = (e) => ({
    emitida: 'fact-badge-emitida', pendiente: 'fact-badge-pendiente', error: 'fact-badge-error',
  })[e?.toLowerCase()] || 'fact-badge-pendiente';

  return (
    <LayoutBase>
      <div className="facturacion-container">
        <div className="facturacion-header">
          <div>
            <h1 className="facturacion-titulo">Facturación Electrónica</h1>
            <p className="facturacion-subtitulo">
              Descarga PDF, XML oficial DIAN o Excel legible por cada factura.
            </p>
          </div>
          <div className="facturacion-stats">
            <div className="fact-stat">
              <span className="fact-stat-valor">{facturas.length}</span>
              <span className="fact-stat-label">Total facturas</span>
            </div>
            <div className="fact-stat">
              <span className="fact-stat-valor">{facturas.filter(f => f.estado === 'emitida').length}</span>
              <span className="fact-stat-label">Emitidas</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {cargando ? (
            <div className="facturacion-estado">Cargando facturas...</div>
          ) : facturas.length === 0 ? (
            <div className="facturacion-estado">No hay facturas registradas.</div>
          ) : (
            <div className="facturacion-tabla-wrapper">
              <table className="tabla-base">
                <thead>
                  <tr>
                    <th>ID</th><th>Venta</th><th>N° Factura</th>
                    <th>Estado</th><th>Fecha</th><th>Descargas</th>
                  </tr>
                </thead>
                <tbody>
                  {facturas.map(f => (
                    <tr key={f.id}>
                      <td className="fact-id">#{f.id}</td>
                      <td>{f.venta_id ? `#${f.venta_id}` : '—'}</td>
                      <td><span className="fact-numero">{f.numero_factura || '—'}</span></td>
                      <td>
                        <span className={`fact-badge ${badgeEstado(f.estado)}`}>
                          {f.estado || 'Pendiente'}
                        </span>
                      </td>
                      <td className="fact-fecha">{fmt(f.creada_en)}</td>
                      <td>
                        <div className="fact-acciones">
                          {f.numero_factura ? (
                            <>
                              <button className="fact-btn-pdf"
                                onClick={() => descargarArchivo('pdf', f.numero_factura)}
                                disabled={descargando[`pdf-${f.numero_factura}`]}
                                title="Descargar PDF oficial">
                                {descargando[`pdf-${f.numero_factura}`] ? '⏳' : '📄'} PDF
                              </button>
                              <button className="fact-btn-xml"
                                onClick={() => descargarArchivo('xml', f.numero_factura)}
                                disabled={descargando[`xml-${f.numero_factura}`]}
                                title="Descargar XML DIAN">
                                {descargando[`xml-${f.numero_factura}`] ? '⏳' : '🧾'} XML
                              </button>
                            </>
                          ) : (
                            <span className="fact-sin-numero">Sin número</span>
                          )}
                          {f.venta_id && (
                            <button className="fact-btn-excel"
                              onClick={() => exportarExcel(f)}
                              disabled={descargando[`xls-${f.id}`]}
                              title="Exportar Excel legible con datos de la factura">
                              {descargando[`xls-${f.id}`] ? '⏳' : '📊'} Excel
                            </button>
                          )}
                        </div>
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