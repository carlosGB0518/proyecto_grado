import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import '../estilos/ModalEditarVencimiento.css';

function ModalEditarVencimiento({ productoId, productoNombre, onClose, onGuardar }) {
  const [datos, setDatos] = useState({
    fecha_entrada: '',
    fecha_vencimiento: '',
    numero_lote: '',
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (productoId) {
      cargarDatos();
    }
  }, [productoId]);

  const cargarDatos = async () => {
    try {
      const { data, error: err } = await supabase
        .from('productos')
        .select('fecha_entrada, fecha_vencimiento, numero_lote')
        .eq('id', productoId)
        .single();

      if (err) {
        console.error('Error cargando datos:', err);
        setError('Error al cargar los datos del producto');
      } else if (data) {
        setDatos({
          fecha_entrada: data.fecha_entrada || '',
          fecha_vencimiento: data.fecha_vencimiento || '',
          numero_lote: data.numero_lote || '',
        });
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error inesperado al cargar datos');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDatos((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!datos.fecha_entrada) {
      setError('La fecha de entrada es requerida');
      return;
    }
    if (!datos.fecha_vencimiento) {
      setError('La fecha de vencimiento es requerida');
      return;
    }

    // Validar que vencimiento sea posterior a entrada
    if (new Date(datos.fecha_vencimiento) <= new Date(datos.fecha_entrada)) {
      setError('La fecha de vencimiento debe ser posterior a la de entrada');
      return;
    }

    setCargando(true);

    try {
      const { error: err } = await supabase
        .from('productos')
        .update({
          fecha_entrada: datos.fecha_entrada,
          fecha_vencimiento: datos.fecha_vencimiento,
          numero_lote: datos.numero_lote || null,
        })
        .eq('id', productoId);

      if (err) {
        console.error('Error de Supabase:', err);
        setError('Error al guardar: ' + err.message);
      } else {
        // Esperar un poco para asegurar que Supabase se sincroniza
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Llamar al callback para actualizar la lista padre
        if (onGuardar) {
          onGuardar();
        }
        
        // Pequeno delay antes de cerrar para feedback visual
        setTimeout(() => {
          onClose();
        }, 500);
      }
    } catch (err) {
      console.error('Error inesperado:', err);
      setError('Error inesperado: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  const handleOverlayClick = (e) => {
    // Solo cierra si se hace clic en el overlay, no en el contenido
    if (e.target.className === 'modal-overlay') {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Gestionar Fechas</h2>
          <button 
            className="btn-cerrar" 
            onClick={onClose}
            type="button"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p className="producto-nombre">
            Producto: <strong>{productoNombre}</strong>
          </p>

          <form onSubmit={handleGuardar} className="formulario">
            <div className="form-grupo">
              <label htmlFor="numero_lote">Número de Lote:</label>
              <input
                id="numero_lote"
                type="text"
                name="numero_lote"
                value={datos.numero_lote}
                onChange={handleChange}
                placeholder="Ej: LOTE-2024-001"
                className="input-form"
                disabled={cargando}
              />
            </div>

            <div className="form-grupo">
              <label htmlFor="fecha_entrada">
                Fecha de Entrada: <span className="requerido">*</span>
              </label>
              <input
                id="fecha_entrada"
                type="date"
                name="fecha_entrada"
                value={datos.fecha_entrada}
                onChange={handleChange}
                required
                className="input-form"
                disabled={cargando}
              />
            </div>

            <div className="form-grupo">
              <label htmlFor="fecha_vencimiento">
                Fecha de Vencimiento: <span className="requerido">*</span>
              </label>
              <input
                id="fecha_vencimiento"
                type="date"
                name="fecha_vencimiento"
                value={datos.fecha_vencimiento}
                onChange={handleChange}
                required
                className="input-form"
                disabled={cargando}
              />
            </div>

            {error && <div className="error-mensaje">⚠️ {error}</div>}

            <div className="modal-acciones">
              <button
                type="button"
                onClick={onClose}
                className="btn-cancelar"
                disabled={cargando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-guardar"
                disabled={cargando}
              >
                {cargando ? 'Guardando...' : 'Guardar Fechas'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ModalEditarVencimiento;