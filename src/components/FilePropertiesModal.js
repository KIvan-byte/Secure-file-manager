import React, { useState, useEffect } from 'react';
import { styled, keyframes } from 'styled-components';
import { FaInfoCircle, FaTimes, FaCalendarAlt, FaUserAlt, FaLock, FaTag, FaDatabase, 
  FaFileImage, FaFileVideo, FaFileAudio, FaFileAlt, FaFilePdf, FaCode, FaFileArchive, 
  FaFile, FaCheck, FaExclamationTriangle, FaCopy, FaExternalLinkAlt, FaShieldAlt, FaKey, FaCalculator, FaFolder } from 'react-icons/fa';
import path from 'path-browserify';

// Animation keyframes
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(52, 152, 219, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(52, 152, 219, 0); }
  100% { box-shadow: 0 0 0 0 rgba(52, 152, 219, 0); }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

// Styled components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background-color: white;
  border-radius: 16px;
  width: 100%;
  max-width: 650px;
  max-height: 85vh;
  overflow-y: auto;
  position: relative;
  display: flex;
  flex-direction: column;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
`;

const ModalTitle = styled.h3`
  margin: 0;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #7f8c8d;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  
  &:hover {
    color: #34495e;
    background-color: #f8f9fa;
  }
`;

const ModalBody = styled.div`
  padding: 0;
  flex: 1;
  overflow: hidden;
`;

const PropertyTabs = styled.div`
  display: flex;
  border-bottom: 1px solid #f0f0f0;
  background-color: #f8f9fa;
`;

const Tab = styled.button`
  padding: 16px 24px;
  background: none;
  border: none;
  border-bottom: 3px solid ${props => props.$active ? '#3498db' : 'transparent'};
  color: ${props => props.$active ? '#3498db' : '#7f8c8d'};
  font-weight: ${props => props.$active ? '600' : '400'};
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    color: #3498db;
    background-color: rgba(52, 152, 219, 0.05);
  }
`;

const HashContainer = styled.div`
  margin-bottom: 16px;
`;

const HashRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #eee;
`;

const HashLabel = styled.div`
  font-weight: 600;
  color: #34495e;
  min-width: 60px;
`;

const HashValue = styled.div`
  flex: 1;
  font-family: monospace;
  font-size: 13px;
  color: #2c3e50;
  word-break: break-all;
  background-color: white;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #ddd;
`;

const HashButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
  
  &:hover {
    background-color: #2980b9;
  }
  
  &:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
`;

const TabContent = styled.div`
  padding: 24px;
  display: ${props => props.$active ? 'block' : 'none'};
  animation: ${fadeIn} 0.3s ease;
`;

const PropertySection = styled.div`
  margin-bottom: 28px;
  animation: ${fadeIn} 0.5s ease;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h4`
  margin: 0 0 16px 0;
  color: #34495e;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  position: relative;
  
  &:after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -6px;
    height: 2px;
    width: 40px;
    background-color: #3498db;
    border-radius: 2px;
  }
`;

const PropertyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  grid-gap: 20px;
`;

const Property = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  transition: all 0.2s ease;
  border-radius: 8px;
  padding: 12px;
  
  &:hover {
    background-color: #f8f9fa;
  }
`;

const PropertyLabel = styled.div`
  color: #7f8c8d;
  font-size: 13px;
  font-weight: 500;
`;

const PropertyValue = styled.div`
  color: #2c3e50;
  font-weight: 500;
  word-break: break-all;
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const CopyToClipboardButton = styled.button`
  background: none;
  border: none;
  color: #95a5a6;
  cursor: pointer;
  padding: 4px;
  font-size: 12px;
  border-radius: 4px;
  margin-left: auto;
  display: flex;
  align-items: center;
  opacity: 0;
  transition: all 0.2s ease;
  
  ${Property}:hover & {
    opacity: 1;
  }
  
  &:hover {
    color: #3498db;
    background-color: rgba(52, 152, 219, 0.1);
  }
