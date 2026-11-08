import React, { useState, useMemo } from 'react';
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
  ArrowUpRight,
  Layers,
  ShieldCheck,
  Info
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
  const [hierarchyMode, setHierarchyMode] = useState('pyramid'); // 'pyramid' | 'chart'

  const totalDocs = documents.length;

  // ISO 9001:2015 4-Tier Quality Hierarchy Pyramid Calculation
  const pyramidTiers = useMemo(() => {
    const getLevelDocs = (level, fallbackCodes) => {
      return documents.filter(d => {
        const typeObj = (documentTypes || []).find(t => t.code === d.type);
        if (typeObj?.level === level) return true;
        return fallbackCodes.includes(d.type);
      });
    };

    const l1 = getLevelDocs(1, ['POL']);
    const l2 = getLevelDocs(2, ['SOP']);
    const l3 = getLevelDocs(3, ['IK', 'WI']);
    const l4 = getLevelDocs(4, ['FORM', 'MEM']);

    const calcPct = (cnt) => totalDocs > 0 ? Math.round((cnt / totalDocs) * 100) : 0;

    return [
      {
        level: 1,
        title: 'Level 1: Kebijakan Mutu (Policy)',
        short: 'Kebijakan & Sasaran Mutu',
        count: l1.length,
        percentage: calcPct(l1.length),
        gradient: 'from-indigo-600 to-indigo-700',
        badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
        borderAccent: 'border-indigo-300 dark:border-indigo-700',
        bgBox: 'bg-indigo-50/70 dark:bg-indigo-950/30',
        widthClass: 'w-[75%]',
        desc: 'Komitmen manajemen puncak, sasaran mutu & manual ISO'
      },
      {
        level: 2,
        title: 'Level 2: Prosedur Operasional (SOP)',
        short: 'Standar Operasional Prosedur',
        count: l2.length,
        percentage: calcPct(l2.length),
        gradient: 'from-blue-600 to-blue-700',
        badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
        borderAccent: 'border-blue-300 dark:border-blue-700',
        bgBox: 'bg-blue-50/70 dark:bg-blue-950/30',
        widthClass: 'w-[84%]',
        desc: 'Proses lintas fungsi & matriks tanggung jawab'
      },
      {
        level: 3,
        title: 'Level 3: Instruksi Kerja (IK / WI)',
        short: 'Instruksi Kerja & Petunjuk Teknis',
        count: l3.length,
        percentage: calcPct(l3.length),
        gradient: 'from-cyan-600 to-teal-600',
        badgeColor: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
        borderAccent: 'border-cyan-300 dark:border-cyan-700',
        bgBox: 'bg-cyan-50/70 dark:bg-cyan-950/30',
        widthClass: 'w-[92%]',
        desc: 'Langkah teknis stasiun kerja & jalur cepat 3-tahap'
      },
      {
        level: 4,
        title: 'Level 4: Formulir & Rekaman Mutu (Form)',
        short: 'Formulir, Template & Checklist',
        count: l4.length,
        percentage: calcPct(l4.length),
        gradient: 'from-emerald-600 to-teal-700',
        badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
        borderAccent: 'border-emerald-300 dark:border-emerald-700',
        bgBox: 'bg-emerald-50/70 dark:bg-emerald-950/30',
        widthClass: 'w-full',
        desc: 'Bukti objektif pelaksanaan kerja & rekaman ISO Clause 7.5'
      }
    ];
  }, [documents, documentTypes, totalDocs]);

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
      {/* Chart 1: Donut Chart / ISO Quality Pyramid (5 Cols) */}
      <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-card flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                {hierarchyMode === 'pyramid' ? <Layers className="w-4 h-4" /> : <PieChart className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  Hierarki Dokumen Mutu ISO
                </h3>
                <p className="text-[11px] text-slate-500">Piramida dokumen Klausul 7.5</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setHierarchyMode('pyramid')}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
                    hierarchyMode === 'pyramid'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Piramida Mutu ISO 4 Tingkat"
                >
                  <Layers className="w-3 h-3" />
                  <span>Piramida</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHierarchyMode('chart')}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
                    hierarchyMode === 'chart'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Grafik Donat Dokumen"
                >
                  <PieChart className="w-3 h-3" />
                  <span>Donat</span>
                </button>
              </div>

              <button
                onClick={() => navigateTo('rep-type', ['Dashboard', 'Report', 'Dokumen per Tipe'])}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline ml-0.5"
              >
                <span>Detail</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {hierarchyMode === 'pyramid' ? (
            /* Visual Piramida Mutu ISO 4 Tingkat */
            <div className="my-4 space-y-2">
              <div className="flex flex-col items-center gap-2">
                {pyramidTiers.map((tier) => (
                  <div
                    key={tier.level}
                    className={`${tier.widthClass} transition-all duration-200 hover:scale-[1.02] cursor-default`}
                  >
                    <div className={`p-2.5 rounded-xl border ${tier.borderAccent} ${tier.bgBox} shadow-xs flex items-center justify-between gap-2`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-5 h-5 rounded-md bg-gradient-to-r ${tier.gradient} text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-xs`}>
                          L{tier.level}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">
                            {tier.short}
                          </p>
                          <p className="text-[9.5px] text-slate-500 dark:text-slate-400 truncate hidden sm:block">
                            {tier.desc}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-black text-xs text-slate-900 dark:text-white">
                          {tier.count}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold ml-1">
                          ({tier.percentage}%)
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Assessment Footer for ISO Pyramid Health */}
              <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 text-[10.5px] flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Struktur ISO 9001:2015 Sehat:</strong> Piramida dokumen didukung fondasi <strong>{pyramidTiers[2].count + pyramidTiers[3].count} dokumen operasional</strong> (Level 3 & 4), menjamin ketertelusuran SOP dan Kebijakan Mutu.
                </p>
              </div>
            </div>
          ) : (
            /* Donut Chart Visual */
            <div>
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
          )}
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
