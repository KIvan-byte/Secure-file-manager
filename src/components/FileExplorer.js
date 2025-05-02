import React, { useState, useEffect } from 'react';
import { styled } from 'styled-components';
import { FaFolder, FaFile, FaArrowUp, FaShare, FaEye, FaSearch, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import path from 'path-browserify';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h2`
  margin: 0;
  font-weight: 600;
  color: #2c3e50;
`;

const ActionBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
  
  @media (max-width: 576px) {
    flex-direction: column;
  }
`;

const CurrentPath = styled.div`
  background-color: white;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-family: monospace;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border-left: 4px solid #3498db;
  word-break: break-all;
`;

const FileList = styled.div`
  flex: 1;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: auto;
`;

const FileListHeader = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #eaeaea;
  font-weight: 600;
  color: #34495e;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const FileListHeaderItem = styled.div`
  padding: 0 8px;
`;

const FileItem = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f9f9f9;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: auto 1fr auto;
  }
  
  @media (max-width: 576px) {
    grid-template-columns: auto 1fr;
    grid-row-gap: 4px;
  }
`;

const FileIcon = styled.div`
  margin-right: 12px;
  color: ${props => props.$isDirectory ? '#f39c12' : '#3498db'};
  display: flex;
  align-items: center;
  font-size: 18px;
`;

const FileInfo = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0; /* Allows for proper text truncation */
`;

const FileName = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
`;

const FileDetails = styled.div`
  display: flex;
  gap: 16px;
  color: #7f8c8d;
  font-size: 12px;
  margin-top: 4px;
`;

const FileSize = styled.div`
`;

const FileDate = styled.div`
  white-space: nowrap;
`;

const FileActions = styled.div`
  display: flex;
  gap: 8px;
  opacity: 0.7;
  margin-left: auto;
  
  ${FileItem}:hover & {
    opacity: 1;
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background-color: ${props => props.$color || '#2c3e50'};
  color: white;
  border: none;
  border-radius: 4px;
  transition: background-color 0.2s ease, transform 0.1s ease;
  
  &:hover {
    background-color: ${props => props.$hoverColor || '#1a252f'};
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: ${props => props.$primary ? '#3498db' : '#2c3e50'};
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
  
  &:hover {
    background-color: ${props => props.$primary ? '#2980b9' : '#1a252f'};
  }
  
  &:active {
    transform: translateY(1px);
  }
`;

const InfoMessage = styled.div`
  background-color: ${props => props.$type === 'error' ? '#fdeded' : '#f0f7ff'};
  color: ${props => props.$type === 'error' ? '#ef5350' : '#3498db'};
  border-left: 4px solid ${props => props.$type === 'error' ? '#ef5350' : '#3498db'};
  padding: 16px;
  border-radius: 0 8px 8px 0;
  margin-bottom: 20px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const MessageIcon = styled.div`
  margin-top: 2px;
`;

const SearchContainer = styled.div`
  position: relative;
  margin-left: auto;
`;

const SearchInput = styled.input`
  padding: 10px 16px 10px 40px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border 0.3s ease;
  width: 200px;
  
  &:focus {
    border-color: #3498db;
    outline: none;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
    width: 300px;
  }
  
  @media (max-width: 768px) {
    width: 140px;
    &:focus {
      width: 180px;
    }
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #7f8c8d;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: #7f8c8d;
  text-align: center;
`;

const IconContainer = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const FilePreview = styled.div`
  margin-top: 20px;
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  white-space: pre-wrap;
  overflow: auto;
  max-height: 400px;
`;

const PreviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
`;

const PreviewTitle = styled.h3`
  margin: 0;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PreviewContent = styled.div`
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
`;

const LoadingIndicator = styled.div`
  padding: 20px;
  text-align: center;
  color: #7f8c8d;
`;

const Breadcrumbs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
`;

const BreadcrumbItem = styled.span`
  cursor: pointer;
  color: ${props => props.$active ? '#34495e' : '#3498db'};
  font-weight: ${props => props.$active ? '600' : '400'};
  
  &:hover {
    text-decoration: ${props => props.$active ? 'none' : 'underline'};
  }
  
  &:after {
    content: ${props => props.$active ? 'none' : '"/"'};
    margin-left: 8px;
    color: #95a5a6;
    font-weight: 400;
  }
`;

function FileExplorer() {
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentPath) {
      loadDirectory(currentPath);
    }
  }, [currentPath]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = files.filter(file => 
        file.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFiles(filtered);
    } else {
      setFilteredFiles(files);
    }
  }, [searchTerm, files]);

  const browseDirectory = async () => {
    try {
      setIsLoading(true);
      const result = await window.electron.fileManager.browseDirectory();
      if (result.success) {
        setCurrentPath(result.path);
        setError(null);
      }
    } catch (error) {
      setError(`Error browsing directory: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDirectory = async (directoryPath) => {
    try {
      setIsLoading(true);
      setSelectedFile(null);
      setFileContent('');
      
      const result = await window.electron.fileManager.readDirectory(directoryPath);
      if (result.success) {
        setFiles(result.items);
        setFilteredFiles(result.items);
        setError(null);
      } else {
        setError(`Error reading directory: ${result.error}`);
      }
    } catch (error) {
      setError(`Error reading directory: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileClick = async (file) => {
    if (file.isDirectory) {
      setCurrentPath(file.path);
    } else {
      try {
        setIsLoading(true);
        setSelectedFile(file);
        
        const result = await window.electron.fileManager.readFile(file.path);
        if (result.success) {
          setFileContent(result.content);
          setError(null);
        } else {
          setError(`Error reading file: ${result.error}`);
          setFileContent('');
        }
      } catch (error) {
        setError(`Error reading file: ${error.message}`);
        setFileContent('');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const navigateUp = () => {
    if (currentPath) {
      const parentPath = path.dirname(currentPath);
      if (parentPath !== currentPath) {
        setCurrentPath(parentPath);
      }
    }
  };

  const handleShareFile = (file) => {
    navigate('/share', { state: { filePath: file.path, fileName: file.name } });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

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
  
  const closePreview = () => {
    setSelectedFile(null);
    setFileContent('');
  };
  
  const getPathParts = (pathString) => {
    if (!pathString) return [];
    
    const parts = pathString.split(path.sep).filter(Boolean);
    
    // Handle Windows drive letter
    if (pathString.match(/^[A-Z]:\\/i)) {
      parts[0] = pathString.substring(0, 3); // e.g., "C:\"
    }
    
    // For Unix-like systems, add root
    if (pathString.startsWith('/')) {
      parts.unshift('/');
    }
    
    return parts;
  };
  
  const navigateToBreadcrumb = (index) => {
    const parts = getPathParts(currentPath);
    const newPath = parts.slice(0, index + 1).join(path.sep);
    
    // Handle special cases for Windows and Unix
    if (parts[0] === '/' && index === 0) {
      setCurrentPath('/');
    } else if (parts[0].match(/^[A-Z]:\\/i) && index === 0) {
      setCurrentPath(parts[0]);
    } else {
      setCurrentPath(newPath);
    }
  };
  
  const buildBreadcrumbs = () => {
    const parts = getPathParts(currentPath);
    
    return (
      <Breadcrumbs>
        {parts.map((part, index) => (
          <BreadcrumbItem 
            key={index}
            onClick={() => navigateToBreadcrumb(index)}
            $active={index === parts.length - 1}
          >
            {part}
          </BreadcrumbItem>
        ))}
      </Breadcrumbs>
    );
  };

  return (
    <Container>
      <Header>
        <Title>File Explorer</Title>
        <SearchContainer>
          <SearchIcon><FaSearch /></SearchIcon>
          <SearchInput 
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchContainer>
      </Header>

      <ActionBar>
        <Button $primary onClick={browseDirectory}>
          <FaFolder /> Browse Directory
        </Button>
        {currentPath && (
          <Button onClick={navigateUp}>
            <FaArrowUp /> Up
          </Button>
        )}
      </ActionBar>

      {error && (
        <InfoMessage $type="error">
          <MessageIcon><FaExclamationTriangle /></MessageIcon>
          <div>{error}</div>
        </InfoMessage>
      )}

      {currentPath ? (
        <>
          {buildBreadcrumbs()}
          <FileList>
            <FileListHeader>
              <FileListHeaderItem>Type</FileListHeaderItem>
              <FileListHeaderItem>Name</FileListHeaderItem>
              <FileListHeaderItem>Size</FileListHeaderItem>
              <FileListHeaderItem>Modified</FileListHeaderItem>
            </FileListHeader>
            
            {isLoading ? (
              <LoadingIndicator>Loading files...</LoadingIndicator>
            ) : filteredFiles.length > 0 ? (
              filteredFiles.map((file, index) => (
                <FileItem key={index} onClick={() => handleFileClick(file)}>
                  <FileIcon $isDirectory={file.isDirectory}>
                    {file.isDirectory ? <FaFolder /> : <FaFile />}
                  </FileIcon>
                  <FileInfo>
                    <FileName>{file.name}</FileName>
                    <FileDetails>
                      <FileSize>{formatSize(file.size)}</FileSize>
                      <FileDate>{formatDate(file.mtime)}</FileDate>
                    </FileDetails>
                  </FileInfo>
                  {!file.isDirectory && (
                    <FileActions onClick={(e) => e.stopPropagation()}>
                      <ActionButton 
                        $color="#3498db" 
                        $hoverColor="#2980b9"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFileClick(file);
                        }}
                        title="View file"
                      >
                        <FaEye />
                      </ActionButton>
                      <ActionButton 
                        $color="#e74c3c" 
                        $hoverColor="#c0392b"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareFile(file);
                        }}
                        title="Share file"
                      >
                        <FaShare />
                      </ActionButton>
                    </FileActions>
                  )}
                </FileItem>
              ))
            ) : (
              <EmptyState>
                <IconContainer>
                  <FaFolder />
                </IconContainer>
                <p>This directory is empty{searchTerm ? ' or no files match your search' : ''}</p>
              </EmptyState>
            )}
          </FileList>
        </>
      ) : (
        <EmptyState>
          <IconContainer>
            <FaFolder />
          </IconContainer>
          <p>Select a directory to start browsing files</p>
          <Button $primary onClick={browseDirectory} style={{ marginTop: '16px' }}>
            <FaFolder /> Browse Directory
          </Button>
        </EmptyState>
      )}

      {selectedFile && fileContent && (
        <FilePreview>
          <PreviewHeader>
            <PreviewTitle>
              <FaFile /> {selectedFile.name}
            </PreviewTitle>
            <Button onClick={closePreview}>Close Preview</Button>
          </PreviewHeader>
          <PreviewContent>{fileContent}</PreviewContent>
        </FilePreview>
      )}
    </Container>
  );
}

export default FileExplorer;