import { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatPanel from './components/ChatPanel';
import DashboardPanel from './components/DashboardPanel';
import ChartModal from './components/ChartModal';
import VisualizationView from './components/VisualizationView';
import DataSourcePanel from './components/DataSourcePanel';
import './styles.css';

function App() {
  const [activeView, setActiveView] = useState('chat');
  const [showChartModal, setShowChartModal] = useState(false);
  const [currentData, setCurrentData] = useState(null);
  const [insights, setInsights] = useState(null);
  const [generatedCharts, setGeneratedCharts] = useState([]);
  const [selectedChart, setSelectedChart] = useState(null);
  const [initialTab, setInitialTab] = useState('visualization');
  const [isConnected, setIsConnected] = useState(false);

  const handleQueryResult = (data, queryInsights) => {
    setCurrentData(data);
    setInsights(queryInsights);
  };

  const handleGenerateGraphs = () => {
    if (currentData && currentData.length > 0) {
      setShowChartModal(true);
    }
  };

  const handleChartSelect = (chartType) => {
    const newChart = {
      id: Date.now(),
      type: chartType,
      data: currentData,
      title: `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart - ${new Date().toLocaleTimeString()}`,
      createdAt: new Date(),
    };

    setGeneratedCharts(prev => [newChart, ...prev]);
    setSelectedChart(newChart);
    setShowChartModal(false);
    setInitialTab('visualization');
    setActiveView('visualization');
  };

  const handleExpandTable = () => {

    const tableChart = {
      id: Date.now(),
      type: 'table',
      data: currentData,
      title: `Data Table - ${new Date().toLocaleTimeString()}`,
      createdAt: new Date(),
    };
    setSelectedChart(tableChart);
    setInitialTab('table');
    setActiveView('visualization');
  };

  const handleViewChange = (view, chart = null) => {
    setActiveView(view);
    if (chart) {
      setSelectedChart(chart);
      setInitialTab('visualization');
      if (chart.data) {
        setCurrentData(chart.data);
      }
    }
  };

  const handleConnectionChange = (connected) => {
    setIsConnected(connected);
  };

  const renderMainContent = () => {
    switch (activeView) {
      case 'dataSource':
        return (
          <DataSourcePanel
            onBack={() => setActiveView('chat')}
            onConnectionChange={handleConnectionChange}
          />
        );
      case 'visualization':
        return (
          <VisualizationView
            chart={selectedChart}
            data={selectedChart?.data || currentData}
            initialTab={initialTab}
            onBack={() => setActiveView('chat')}
            onNewAnalysis={() => {
              setActiveView('chat');
              setSelectedChart(null);
            }}
          />
        );
      case 'chat':
      default:
        return (
          <>
            <ChatPanel
              onQueryResult={handleQueryResult}
            />
            <DashboardPanel
              insights={insights}
              currentData={currentData}
              onGenerateGraphs={handleGenerateGraphs}
              onExpandTable={handleExpandTable}
            />
          </>
        );
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        generatedCharts={generatedCharts}
        onViewChange={handleViewChange}
      />

      <main className="main-content">
        {renderMainContent()}
      </main>

      {showChartModal && (
        <ChartModal
          onClose={() => setShowChartModal(false)}
          onSelect={handleChartSelect}
          recommendedType="bar"
        />
      )}
    </div>
  );
}

export default App;
