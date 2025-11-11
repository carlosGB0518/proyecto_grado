import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import LayoutBase from '../layouts/LayoutBase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../estilos/proveedores.css';

const Proveedores = () => {
  return <div style={{ padding: '2rem' }}>✅ Página de proveedores cargada correctamente</div>;
};

export default Proveedores;

