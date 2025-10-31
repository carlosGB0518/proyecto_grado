import { useEffect, useState } from "react";
import LayoutBase from "../layouts/LayoutBase";
import api from '../services/api';
import { supabase } from "../supabase";
import "../estilos/facturacion.css";

function Facturacion() {
  const [facturas, setFacturas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // 🔹 Cargar facturas desde Supabase al montar el componente
  useEffect(() => {
    const cargarFacturas = async () => {
      const { data, error } = await supabase
        .from("facturas")
        .select(
          "id, venta_id, uuid, numero_factura, estado, pdf_url, xml_url, creada_en"
        )
        .order("id", { ascending: false });

      if (error) {
        console.error("Error cargando facturas:", error.message);
        alert("❌ Error al cargar facturas");
      } else {
        setFacturas(data);
      }

      setCargando(false);
    };

    cargarFacturas();
  }, []);

  // 🔹 Descargar PDF
const descargarPdf = async (numeroFactura) => {
  if (!numeroFactura) {
    alert("⚠️ No hay número de factura disponible.");
    return;
  }

  try {
    const res = await fetch(`${api}/api/facturas/${numeroFactura}/pdf`);

    if (!res.ok) throw new Error("Error descargando PDF desde el backend");

    // 📦 Convertir respuesta a binario
    const blob = await res.blob();

    // 🔗 Crear enlace temporal
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Factura_${numeroFactura}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    console.log("✅ PDF descargado correctamente");
  } catch (err) {
    console.error("❌ Error descargando PDF:", err);
    alert("❌ Error al descargar PDF. Revisa la consola del backend.");
  }
};

// 🔹 Descargar XML
const descargarXml = async (numeroFactura) => {
  if (!numeroFactura) {
    alert("⚠️ No hay número de factura disponible.");
    return;
  }

  try {
    const res = await fetch(`${api}/api/facturas/${numeroFactura}/xml`);

    if (!res.ok) throw new Error("Error descargando XML desde el backend");

    // 📦 Convertir respuesta a binario
    const blob = await res.blob();

    // 🔗 Crear enlace temporal
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Factura_${numeroFactura}.xml`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    console.log("✅ XML descargado correctamente");
  } catch (err) {
    console.error("❌ Error descargando XML:", err);
    alert("❌ Error al descargar XML. Revisa la consola del backend.");
  }
};

  if (cargando) return <p>Cargando facturas...</p>;

  return (
    <LayoutBase>
      <h1>📄 Facturación Electrónica</h1>

      {facturas.length === 0 ? (
        <p>No hay facturas registradas.</p>
      ) : (
        <table className="tabla-facturas">
          <thead>
            <tr>
              <th>ID</th>
              <th>Venta</th>
              <th>Número Factura</th>
              <th>UUID</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {facturas.map((f) => (
              <tr key={f.id}>
                <td>{f.id}</td>
                <td>{f.venta_id || "—"}</td>
                <td>{f.numero_factura || "—"}</td>
                <td>{f.uuid || "—"}</td>
                <td>{f.estado || "Pendiente"}</td>
                <td>
                  {f.creada_en
                    ? new Date(f.creada_en).toLocaleString()
                    : "—"}
                </td>
                <td>
                  {f.numero_factura ? (
                    <>
                      <button
                        onClick={() => descargarPdf(f.numero_factura)}
                        className="btn-descargar"
                      >
                        📄 PDF
                      </button>
                      <button
                        onClick={() => descargarXml(f.numero_factura)}
                        className="btn-descargar"
                      >
                        🧾 XML
                      </button>
                    </>
                  ) : (
                    <span>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </LayoutBase>
  );
}

export default Facturacion;
