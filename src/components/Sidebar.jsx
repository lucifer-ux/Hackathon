import {
    BarChart3,
    History
} from 'lucide-react';

export default function Sidebar({ generatedCharts, onViewChange }) {
    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-header">
                <div className="sidebar-brand">
                    <div className="sidebar-avatar">
                        <img
                            src="https://ui-avatars.com/api/?name=AP&background=2563eb&color=fff&bold=true&size=44"
                            alt="Avatar"
                        />
                    </div>
                    <div className="sidebar-brand-text">
                        <h1>Analyst Pro</h1>
                    </div>
                </div>
            </div>

            {/* Generated Charts History */}
            <div className="sidebar-nav">
                <div style={{ padding: '0 12px 8px', fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
                    Generated Charts
                </div>

                {generatedCharts && generatedCharts.length > 0 ? (
                    generatedCharts.map((chart) => (
                        <button
                            key={chart.id}
                            onClick={() => {
                                onViewChange?.('visualization', chart);
                            }}
                            className="nav-item"
                            style={{ fontSize: '13px' }}
                        >
                            <BarChart3 size={16} />
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                {chart.title}
                            </span>
                        </button>
                    ))
                ) : (
                    <div style={{ padding: '16px', textAlign: 'center', color: '#cbd5e1', fontSize: '13px' }}>
                        <History size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                        <p>No charts yet</p>
                    </div>
                )}
            </div>
        </aside>
    );
}
