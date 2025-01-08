import { useState, useEffect } from 'react';
import { db, auth } from '../services/firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    rol: 'operador',
    sucursal: '',
    activo: true
  });

  useEffect(() => {
    fetchUsuarios();
    fetchSucursales();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'usuarios'));
      const usuariosData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsuarios(usuariosData);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (editando) {
        // Actualizar usuario existente
        const userRef = doc(db, 'usuarios', editando);
        await updateDoc(userRef, {
          nombre: formData.nombre,
          rol: formData.rol,
          sucursal: formData.sucursal,
          activo: formData.activo,
          updatedAt: new Date()
        });
      } else {
        // Crear nuevo usuario en Authentication
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        // Guardar información adicional en Firestore
        await setDoc(doc(db, 'usuarios', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: formData.email,
          nombre: formData.nombre,
          rol: formData.rol,
          sucursal: formData.sucursal,
          activo: true,
          createdAt: new Date()
        });
      }

      setIsModalOpen(false);
      resetForm();
      fetchUsuarios();
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEstado = async (usuario) => {
    try {
      const userRef = doc(db, 'usuarios', usuario.id);
      await updateDoc(userRef, {
        activo: !usuario.activo,
        updatedAt: new Date()
      });
      fetchUsuarios();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      setError('Error al cambiar estado del usuario');
    }
  };

  const handleEdit = (usuario) => {
    setFormData({
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
      sucursal: usuario.sucursal,
      activo: usuario.activo
    });
    setEditando(usuario.id);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      nombre: '',
      rol: 'operador',
      sucursal: '',
      activo: true
    });
    setEditando(null);
    setError('');
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-white">Gestión de Usuarios</h2>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Nuevo Usuario
        </button>
      </div>

      {/* Lista de Usuarios */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-400">Cargando usuarios...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {usuarios.map((usuario) => (
            <div
              key={usuario.id}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-white">{usuario.nombre}</h3>
                  <p className="text-gray-400 mt-1">{usuario.email}</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-400">
                      Rol: <span className="text-white capitalize">{usuario.rol}</span>
                    </p>
                    <p className="text-sm text-gray-400">
                      Sucursal: <span className="text-white">
                        {sucursales.find(s => s.id === usuario.sucursal)?.nombre || 'No asignada'}
                      </span>
                    </p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        usuario.activo 
                          ? 'bg-green-500/10 text-green-500' 
                          : 'bg-red-500/10 text-red-500'
                      }`}
                    >
                      {usuario.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(usuario)}
                    className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    <PencilSquareIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleToggleEstado(usuario)}
                    className="p-2 text-gray-400 hover:text-yellow-500 transition-colors"
                  >
                    {usuario.activo ? (
                      <XCircleIcon className="h-5 w-5" />
                    ) : (
                      <CheckCircleIcon className="h-5 w-5" />
                    )}
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
              {editando ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>
            {error && (
              <div className="mb-4 p-4 bg-red-900/50 text-red-200 rounded-lg">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editando && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </>
              )}
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
                  Rol
                </label>
                <select
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="operador">Operador</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Sucursal
                </label>
                <select
                  value={formData.sucursal}
                  onChange={(e) => setFormData({ ...formData, sucursal: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccione sucursal</option>
                  {sucursales.map(sucursal => (
                    <option key={sucursal.id} value={sucursal.id}>
                      {sucursal.nombre}
                    </option>
                  ))}
                </select>
              </div>
              {editando && (
                <div className="flex items-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.activo}
                      onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-400">Usuario Activo</span>
                  </label>
                </div>
              )}
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
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-600"
                >
                  {loading ? 'Guardando...' : (editando ? 'Guardar Cambios' : 'Crear Usuario')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}