`;

const CopiedIndicator = styled.span`
  position: absolute;
  top: -8px;
  right: 8px;
  background-color: #2ecc71;
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(46, 204, 113, 0.3);
  animation: ${fadeIn} 0.2s ease;
`;

const FilePath = styled.div`
  font-family: monospace;
  font-size: 13px;
  background-color: #f8f9fa;
  padding: 12px 16px;
  border-radius: 8px;
  margin: 0 0 24px 0;
  word-break: break-all;
  border: 1px solid #eee;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const CopyPathButton = styled.button`
  background: none;
  border: none;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 13px;
  border-radius: 4px;
  color: #7f8c8d;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  
  &:hover {
    color: #3498db;
    background-color: rgba(52, 152, 219, 0.1);
  }
`;

const OpenLocationButton = styled(CopyPathButton)`
  &:hover {
    color: #2ecc71;
    background-color: rgba(46, 204, 113, 0.1);
  }
`;

const LoadingIndicator = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #7f8c8d;
`;

const Spinner = styled.div`
  border: 3px solid rgba(52, 152, 219, 0.1);
  border-top: 3px solid #3498db;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: ${spin} 1s linear infinite;
  margin-bottom: 16px;
`;

const FileIconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 42px;
  width: 42px;
  background-color: ${props => `rgba(${props.$rgbColor || '52, 152, 219'}, 0.1)`};
  border-radius: 12px;
  font-size: 20px;
  color: ${props => props.$color || '#3498db'};
  margin-right: 12px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
`;

const FileNameContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const FileName = styled.h4`
  margin: 0 0 4px 0;
  color: #2c3e50;
  font-size: 16px;
`;

const FileType = styled.div`
  color: #7f8c8d;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const ProgressBar = styled.div`
  height: 6px;
  background-color: #ecf0f1;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 8px;
`;

const ProgressFill = styled.div`
  height: 100%;
  background-color: #3498db;
  width: ${props => props.$percentage}%;
  border-radius: 3px;
  transition: width 0.3s ease;
`;

const ErrorMessage = styled.div`
  background-color: #fdeded;
  color: #e74c3c;
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  animation: ${fadeIn} 0.3s ease;
  border: 1px solid rgba(231, 76, 60, 0.2);
`;

const ErrorIcon = styled.div`
  color: #e74c3c;
  font-size: 20px;
  margin-top: 2px;
`;

const SecurityBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background-color: #2ecc71;
  color: white;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  margin-left: 12px;
`;

const formatSize = (size) => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let fileSize = size;
  
  while (fileSize >= 1024 && unitIndex < units.length - 1) {
    fileSize /= 1024;
    unitIndex++;
  }
  
  return `${fileSize.toFixed(1)} ${units[unitIndex]}`;
};

const formatDate = (dateString) => {
  if (!dateString) return 'Not available';
  
  try {
    const date = new Date(dateString);
    // A more thorough check for valid dates
    if (isNaN(date.getTime()) || date.getFullYear() <= 1970) {
      return 'Not available';
    }
    return date.toLocaleString();
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Not available';
  }
};

const formatMode = (mode) => {
  // Convert file mode to readable permissions (Unix-style)
  const permissions = [];
  
  // Owner permissions
  permissions.push((mode & 0o400) ? 'r' : '-');
  permissions.push((mode & 0o200) ? 'w' : '-');
  permissions.push((mode & 0o100) ? 'x' : '-');
  
  // Group permissions
  permissions.push((mode & 0o040) ? 'r' : '-');
  permissions.push((mode & 0o020) ? 'w' : '-');
  permissions.push((mode & 0o010) ? 'x' : '-');
  
  // Others permissions
  permissions.push((mode & 0o004) ? 'r' : '-');
  permissions.push((mode & 0o002) ? 'w' : '-');
  permissions.push((mode & 0o001) ? 'x' : '-');
  
  return permissions.join('');
};

