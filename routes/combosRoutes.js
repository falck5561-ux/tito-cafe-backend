import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import apiClient from '../services/api';
import AuthContext from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

function CombosPage() {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);
  const { agregarProductoAPedido } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCombos = async () => {
      try {
        // --- LA CORRECCIÓN ESTÁ AQUÍ ---
        // La ruta correcta para obtener combos activos es simplemente '/combos'
        const response = await apiClient.get('/combos'); 
        setCombos(response.data);
      } catch (err) {
        setError('No se pudieron cargar los combos en este momento.');
        console.error("Error en CombosPage:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCombos();
  }, []);

  const handleOrdenarClick = (combo) => {
    if (!user) {
      toast.error('Por favor, inicia sesión para añadir al carrito.');
      navigate('/login');
      return;
    }
    
    const itemParaCarrito = {
      id: `combo-${combo.id}`,
      nombre: combo.titulo,
      precio: combo.precio_oferta > 0 ? combo.precio_oferta : combo.precio,
    };
    agregarProductoAPedido(itemParaCarrito);
  };

  return (
    <motion.div 
      className="container section-padding"
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-center mb-5">Nuestros Combos Especiales</h1>

      {loading && <div className="text-center"><div className="spinner-border"></div></div>}
      {error && <div className="alert alert-danger">{error}</div>}
      
      {!loading && !error && combos.length === 0 && (
        <div className="text-center p-5 rounded" style={{backgroundColor: 'var(--bs-tertiary-bg)'}}>
          <h3>No hay combos especiales disponibles por el momento.</h3>
          <p>¡Vuelve pronto para ver nuestras nuevas ofertas!</p>
        </div>
      )}

      {!loading && !error && combos.length > 0 && (
        <div className="row g-4">
          {combos.map((combo, index) => {
            const precioFinal = combo.precio_oferta > 0 ? combo.precio_oferta : combo.precio;
            const displayImage = (combo.imagenes && combo.imagenes.length > 0) 
              ? combo.imagenes[0] 
              : `https://placehold.co/400x300/d7ccc8/4a2c2a?text=${encodeURIComponent(combo.titulo)}`;

            return (
              <motion.div 
                key={combo.id} 
                className="col-md-6 col-lg-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="card h-100 shadow-sm overflow-hidden">
                  <img 
                    src={displayImage}
                    className="card-img-top" 
                    alt={combo.titulo}
                    style={{ height: '220px', objectFit: 'cover' }}
                  />
                  <div className="card-body d-flex flex-column">
                    <h4 className="card-title flex-grow-1">{combo.titulo}</h4>
                    <p className="card-text">{combo.descripcion}</p>
                  </div>
                  <div className="card-footer bg-transparent border-top-0 pb-3 d-flex justify-content-between align-items-center">
                    <div>
                      {combo.precio_oferta > 0 && Number(combo.precio_oferta) < Number(combo.precio) ? (
                        <>
                          <span className="text-muted text-decoration-line-through me-2">${Number(combo.precio).toFixed(2)}</span>
                          <span className="fw-bold fs-4 text-success">${Number(precioFinal).toFixed(2)}</span>
                        </>
                      ) : (
                        <span className="fw-bold fs-4">${Number(precioFinal).toFixed(2)}</span>
                      )}
                    </div>
                    <button onClick={() => handleOrdenarClick(combo)} className="btn btn-primary">
                      ¡Lo Quiero!
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

export default CombosPage;

