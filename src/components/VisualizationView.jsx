import { useState } from 'react';
import {
    Share2,
    Download,
    Plus,
    Filter,
    Settings,
    Sparkles,
    X,
    MessageSquare,
    Table2,
    BarChart3,
    TrendingUp,
    Maximize2,
    Minimize2
} from 'lucide-react';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

const COLORS = ['#2563eb', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];

function formatCurrency(value) {
    if (typeof value !== 'number') return value;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

function formatCellValue(value) {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') {
        if (Math.abs(value) > 1000) {
            return new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 0 }).format(value);
        }
        return Math.round(value * 100) / 100;
    }
    return String(value);
}

function InsightBubble({ onClose }) {
    return (
        <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'white',
            borderRadius: '14px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            border: '1px solid #e2e8f0',
            padding: '16px',
            maxWidth: '220px',
            zIndex: 10,
            animation: 'fadeIn 0.3s ease-out'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={14} style={{ color: '#2563eb' }} />
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#2563eb', textTransform: 'uppercase' }}>AI Insight</span>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                    <X size={14} />
                </button>
            </div>
            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                Focus on the highest performing categories for maximum impact.
            </p>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color }) {
    return (
        <div style={{
            background: 'white',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
        }}>
            <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Icon size={22} style={{ color: 'white' }} />
            </div>
            <div>
                <p style={{ fontSize: '13px', color: '#64748b' }}>{label}</p>
                <p style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>{value}</p>
            </div>
        </div>
    );
}

function getChartKeys(data) {
    if (!data || data.length === 0) return { xKey: '', dataKeys: [] };

    const keys = Object.keys(data[0]);
    const xKey = keys.find(k => typeof data[0][k] === 'string') || keys[0];
    const dataKeys = keys.filter(k =>
        typeof data[0][k] === 'number' &&
        k !== 'id' &&
        !k.toLowerCase().includes('id')
    );

    return { xKey, dataKeys };
}

