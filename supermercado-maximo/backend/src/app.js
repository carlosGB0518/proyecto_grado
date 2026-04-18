import dotenv from "dotenv";
import express from "express";
import cors from "cors";

import facturaRoutes from "./routes/factura.routes.js";

// ✅ Cargar variables de entorno
dotenv.config();

// ✅ Verificación opcional (puedes quitar esto después)
console.log("FACTUS_BASE_URL:", process.env.FACTUS_BASE_URL);

const app = express();

// ✅ Middlewares
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map(origin => origin.trim())
  : ["https://proyecto-grado-teal.vercel.app"];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS policy: origin not allowed"));
    }
  },
  credentials: true,
}));
app.use(express.json());

// ✅ Ruta principal de prueba
app.get("/", (req, res) => {
  res.send("🚀 API de Supermercado funcionando correctamente");
});

// ✅ Montar rutas de factura
app.use("/api", facturaRoutes);

// ✅ Puerto
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
});
