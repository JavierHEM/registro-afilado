import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  BuildingOfficeIcon,
  WrenchScrewdriverIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#6366F1'];

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalSierras: 0,
    sierrasAfiladas: 0,
    pendientesAfilado: 0,
    totalAfilados: 0,
    totalSucursales: 0
  });

  const [afiladosPorMes, setAfiladosPorMes] = useState([]);
  const [afiladosPorTipo, setAfiladosPorTipo] = useState([]);
  const [afiladosPorSucursal, setAfiladosPorSucursal] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sierrasSnapshot, afiladosSnapshot, sucursalesSnapshot] = await Promise.all([
        getDocs(collection(db, 'registro_sierras')),
        getDocs(collection(db, 'historial_afilados')),
        getDocs(collection(db, 'sucursales'))
      ]);

      const sierras = sierrasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const afilados = afiladosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const sucursales = sucursalesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setStats({
        totalSierras: sierras.length,
        sierrasAfiladas: sierras.filter(sierra => sierra.ultimoAfilado).length,
        pendientesAfilado: sierras.filter(sierra => !sierra.ultimoAfilado).length,
        totalAfilados: afilados.length,
        totalSucursales: sucursales.length
      });

      procesarAfiladosPorMes(afilados);
      procesarAfiladosPorTipo(afilados);
      await procesarAfiladosPorSucursal(afilados, sucursales);

    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const procesarAfiladosPorMes = (afilados) => {
    const últimosSeisMeses = [];
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() - i);
      últimosSeisMeses.push({
        mes: fecha.toLocaleString('default', { month: 'long' }),
        cantidad: 0
      });
    }

    afilados.forEach(afilado => {
      const fecha = afilado.fecha.toDate();
      const mes = fecha.toLocaleString('default', { month: 'long' });
      const mesData = últimosSeisMeses.find(m => m.mes === mes);
      if (mesData) {
        mesData.cantidad++;
      }
    });

    setAfiladosPorMes(últimosSeisMeses);
  };

  const procesarAfiladosPorTipo = (afilados) => {
    const tipos = {};
    afilados.forEach(afilado => {
      tipos[afilado.tipoAfilado] = (tipos[afilado.tipoAfilado] || 0) + 1;
    });

    setAfiladosPorTipo(Object.entries(tipos).map(([name, value]) => ({
      name,
      value
    })));
  };

  const procesarAfiladosPorSucursal = async (afilados, sucursales) => {
    const conteoSucursales = sucursales.map(sucursal => ({
      name: sucursal.nombre,
      cantidad: afilados.filter(afilado => afilado.sucursal === sucursal.id).length
    }));

    setAfiladosPorSucursal(conteoSucursales);
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    
    // Título y fecha
    doc.setFontSize(18);
    doc.text('Reporte de Afilados', 14, 20);
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30);

    // Estadísticas generales
    doc.setFontSize(12);
    doc.text('Estadísticas Generales', 14, 40);
    doc.setFontSize(10);
    doc.text(`Total Sierras: ${stats.totalSierras}`, 14, 50);
    doc.text(`Sierras Afiladas: ${stats.sierrasAfiladas}`, 14, 56);
    doc.text(`Pendientes de Afilado: ${stats.pendientesAfilado}`, 14, 62);
    doc.text(`Total Afilados: ${stats.totalAfilados}`, 14, 68);

    // Tabla de afilados por sucursal
    const tableData = afiladosPorSucursal.map(item => [
      item.name,
      item.cantidad.toString()
    ]);

    doc.autoTable({
      startY: 80,
      head: [['Sucursal', 'Cantidad de Afilados']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] }
    });

    // Tabla de afilados por tipo
    const tiposData = afiladosPorTipo.map(item => [
      item.name,
      item.value.toString()
    ]);

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 15,
      head: [['Tipo de Afilado', 'Cantidad']],
      body: tiposData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save(`reporte-afilados-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportarCSV = () => {
    // Preparar datos
    const data = [
      ['Reporte de Afilados', ''],
      ['Fecha:', new Date().toLocaleDateString()],
      ['', ''],
      ['Estadísticas Generales', ''],
      ['Total Sierras', stats.totalSierras],
      ['Sierras Afiladas', stats.sierrasAfiladas],
      ['Pendientes de Afilado', stats.pendientesAfilado],
      ['Total Afilados', stats.totalAfilados],
      ['', ''],
      ['Afilados por Sucursal', ''],
      ['Sucursal', 'Cantidad'],
      ...afiladosPorSucursal.map(item => [item.name, item.cantidad]),
      ['', ''],
      ['Afilados por Tipo', ''],
      ['Tipo', 'Cantidad'],
      ...afiladosPorTipo.map(item => [item.name, item.value])
    ];

    // Convertir a CSV
    const csvContent = "data:text/csv;charset=utf-8," 
      + data.map(row => row.join(",")).join("\n");

    // Descargar archivo
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte-afilados-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <div className="text-white">Cargando estadísticas...</div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <p className="text-gray-400 mt-1">
            Última actualización: {new Date().toLocaleTimeString()}
          </p>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={exportarPDF}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            PDF
          </button>
          <button
            onClick={exportarCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            CSV
          </button>
        </div>
      </div>

      {/* Cards de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {[
          {
            title: "Total Sierras",
            value: stats.totalSierras,
            icon: WrenchScrewdriverIcon,
            color: "text-blue-500",
            bgColor: "bg-blue-500/10"
          },
          {
            title: "Sierras Afiladas",
            value: stats.sierrasAfiladas,
            icon: CheckCircleIcon,
            color: "text-green-500",
            bgColor: "bg-green-500/10"
          },
          {
            title: "Pendientes",
            value: stats.pendientesAfilado,
            icon: ClockIcon,
            color: "text-yellow-500",
            bgColor: "bg-yellow-500/10"
          },
          {
            title: "Total Afilados",
            value: stats.totalAfilados,
            icon: ChartBarIcon,
            color: "text-purple-500",
            bgColor: "bg-purple-500/10"
          },
          {
            title: "Sucursales",
            value: stats.totalSucursales,
            icon: BuildingOfficeIcon,
            color: "text-indigo-500",
            bgColor: "bg-indigo-500/10"
          }
        ].map((card) => (
          <div
            key={card.title}
            className={`${card.bgColor} rounded-xl p-6 border border-gray-800`}
          >
            <div className="flex items-center justify-between">
              <div>
                <card.icon className={`h-6 w-6 ${card.color}`} />
                <p className={`mt-4 text-3xl font-bold ${card.color}`}>
                  {card.value}
                </p>
                <p className="mt-1 text-sm text-gray-400">{card.title}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de línea temporal */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-medium text-white mb-6">Afilados por Mes</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={afiladosPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="mes" 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="cantidad" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Afilados"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico circular */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-medium text-white mb-6">Distribución por Tipo</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={afiladosPorTipo}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {afiladosPorTipo.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de barras */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 lg:col-span-2">
          <h3 className="text-lg font-medium text-white mb-6">Afilados por Sucursal</h3>
          <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
              <BarChart data={afiladosPorSucursal}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name" 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="cantidad" 
                  fill="#3B82F6" 
                  name="Cantidad de Afilados"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}