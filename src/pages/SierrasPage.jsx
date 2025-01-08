import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';

export default function SierrasPage() {
  const [tipos, setTipos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    estado: true,
    descripcion: ''
  });

  useEffect(() => {
    fetchTiposSierra();
  }, []);

  const fetchTiposSierra = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'tipos_sierra'));
      const tiposData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTipos(tiposData);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar tipos de sierra:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        await updateDoc(doc(db, 'tipos_sierra', editando), formData);
      } else {
        await addDoc(collection(db, 'tipos_sierra'), {
          ...formData,
          fechaCreacion: new Date()
        });
      }
      setIsModalOpen(false);
      resetForm();
      fetchTiposSierra();
    } catch (error) {
      console.error('Error al guardar tipo de sierra:', error);
    }
  };

  const handleEdit = (tipo) => {
    setFormData({
      codigo: tipo.codigo,
      nombre: tipo.nombre,
      estado: tipo.estado,
      descripcion: tipo.descripcion
    });
    setEditando(tipo.id);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      codigo: '',
      nombre: '',
      estado: true,
      descripcion: ''
    });
    setEditando(null);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-white">Categorías de Sierra</h2>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5" />
          Nueva Categoría
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-400">Cargando categorías...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tipos.map((tipo) => (
            <div
              key={tipo.id}
              className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800/50 p-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium text-white">
                      {tipo.nombre}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        tipo.estado
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-red-500/10 text-red-500'
                      }`}
                    >
                      {tipo.estado ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <p className="text-gray-400 mt-1">Código: {tipo.codigo}</p>
                  <p className="text-gray-400 mt-2">{tipo.descripcion}</p>
                </div>
                <button
                  onClick={() => handleEdit(tipo)}
                  className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-white mb-4">
              {editando ? 'Editar Categoría' : 'Nueva Categoría'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Código
                </label>
                <input
                  type="text"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>
              <div className="flex items-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-400">Activo</span>
                </label>
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editando ? 'Guardar Cambios' : 'Crear Categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}