const getFileIcon = (file) => {
  const fileType = getFileType(file);
  
  switch (fileType) {
    case 'image':
      return { icon: <FaFileImage />, color: '#3498db', rgb: '52, 152, 219' };
    case 'video':
      return { icon: <FaFileVideo />, color: '#e74c3c', rgb: '231, 76, 60' };
    case 'audio':
      return { icon: <FaFileAudio />, color: '#9b59b6', rgb: '155, 89, 182' };
    case 'document':
      return { icon: <FaFileAlt />, color: '#2ecc71', rgb: '46, 204, 113' };
    case 'pdf':
      return { icon: <FaFilePdf />, color: '#e67e22', rgb: '230, 126, 34' };
    case 'code':
      return { icon: <FaCode />, color: '#f1c40f', rgb: '241, 196, 15' };
    case 'archive':
      return { icon: <FaFileArchive />, color: '#f39c12', rgb: '243, 156, 18' };
    default:
      return { icon: <FaFile />, color: '#7f8c8d', rgb: '127, 140, 141' };
  }
};

const getFileType = (file) => {
  const ext = path.extname(file.name).toLowerCase();
  
  // Check if it's an archive
  if (isArchive(file.name)) {
    return 'archive';
  }
  
  // Check file extension
  if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'].includes(ext)) {
    return 'image';
  } else if (['.mp4', '.webm', '.mkv', '.avi', '.mov', '.flv'].includes(ext)) {
    return 'video';
  } else if (['.mp3', '.wav', '.ogg', '.flac', '.aac'].includes(ext)) {
    return 'audio';
  } else if (['.doc', '.docx', '.txt', '.rtf', '.odt', '.xls', '.xlsx', '.ppt', '.pptx'].includes(ext)) {
    return 'document';
  } else if (ext === '.pdf') {
    return 'pdf';
  } else if (['.js', '.html', '.css', '.py', '.java', '.c', '.cpp', '.php', '.go', '.ts', '.jsx', '.tsx'].includes(ext)) {
    return 'code';
  }
  
  return 'other';
};

const isArchive = (fileName) => {
  const ext = path.extname(fileName).toLowerCase();
  return ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'].includes(ext);
};

const getFileIconByMimeType = (mimeType) => {
  if (!mimeType) return { icon: <FaFile />, color: '#7f8c8d', rgb: '127, 140, 141' };
  
  if (mimeType.startsWith('image/')) {
    return { icon: <FaFileImage />, color: '#3498db', rgb: '52, 152, 219' };
  } else if (mimeType.startsWith('video/')) {
    return { icon: <FaFileVideo />, color: '#e74c3c', rgb: '231, 76, 60' };
  } else if (mimeType.startsWith('audio/')) {
    return { icon: <FaFileAudio />, color: '#9b59b6', rgb: '155, 89, 182' };
  } else if (mimeType.startsWith('text/')) {
    return { icon: <FaFileAlt />, color: '#2ecc71', rgb: '46, 204, 113' };
  } else if (mimeType === 'application/pdf') {
    return { icon: <FaFilePdf />, color: '#e67e22', rgb: '230, 126, 34' };
  } else if (mimeType.includes('zip') || mimeType.includes('compressed') || mimeType.includes('archive')) {
    return { icon: <FaFileArchive />, color: '#f39c12', rgb: '243, 156, 18' };
  } else if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('xml')) {
    return { icon: <FaCode />, color: '#f1c40f', rgb: '241, 196, 15' };
  }
  
  return { icon: <FaFile />, color: '#7f8c8d', rgb: '127, 140, 141' };
};

