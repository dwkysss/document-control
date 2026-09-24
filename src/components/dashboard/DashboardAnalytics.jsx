import React, { useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  PieChart,
  Building2,
  ArrowUpRight
} from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

export default function DashboardAnalytics({
  documents = [],
  departments = [],
  documentTypes = [],
  navigateTo
}) {
  const [viewMode, setViewMode] = useState('chart'); // 'chart' | 'table'

  const totalDocs = documents.length;

  // Breakdown by Type
  const typeBreakdown = documentTypes.map(type => {
    const count = documents.filter(d => d.type === type.code).length;
    const percentage = totalDocs > 0 ? Math.round((count / totalDocs) * 100) : 0;
    return {
      code: type.code,
      name: type.name,
      level: type.level,
      count,
      percentage
    };
  }).sort((a, b) => b.count - a.count);

  // Breakdown by Department
  const deptBreakdown = departments.map(dept => {
    const count = documents.filter(d => d.department === dept.code).length;
    const percentage = totalDocs > 0 ? Math.round((count / totalDocs) * 100) : 0;
    return {
      code: dept.code,
      name: dept.name,
      count,
      percentage
    };
  }).sort((a, b) => b.count - a.count);

  // Chart 1: Donut Data (Hierarchy of ISO Documents)
  const donutColors = [
    '#3b82f6', // SOP - Blue
    '#06b6d4', // IK - Cyan
    '#10b981', // FORM - Emerald
    '#6366f1', // POL - Indigo
    '#f59e0b', // MEM - Amber
    '#ec4899', // WI - Pink
    '#8b5cf6', // EXT - Purple
  ];

  const doughnutData = {
    labels: typeBreakdown.map(t => `${t.code} (${t.name})`),
    datasets: [
      {
        data: typeBreakdown.map(t => t.count),
        backgroundColor: donutColors.slice(0, typeBreakdown.length),
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 6,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const val = context.raw || 0;
            const pct = totalDocs > 0 ? Math.round((val / totalDocs) * 100) : 0;
            return ` ${context.label}: ${val} dokumen (${pct}%)`;
          },
        },
      },
    },
  };

  // Chart 2: Horizontal Bar Data (Departments)
  const topDepts = deptBreakdown.slice(0, 7);
  const barData = {
    labels: topDepts.map(d => d.code),
    datasets: [
      {
        label: 'Jumlah Dokumen',
        data: topDepts.map(d => d.count),
        backgroundColor: '#2563eb',
        borderRadius: 6,
        barThickness: 16,
      },
    ],
  };

  const barOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return ` ${context.raw} Dokumen Terdaftar`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: 'rgba(226, 232, 240, 0.6)',
        },
        ticks: {
          precision: 0,
          font: { size: 10 },
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          font: { weight: 'bold', size: 11 },
        },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Chart 1: Donut Chart - Hierarki Dokumen ISO (5 Cols) */}
      <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-card flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                <PieChart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  Hierarki Dokumen Mutu ISO
                </h3>
                <p className="text-[11px] text-slate-500">Piramida dokumen Klausul 7.5</p>
              </div>
            </div>
            <button
              onClick={() => navigateTo('rep-type', ['Dashboard', 'Report', 'Dokumen per Tipe'])}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline"
            >
              <span>Detail</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Donut Chart Visual */}
          <div className="relative h-44 my-4 flex items-center justify-center">
            {totalDocs === 0 ? (
              <div className="text-center text-xs text-slate-400">
                Belum ada dokumen terdaftar untuk dianalisis.
              </div>
            ) : (
              <>
                <Doughnut data={doughnutData} options={doughnutOptions} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                    {totalDocs}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Master
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Legend Items */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            {typeBreakdown.slice(0, 6).map((type, idx) => (
              <div key={type.code} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: donutColors[idx % donutColors.length] }}
                  />
                  <span className="font-semibold text-slate-700 dark:text-slate-300 truncate text-[11px]">
                    {type.code}
                  </span>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px]">
                  {type.count} ({type.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart 2: Department Distribution (7 Cols) */}
      <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-card flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  Distribusi Dokumen per Unit Kerja
                </h3>
                <p className="text-[11px] text-slate-500">Sebaran SOP & IK pada masing-masing divisi</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 text-xs">
                <button
                  onClick={() => setViewMode('chart')}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold transition ${
                    viewMode === 'chart'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Grafik
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold transition ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Tabel
                </button>
              </div>

              <button
                onClick={() => navigateTo('rep-dept', ['Dashboard', 'Report', 'Dokumen per Departemen'])}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline"
              >
                <span>Laporan</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Body: Chart or Table */}
          {viewMode === 'chart' ? (
            <div className="h-64 pt-3">
              {totalDocs === 0 ? (
                <div className="h-full flex items-center justify-center text-center text-xs text-slate-400">
                  Belum ada dokumen yang terdaftar untuk ditampilkan.
                </div>
              ) : (
                <Bar data={barData} options={barOptions} />
              )}
            </div>
          ) : (
            <div className="pt-2 max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-[10px] uppercase font-bold">
                    <th className="py-2">Kode</th>
                    <th className="py-2">Departemen</th>
                    <th className="py-2 text-right">Jumlah</th>
                    <th className="py-2 text-right">Porsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {deptBreakdown.map(dept => (
                    <tr key={dept.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2 font-mono font-bold text-blue-600">{dept.code}</td>
                      <td className="py-2 text-slate-700 dark:text-slate-300 truncate max-w-xs">{dept.name}</td>
                      <td className="py-2 text-right font-mono font-bold text-slate-900 dark:text-white">{dept.count}</td>
                      <td className="py-2 text-right text-slate-500 font-semibold">{dept.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
