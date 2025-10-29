import { Router } from "express";
import { emitirFactura, obtenerPdf, obtenerXml } from "../controllers/factura.controller.js";

const router = Router();

// Emitir factura electrónica
router.post("/facturas", emitirFactura);

// Descargar PDF
router.get("/facturas/:number/pdf", obtenerPdf);

// Descargar XML
router.get("/facturas/:number/xml", obtenerXml);

export default router;