function ChartComponent({ type, data }) {
    if (!data || data.length === 0) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '350px', color: '#cbd5e1' }}>No data to visualize</div>;
    }

    const { xKey, dataKeys } = getChartKeys(data);
    const chartData = data;
    const commonProps = { margin: { top: 20, right: 30, left: 20, bottom: 50 } };

    if (dataKeys.length === 0) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '350px', color: '#64748b' }}>Data contains no numeric values to plot.</div>;
    }

    const primaryDataKey = dataKeys[0];

    switch (type) {
        case 'bar':
            return (
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={chartData} {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey={xKey} stroke="#64748b" fontSize={12} angle={-45} textAnchor="end" height={60} />
                        <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => v > 1000 ? `${v / 1000}k` : v} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Legend verticalAlign="top" />
                        {dataKeys.map((key, index) => (
                            <Bar key={key} dataKey={key} name={key.replace(/_/g, ' ')} fill={COLORS[index % COLORS.length]} radius={[4, 4, 0, 0]} maxBarSize={50} />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            );

        case 'line':
            return (
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={chartData} {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey={xKey} stroke="#64748b" fontSize={12} angle={-45} textAnchor="end" height={60} />
                        <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => v > 1000 ? `${v / 1000}k` : v} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Legend verticalAlign="top" />
                        {dataKeys.map((key, index) => (
                            <Line key={key} type="monotone" dataKey={key} name={key.replace(/_/g, ' ')} stroke={COLORS[index % COLORS.length]} strokeWidth={3} dot={{ r: 4 }} />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            );

        case 'area':
            return (
                <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={chartData} {...commonProps}>
                        <defs>
                            {dataKeys.map((key, index) => (
                                <linearGradient key={`grad-${key}`} id={`color-${key}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0} />
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey={xKey} stroke="#64748b" fontSize={12} angle={-45} textAnchor="end" height={60} />
                        <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => v > 1000 ? `${v / 1000}k` : v} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Legend verticalAlign="top" />
                        {dataKeys.map((key, index) => (
                            <Area key={key} type="monotone" dataKey={key} name={key.replace(/_/g, ' ')} stroke={COLORS[index % COLORS.length]} fill={`url(#color-${key})`} strokeWidth={2} />
                        ))}
                    </AreaChart>
                </ResponsiveContainer>
            );

        case 'pie':
            return (
                <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                        <Pie data={chartData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={4} dataKey={primaryDataKey} nameKey={xKey}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(v) => [formatCurrency(v), primaryDataKey.replace(/_/g, ' ')]} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            );

        default:
            return null;
    }
}

function DataTableView({ data, isFullScreen, onToggleFullScreen }) {
    if (!data || data.length === 0) {
        return <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No data available</div>;
    }

    const columns = Object.keys(data[0]);

    return (
        <div className="card">
            <div className="card-header">
                <div className="card-title">
                    <h3>Full Data Results</h3>
                    <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '8px' }}>
                        {data.length} records
                    </span>
                </div>
                <div className="card-actions">
                    <button className="card-action-btn" onClick={onToggleFullScreen} title={isFullScreen ? "Exit Full Screen" : "Full Screen"}>
                        {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                </div>
            </div>

            <div className="table-wrapper" style={{ maxHeight: isFullScreen ? '70vh' : '400px', overflowY: 'auto' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            {columns.map(col => (
                                <th key={col}>{col.replace(/_/g, ' ')}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.slice(0, isFullScreen ? 500 : 50).map((row, idx) => (
                            <tr key={idx}>
                                {columns.map(col => (
                                    <td key={`${idx}-${col}`}>{formatCellValue(row[col])}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="table-footer">
                <span>Showing {Math.min(data.length, isFullScreen ? 500 : 50)} of {data.length} rows</span>
            </div>
        </div>
    );
}

export default function VisualizationView({ chart, data, initialTab = 'visualization', onBack, onNewAnalysis }) {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [showInsight, setShowInsight] = useState(true);
    const [isTableFullScreen, setIsTableFullScreen] = useState(false);

    if (!chart || !data) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>Loading...</div>;
    }

    const { xKey, dataKeys } = getChartKeys(data);
    const primaryMetric = dataKeys && dataKeys.length > 0 ? dataKeys[0] : 'Value';
    const totalValue = data.reduce((sum, row) => sum + (Number(row[primaryMetric]) || 0), 0);

    const tabs = [
        { id: 'chat', label: 'Chat', icon: MessageSquare },
        { id: 'table', label: 'Data Table', icon: Table2 },
        { id: 'visualization', label: 'Visualization', icon: BarChart3 },
    ];

    const handleTabClick = (tabId) => {
        if (tabId === 'chat') {
            onBack(); 
        } else {
            setActiveTab(tabId);
        }
    };

    return (
        <div className="dashboard-panel">
            {}
            <header className="dashboard-header">
                <div className="breadcrumb">
                    <span onClick={onBack} style={{ cursor: 'pointer' }}>Chat Session</span>
                    <span style={{ color: '#94a3b8' }}>›</span>
                    <span>Analysis</span>
                    <span style={{ color: '#94a3b8' }}>›</span>
                    <span style={{ color: '#2563eb', fontWeight: 500 }}>
                        {activeTab === 'table' ? 'Data Table' : 'Visualization'}
                    </span>
                </div>
                <div className="dashboard-actions">
                    <button className="action-btn">
                        <Share2 size={16} />
                        Share
                    </button>
                    <button className="action-btn">
                        <Download size={16} />
                        Export
                    </button>
                </div>
            </header>

            {}
            <div className="dashboard-content">
                {}
                <div style={{ marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>{chart.title}</h1>
                    <p style={{ color: '#64748b', marginTop: '6px' }}>
                        {activeTab === 'table'
                            ? `Showing all ${data.length} records from your query`
                            : <>Visualizing <strong>{primaryMetric.replace(/_/g, ' ')}</strong> by <strong>{xKey.replace(/_/g, ' ')}</strong></>
                        }
                    </p>
                </div>

                {}
                <div style={{
                    display: 'flex',
                    gap: '4px',
                    marginBottom: '24px',
                    background: 'white',
                    borderRadius: '10px',
                    padding: '4px',
                    width: 'fit-content',
                    border: '1px solid #e2e8f0'
                }}>
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabClick(tab.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 16px',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: isActive ? '#eff6ff' : 'transparent',
                                    color: isActive ? '#2563eb' : '#64748b',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {}
                {activeTab === 'table' ? (
                    <DataTableView
                        data={data}
                        isFullScreen={isTableFullScreen}
                        onToggleFullScreen={() => setIsTableFullScreen(!isTableFullScreen)}
                    />
                ) : (
                    <>
                        {}
                        <div className="card" style={{ position: 'relative' }}>
                            <div className="card-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>Chart View</h3>
                                </div>
                                <div className="card-actions">
                                    <button className="card-action-btn"><Filter size={16} /></button>
                                    <button className="card-action-btn"><Settings size={16} /></button>
                                </div>
                            </div>
                            <div className="card-body" style={{ padding: '24px', position: 'relative' }}>
                                <ChartComponent type={chart.type} data={data} />
                                {showInsight && <InsightBubble onClose={() => setShowInsight(false)} />}
                            </div>
                        </div>

                        {}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '20px' }}>
                            <StatCard
                                icon={TrendingUp}
                                label={`Total ${primaryMetric.replace(/_/g, ' ')}`}
                                value={formatCurrency(totalValue)}
                                color="linear-gradient(135deg, #22c55e, #16a34a)"
                            />
                            <StatCard
                                icon={BarChart3}
                                label="Record Count"
                                value={data.length}
                                color="linear-gradient(135deg, #2563eb, #1d4ed8)"
                            />
                            <StatCard
                                icon={TrendingUp}
                                label="Top Performing"
                                value={data.length > 0 ? ([...data].sort((a, b) => (b[primaryMetric] || 0) - (a[primaryMetric] || 0))[0]?.[xKey] || '-') : '-'}
                                color="linear-gradient(135deg, #8b5cf6, #7c3aed)"
                            />
                        </div>
                    </>
                )}
            </div>

            {}
            <div className="generate-btn-wrapper">
                <button className="generate-btn" onClick={onNewAnalysis}>
                    <Plus size={20} />
                    New Analysis
                </button>
            </div>
        </div>
    );
}
