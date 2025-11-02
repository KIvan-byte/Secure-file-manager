import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import {
  FaSync, FaWifi, FaShieldAlt, FaUsers, FaCog, FaPlay, FaStop,
  FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaNetworkWired,
  FaLock, FaUnlock, FaEye, FaEyeSlash, FaPlus, FaTrash, FaEdit,
  FaDownload, FaUpload, FaHistory, FaGlobe, FaDesktop
} from 'react-icons/fa';

// Animations
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const slideIn = keyframes`
  from { transform: translateX(-20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 100%;
  gap: 24px;
  padding: 0 16px;

  @media (max-width: 768px) {
    gap: 16px;
    padding: 0 12px;
  }

  @media (max-width: 480px) {
    gap: 12px;
    padding: 0 8px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
  flex-wrap: wrap;
  gap: 16px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
`;

const Title = styled.h2`
  margin: 0;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: 768px) {
    font-size: 1.5rem;
    gap: 10px;
    justify-content: center;
  }

  @media (max-width: 480px) {
    font-size: 1.25rem;
    gap: 8px;
  }
`;

const StatusIndicator = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => {
    switch (props.$status) {
      case 'active': return '#2ecc71';
      case 'syncing': return '#f39c12';
      case 'error': return '#e74c3c';
      default: return '#95a5a6';
    }
  }};
  ${props => props.$status === 'syncing' && css`
    animation: ${pulse} 2s infinite;
  `}
`;

const SyncGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  @media (max-width: 768px) {
    gap: 16px;
  }

  @media (max-width: 480px) {
    gap: 12px;
  }
`;

const Card = styled.div`
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    border-radius: 8px;

    &:hover {
      transform: none;
    }
  }

  @media (max-width: 480px) {
    border-radius: 6px;
  }
`;

const CardHeader = styled.div`
  padding: 20px 24px 16px;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 768px) {
    padding: 16px 20px 12px;
  }

  @media (max-width: 480px) {
    padding: 12px 16px 8px;
  }
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 10px;

  @media (max-width: 768px) {
    font-size: 16px;
    gap: 8px;
  }

  @media (max-width: 480px) {
    font-size: 14px;
    gap: 6px;
  }
`;

const CardContent = styled.div`
  padding: 24px;

  @media (max-width: 768px) {
    padding: 20px;
  }

  @media (max-width: 480px) {
    padding: 16px;
  }
`;

const ControlPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 768px) {
    gap: 16px;
  }

  @media (max-width: 480px) {
    gap: 12px;
  }
`;

const InitializationSection = styled.div`
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  padding: 20px;
  border: 2px dashed ${props => props.$initialized ? '#2ecc71' : '#dee2e6'};
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    padding: 16px;
    border-radius: 6px;
  }

  @media (max-width: 480px) {
    padding: 12px;
  }
`;

const PasswordInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }

  &:disabled {
    background-color: #f8f9fa;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    padding: 10px 14px;
    font-size: 13px;
  }

  @media (max-width: 480px) {
    padding: 8px 12px;
    font-size: 12px;
  }
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  background: ${props => {
    if (props.$variant === 'primary') return 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)';
    if (props.$variant === 'success') return 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)';
    if (props.$variant === 'danger') return 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
    if (props.$variant === 'warning') return 'linear-gradient(135deg, #f39c12 0%, #d35400 100%)';
    return 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)';
  }};
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  @media (max-width: 768px) {
    padding: 10px 16px;
    min-width: 100px;
    gap: 6px;

    &:hover:not(:disabled) {
      transform: none;
    }
  }

  @media (max-width: 480px) {
    padding: 8px 14px;
    font-size: 14px;
    min-width: 80px;
    width: 100%;
  }
`;

const PeersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;

  @media (max-width: 768px) {
    gap: 10px;
    max-height: 250px;
  }

  @media (max-width: 480px) {
    gap: 8px;
    max-height: 200px;
  }
