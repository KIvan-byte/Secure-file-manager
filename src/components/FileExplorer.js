import React, { useState, useEffect } from 'react';
import { styled } from 'styled-components';
import { FaFolder, FaFile, FaArrowUp, FaShare, FaEye } from 'react-icons/fa';
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
  margin-bottom: 20px;
`;

const Title = styled.h2`
  margin: 0;
`;

const ActionBar = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
`;

const CurrentPath = styled.div`
  background-color: #f0f0f0;
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 20px;
  font-family: monospace;
`;

const FileList = styled.div`
  flex: 1;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: auto;
`;

const FileItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;

  &:hover {
    background-color: #f9f9f9;
  }
`;

const FileIcon = styled.div`
  margin-right: 12px;
  color: ${props => props.$isDirectory ? '#f39c12' : '#3498db'};
`;

const FileName = styled.div`
  flex: 1;
`;

const FileActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  padding: 4px 8px;
  background-color: ${props => props.$color || '#2c3e50'};
  
  &:hover {
    background-color: ${props => props.$hoverColor || '#1a252f'};
  }
`;

const FilePreview = styled.div`
  margin-top: 20px;
  background-color: white;
  border-radius: 4px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  white-space: pre-wrap;
  overflow: auto;
  max-height: 300px;
`;

function FileExplorer() {
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (currentPath) {
      loadDirectory(currentPath);
    }
  }, [currentPath]);

  const browseDirectory = async () => {
    try {
      const result = await window.electron.fileManager.browseDirectory();
      if (result.success) {
        setCurrentPath(result.path);
      }
    } catch (error) {
      console.error('Error browsing directory:', error);
    }
  };

  const loadDirectory = async (directoryPath) => {
    try {
      const result = await window.electron.fileManager.readDirectory(directoryPath);
      if (result.success) {
        setFiles(result.items);
        setSelectedFile(null);
        setFileContent('');
      } else {
        console.error('Error reading directory:', result.error);
      }
    } catch (error) {
      console.error('Error reading directory:', error);
    }
  };

  const handleFileClick = async (file) => {
    if (file.isDirectory) {
      setCurrentPath(file.path);
    } else {
      setSelectedFile(file);
      try {
        const result = await window.electron.fileManager.readFile(file.path);
        if (result.success) {
          setFileContent(result.content);
        } else {
          console.error('Error reading file:', result.error);
          setFileContent('Error reading file: ' + result.error);
        }
      } catch (error) {
        console.error('Error reading file:', error);
        setFileContent('Error reading file: ' + error.message);
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

  return (
    <Container>
      <Header>
        <Title>File Explorer</Title>
      </Header>

      <ActionBar>
        <button onClick={browseDirectory}>Browse Directory</button>
        {currentPath && <button onClick={navigateUp}><FaArrowUp /> Up</button>}
      </ActionBar>

      {currentPath && <CurrentPath>{currentPath}</CurrentPath>}

      {currentPath ? (
        <FileList>
          {files.map((file, index) => (
            <FileItem key={index} onClick={() => handleFileClick(file)}>
              <FileIcon $isDirectory={file.isDirectory}>
                {file.isDirectory ? <FaFolder /> : <FaFile />}
              </FileIcon>
              <FileName>{file.name}</FileName>
              <div>{formatSize(file.size)}</div>
              <div style={{ marginLeft: '10px' }}>{formatDate(file.mtime)}</div>
              {!file.isDirectory && (
                <FileActions onClick={(e) => e.stopPropagation()}>
                  <ActionButton 
                    $color="#3498db" 
                    $hoverColor="#2980b9"
                    onClick={() => handleFileClick(file)}
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
                  >
                    <FaShare />
                  </ActionButton>
                </FileActions>
              )}
            </FileItem>
          ))}
        </FileList>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          Select a directory to start browsing files
        </div>
      )}

      {selectedFile && fileContent && (
        <FilePreview>
          <h3>{selectedFile.name}</h3>
          <div>{fileContent}</div>
        </FilePreview>
      )}
    </Container>
  );
}

export default FileExplorer;