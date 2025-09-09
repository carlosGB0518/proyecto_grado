import { crearYValidarFactura, descargarPdf, descargarXml } from "../services/factus.service.js";
import buildFactura from "../utils/buildFactura.js";

export async function emitirFactura(req, res) {
  console.log("📥 Petición recibida en /api/facturas:", req.body);
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: "El body está vacío. Debes enviar los datos de la factura." });
    }

    // 1. Construir el payload en el formato de Factus
    const payload = buildFactura(req.body);
    console.log("📦 Payload enviado a Factus:", payload);

    // 2. Crear y validar factura en Factus
    const { data } = await crearYValidarFactura(payload);
    console.log("✅ Respuesta Factus:", data);

    // 3. TODO: Guardar en DB (supabase más adelante)

    // 4. Enviar respuesta al cliente
    res.status(201).json({
      mensaje: "Factura emitida correctamente",
      uuid: data?.uuid || null,
      estado: data?.status || null,
      cufe: data?.cufe || null,
      respuesta: data
    });

  } catch (error) {
    console.error("❌ Error emitiendo factura:", error.response?.data || error.message);
    res.status(400).json({ error: error.response?.data || error.message });
  }
}

export async function obtenerPdf(req, res) {
  try {
    const { uuid } = req.params;
    if (!uuid) {
      return res.status(400).json({ error: "Debes proporcionar un UUID" });
    }

    const { data } = await descargarPdf(uuid);

    // ⚠️ Factus devuelve el PDF en base64, lo enviamos directamente como JSON
    res.json({ pdf: data });
  } catch (error) {
    console.error("❌ Error obteniendo PDF:", error.response?.data || error.message);
    res.status(400).json({ error: error.response?.data || error.message });
  }
}

export async function obtenerXml(req, res) {
  try {
    const { uuid } = req.params;
    if (!uuid) {
      return res.status(400).json({ error: "Debes proporcionar un UUID" });
    }

    const { data } = await descargarXml(uuid);

    res.json({ xml: data });
  } catch (error) {
    console.error("❌ Error obteniendo XML:", error.response?.data || error.message);
    res.status(400).json({ error: error.response?.data || error.message });
  }
}
