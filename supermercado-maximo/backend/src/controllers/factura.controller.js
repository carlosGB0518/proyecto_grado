import buildFactura from "../utils/buildFactura.js";
import {
  crearYValidarFactura,
  descargarPdf,
  descargarXml,
} from "../services/factus.service.js";
import { supabase } from "../supabase.js";


/**
 * 🧾 Emitir factura electrónica y guardar registro completo en Supabase
 */
export async function emitirFactura(req, res) {
  console.log("📥 Petición recibida en /api/facturas:", req.body);

  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        error: "El body está vacío. Debes enviar los datos de la factura.",
      });
    }

    // 1️⃣ Construir payload compatible con Factus
    const payload = buildFactura(req.body);
    console.log("📦 Payload enviado a Factus:", payload);

    // 2️⃣ Crear y validar factura en Factus
    const { data } = await crearYValidarFactura(payload);
    console.log("✅ Respuesta Factus:", data);

    // 📊 Extraer los datos principales
    const facturaData = {
      venta_id: req.body.venta_id || null,
      uuid: data?.bill?.uuid || null,
      numero_factura: data?.data?.bill?.number || null,
      estado: data?.status || "emitida",
      cufe: data?.data?.bill?.cufe || null,
      pdf_url: data?.data?.bill?.public_url || null, // 🔗 Enlace público de Factus
      xml_url: null, // Se completará cuando se descargue
      datos_completos: data || {},
    };

    // 3️⃣ Guardar en Supabase
    const { error: supaError } = await supabase
      .from("facturas")
      .insert([facturaData]);

    if (supaError) {
      console.error("❌ Error guardando factura en Supabase:", supaError.message);
    } else {
      console.log("🗄️ Factura registrada correctamente en Supabase");
    }

    // 4️⃣ Responder al frontend
    res.status(201).json({
      mensaje: "Factura emitida correctamente",
      numero_factura: facturaData.numero_factura,
      estado: facturaData.estado,
      cufe: facturaData.cufe,
      respuesta: data,
    });
  } catch (error) {
    console.error(
      "❌ Error emitiendo factura:",
      error.response?.data || error.message
    );
    res.status(400).json({ error: error.response?.data || error.message });
  }
}




export async function obtenerPdf(req, res) {
  try {
    const { number } = req.params;
    if (!number) {
      return res.status(400).json({ error: "Debes proporcionar un número de factura válido." });
    }

    console.log("➡️ Solicitando PDF desde Factus:", number);

    const factusResponse = await descargarPdf(number);

    // 🔍 Imprimimos para ver la estructura real
    console.log("📤 Estructura completa Factus PDF:", Object.keys(factusResponse || {}));
    console.log("📤 Estructura factusResponse.data:", Object.keys(factusResponse.data || {}));

    // 📦 Obtenemos el nivel correcto
    const data =
      factusResponse?.data?.data ||  // si viene anidado
      factusResponse?.data ||        // si viene plano
      factusResponse;                // último intento

    console.log("📤 Respuesta completa de Factus PDF:", data);

    // 🔑 Buscamos el campo que contenga el Base64
    const pdfBase64 =
      data?.pdf_base_64_encoded ||
      data?.pdf_base64_encoded ||
      data?.pdf_base64 ||
      data?.pdf ||
      data?.data?.pdf_base_64_encoded ||
      data?.data?.pdf_base64_encoded ||
      null;

    if (!pdfBase64) {
      console.error("❌ No se encontró el campo PDF base64 en la respuesta");
      return res.status(400).json({
        error: "No se recibió el PDF desde Factus.",
        estructura: Object.keys(data || {}),
      });
    }

    console.log("✅ PDF base64 recibido correctamente.");

    // 🧩 Convertimos a binario
    const pdfBuffer = Buffer.from(pdfBase64, "base64");

    // 📤 Enviamos el archivo al cliente
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Factura_${number}.pdf"`
    );
    res.send(pdfBuffer);

    console.log("✅ PDF enviado correctamente al cliente.");
  } catch (error) {
    console.error("❌ Error obteniendo PDF:", error.response?.data || error.message);
    res.status(400).json({ error: error.response?.data || error.message });
  }
}


export async function obtenerXml(req, res) {
  try {
    const { number } = req.params;
    if (!number) {
      return res.status(400).json({ error: "Debes proporcionar un número de factura válido." });
    }

    console.log("➡️ Solicitando XML desde Factus:", number);

    const factusResponse = await descargarXml(number);

    // 🔍 Log para inspeccionar la estructura
    console.log("📤 Estructura completa Factus XML:", Object.keys(factusResponse || {}));
    console.log("📤 Estructura factusResponse.data:", Object.keys(factusResponse.data || {}));

    // 📦 Obtenemos el objeto correcto
    const data =
      factusResponse?.data?.data ||
      factusResponse?.data ||
      factusResponse;

    console.log("📤 Respuesta completa de Factus XML:", data);

    // 🔑 Buscamos el campo correcto con el Base64
    const xmlBase64 =
      data?.xml_base64 ||
      data?.xml_base_64_encoded ||
      data?.xml ||
      data?.data?.xml_base64 ||
      null;

    if (!xmlBase64) {
      console.error("❌ No se encontró el campo XML base64 en la respuesta");
      return res.status(400).json({
        error: "No se recibió el XML desde Factus.",
        estructura: Object.keys(data || {}),
      });
    }

    console.log("✅ XML base64 recibido correctamente.");

    // 🧩 Convertimos a binario (UTF-8)
    const xmlBuffer = Buffer.from(xmlBase64, "base64");

    // 📤 Enviamos al cliente como descarga
    res.setHeader("Content-Type", "application/xml");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Factura_${number}.xml"`
    );
    res.send(xmlBuffer);

    console.log("✅ XML enviado correctamente al cliente.");
  } catch (error) {
    console.error("❌ Error obteniendo XML:", error.response?.data || error.message);
    res.status(400).json({ error: error.response?.data || error.message });
  }
}