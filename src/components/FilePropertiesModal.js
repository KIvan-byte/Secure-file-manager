import React, { useState, useEffect } from 'react';
import { styled } from 'styled-components';
import { FaInfoCircle, FaTimes, FaCalendarAlt, FaUserAlt, FaLock, FaTag, FaDatabase, FaFileImage, FaFileVideo, FaFileAudio, FaFileAlt, FaFilePdf, FaCode, FaFileArchive, FaFile } from 'react-icons/fa';
import path from 'path-browserify';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #eaeaea;
`;

const ModalTitle = styled.h3`
  margin: 0;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #7f8c8d;
  padding: 5px;
  
  &:hover {
    color: #34495e;
  }
`;

const ModalBody = styled.div`
  padding: 20px;
`;

const PropertySection = styled.div`
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h4`
  margin: 0 0 15px 0;
  color: #34495e;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
`;

const PropertyGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 12px;
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const Property = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const PropertyLabel = styled.div`
  color: #7f8c8d;
  font-size: 13px;
`;

const PropertyValue = styled.div`
  color: #2c3e50;
  font-weight: 500;
  word-break: break-all;
`;

const FilePath = styled.div`
  font-family: monospace;
  font-size: 13px;
  background-color: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  margin: 15px 0;
  word-break: break-all;
`;

const LoadingIndicator = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #7f8c8d;
`;

const FileIconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64px;
  width: 64px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-right: 15px;
  font-size: 32px;
  color: ${props => props.$color || '#3498db'};
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
`;

const FileType = styled.div`
  color: #7f8c8d;
  font-size: 13px;
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
  const date = new Date(dateString);
  return date.toLocaleString();
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
      return { icon: <FaFileImage />, color: '#3498db' };
    case 'video':
      return { icon: <FaFileVideo />, color: '#e74c3c' };
    case 'audio':
      return { icon: <FaFileAudio />, color: '#9b59b6' };
    case 'document':
      return { icon: <FaFileAlt />, color: '#2ecc71' };
    case 'pdf':
      return { icon: <FaFilePdf />, color: '#e67e22' };
    case 'code':
      return { icon: <FaCode />, color: '#f1c40f' };
    case 'archive':
      return { icon: <FaFileArchive />, color: '#f39c12' };
    default:
      return { icon: <FaFile />, color: '#7f8c8d' };
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

function FilePropertiesModal({ isOpen, onClose, file }) {
  const [fileDetails, setFileDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (isOpen && file) {
      fetchFileDetails();
    }
  }, [isOpen, file]);
  
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
  
  if (!isOpen || !file) return null;
  
  const fileIcon = getFileIcon(file);
  
  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <HeaderContent>
            <FileIconContainer $color={fileIcon.color}>
              {fileIcon.icon}
            </FileIconContainer>
            <FileNameContainer>
              <FileName>{file.name}</FileName>
              <FileType>{file.isDirectory ? 'Directory' : `${getFileType(file).toUpperCase()} File`}</FileType>
            </FileNameContainer>
          </HeaderContent>
          <CloseButton onClick={onClose}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>
        
        <ModalBody>
          <FilePath>{file.path}</FilePath>
          
          {isLoading ? (
            <LoadingIndicator>
              <div>Loading file details...</div>
            </LoadingIndicator>
          ) : error ? (
            <div style={{ color: '#e74c3c', marginTop: '10px' }}>
              Error: {error}
            </div>
          ) : (
            <>
              <PropertySection>
                <SectionTitle>
                  <FaDatabase /> Basic Information
                </SectionTitle>
                <PropertyGrid>
                  <Property>
                    <PropertyLabel>Size</PropertyLabel>
                    <PropertyValue>{formatSize(file.size)}</PropertyValue>
                  </Property>
                  
                  {fileDetails?.mime && (
                    <Property>
                      <PropertyLabel>MIME Type</PropertyLabel>
                      <PropertyValue>{fileDetails.mime}</PropertyValue>
                    </Property>
                  )}
                </PropertyGrid>
              </PropertySection>
              
              <PropertySection>
                <SectionTitle>
                  <FaCalendarAlt /> Timestamps
                </SectionTitle>
                <PropertyGrid>
                  <Property>
                    <PropertyLabel>Created</PropertyLabel>
                    <PropertyValue>{formatDate(fileDetails?.birthtime || file.birthtime)}</PropertyValue>
                  </Property>
                  
                  <Property>
                    <PropertyLabel>Modified</PropertyLabel>
                    <PropertyValue>{formatDate(fileDetails?.mtime || file.mtime)}</PropertyValue>
                  </Property>
                  
                  <Property>
                    <PropertyLabel>Last Accessed</PropertyLabel>
                    <PropertyValue>{formatDate(fileDetails?.atime)}</PropertyValue>
                  </Property>
                  
                  <Property>
                    <PropertyLabel>Status Changed</PropertyLabel>
                    <PropertyValue>{formatDate(fileDetails?.ctime)}</PropertyValue>
                  </Property>
                </PropertyGrid>
              </PropertySection>
              
              <PropertySection>
                <SectionTitle>
                  <FaLock /> Permissions
                </SectionTitle>
                <PropertyGrid>
                  {fileDetails?.mode && (
                    <Property>
                      <PropertyLabel>File Mode</PropertyLabel>
                      <PropertyValue>{formatMode(fileDetails.mode)} ({fileDetails.mode.toString(8)})</PropertyValue>
                    </Property>
                  )}
                  
                  {fileDetails?.owner && (
                    <Property>
                      <PropertyLabel>Owner</PropertyLabel>
                      <PropertyValue>{fileDetails.owner}</PropertyValue>
                    </Property>
                  )}
                  
                  {fileDetails?.group && (
                    <Property>
                      <PropertyLabel>Group</PropertyLabel>
                      <PropertyValue>{fileDetails.group}</PropertyValue>
                    </Property>
                  )}
                </PropertyGrid>
              </PropertySection>
            </>
          )}
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
}

export default FilePropertiesModal;