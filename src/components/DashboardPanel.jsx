import { useState } from 'react';
import {
    Sparkles,
    CheckCircle2,
    BarChart3,
    Download,
    Filter,
    Maximize2,
    Minimize2,
    ChevronRight,
    ChevronDown,
    Upload,
    SlidersHorizontal
} from 'lucide-react';

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


function detectGroupingKey(data) {
    if (!data || data.length === 0) return null;

    const keys = Object.keys(data[0]);

    
    const priorityColumns = ['region', 'category', 'segment', 'sub_category', 'state', 'city', 'order_year', 'order_month'];

    
    for (const priorityCol of priorityColumns) {
        if (keys.includes(priorityCol)) {
            const uniqueValues = [...new Set(data.map(row => row[priorityCol]))];
            if (uniqueValues.length >= 2 && uniqueValues.length <= 50) {
                return priorityCol;
            }
        }
    }

    
    const stringKeys = keys.filter(k => typeof data[0][k] === 'string');
    for (const key of stringKeys) {
        const uniqueValues = [...new Set(data.map(row => row[key]))];
        if (uniqueValues.length >= 2 && uniqueValues.length <= 20) {
            return key;
        }
    }
    return null;
}


function groupDataByKey(data, key) {
    const groups = {};
    data.forEach(row => {
        const groupValue = row[key] || 'Unknown';
        if (!groups[groupValue]) {
            groups[groupValue] = [];
        }
        groups[groupValue].push(row);
    });
    return groups;
}

