import { useState } from 'react';
import { X, BarChart3, TrendingUp, PieChart, AreaChart, Sparkles, Star } from 'lucide-react';

const chartTypes = [
    {
        id: 'bar',
        name: 'Bar Chart',
        description: 'Compare distinct categories side-by-side.',
        icon: BarChart3
    },
    {
        id: 'line',
        name: 'Line Chart',
        description: 'Visualize trends and changes over time.',
        icon: TrendingUp
    },
    {
        id: 'pie',
        name: 'Pie Chart',
        description: 'Show proportions of a whole.',
        icon: PieChart
    },
    {
        id: 'area',
        name: 'Area Chart',
        description: 'Highlight magnitude of change.',
        icon: AreaChart
    },
];

export default function ChartModal({ onClose, onSelect, recommendedType = 'bar' }) {
    const [selected, setSelected] = useState(recommendedType);

    const handleGenerate = () => {
        onSelect(selected);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                {}
                <div className="modal-header">
                    <div>
                        <h2>Choose a Visualization Style</h2>
                        <p>Select the best format to represent your current dataset.</p>
                    </div>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {}
                <div className="modal-recommendation">
                    <Sparkles />
                    <span>AI recommends a <strong>Bar Chart</strong></span>
                </div>

                {}
                <div className="modal-body">
                    {chartTypes.map((chart) => {
                        const Icon = chart.icon;
                        const isSelected = selected === chart.id;
                        const isRecommended = chart.id === recommendedType;

                        return (
                            <div
                                key={chart.id}
                                onClick={() => setSelected(chart.id)}
                                className={`chart-option ${isSelected ? 'selected' : ''}`}
                            >
                                {isRecommended && (
                                    <span className="recommended-badge">
                                        <Star size={10} />
                                        Recommended
                                    </span>
                                )}

                                <div className="chart-option-icon">
                                    <Icon />
                                </div>

                                <h4>{chart.name}</h4>
                                <p>{chart.description}</p>

                                <div className="chart-option-radio"></div>
                            </div>
                        );
                    })}
                </div>

                {}
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="btn btn-primary" onClick={handleGenerate}>
                        <Sparkles />
                        Generate Chart
                    </button>
                </div>
            </div>
        </div>
    );
}
