import buildFactura from "../utils/buildFactura.js";
import {
  crearYValidarFactura,
  descargarPdf,
  descargarXml,
} from "../services/factus.service.js";
import { supabase } from "../supabase.js";

/**
 * 🧾 Emitir factura electrónica y guardar en Supabase
 */
export async function emitirFactura(req, res) {
  console.log("📥 [FACTURAS] Body recibido:", JSON.stringify(req.body, null, 2));

  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: "El body está vacío." });
    }

    // 1️⃣ Construir payload para Factus
    const payload = buildFactura(req.body);
    console.log("📦 [FACTURAS] Payload a Factus:", JSON.stringify(payload, null, 2));

    // 2️⃣ Llamar a Factus
    let factusRespuesta;
    try {
      const { data } = await crearYValidarFactura(payload);
      factusRespuesta = data;
      console.log("✅ [FACTURAS] Respuesta Factus:", JSON.stringify(data, null, 2));
    } catch (factusError) {
      const detalle = factusError.response?.data || factusError.message;
      console.error("❌ [FACTURAS] Error en Factus:", detalle);

      // Guardar en Supabase con estado 'error' para que aparezca en el listado
      const { error: supaErr } = await supabase.from("facturas").insert([{
        venta_id:       req.body.venta_id || null,
        estado:         "error",
        datos_completos: { error: detalle },
      }]);

      if (supaErr) {
        console.error("❌ [FACTURAS] Error guardando error en Supabase:", supaErr.message);
      }

      return res.status(400).json({
        error:   "Error al comunicarse con Factus",
        detalle: detalle,
      });
    }

    // 3️⃣ Extraer campos de la respuesta de Factus
    // Factus puede devolver la info en distintos niveles según la versión
    const bill = factusRespuesta?.data?.bill || factusRespuesta?.bill || {};

    const facturaData = {
      venta_id:       req.body.venta_id || null,
      uuid:           bill.cufe || factusRespuesta?.data?.cufe || null,
      numero_factura: bill.number || factusRespuesta?.data?.number || null,
      estado:         factusRespuesta?.status || "emitida",
      cufe:           bill.cufe || factusRespuesta?.data?.cufe || null,
      pdf_url:        bill.public_url || bill.pdf_url || null,
      xml_url:        bill.xml_url || null,
      datos_completos: factusRespuesta || {},
    };

    console.log("📝 [FACTURAS] Datos a insertar en Supabase:", facturaData);

    // 4️⃣ Guardar en Supabase
    const { data: insertado, error: supaError } = await supabase
      .from("facturas")
      .insert([facturaData])
      .select()
      .single();

    if (supaError) {
      console.error("❌ [FACTURAS] Error guardando en Supabase:", supaError.message);
      console.error("Código error:", supaError.code);
      console.error("Detalle:", supaError.details);
      // No fallamos — la factura fue emitida en Factus, solo falló el guardado local
    } else {
      console.log("🗄️ [FACTURAS] Guardada en Supabase con ID:", insertado?.id);
    }

    // 5️⃣ Respuesta al frontend
    res.status(201).json({
      mensaje:        "Factura emitida correctamente",
      numero_factura: facturaData.numero_factura,
      estado:         facturaData.estado,
      cufe:           facturaData.cufe,
      pdf_url:        facturaData.pdf_url,
      supabase_id:    insertado?.id || null,
      respuesta:      factusRespuesta,
    });

  } catch (error) {
    const detalle = error.response?.data || error.message;
    console.error("❌ [FACTURAS] Error general:", detalle);
    res.status(400).json({ error: detalle });
  }
}

/**
 * 📄 Descargar PDF de una factura
 */
export async function obtenerPdf(req, res) {
  try {
    const { number } = req.params;
    if (!number) {
      return res.status(400).json({ error: "Falta el número de factura." });
    }

    console.log("➡️ [PDF] Solicitando número:", number);
    const factusResponse = await descargarPdf(number);

    // Buscar el base64 en distintos niveles de la respuesta
    const data = factusResponse?.data?.data || factusResponse?.data || factusResponse;
    const pdfBase64 =
      data?.pdf_base_64_encoded ||
      data?.pdf_base64_encoded  ||
      data?.pdf_base64          ||
      data?.pdf                 ||
      data?.data?.pdf_base_64_encoded ||
      null;

    if (!pdfBase64) {
      console.error("❌ [PDF] No se encontró base64. Estructura:", Object.keys(data || {}));
      return res.status(400).json({
        error:     "No se recibió el PDF desde Factus.",
        estructura: Object.keys(data || {}),
      });
    }

    const pdfBuffer = Buffer.from(pdfBase64, "base64");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Factura_${number}.pdf"`);
    res.send(pdfBuffer);

    console.log("✅ [PDF] Enviado correctamente.");
  } catch (error) {
    console.error("❌ [PDF] Error:", error.response?.data || error.message);
    res.status(400).json({ error: error.response?.data || error.message });
  }
}

/**
 * 🧾 Descargar XML de una factura
 */
export async function obtenerXml(req, res) {
  try {
    const { number } = req.params;
    if (!number) {
      return res.status(400).json({ error: "Falta el número de factura." });
    }

    console.log("➡️ [XML] Solicitando número:", number);
    const factusResponse = await descargarXml(number);

    const data = factusResponse?.data?.data || factusResponse?.data || factusResponse;
    const xmlBase64 =
      data?.xml_base_64_encoded ||
      data?.xml_base64_encoded  ||
      data?.xml_base64          ||
      data?.xml                 ||
      data?.data?.xml_base_64_encoded ||
      null;

    if (!xmlBase64) {
      console.error("❌ [XML] No se encontró base64. Estructura:", Object.keys(data || {}));
      return res.status(400).json({
        error:     "No se recibió el XML desde Factus.",
        estructura: Object.keys(data || {}),
      });
    }

    const xmlBuffer = Buffer.from(xmlBase64, "base64");
    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Content-Disposition", `attachment; filename="Factura_${number}.xml"`);
    res.send(xmlBuffer);

    console.log("✅ [XML] Enviado correctamente.");
  } catch (error) {
    console.error("❌ [XML] Error:", error.response?.data || error.message);
    res.status(400).json({ error: error.response?.data || error.message });
  }
}