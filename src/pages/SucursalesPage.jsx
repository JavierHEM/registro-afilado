import { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

export default function SucursalesPage() {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    encargado: ''
  });

  useEffect(() => {
    fetchSucursales();
  }, []);

  const fetchSucursales = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'sucursales'));
      const sucursalesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSucursales(sucursalesData);
    } catch (error) {
      console.error('Error al cargar sucursales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        await updateDoc(doc(db, 'sucursales', editando), formData);
      } else {
        await addDoc(collection(db, 'sucursales'), {
          ...formData,
          fechaCreacion: new Date()
        });
      }
      setIsModalOpen(false);
      resetForm();
      fetchSucursales();
    } catch (error) {
      console.error('Error al guardar sucursal:', error);
    }
  };

  const handleEdit = (sucursal) => {
    setFormData({
      nombre: sucursal.nombre,
      direccion: sucursal.direccion,
      telefono: sucursal.telefono,
      encargado: sucursal.encargado || ''
    });
    setEditando(sucursal.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta sucursal?')) {
      try {
        await deleteDoc(doc(db, 'sucursales', id));
        fetchSucursales();
      } catch (error) {
        console.error('Error al eliminar sucursal:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      direccion: '',
      telefono: '',
      encargado: ''
    });
    setEditando(null);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-white">Sucursales</h2>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Nueva Sucursal
        </button>
      </div>

      {/* Grid de Sucursales */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-400">Cargando sucursales...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sucursales.map((sucursal) => (
            <div
              key={sucursal.id}
              className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800/50 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="bg-blue-500/10 rounded-lg p-2">
                    <BuildingOfficeIcon className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">
                      {sucursal.nombre}
                    </h3>
                    <p className="text-gray-400 mt-1">{sucursal.direccion}</p>
                    <p className="text-gray-400">{sucursal.telefono}</p>
                    {sucursal.encargado && (
                      <p className="text-gray-400 mt-2">
                        Encargado: {sucursal.encargado}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(sucursal)}
                    className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    <PencilSquareIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(sucursal.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
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
              {editando ? 'Editar Sucursal' : 'Nueva Sucursal'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  Dirección
                </label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Encargado
                </label>
                <input
                  type="text"
                  value={formData.encargado}
                  onChange={(e) => setFormData({ ...formData, encargado: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                />
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
                  {editando ? 'Guardar Cambios' : 'Crear Sucursal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}