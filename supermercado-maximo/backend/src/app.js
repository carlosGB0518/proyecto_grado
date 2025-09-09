

import express from "express";
import dotenv from "dotenv";
import facturaRoutes from "./routes/factura.routes.js";

dotenv.config();
const app = express();

// Middlewares
app.use(express.json());
app.get("/", (req, res) => {
  res.send("🚀 API de Supermercado funcionando");
});

// Rutas
app.use("/api", facturaRoutes);

// Puerto
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
});