function FilePropertiesModal({ isOpen, onClose, file }) {
  const [fileDetails, setFileDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [copiedItem, setCopiedItem] = useState(null);
  const [pathCopied, setPathCopied] = useState(false);
  
  // Hash calculation state
  const [hashCalculations, setHashCalculations] = useState({
    md5: { value: '', isCalculating: false },
    sha1: { value: '', isCalculating: false },
    sha256: { value: '', isCalculating: false }
  });

  useEffect(() => {
    if (isOpen && file) {
      fetchFileDetails();
      // Reset hash calculations when modal opens
      setHashCalculations({
        md5: { value: '', isCalculating: false },
        sha1: { value: '', isCalculating: false },
        sha256: { value: '', isCalculating: false }
      });
    }
  }, [isOpen, file]);

  const calculateHash = async (algorithm) => {
    if (!file || file.isDirectory) return;

    setHashCalculations(prev => ({
      ...prev,
      [algorithm]: { ...prev[algorithm], isCalculating: true }
    }));

    try {
      const result = await window.electron.fileManager.calculateFileHash(file.path, algorithm);
      
      if (result.success) {
        setHashCalculations(prev => ({
          ...prev,
          [algorithm]: { 
            value: result.hash, 
            isCalculating: false 
          }
        }));
      } else {
        setHashCalculations(prev => ({
          ...prev,
          [algorithm]: { 
            value: 'Error', 
            isCalculating: false 
          }
        }));
      }
    } catch (error) {
      setHashCalculations(prev => ({
        ...prev,
        [algorithm]: { 
          value: 'Error', 
          isCalculating: false 
        }
      }));
    }
  };
  
  const fetchFileDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await window.electron.fileManager.getFileDetails(file.path);
      
      if (result.success) {
        setFileDetails(result.details);
      } else {
        setError(result.error || 'Failed to fetch file details');
      }
    } catch (error) {
      console.error('Error fetching file details:', error);
      setError(error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  const copyToClipboard = (text, item) => {
    if (!text || text === 'Error' || text === 'Not calculated') return;
    navigator.clipboard.writeText(text);
    setCopiedItem(item);
    setTimeout(() => setCopiedItem(null), 2000);
  };
  
  const copyFilePath = () => {
    navigator.clipboard.writeText(file.path);
    setPathCopied(true);
    setTimeout(() => setPathCopied(false), 2000);
  };
  
  const openFileLocation = () => {
    const dirPath = path.dirname(file.path);
    // Navigate to directory or show it in OS file explorer
    if (window.electron.fileManager.showItemInFolder) {
      window.electron.fileManager.showItemInFolder(file.path);
    } else if (window.electron.fileManager.openDirectory) {
      window.electron.fileManager.openDirectory(dirPath);
    }
  };
  
  if (!isOpen || !file) return null;
  
  const fileIcon = getFileIcon(file);
  const mimeTypeIcon = fileDetails?.mime ? getFileIconByMimeType(fileDetails.mime) : fileIcon;
  
  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <HeaderContent>
            <FileIconContainer $color={fileIcon.color} $rgbColor={fileIcon.rgb}>
              {fileIcon.icon}
            </FileIconContainer>
            <FileNameContainer>
              <FileName>{file.name}</FileName>
              <FileType>
                {file.isDirectory ? 'Directory' : `${getFileType(file).charAt(0).toUpperCase() + getFileType(file).slice(1)} File`}
                {fileDetails?.mime && fileDetails.mime.includes('encrypted') && (
                  <SecurityBadge>
                    <FaShieldAlt /> Encrypted
                  </SecurityBadge>
                )}
              </FileType>
            </FileNameContainer>
          </HeaderContent>
          <CloseButton onClick={onClose}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>
        
        <PropertyTabs>
          <Tab 
            $active={activeTab === 'general'} 
            onClick={() => setActiveTab('general')}
          >
            <FaInfoCircle /> General
          </Tab>
          <Tab 
            $active={activeTab === 'timestamps'} 
            onClick={() => setActiveTab('timestamps')}
          >
            <FaCalendarAlt /> Timestamps
          </Tab>
          <Tab 
            $active={activeTab === 'permissions'} 
            onClick={() => setActiveTab('permissions')}
          >
            <FaLock /> Permissions
          </Tab>
          <Tab 
            $active={activeTab === 'checksums'} 
            onClick={() => setActiveTab('checksums')}
          >
            <FaKey /> Checksums
          </Tab>
        </PropertyTabs>
        
        <ModalBody>
          <TabContent $active={activeTab === 'general'}>
            <FilePath>
              <span>{file.path}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <CopyPathButton onClick={copyFilePath}>
                  {pathCopied ? <><FaCheck /> Copied</> : <><FaCopy /> Copy Path</>}
                </CopyPathButton>
                <OpenLocationButton onClick={openFileLocation}>
                  <FaExternalLinkAlt /> Open Location
                </OpenLocationButton>
              </div>
            </FilePath>
            
            {isLoading ? (
              <LoadingIndicator>
                <Spinner />
                <div>Loading file details...</div>
              </LoadingIndicator>
            ) : error ? (
              <ErrorMessage>
                <ErrorIcon><FaExclamationTriangle /></ErrorIcon>
                <div>
                  <strong>Error loading file details</strong>
                  <p style={{ margin: '5px 0 0 0' }}>{error}</p>
                </div>
              </ErrorMessage>
            ) : (
              <PropertySection>
                <SectionTitle>
                  <FaDatabase /> Basic Information
                </SectionTitle>
                <PropertyGrid>
                  <Property>
                    <PropertyLabel>Size</PropertyLabel>
                    <PropertyValue>
                      {formatSize(file.size)}
                      <CopyToClipboardButton 
                        onClick={() => copyToClipboard(formatSize(file.size), 'size')}
                        title="Copy to clipboard"
                      >
                        {copiedItem === 'size' ? <FaCheck /> : <FaCopy />}
                      </CopyToClipboardButton>
                      {copiedItem === 'size' && <CopiedIndicator>Copied!</CopiedIndicator>}
                    </PropertyValue>
                    <ProgressBar>
                      <ProgressFill $percentage={Math.min(100, file.size / 1024 / 1024)} />
                    </ProgressBar>
                  </Property>
                  
                  {fileDetails?.mime && (
                    <Property>
                      <PropertyLabel>MIME Type</PropertyLabel>
                      <PropertyValue>
                        <span style={{ color: mimeTypeIcon.color }}>{mimeTypeIcon.icon}</span>
                        {fileDetails.mime}
                        <CopyToClipboardButton 
                          onClick={() => copyToClipboard(fileDetails.mime, 'mime')}
                          title="Copy to clipboard"
                        >
                          {copiedItem === 'mime' ? <FaCheck /> : <FaCopy />}
                        </CopyToClipboardButton>
                        {copiedItem === 'mime' && <CopiedIndicator>Copied!</CopiedIndicator>}
                      </PropertyValue>
                    </Property>
                  )}
                  
                  <Property>
                    <PropertyLabel>File Type</PropertyLabel>
                    <PropertyValue>
                      <span style={{ color: fileIcon.color }}>{fileIcon.icon}</span>
                      {getFileType(file).charAt(0).toUpperCase() + getFileType(file).slice(1)}
                    </PropertyValue>
                  </Property>
                  
                  <Property>
                    <PropertyLabel>Location</PropertyLabel>
                    <PropertyValue>
                      {path.dirname(file.path)}
                    </PropertyValue>
                  </Property>
                </PropertyGrid>
              </PropertySection>
            )}
          </TabContent>
          
          <TabContent $active={activeTab === 'timestamps'}>
            {isLoading ? (
              <LoadingIndicator>
                <Spinner />
                <div>Loading timestamp details...</div>
              </LoadingIndicator>
            ) : error ? (
              <ErrorMessage>
                <ErrorIcon><FaExclamationTriangle /></ErrorIcon>
                <div>
                  <strong>Error loading timestamp details</strong>
                  <p style={{ margin: '5px 0 0 0' }}>{error}</p>
                </div>
              </ErrorMessage>
            ) : (
              <PropertySection>
                <SectionTitle>
                  <FaCalendarAlt /> File Timestamps
                </SectionTitle>
                <PropertyGrid>
                  <Property>
                    <PropertyLabel>Created</PropertyLabel>
                    <PropertyValue>
                      {formatDate(fileDetails?.birthtime || file.birthtime)}
                      <CopyToClipboardButton 
                        onClick={() => copyToClipboard(formatDate(fileDetails?.birthtime || file.birthtime), 'created')}
                        title="Copy to clipboard"
                      >
                        {copiedItem === 'created' ? <FaCheck /> : <FaCopy />}
                      </CopyToClipboardButton>
                      {copiedItem === 'created' && <CopiedIndicator>Copied!</CopiedIndicator>}
                    </PropertyValue>
                  </Property>
                  
                  <Property>
                    <PropertyLabel>Modified</PropertyLabel>
                    <PropertyValue>
                      {formatDate(fileDetails?.mtime || file.mtime)}
                      <CopyToClipboardButton 
                        onClick={() => copyToClipboard(formatDate(fileDetails?.mtime || file.mtime), 'modified')}
                        title="Copy to clipboard"
                      >
                        {copiedItem === 'modified' ? <FaCheck /> : <FaCopy />}
                      </CopyToClipboardButton>
                      {copiedItem === 'modified' && <CopiedIndicator>Copied!</CopiedIndicator>}
                    </PropertyValue>
                  </Property>
                  
                  <Property>
                    <PropertyLabel>Last Accessed</PropertyLabel>
                    <PropertyValue>
                      {formatDate(fileDetails?.atime)}
                      <CopyToClipboardButton 
                        onClick={() => copyToClipboard(formatDate(fileDetails?.atime), 'accessed')}
                        title="Copy to clipboard"
                      >
                        {copiedItem === 'accessed' ? <FaCheck /> : <FaCopy />}
                      </CopyToClipboardButton>
                      {copiedItem === 'accessed' && <CopiedIndicator>Copied!</CopiedIndicator>}
                    </PropertyValue>
                  </Property>
                  
                  <Property>
                    <PropertyLabel>Status Changed</PropertyLabel>
                    <PropertyValue>
                      {formatDate(fileDetails?.ctime)}
                      <CopyToClipboardButton 
                        onClick={() => copyToClipboard(formatDate(fileDetails?.ctime), 'changed')}
                        title="Copy to clipboard"
                      >
                        {copiedItem === 'changed' ? <FaCheck /> : <FaCopy />}
                      </CopyToClipboardButton>
                      {copiedItem === 'changed' && <CopiedIndicator>Copied!</CopiedIndicator>}
                    </PropertyValue>
                  </Property>
                </PropertyGrid>
              </PropertySection>
            )}
          </TabContent>
          
          <TabContent $active={activeTab === 'permissions'}>
            {isLoading ? (
              <LoadingIndicator>
                <Spinner />
                <div>Loading permission details...</div>
              </LoadingIndicator>
            ) : error ? (
              <ErrorMessage>
                <ErrorIcon><FaExclamationTriangle /></ErrorIcon>
                <div>
                  <strong>Error loading permission details</strong>
                  <p style={{ margin: '5px 0 0 0' }}>{error}</p>
                </div>
              </ErrorMessage>
            ) : (
              <PropertySection>
                <SectionTitle>
                  <FaLock /> File Permissions & Ownership
                </SectionTitle>
                <PropertyGrid>
                  {fileDetails?.mode && (
                    <Property>
                      <PropertyLabel>File Mode</PropertyLabel>
                      <PropertyValue>
                        {formatMode(fileDetails.mode)} ({fileDetails.mode.toString(8)})
                        <CopyToClipboardButton 
                          onClick={() => copyToClipboard(`${formatMode(fileDetails.mode)} (${fileDetails.mode.toString(8)})`, 'mode')}
                          title="Copy to clipboard"
                        >
                          {copiedItem === 'mode' ? <FaCheck /> : <FaCopy />}
                        </CopyToClipboardButton>
                        {copiedItem === 'mode' && <CopiedIndicator>Copied!</CopiedIndicator>}
                      </PropertyValue>
                    </Property>
                  )}
                  
                  {fileDetails?.owner && (
                    <Property>
                      <PropertyLabel>Owner</PropertyLabel>
                      <PropertyValue>
                        <FaUserAlt style={{ fontSize: '14px' }} /> {fileDetails.owner}
                        <CopyToClipboardButton 
                          onClick={() => copyToClipboard(fileDetails.owner, 'owner')}
                          title="Copy to clipboard"
                        >
                          {copiedItem === 'owner' ? <FaCheck /> : <FaCopy />}
                        </CopyToClipboardButton>
                        {copiedItem === 'owner' && <CopiedIndicator>Copied!</CopiedIndicator>}
                      </PropertyValue>
                    </Property>
                  )}
                  
                  {fileDetails?.group && (
                    <Property>
                      <PropertyLabel>Group</PropertyLabel>
                      <PropertyValue>
                        <FaUserAlt style={{ fontSize: '14px' }} /> {fileDetails.group}
                        <CopyToClipboardButton 
                          onClick={() => copyToClipboard(fileDetails.group, 'group')}
                          title="Copy to clipboard"
                        >
                          {copiedItem === 'group' ? <FaCheck /> : <FaCopy />}
                        </CopyToClipboardButton>
                        {copiedItem === 'group' && <CopiedIndicator>Copied!</CopiedIndicator>}
                      </PropertyValue>
                    </Property>
                  )}
                </PropertyGrid>
              </PropertySection>
            )}
          </TabContent>

          {/* Checksums Tab */}
          <TabContent $active={activeTab === 'checksums'}>
            {file && !file.isDirectory && (
              <PropertySection>
                <SectionTitle>
                  <FaKey /> File Checksums
                </SectionTitle>
                
                <HashContainer>
                  {['md5', 'sha1', 'sha256'].map(algorithm => (
                    <HashRow key={algorithm}>
                      <HashLabel>{algorithm.toUpperCase()}</HashLabel>
                      
                      <HashValue>
                        {hashCalculations[algorithm].value || 'Not calculated'}
                      </HashValue>
                      
                      <HashButton
                        onClick={() => calculateHash(algorithm)}
                        disabled={hashCalculations[algorithm].isCalculating}
                      >
                        {hashCalculations[algorithm].isCalculating ? (
                          <>
                            <Spinner /> Calculating...
                          </>
                        ) : (
                          <>
                            <FaCalculator /> Calculate
                          </>
                        )}
                      </HashButton>
                      
                      {hashCalculations[algorithm].value && hashCalculations[algorithm].value !== 'Error' && hashCalculations[algorithm].value !== 'Not calculated' && (
                        <HashButton
                          onClick={() => copyToClipboard(hashCalculations[algorithm].value, `${algorithm}_hash`)}
                          style={{ backgroundColor: '#2ecc71' }}
                        >
                          {copiedItem === `${algorithm}_hash` ? (
                            <>
                              <FaCheck /> Copied!
                            </>
                          ) : (
                            <>
                              <FaCopy /> Copy
                            </>
                          )}
                        </HashButton>
                      )}
                    </HashRow>
                  ))}
                </HashContainer>
                
                <div style={{ marginTop: '20px', backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '8px', border: '1px solid #eee' }}>
                  <strong>About Checksums:</strong><br />
                  • MD5: 128-bit hash (fast, suitable for file integrity)<br />
                  • SHA1: 160-bit hash (more secure than MD5)<br />
                  • SHA256: 256-bit hash (most secure, recommended for cryptographic purposes)
                </div>
              </PropertySection>
            )}
            
            {file && file.isDirectory && (
              <PropertySection>
                <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #eee' }}>
                  <div style={{ fontSize: '40px', color: '#7f8c8d', marginBottom: '10px' }}>
                    <FaFolder />
                  </div>
                  <p>Checksum calculation is not available for directories.</p>
                </div>
              </PropertySection>
            )}
          </TabContent>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
}

export default FilePropertiesModal;