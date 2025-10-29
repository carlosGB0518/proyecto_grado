import { Router } from "express";
import facturaRoutes from "./factura.routes.js";

const router = Router();

router.use("/", facturaRoutes);

export default router;