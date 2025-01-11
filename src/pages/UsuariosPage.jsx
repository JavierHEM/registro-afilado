import { useState, useEffect } from 'react';
import { db, auth } from '../services/firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { query, where} from 'firebase/firestore';

import { 
  EyeIcon, 
  EyeSlashIcon,
  UserPlusIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

export default function UsuariosPage() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nombre: '',
    rol: 'operador',
    sucursal: '',
    activo: true
  });

  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirmPassword: false
  });

  useEffect(() => {
    if (!user) {
      setError('Usuario no autenticado.');
      setLoading(false);
      return;
    }
    fetchData();
  }, [user]);
  
  const fetchData = async () => {
    try {
      setLoading(true);
  
      // Consulta para el usuario actual
      const currentUserQuery = query(collection(db, 'usuarios'), where('email', '==', user?.email));
  
      // Llamadas paralelas a Firebase
      const [usuariosSnap, sucursalesSnap, currentUserDocSnap] = await Promise.all([
        getDocs(collection(db, 'usuarios')),
        getDocs(collection(db, 'sucursales')),
        getDocs(currentUserQuery)
      ]);
  
      // Obtener datos del usuario actual
      const currentUserDoc = currentUserDocSnap.docs[0]?.data();
      if (currentUserDoc) {
        setCurrentUserRole(currentUserDoc.rol); // Establecer el rol del usuario actual
      }
  
      // Cargar usuarios
      const usuariosData = usuariosSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsuarios(usuariosData);
  
      // Cargar sucursales
      const sucursalesData = sucursalesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSucursales(sucursalesData);
  
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validaciones
      if (!formData.email || !formData.password || !formData.nombre || !formData.sucursal) {
        throw new Error('Por favor complete todos los campos requeridos');
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }

      if (formData.password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      // Crear usuario en Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Guardar información adicional en Firestore
      await setDoc(doc(db, 'usuarios', userCredential.user.uid), {
        email: formData.email,
        nombre: formData.nombre,
        rol: formData.rol,
        sucursal: formData.sucursal,
        activo: true,
        createdAt: new Date()
      });

      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      nombre: '',
      rol: 'operador',
      sucursal: '',
      activo: true
    });
    setShowPasswords({
      password: false,
      confirmPassword: false
    });
  };
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-white">Gestión de Usuarios</h2>
        {currentUserRole === 'administrador' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <UserPlusIcon className="h-5 w-5" />
            Nuevo Usuario
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/50 text-red-200 rounded-lg">
          {error}
        </div>
      )}

      {/* Lista de Usuarios */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-white">Cargando usuarios...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {usuarios.map((usuario) => (
            <div
              key={usuario.id}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                  <UserCircleIcon className="h-10 w-10 text-gray-400" />
                  <div>
                    <h3 className="text-lg font-medium text-white">{usuario.nombre}</h3>
                    <p className="text-sm text-gray-400">{usuario.email}</p>
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
                        className={`inline-flex mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          usuario.activo ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                        }`}
                      >
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Nuevo Usuario */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-white mb-4">
              Nuevo Usuario
            </h2>

            {error && (
              <div className="mb-4 p-4 bg-red-900/50 text-red-200 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                <div className="relative">
                  <input
                    type={showPasswords.password ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                    onClick={() => setShowPasswords(prev => ({ ...prev, password: !prev.password }))}
                  >
                    {showPasswords.password ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirmPassword: !prev.confirmPassword }))}
                  >
                    {showPasswords.confirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
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
                  {loading ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}