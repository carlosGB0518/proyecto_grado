import dotenv from "dotenv";
import express from "express";
import cors from "cors";

import facturaRoutes from "./routes/factura.routes.js";

dotenv.config();

const app = express();

// ================================================================
// CORS — configuración robusta para Vercel + desarrollo local
// ================================================================

const ORIGENES_PERMITIDOS = [
  // Producción — Vercel (agrega aquí TODOS tus dominios de Vercel)
  "https://proyecto-grado-teal.vercel.app",
  "https://proyecto-grado-git-limpia-supermercado-maximos-projects.vercel.app",
  // Desarrollo local
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
];

const opcionesCors = {
  origin: function (origin, callback) {
    // Permite peticiones sin origin (Postman, curl, SSR)
    if (!origin) return callback(null, true);

    if (ORIGENES_PERMITIDOS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS bloqueado para origen: ${origin}`);
      callback(new Error(`Origen no permitido por CORS: ${origin}`));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],
  credentials: true,
  optionsSuccessStatus: 200, // Algunos browsers antiguos usan 204, pero 200 es más seguro
};

// Aplicar CORS ANTES de cualquier otra cosa
app.use(cors(opcionesCors));

// ✅ Responder a preflight OPTIONS en TODAS las rutas
// Esto es crítico — sin esto el browser bloquea las peticiones POST/PUT
app.options("*", cors(opcionesCors));

// ================================================================
// Middlewares generales
// ================================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================================================================
// Ruta de salud (útil para verificar que el backend está vivo)
// ================================================================
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    mensaje: "🚀 API Supermercado Máximo funcionando",
    timestamp: new Date().toISOString(),
  });
});

// Ruta de salud explícita para Render health checks
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ================================================================
// Rutas de la API
// ================================================================
app.use("/api", facturaRoutes);

// ================================================================
// Manejo de errores CORS (responde con JSON en vez de HTML)
// ================================================================
app.use((err, req, res, next) => {
  if (err.message && err.message.includes("CORS")) {
    return res.status(403).json({
      error: "CORS",
      mensaje: err.message,
      origenRecibido: req.headers.origin || "sin origin",
    });
  }
  console.error("❌ Error no manejado:", err.message);
  res.status(500).json({ error: err.message });
});

// ================================================================
// Inicio del servidor
// ================================================================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en puerto ${PORT}`);
  console.log(`🌍 Orígenes CORS permitidos:`);
  ORIGENES_PERMITIDOS.forEach(o => console.log(`   ✅ ${o}`));
});