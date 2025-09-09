import axios from "axios";
import qs from "qs";

const BASE = process.env.FACTUS_BASE_URL;

let accessToken = null;
let tokenExp = 0;

async function getToken() {
  const now = Date.now();
  if (accessToken && now < tokenExp - 60_000) return accessToken;

  const { data } = await axios.post(`${BASE}/oauth/token`,
    qs.stringify({
      grant_type: "password",
      client_id: process.env.FACTUS_CLIENT_ID,
      client_secret: process.env.FACTUS_CLIENT_SECRET,
      username: process.env.FACTUS_USERNAME,
      password: process.env.FACTUS_PASSWORD
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  console.log("🔑 Token recibido:", data); // Log para depuración

  accessToken = data.access_token;
  tokenExp = Date.now() + (data.expires_in ?? 3600) * 1000;
  return accessToken;
}

async function factusRequest(method, url, body) {
  const token = await getToken();
  const fullUrl = `${BASE}${url.startsWith("/") ? url : `/${url}`}`;
  console.log("➡️ URL Factus:", fullUrl); // Log para depuración
  return axios.request({
    method,
    url: fullUrl,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    data: body
  });
}

// API públicas
export async function crearYValidarFactura(payload) {
  return factusRequest("POST", "/api/facturas", payload);
}

export async function descargarPdf(uuid) {
  return factusRequest("GET", `/facturas/${uuid}/pdf`);
}

export async function descargarXml(uuid) {
  return factusRequest("GET", `/facturas/${uuid}/xml`);
}