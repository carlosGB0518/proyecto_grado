import dotenv from "dotenv";
import axios from "axios";
import qs from "qs";

dotenv.config();

// 🔧 URLs base — separadas para autenticación y API principal
const AUTH_BASE = process.env.FACTUS_AUTH_URL || "https://api-sandbox.factus.com.co";
const API_BASE = process.env.FACTUS_BASE_URL || "https://api-sandbox.factus.com.co/api";

let accessToken = null;
let tokenExp = 0;

/**
 * 🔑 Obtener y cachear token OAuth2 de Factus
 */
async function getToken() {
  const now = Date.now();

  // Si el token aún es válido, reutilizarlo
  if (accessToken && now < tokenExp - 60_000) {
    return accessToken;
  }

  try {
    const { data } = await axios.post(
      `${AUTH_BASE}/oauth/token`,
      qs.stringify({
        grant_type: "password",
        client_id: process.env.FACTUS_CLIENT_ID,
        client_secret: process.env.FACTUS_CLIENT_SECRET,
        username: process.env.FACTUS_USERNAME,
        password: process.env.FACTUS_PASSWORD,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    accessToken = data.access_token;
    tokenExp = Date.now() + (data.expires_in ?? 3600) * 1000;

    console.log("✅ Token obtenido correctamente de Factus");
    return accessToken;
  } catch (error) {
    console.error("❌ Error obteniendo token de Factus:", error.response?.data || error.message);
    throw new Error("No se pudo obtener el token de Factus");
  }
}

/**
 * 🚀 Realizar peticiones autenticadas a Factus
 */
async function factusRequest(method, url, body) {
  const token = await getToken();
  const fullUrl = `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`;

  try {
    const response = await axios.request({
      method,
      url: fullUrl,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: body,
    });

    return response;
  } catch (error) {
    console.error("❌ Error en la petición a Factus:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * 🧾 Crear y validar factura electrónica (endpoint oficial)
 */
export async function crearYValidarFactura(payload) {
  // ✅ Endpoint correcto según la documentación oficial:
  return factusRequest("POST", "/v1/bills/validate", payload);
}


/**
 * 📄 Descargar PDF de la factura (versión final correcta)
 */
export async function descargarPdf(number) {
  const token = await getToken();
  const url = `https://api-sandbox.factus.com.co/v1/bills/download-pdf/${number}`;

  try {
    console.log("➡️ Solicitando PDF desde Factus:", url);

    const { data } = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
      }
    });

    if (data?.data?.pdf_base_64_encoded) {
      console.log("✅ PDF base64 recibido correctamente.");
      return { pdf_base64: data.data.pdf_base_64_encoded };
    } else {
      console.error("❌ No se encontró el campo 'pdf_base_64_encoded' en la respuesta:", data);
      throw new Error("El PDF no se recibió correctamente desde Factus.");
    }
  } catch (error) {
    console.error("❌ Error descargando PDF:", error.response?.data || error.message);
    throw error;
  }
}


/**
 * 📄 Descargar XML de la factura 
 */
export async function descargarXml(number) {
  const token = await getToken();
  const url = `https://api-sandbox.factus.com.co/v1/bills/download-xml/${number}`;

  try {
    console.log("➡️ Solicitando XML desde Factus:", url);

    const { data } = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
      },
      responseType: "json",
    });

    if (data?.data?.xml_base_64_encoded) {
      console.log("✅ XML base64 recibido correctamente.");
      return { xml_base64: data.data.xml_base_64_encoded };
    } else {
      console.error("❌ No se encontró el campo 'xml_base_64_encoded' en la respuesta:", data);
      throw new Error("El XML no se recibió correctamente desde Factus.");
    }
  } catch (error) {
    console.error("❌ Error descargando XML:", error.response?.data || error.message);
    throw error;
  }
}



export default {
  crearYValidarFactura,
  descargarPdf,
  descargarXml,
};