`;

const PeerItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid ${props => {
    switch (props.$status) {
      case 'connected': return '#2ecc71';
      case 'connecting': return '#f39c12';
      case 'disconnected': return '#e74c3c';
      default: return '#95a5a6';
    }
  }};
  transition: all 0.3s ease;

  &:hover {
    background: #ecf0f1;
    transform: translateX(4px);
  }

  @media (max-width: 768px) {
    padding: 10px 12px;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;

    &:hover {
      transform: none;
    }
  }

  @media (max-width: 480px) {
    padding: 8px 10px;
    border-radius: 6px;
  }
`;

const PeerInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  @media (max-width: 768px) {
    align-items: center;
    text-align: center;
  }
`;

const PeerName = styled.div`
  font-weight: 600;
  color: #2c3e50;
`;

const PeerDetails = styled.div`
  font-size: 12px;
  color: #7f8c8d;
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 768px) {
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
  }

  @media (max-width: 480px) {
    font-size: 11px;
    gap: 4px;
  }
`;

const StatusBadge = styled.span`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  background-color: ${props => {
    switch (props.$status) {
      case 'connected': return '#d4edda';
      case 'connecting': return '#fff3cd';
      case 'disconnected': return '#f8d7da';
      default: return '#e2e3e5';
    }
  }};
  color: ${props => {
    switch (props.$status) {
      case 'connected': return '#155724';
      case 'connecting': return '#856404';
      case 'disconnected': return '#721c24';
      default: return '#383d41';
    }
  }};
`;

const SyncStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-top: 20px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 12px;
    margin-top: 16px;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 12px;
  }
`;

const StatCard = styled.div`
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  border: 1px solid #dee2e6;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #7f8c8d;
  text-transform: uppercase;
  font-weight: 600;
`;

const SyncActivity = styled.div`
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 8px;
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
`;

const ActivityIcon = styled.div`
  color: ${props => {
    switch (props.$type) {
      case 'sync': return '#3498db';
      case 'upload': return '#2ecc71';
      case 'download': return '#f39c12';
      case 'conflict': return '#e74c3c';
      default: return '#95a5a6';
    }
  }};
`;

const ActivityDetails = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ActivityMessage = styled.div`
  font-size: 14px;
  color: #2c3e50;
`;

const ActivityTime = styled.div`
  font-size: 12px;
  color: #7f8c8d;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #7f8c8d;

  svg {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }
`;

const SpinningIcon = styled(FaSync)`
  animation: ${rotate} 1s linear infinite;
`;

const AlertBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  background-color: ${props => {
    switch (props.$type) {
      case 'success': return '#d4edda';
      case 'warning': return '#fff3cd';
      case 'error': return '#f8d7da';
      case 'info': return '#d1ecf1';
      default: return '#e2e3e5';
    }
  }};
  border: 1px solid ${props => {
    switch (props.$type) {
      case 'success': return '#c3e6cb';
      case 'warning': return '#ffeaa7';
      case 'error': return '#f5c6cb';
      case 'info': return '#bee5eb';
      default: return '#d6d8db';
    }
  }};
  color: ${props => {
    switch (props.$type) {
      case 'success': return '#155724';
      case 'warning': return '#856404';
      case 'error': return '#721c24';
      case 'info': return '#0c5460';
      default: return '#383d41';
    }
  }};
