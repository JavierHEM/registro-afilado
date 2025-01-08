import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, addDoc, query, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { 
  MagnifyingGlassIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

const TIPOS_AFILADO = ['LOMO', 'PECHO'];

export default function RegistroAfiladoPage() {
  const [codigo, setCodigo] = useState('');
  const [sierra, setSierra] = useState(null);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [nuevoRegistro, setNuevoRegistro] = useState({
    tipoAfilado: '',
    fechaAfilado: '',
    observaciones: '',
    ultimoAfilado: false
  });

  useEffect(() => {
    fetchSucursales();
  }, []);

  const fetchSucursales = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'sucursales'));
      setSucursales(querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
    } catch (error) {
      console.error('Error al cargar sucursales:', error);
    }
  };

  const buscarSierra = async () => {
    if (!codigo.trim()) return;
    
    setLoading(true);
    setError('');
    setSierra(null);

    try {
      const q = query(collection(db, 'registro_sierras'), where('codigo', '==', codigo));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('Sierra no encontrada. ¿Desea registrarla?');
        setIsModalOpen(true);
      } else {
        const sierraData = {
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data()
        };

        if (sierraData.ultimoAfilado) {
          setError('¡ADVERTENCIA! Esta sierra está marcada como último afilado y no puede ser afilada nuevamente.');
          setSierra(sierraData);
          return;
        }

        // Cargar historial
        const historialQuery = query(
          collection(db, 'historial_afilados'),
          where('sierraId', '==', sierraData.id)
        );
        const historialSnapshot = await getDocs(historialQuery);
        const historial = historialSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setSierra({ ...sierraData, historial });
      }
    } catch (error) {
      console.error('Error al buscar sierra:', error);
      setError('Error al buscar sierra. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodigoKeyPress = (e) => {
    if (e.key === 'Enter') {
      buscarSierra();
    }
  };

  const handleRegistroAfilado = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Crear el nuevo registro de afilado
      const registroAfilado = {
        sierraId: sierra.id,
        fecha: new Date(nuevoRegistro.fechaAfilado),
        tipoAfilado: nuevoRegistro.tipoAfilado,
        observaciones: nuevoRegistro.observaciones,
        sucursal: sierra.sucursal
      };

      // Registrar el afilado
      await addDoc(collection(db, 'historial_afilados'), registroAfilado);

      // Actualizar el estado de la sierra si es último afilado
      if (nuevoRegistro.ultimoAfilado) {
        const sierraRef = doc(db, 'registro_sierras', sierra.id);
        await updateDoc(sierraRef, {
          ultimoAfilado: true,
          fechaUltimoAfilado: new Date(nuevoRegistro.fechaAfilado)
        });
      }

      // Limpiar formulario y recargar datos
      setNuevoRegistro({
        tipoAfilado: '',
        fechaAfilado: '',
        observaciones: '',
        ultimoAfilado: false
      });
      
      await buscarSierra();
    } catch (error) {
      console.error('Error al registrar afilado:', error);
      setError('Error al registrar afilado. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-white mb-8">Registro de Afilado</h2>

      {/* Búsqueda */}
      <div className="mb-8">
        <div className="max-w-xl flex gap-4">
          <div className="flex-1">
            <label htmlFor="codigo" className="block text-sm font-medium text-gray-400 mb-1">
              Código de Sierra
            </label>
            <input
              id="codigo"
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              onKeyPress={handleCodigoKeyPress}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              placeholder="Escanee o ingrese el código"
              autoFocus
            />
          </div>
          <button
            onClick={buscarSierra}
            disabled={loading}
            className="self-end px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mensajes de error */}
      {error && (
        <div className={`p-4 rounded-lg mb-6 ${
          error.includes('ADVERTENCIA') ? 'bg-yellow-900/50 text-yellow-200' : 'bg-red-900/50 text-red-200'
        }`}>
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Información de la sierra y formulario de registro */}
      {sierra && (
        <div className="space-y-6">
          {/* Información de la sierra */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-medium text-white mb-4">Información de la Sierra</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Código</p>
                <p className="text-white">{sierra.codigo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Sucursal</p>
                <p className="text-white">
                  {sucursales.find(s => s.id === sierra.sucursal)?.nombre || 'No especificada'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Estado</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  sierra.ultimoAfilado ? 'bg-red-400/10 text-red-400' : 'bg-green-400/10 text-green-400'
                }`}>
                  {sierra.ultimoAfilado ? 'Último afilado realizado' : 'Disponible para afilar'}
                </span>
              </div>
            </div>

            {/* Formulario de registro de afilado */}
            {!sierra.ultimoAfilado && (
              <form onSubmit={handleRegistroAfilado} className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Tipo de Afilado
                    </label>
                    <select
                      value={nuevoRegistro.tipoAfilado}
                      onChange={(e) => setNuevoRegistro({
                        ...nuevoRegistro,
                        tipoAfilado: e.target.value
                      })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Seleccione tipo</option>
                      {TIPOS_AFILADO.map(tipo => (
                        <option key={tipo} value={tipo}>{tipo}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Fecha y Hora de Afilado
                    </label>
                    <input
                      type="datetime-local"
                      value={nuevoRegistro.fechaAfilado}
                      onChange={(e) => setNuevoRegistro({
                        ...nuevoRegistro,
                        fechaAfilado: e.target.value
                      })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Observaciones
                    </label>
                    <textarea
                      value={nuevoRegistro.observaciones}
                      onChange={(e) => setNuevoRegistro({
                        ...nuevoRegistro,
                        observaciones: e.target.value
                      })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                      rows="3"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={nuevoRegistro.ultimoAfilado}
                        onChange={(e) => setNuevoRegistro({
                          ...nuevoRegistro,
                          ultimoAfilado: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      <span className="ml-3 text-sm font-medium text-gray-400">
                        Marcar como último afilado
                      </span>
                    </label>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600"
                  >
                    {loading ? 'Registrando...' : 'Registrar Afilado'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Historial de afilados */}
          {sierra.historial && sierra.historial.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Historial de Afilados</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left text-sm text-gray-400 pb-2">Fecha</th>
                      <th className="text-left text-sm text-gray-400 pb-2">Tipo</th>
                      <th className="text-left text-sm text-gray-400 pb-2">Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sierra.historial.map((registro) => (
                      <tr key={registro.id} className="border-t border-gray-700">
                        <td className="py-2 text-white">
                          {registro.fecha.toDate().toLocaleString()}
                        </td>
                        <td className="py-2 text-white">{registro.tipoAfilado}</td>
                        <td className="py-2 text-white">{registro.observaciones || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}