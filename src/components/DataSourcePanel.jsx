import { useState, useRef, useEffect } from 'react';
import {
    Database,
    Upload,
    Check,
    AlertCircle,
    Loader2,
    Link,
    Key,
    Table,
    FileSpreadsheet,
    X,
    ChevronLeft,
    Plus,
    RefreshCw
} from 'lucide-react';
import {
    createDynamicClient,
    testConnection,
    parseCSV,
    uploadCSVData,
    setActiveClient,
    fetchTables
} from '../services/supabaseService';

const STORAGE_KEY = 'supabase_connection';

function loadConnectionFromStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('Failed to load connection from storage:', e);
    }
    return null;
}

function saveConnectionToStorage(connection) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(connection));
    } catch (e) {
        console.error('Failed to save connection to storage:', e);
    }
}

export default function DataSourcePanel({ onBack, onConnectionChange }) {
    const storedConnection = loadConnectionFromStorage();

    const [supabaseUrl, setSupabaseUrl] = useState(storedConnection?.url || '');
    const [supabaseKey, setSupabaseKey] = useState(storedConnection?.key || '');
    const [isConnected, setIsConnected] = useState(storedConnection?.connected || false);
    const [connectionError, setConnectionError] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);

    // Tables state
    const [existingTables, setExistingTables] = useState([]);
    const [isLoadingTables, setIsLoadingTables] = useState(false);
    const [selectedTable, setSelectedTable] = useState('');
    const [isNewTable, setIsNewTable] = useState(true);
    const [newTableName, setNewTableName] = useState('');

    const [csvFile, setCsvFile] = useState(null);
    const [csvData, setCsvData] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState({ type: '', message: '', sql: '' });

    const fileInputRef = useRef(null);

    // Fetch tables on connection
    useEffect(() => {
        if (isConnected) {
            loadTables();
        }
    }, [isConnected]);

    const loadTables = async () => {
        setIsLoadingTables(true);
        try {
            const result = await fetchTables();
            if (result.success) {
                setExistingTables(result.tables);
            }
        } catch (err) {
            console.error('Failed to load tables:', err);
        } finally {
            setIsLoadingTables(false);
        }
    };

    const handleConnect = async () => {
        if (!supabaseUrl.trim() || !supabaseKey.trim()) {
            setConnectionError('Please provide both Supabase URL and Anon Key');
            return;
        }

        setIsConnecting(true);
        setConnectionError('');

        try {
            const client = createDynamicClient(supabaseUrl.trim(), supabaseKey.trim());
            const result = await testConnection(client);

            if (result.success) {
                setIsConnected(true);
                setActiveClient(client);
                saveConnectionToStorage({
                    url: supabaseUrl.trim(),
                    key: supabaseKey.trim(),
                    connected: true
                });
                onConnectionChange?.(true, client);
            } else {
                setConnectionError(result.error || 'Failed to connect');
                setIsConnected(false);
            }
        } catch (err) {
            setConnectionError(err.message);
            setIsConnected(false);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = () => {
        setIsConnected(false);
        setActiveClient(null);
        setExistingTables([]);
        localStorage.removeItem(STORAGE_KEY);
        onConnectionChange?.(false, null);
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            setUploadStatus({ type: 'error', message: 'Please select a CSV file' });
            return;
        }

        setCsvFile(file);
        setUploadStatus({ type: '', message: '', sql: '' });

        try {
            const parsed = await parseCSV(file);
            setCsvData(parsed);

            // Auto-generate table name from file name for new tables
            const baseName = file.name.replace('.csv', '').toLowerCase().replace(/[^a-z0-9]/g, '_');
            setNewTableName(baseName);
        } catch (err) {
            setUploadStatus({ type: 'error', message: 'Failed to parse CSV: ' + err.message });
            setCsvData(null);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileSelect({ target: { files: [file] } });
        }
    };

    const getTargetTableName = () => {
        return isNewTable ? newTableName.trim() : selectedTable;
    };

    const handleUpload = async () => {
        const tableName = getTargetTableName();

        if (!csvData || !tableName) {
            setUploadStatus({ type: 'error', message: 'Please provide a table name' });
            return;
        }

        setIsUploading(true);
        setUploadStatus({ type: 'info', message: 'Uploading data...' });

        try {
            const result = await uploadCSVData(tableName, csvData, isNewTable);

            if (result.success) {
                setUploadStatus({
                    type: 'success',
                    message: `Successfully uploaded ${result.insertedCount || csvData.rows.length} rows to table "${tableName}"`
                });
                // Reset form
                setCsvFile(null);
                setCsvData(null);
                setNewTableName('');
                setSelectedTable('');
                // Refresh table list
                loadTables();
            } else {
                setUploadStatus({
                    type: 'error',
                    message: result.error,
                    sql: result.sql || ''
                });
            }
        } catch (err) {
            setUploadStatus({ type: 'error', message: err.message });
        } finally {
            setIsUploading(false);
        }
    };

    const clearFile = () => {
        setCsvFile(null);
        setCsvData(null);
        setNewTableName('');
        setUploadStatus({ type: '', message: '', sql: '' });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="data-source-panel">
            <header className="data-source-header">
                <button className="back-btn" onClick={onBack}>
                    <ChevronLeft size={20} />
                    Back to Chat
                </button>
                <h1><Database size={24} /> Data Sources</h1>
                <p>Connect your Supabase database and upload CSV data</p>
            </header>

            {/* Connection Section */}
            <section className="connection-section">
                <div className="section-header">
                    <h2><Link size={18} /> Supabase Connection</h2>
                    {isConnected && (
                        <span className="connection-badge connected">
                            <Check size={14} /> Connected
                        </span>
                    )}
                </div>

                {!isConnected ? (
                    <div className="connection-form">
                        <div className="form-group">
                            <label htmlFor="supabase-url">
                                <Link size={14} /> Supabase URL
                            </label>
                            <input
                                id="supabase-url"
                                type="text"
                                value={supabaseUrl}
                                onChange={(e) => setSupabaseUrl(e.target.value)}
                                placeholder="https://your-project.supabase.co"
                                disabled={isConnecting}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="supabase-key">
                                <Key size={14} /> Anon Key
                            </label>
                            <input
                                id="supabase-key"
                                type="password"
                                value={supabaseKey}
                                onChange={(e) => setSupabaseKey(e.target.value)}
                                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                disabled={isConnecting}
                            />
                        </div>

                        {connectionError && (
                            <div className="connection-error">
                                <AlertCircle size={14} />
                                {connectionError}
                            </div>
                        )}

                        <button
                            className="connect-btn"
                            onClick={handleConnect}
                            disabled={isConnecting}
                        >
                            {isConnecting ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} />
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    <Database size={16} />
                                    Connect to Supabase
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    <div className="connection-info">
                        <div className="connection-details">
                            <span className="connection-url">{supabaseUrl}</span>
                        </div>
                        <button className="disconnect-btn" onClick={handleDisconnect}>
                            Disconnect
                        </button>
                    </div>
                )}
            </section>

            {/* Tables List Section */}
            {isConnected && (
                <section className="tables-section">
                    <div className="section-header">
                        <h2><Table size={18} /> Existing Tables</h2>
                        <button
                            className="refresh-btn"
                            onClick={loadTables}
                            disabled={isLoadingTables}
                        >
                            <RefreshCw size={14} className={isLoadingTables ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>
                    <div className="tables-list">
                        {isLoadingTables ? (
                            <div className="tables-loading">
                                <Loader2 className="animate-spin" size={20} />
                                <span>Loading tables...</span>
                            </div>
                        ) : existingTables.length > 0 ? (
                            <div className="tables-grid">
                                {existingTables.map((table) => (
                                    <div key={table} className="table-item">
                                        <Table size={14} />
                                        <span>{table}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="tables-empty">
                                <p>No tables found. Upload a CSV to create one!</p>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* CSV Upload Section */}
            {isConnected && (
                <section className="upload-section">
                    <div className="section-header">
                        <h2><Upload size={18} /> Upload CSV</h2>
                    </div>

                    {!csvFile ? (
                        <div
                            className="upload-dropzone"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <FileSpreadsheet size={48} />
                            <p>Drag & drop a CSV file here</p>
                            <span>or click to browse</span>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                            />
                        </div>
                    ) : (
                        <div className="file-selected">
                            <div className="file-info">
                                <FileSpreadsheet size={24} />
                                <div>
                                    <p className="file-name">{csvFile.name}</p>
                                    <span className="file-meta">
                                        {csvData ? `${csvData.rows.length} rows, ${csvData.columns.length} columns` : 'Parsing...'}
                                    </span>
                                </div>
                                <button className="clear-file-btn" onClick={clearFile}>
                                    <X size={18} />
                                </button>
                            </div>

                            {csvData && (
                                <>
                                    {/* Preview Table */}
                                    <div className="csv-preview">
                                        <h3>Preview (first 5 rows)</h3>
                                        <div className="preview-table-wrapper">
                                            <table className="preview-table">
                                                <thead>
                                                    <tr>
                                                        {csvData.columns.map((col, i) => (
                                                            <th key={i}>{col}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {csvData.rows.slice(0, 5).map((row, i) => (
                                                        <tr key={i}>
                                                            {csvData.columns.map((col, j) => (
                                                                <td key={j}>{row[col]}</td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Table Selection */}
                                    <div className="table-selection">
                                        <h3>Target Table</h3>
                                        <div className="table-options">
                                            <label className={`table-option ${isNewTable ? 'selected' : ''}`}>
                                                <input
                                                    type="radio"
                                                    name="tableType"
                                                    checked={isNewTable}
                                                    onChange={() => setIsNewTable(true)}
                                                />
                                                <Plus size={14} />
                                                <span>Create new table</span>
                                            </label>
                                            {existingTables.length > 0 && (
                                                <label className={`table-option ${!isNewTable ? 'selected' : ''}`}>
                                                    <input
                                                        type="radio"
                                                        name="tableType"
                                                        checked={!isNewTable}
                                                        onChange={() => setIsNewTable(false)}
                                                    />
                                                    <Table size={14} />
                                                    <span>Use existing table</span>
                                                </label>
                                            )}
                                        </div>

                                        {isNewTable ? (
                                            <div className="form-group table-name-group">
                                                <label htmlFor="new-table-name">
                                                    <Table size={14} /> New Table Name
                                                </label>
                                                <input
                                                    id="new-table-name"
                                                    type="text"
                                                    value={newTableName}
                                                    onChange={(e) => setNewTableName(e.target.value)}
                                                    placeholder="my_data_table"
                                                />
                                                <span className="input-hint">
                                                    Table will be created automatically with inferred column types
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="form-group table-name-group">
                                                <label htmlFor="existing-table">
                                                    <Table size={14} /> Select Table
                                                </label>
                                                <select
                                                    id="existing-table"
                                                    value={selectedTable}
                                                    onChange={(e) => setSelectedTable(e.target.value)}
                                                    className="table-select"
                                                >
                                                    <option value="">Select a table...</option>
                                                    {existingTables.map((table) => (
                                                        <option key={table} value={table}>
                                                            {table}
                                                        </option>
                                                    ))}
                                                </select>
                                                <span className="input-hint">
                                                    Make sure column names match the CSV headers
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Upload Status */}
                                    {uploadStatus.message && (
                                        <div className={`upload-status ${uploadStatus.type}`}>
                                            {uploadStatus.type === 'error' && <AlertCircle size={14} />}
                                            {uploadStatus.type === 'success' && <Check size={14} />}
                                            {uploadStatus.type === 'info' && <Loader2 className="animate-spin" size={14} />}
                                            <span>{uploadStatus.message}</span>
                                        </div>
                                    )}

                                    {/* Show SQL for manual creation if needed */}
                                    {uploadStatus.sql && (
                                        <div className="sql-hint">
                                            <h4>Create table manually with this SQL:</h4>
                                            <pre className="sql-code">{uploadStatus.sql}</pre>
                                        </div>
                                    )}

                                    {/* Upload Button */}
                                    <button
                                        className="upload-btn"
                                        onClick={handleUpload}
                                        disabled={isUploading || !getTargetTableName()}
                                    >
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="animate-spin" size={16} />
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={16} />
                                                Upload to Supabase
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}