function KeyInsights({ insights }) {
    if (!insights || !insights.keyInsights || insights.keyInsights.length === 0) {
        return (
            <div className="card">
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-icon">
                            <Sparkles />
                        </div>
                        <h3>Key Insights</h3>
                    </div>
                    <span className="card-meta">No analysis yet</span>
                </div>
                <div className="card-body">
                    <p style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                        Enter a query to generate insights.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <div className="card-title">
                    <div className="card-icon">
                        <Sparkles />
                    </div>
                    <h3>Key Insights</h3>
                </div>
                <span className="card-meta">Generated just now</span>
            </div>
            <div className="card-body">
                {insights.keyInsights.map((insight, idx) => (
                    <div key={idx} className="insight-item">
                        <div className="insight-check">
                            <CheckCircle2 />
                        </div>
                        <p className="insight-text">
                            <strong>{insight.title}:</strong> {insight.content}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function GroupedDataTable({ data, isExpanded, onToggleExpand }) {
    const [expandedGroups, setExpandedGroups] = useState({});

    if (!data || data.length === 0) {
        return (
            <div className="card">
                <div className="card-header">
                    <div className="card-title">
                        <h3>Query Results</h3>
                    </div>
                </div>
                <div className="card-body" style={{ textAlign: 'center', color: '#94a3b8' }}>
                    No data available.
                </div>
            </div>
        );
    }

    const groupingKey = detectGroupingKey(data);
    const columns = Object.keys(data[0]);

    const toggleGroup = (groupName) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName]
        }));
    };

    
    if (groupingKey && !isExpanded) {
        const groupedData = groupDataByKey(data, groupingKey);
        const groupNames = Object.keys(groupedData);

        return (
            <div className="card">
                <div className="card-header">
                    <div className="card-title">
                        <h3>Query Results</h3>
                        <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '8px' }}>
                            Grouped by {groupingKey.replace(/_/g, ' ')}
                        </span>
                    </div>
                    <div className="card-actions">
                        <button className="card-action-btn" onClick={onToggleExpand} title="Expand All">
                            <Maximize2 />
                        </button>
                    </div>
                </div>

                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {groupNames.map(groupName => {
                        const groupRows = groupedData[groupName];
                        const isGroupExpanded = expandedGroups[groupName];

                        return (
                            <div key={groupName} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                {}
                                <div
                                    onClick={() => toggleGroup(groupName)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '14px 20px',
                                        cursor: 'pointer',
                                        background: isGroupExpanded ? '#f8fafc' : 'white',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {isGroupExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{groupName}</span>
                                    </div>
                                    <span style={{
                                        background: '#eff6ff',
                                        color: '#2563eb',
                                        padding: '4px 10px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: 600
                                    }}>
                                        {groupRows.length} records
                                    </span>
                                </div>

                                {}
                                {isGroupExpanded && (
                                    <div style={{ padding: '0 20px 16px', background: '#f8fafc' }}>
                                        <table className="data-table" style={{ fontSize: '13px' }}>
                                            <thead>
                                                <tr>
                                                    {columns.filter(c => c !== groupingKey).slice(0, 6).map(col => (
                                                        <th key={col} style={{ padding: '8px 12px' }}>{col.replace(/_/g, ' ')}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {groupRows.slice(0, 10).map((row, idx) => (
                                                    <tr key={idx}>
                                                        {columns.filter(c => c !== groupingKey).slice(0, 6).map(col => (
                                                            <td key={`${idx}-${col}`} style={{ padding: '8px 12px' }}>
                                                                {formatCellValue(row[col])}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {groupRows.length > 10 && (
                                            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', textAlign: 'center' }}>
                                                Showing 10 of {groupRows.length} records
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="table-footer">
                    <span>{groupNames.length} groups, {data.length} total records</span>
                </div>
            </div>
        );
    }

    
    return (
        <div className="card">
            <div className="card-header">
                <div className="card-title">
                    <h3>Query Results</h3>
                </div>
                <div className="card-actions">
                    <button className="card-action-btn" onClick={onToggleExpand} title={isExpanded ? "Collapse" : "Expand"}>
                        {isExpanded ? <Minimize2 /> : <Maximize2 />}
                    </button>
                </div>
            </div>

            <div className="table-wrapper" style={{ maxHeight: isExpanded ? 'none' : '350px', overflowY: 'auto' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            {columns.slice(0, isExpanded ? columns.length : 6).map(col => (
                                <th key={col}>{col.replace(/_/g, ' ')}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.slice(0, isExpanded ? 100 : 10).map((row, idx) => (
                            <tr key={idx}>
                                {columns.slice(0, isExpanded ? columns.length : 6).map(col => (
                                    <td key={`${idx}-${col}`}>
                                        {formatCellValue(row[col])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="table-footer">
                <span>Showing {Math.min(data.length, isExpanded ? 100 : 10)} of {data.length} rows</span>
            </div>
        </div>
    );
}

export default function DashboardPanel({ insights, currentData, onGenerateGraphs, onExpandTable }) {
    const [isTableExpanded, setIsTableExpanded] = useState(false);

    const handleExport = () => {
        if (!currentData || currentData.length === 0) return;

        const headers = Object.keys(currentData[0]);
        const csvContent = [
            headers.join(','),
            ...currentData.map(row => headers.map(field => JSON.stringify(row[field] ?? '')).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'export_data.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    
    const handleToggleExpand = () => {
        if (onExpandTable) {
            onExpandTable(); 
        } else {
            setIsTableExpanded(!isTableExpanded);
        }
    };

    return (
        <div className="dashboard-panel">
            {}
            <header className="dashboard-header">
                <div className="breadcrumb">
                    <span>Analysis</span>
                    <ChevronRight />
                    <span className="live-badge">Live Data</span>
                </div>
                <div className="dashboard-actions">
                    <button className="action-btn" onClick={handleExport} disabled={!currentData}>
                        <Upload />
                        Export
                    </button>
                    <button className="action-btn">
                        <SlidersHorizontal />
                        Customize
                    </button>
                </div>
            </header>

            {}
            <div className="dashboard-content">
                <KeyInsights insights={insights} />
                <GroupedDataTable
                    data={currentData}
                    isExpanded={isTableExpanded}
                    onToggleExpand={handleToggleExpand}
                />
            </div>

            {}
            <div className="generate-btn-wrapper">
                <button
                    className="generate-btn"
                    onClick={onGenerateGraphs}
                    disabled={!currentData || currentData.length === 0}
                    style={(!currentData || currentData.length === 0) ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                    <BarChart3 />
                    Generate Graphs
                </button>
            </div>
        </div>
    );
}