`;

function ZeroKnowledgeSync() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [peers, setPeers] = useState([]);
  const [syncStats, setSyncStats] = useState({
    filesInSync: 0,
    totalSyncSize: 0,
    lastSyncTime: null,
    activeSessions: 0
  });
  const [activity, setActivity] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncedFiles, setSyncedFiles] = useState([]);
  const [syncDirectory, setSyncDirectory] = useState('');
  const [lastEventTimestamp, setLastEventTimestamp] = useState(0); // Add timestamp tracking

  const syncManagerRef = useRef(null);

  useEffect(() => {
    // Initialize sync system
    initializeSyncSystem();

    // Setup polling for updates
    const cleanup = setupEventListeners();

    // Also poll immediately and more frequently for peers
    const peerPollInterval = setInterval(async () => {
      await updatePeersList();
    }, 1000); // Check for peers every second

    // Set up event listeners for sync events
    const handleFileReceived = (data) => {
      console.log('File received from sync:', data);
      addAlert('success', `Received file: ${data.fileName}`);
      addActivity('download', `Received file from peer: ${data.fileName}`);
      // Refresh the synced files list
      setTimeout(() => {
        updateSyncedFiles();
        updateSyncStats();
      }, 500);
    };

    const handleFileAdded = (data) => {
      console.log('File added to sync:', data);
      addAlert('success', `File added to sync: ${data.fileName}`);
      addActivity('upload', `Added file to sync: ${data.fileName}`);
      // Refresh the synced files list
      setTimeout(() => {
        updateSyncedFiles();
        updateSyncStats();
      }, 500);
    };

    // Listen for sync events if electron API is available
    if (window.electronAPI && window.electronAPI.on) {
      window.electronAPI.on('sync-file-received', handleFileReceived);
      window.electronAPI.on('sync-file-added', handleFileAdded);
    }

    return () => {
      if (cleanup) cleanup();
      clearInterval(peerPollInterval);

      // Cleanup listeners on unmount
      if (window.electronAPI && window.electronAPI.removeListener) {
        window.electronAPI.removeListener('sync-file-received', handleFileReceived);
        window.electronAPI.removeListener('sync-file-added', handleFileAdded);
      }
    };
  }, []);

  const initializeSyncSystem = async () => {
    try {
      // Check sync status from main process
      const statusResult = await window.electron.fileManager.syncGetStatus();
      if (statusResult.success) {
        const status = statusResult.status;
        setIsInitialized(status.isInitialized);
        setIsRunning(status.isRunning);

        if (status.isInitialized) {
          // Get current peers
          const peersResult = await window.electron.fileManager.syncGetPeers();
          if (peersResult.success) {
            setPeers(peersResult.peers);
          }

          // Update stats
          setSyncStats(prev => ({
            ...prev,
            filesInSync: status.stats.filesInSync,
            activeSessions: status.stats.activeSessions
          }));
        }
      }

    } catch (error) {
      console.error('Failed to initialize sync system:', error);
      addAlert('error', 'Failed to initialize sync system');
    }
  };

  const setupEventListeners = () => {
    // Event listeners are now handled by the main process
    // We'll poll for updates instead
    const pollInterval = setInterval(async () => {
      if (isInitialized) {
        await updatePeersList();
        await updateSyncStats();
        await updateSyncedFiles();
        await updateSyncDirectory();
      }
    }, 2000); // Poll every 2 seconds for faster peer discovery updates

    return () => clearInterval(pollInterval);
  };

  const checkExistingSetup = async () => {
    // Implementation to check if sync is already configured
  };

  const handleInitialize = async () => {
    if (!masterPassword) {
      addAlert('warning', 'Please enter a master password');
      return;
    }

    setLoading(true);
    try {
      const result = await window.electron.fileManager.syncInitialize(masterPassword);
      if (result.success) {
        setIsInitialized(true);
        setIsRunning(true);
        setMasterPassword(''); // Clear password from memory
        addAlert('success', 'Zero-Knowledge Sync initialized successfully');
        addActivity('sync', 'Sync system initialized');
        await updatePeersList();
        await updateSyncStats();
      } else {
        addAlert('error', result.error || 'Failed to initialize sync system');
      }
    } catch (error) {
      console.error('Initialization failed:', error);
      addAlert('error', 'Failed to initialize sync system');
    } finally {
      setLoading(false);
    }
  };

  const handleStartStop = async () => {
    if (isRunning) {
      const result = await window.electron.fileManager.syncShutdown();
      if (result.success) {
        setIsRunning(false);
        setIsInitialized(false);
        addAlert('info', 'Sync system stopped');
        addActivity('sync', 'Sync system stopped');
      }
    } else {
      if (masterPassword) {
        await handleInitialize();
      } else {
        addAlert('warning', 'Please enter master password to start sync');
      }
    }
  };

  const handleAddFileToSync = async () => {
    try {
      const result = await window.electron.fileManager.selectFile();
      if (result && result.success && result.path) {
        const filePath = result.path;

        // Add file to sync
        const addResult = await window.electron.fileManager.syncAddFile(filePath);
        if (addResult.success) {
          addAlert('success', `File added to sync: ${addResult.metadata.fileName}`);
          addActivity('sync', `Added file to sync: ${addResult.metadata.fileName}`);

          // Update UI immediately
          await updateSyncedFiles();
          await updateSyncStats();
        } else {
          addAlert('error', addResult.error || 'Failed to add file to sync');
        }
      }
    } catch (error) {
      console.error('Failed to add file to sync:', error);
      addAlert('error', 'Failed to add file to sync');
    }
  };

  const updatePeersList = async () => {
    try {
      const result = await window.electron.fileManager.syncGetPeers();
      if (result.success) {
        console.log('Updating peers list:', result.peers); // Debug log
        setPeers(result.peers);
      } else {
        console.log('Failed to get peers:', result.error);
      }
    } catch (error) {
      console.error('Failed to update peers list:', error);
    }
  };

  const updateSyncStats = async () => {
    try {
      const result = await window.electron.fileManager.syncGetStatus();
      if (result.success) {
        setSyncStats(prev => ({
          ...prev,
          filesInSync: result.status.stats.filesInSync,
          activeSessions: result.status.stats.activeSessions,
          lastSyncTime: Date.now()
        }));
      }
    } catch (error) {
      console.error('Failed to update sync stats:', error);
    }
  };

  const updateSyncedFiles = async () => {
    try {
      const result = await window.electron.fileManager.syncGetFiles();
      if (result.success) {
        setSyncedFiles(result.files);
      }
    } catch (error) {
      console.error('Failed to update synced files:', error);
    }
  };

  const updateSyncDirectory = async () => {
    try {
      const result = await window.electron.fileManager.syncGetDirectory();
      if (result.success) {
        setSyncDirectory(result.directory);
      }
    } catch (error) {
      console.error('Failed to get sync directory:', error);
    }
  };

  const addAlert = (type, message) => {
    const now = Date.now();

    // Prevent duplicate alerts within 2 seconds
    if (now - lastEventTimestamp < 2000) {
      console.log('Skipping duplicate alert:', message);
      return;
    }

    setLastEventTimestamp(now);

    const alert = {
      id: Date.now() + Math.random(), // Make ID more unique
      type,
      message,
      timestamp: Date.now()
    };

    setAlerts(prev => [alert, ...prev.slice(0, 4)]); // Keep only 5 alerts

    // Auto-remove alerts after 5 seconds
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== alert.id));
    }, 5000);
  };

  const addActivity = (type, message) => {
    const activityItem = {
      id: Date.now() + Math.random(), // Make ID more unique
      type,
      message,
      timestamp: Date.now()
    };

    setActivity(prev => [activityItem, ...prev.slice(0, 49)]); // Keep only 50 items
  };

  const handleDownloadFile = async (fileHash, fileName) => {
    try {
      const result = await window.electron.fileManager.syncDownloadFile(fileHash);
      if (result.success) {
        // Create download link
        const content = atob(result.content);
        const blob = new Blob([content], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        addAlert('success', `File downloaded: ${fileName}`);
        addActivity('download', `Downloaded file: ${fileName}`);
      } else {
        addAlert('error', result.error || 'Failed to download file');
      }
    } catch (error) {
      console.error('Failed to download file:', error);
      addAlert('error', 'Failed to download file');
    }
  };

  const handleRemoveFile = async (fileHash, fileName) => {
    try {
      const result = await window.electron.fileManager.syncRemoveFile(fileHash);
      if (result.success) {
        addAlert('success', `File removed from sync: ${fileName}`);
        addActivity('sync', `Removed file from sync: ${fileName}`);
        await updateSyncedFiles();
        await updateSyncStats();
      } else {
        addAlert('error', result.error || 'Failed to remove file');
      }
    } catch (error) {
      console.error('Failed to remove file:', error);
      addAlert('error', 'Failed to remove file');
    }
  };

  const openSyncDirectory = async () => {
    try {
      const result = await window.electron.fileManager.syncOpenDirectory();
      if (result.success) {
        addAlert('success', 'Sync directory opened');
      } else {
        addAlert('error', result.error || 'Failed to open sync directory');
      }
    } catch (error) {
      console.error('Failed to open sync directory:', error);
      addAlert('error', 'Failed to open sync directory');
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Container>
      <Header>
        <Title>
          <FaSync />
          Zero-Knowledge Sync
          <StatusIndicator $status={isRunning ? 'active' : 'inactive'} />
        </Title>
        <Button
          $variant={isRunning ? 'danger' : 'success'}
          onClick={handleStartStop}
          disabled={!isInitialized}
        >
          {isRunning ? <FaStop /> : <FaPlay />}
          {isRunning ? 'Stop Sync' : 'Start Sync'}
        </Button>
      </Header>

      {/* Alerts */}
      {alerts.map((alert, index) => (
        <AlertBanner key={`${alert.id}-${index}`} $type={alert.type}>
          {alert.type === 'success' && <FaCheckCircle />}
          {alert.type === 'warning' && <FaExclamationTriangle />}
          {alert.type === 'error' && <FaTimesCircle />}
          {alert.type === 'info' && <FaNetworkWired />}
          <span>{alert.message}</span>
        </AlertBanner>
      ))}

      <SyncGrid>
        {/* Control Panel */}
        <Card>
          <CardHeader>
            <CardTitle>
              <FaCog />
              Control Panel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ControlPanel>
              {!isInitialized && (
                <InitializationSection $initialized={isInitialized}>
                  <h4 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaShieldAlt />
                    Initialize Zero-Knowledge Sync
                  </h4>
                  <div style={{ position: 'relative', marginBottom: '16px' }}>
                    <PasswordInput
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter master password for encryption"
                      value={masterPassword}
                      onChange={(e) => setMasterPassword(e.target.value)}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#7f8c8d',
                        cursor: 'pointer'
                      }}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <Button
                    $variant="primary"
                    onClick={handleInitialize}
                    disabled={!masterPassword || loading}
                  >
                    {loading ? <SpinningIcon /> : <FaLock />}
                    {loading ? 'Initializing...' : 'Initialize Sync'}
                  </Button>
                </InitializationSection>
              )}

              {isInitialized && (
                <>
                  <Button $variant="primary" onClick={handleAddFileToSync}>
                    <FaPlus />
                    Add File to Sync
                  </Button>

                  <SyncStats>
                    <StatCard>
                      <StatValue>{syncStats.filesInSync}</StatValue>
                      <StatLabel>Files in Sync</StatLabel>
                    </StatCard>
                    <StatCard>
                      <StatValue>{formatFileSize(syncStats.totalSyncSize)}</StatValue>
                      <StatLabel>Total Size</StatLabel>
                    </StatCard>
                    <StatCard>
                      <StatValue>{peers.length}</StatValue>
                      <StatLabel>Connected Peers</StatLabel>
                    </StatCard>
                    <StatCard>
                      <StatValue>{syncStats.activeSessions}</StatValue>
                      <StatLabel>Active Sessions</StatLabel>
                    </StatCard>
                  </SyncStats>
                </>
              )}
            </ControlPanel>
          </CardContent>
        </Card>

        {/* Peers Panel */}
        <Card>
          <CardHeader>
            <CardTitle>
              <FaUsers />
              Connected Peers
            </CardTitle>
            <StatusBadge $status={peers.length > 0 ? 'connected' : 'disconnected'}>
              {peers.length} {peers.length === 1 ? 'Peer' : 'Peers'}
            </StatusBadge>
          </CardHeader>
          <CardContent>
            {peers.length > 0 ? (
              <PeersList>
                {peers.map((peer, index) => (
                  <PeerItem key={`${peer.deviceId}-${index}`} $status={peer.status}>
                    <PeerInfo>
                      <PeerName>{peer.deviceId}</PeerName>
                      <PeerDetails>
                        <FaDesktop />
                        {peer.address}:{peer.port}
                        <span>•</span>
                        <span>{formatTimestamp(peer.lastSeen)}</span>
                      </PeerDetails>
                    </PeerInfo>
                    <StatusBadge $status={peer.status}>
                      {peer.status}
                    </StatusBadge>
                  </PeerItem>
                ))}
              </PeersList>
            ) : (
              <EmptyState>
                <FaGlobe />
                <div>No peers discovered</div>
                <div style={{ fontSize: '12px', marginTop: '8px' }}>
                  Peers will appear here when they're discovered on your network
                </div>
              </EmptyState>
            )}
          </CardContent>
        </Card>
      </SyncGrid>

      {/* Activity Panel */}
      <Card>
        <CardHeader>
          <CardTitle>
            <FaHistory />
            Sync Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activity.length > 0 ? (
            <SyncActivity>
              {activity.map((item, index) => (
                <ActivityItem key={`${item.id}-${index}`}>
                  <ActivityIcon $type={item.type}>
                    {item.type === 'sync' && <FaSync />}
                    {item.type === 'upload' && <FaUpload />}
                    {item.type === 'download' && <FaDownload />}
                    {item.type === 'conflict' && <FaExclamationTriangle />}
                  </ActivityIcon>
                  <ActivityDetails>
                    <ActivityMessage>{item.message}</ActivityMessage>
                    <ActivityTime>{formatTimestamp(item.timestamp)}</ActivityTime>
                  </ActivityDetails>
                </ActivityItem>
              ))}
            </SyncActivity>
          ) : (
            <EmptyState>
              <FaHistory />
              <div>No sync activity yet</div>
              <div style={{ fontSize: '12px', marginTop: '8px' }}>
                Activity will appear here when files are synced
              </div>
            </EmptyState>
          )}
        </CardContent>
      </Card>

      {/* Synced Files Panel */}
      {isInitialized && (
        <Card>
          <CardHeader>
            <CardTitle>
              <FaDownload />
              Synced Files ({syncedFiles.length})
            </CardTitle>
            <Button
              $variant="primary"
              onClick={openSyncDirectory}
              style={{ padding: '8px 16px', fontSize: '14px' }}
            >
              <FaGlobe />
              Open Sync Folder
            </Button>
          </CardHeader>
          <CardContent>
            {syncedFiles.length > 0 ? (
              <SyncActivity>
                {syncedFiles.map((file, index) => (
                  <ActivityItem key={`${file.contentHash}-${index}`}>
                    <ActivityIcon $type="sync">
                      <FaDownload />
                    </ActivityIcon>
                    <ActivityDetails>
                      <ActivityMessage>
                        {file.fileName}
                        <span style={{ fontSize: '12px', color: '#7f8c8d', marginLeft: '8px' }}>
                          {formatFileSize(file.fileSize)}
                        </span>
                      </ActivityMessage>
                      <ActivityTime>
                        {file.receivedFrom ? `Received from peer` : 'Added locally'} • {formatTimestamp(file.addedToSync || file.receivedAt)}
                      </ActivityTime>
                    </ActivityDetails>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button
                        $variant="primary"
                        onClick={() => handleDownloadFile(file.contentHash, file.fileName)}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        <FaDownload />
                      </Button>
                      <Button
                        $variant="danger"
                        onClick={() => handleRemoveFile(file.contentHash, file.fileName)}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  </ActivityItem>
                ))}
              </SyncActivity>
            ) : (
              <EmptyState>
                <FaDownload />
                <div>No synced files yet</div>
                <div style={{ fontSize: '12px', marginTop: '8px' }}>
                  Files will appear here when added to sync or received from peers
                </div>
              </EmptyState>
            )}
            {syncDirectory && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#7f8c8d'
              }}>
                <strong>Sync Directory:</strong> {syncDirectory}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </Container>
  );
}

export default ZeroKnowledgeSync;