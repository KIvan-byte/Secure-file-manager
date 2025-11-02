import React, { useState, useEffect } from 'react';
import { styled } from 'styled-components';
import { FaArchive, FaFileArchive, FaTimes, FaCheck, FaSpinner, FaInfoCircle, FaFolder } from 'react-icons/fa';
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

const CompressionForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const Label = styled.label`
  font-weight: 600;
  color: #34495e;
`;

const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border 0.3s ease;

  &:focus {
    border-color: #3498db;
    outline: none;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }

  &[disabled] {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border 0.3s ease;

  &:focus {
    border-color: #3498db;
    outline: none;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const FileInfo = styled.div`
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 200px;
  overflow-y: auto;
`;

const FileItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 4px;
  background-color: ${props => props.$isSelected ? '#ebf5fd' : 'transparent'};

  &:not(:last-child) {
    border-bottom: 1px solid #eaeaea;
  }
`;

const FileName = styled.div`
  word-break: break-all;
`;

const FilePath = styled.div`
  font-family: monospace;
  font-size: 12px;
  color: #7f8c8d;
  word-break: break-all;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  background-color: ${props => props.$primary ? '#3498db' : '#2c3e50'};
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${props => props.$primary ? '#2980b9' : '#1a252f'};
  }

  &:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
`;

const Message = styled.div`
  padding: 15px;
  margin-top: 15px;
  border-radius: 6px;
  background-color: ${props => {
    switch (props.$type) {
      case 'success': return '#d4edda';
      case 'error': return '#f8d7da';
      case 'info': return '#d1ecf1';
      default: return '#d1ecf1';
    }
  }};
  color: ${props => {
    switch (props.$type) {
      case 'success': return '#155724';
      case 'error': return '#721c24';
      case 'info': return '#0c5460';
      default: return '#0c5460';
    }
  }};
  display: flex;
  align-items: flex-start;
  gap: 10px;
`;

const MessageIcon = styled.div`
  margin-top: 2px;
`;

const Spinner = styled(FaSpinner)`
  animation: spin 1s linear infinite;

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const InfoBox = styled.div`
  padding: 15px;
  margin-top: 15px;
  border-radius: 6px;
  background-color: #f8f9fa;
  border-left: 4px solid #3498db;
  color: #34495e;
  font-size: 14px;
`;

const Radio = styled.div`
  display: flex;
  gap: 20px;
  margin-top: 5px;
`;

const RadioOption = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
`;

function FileCompressionModal({ isOpen, onClose, files = [], mode = 'compress', initialOutputPath = '' }) {
  const [format, setFormat] = useState('zip');
  const [outputPath, setOutputPath] = useState('');
  const [message, setMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sourcePaths, setSourcePaths] = useState([]);

  useEffect(() => {
    if (files.length > 0) {
      // Set source paths from the file selection
      setSourcePaths(files.map(file => file.path));

      // Generate a default output path
      if (mode === 'compress') {
        let defaultPath = '';

        if (files.length === 1) {
          // For a single file or directory, use its name as the archive name
          const file = files[0];
          const dirPath = file.isDirectory ? file.path : path.dirname(file.path);
          const baseName = path.basename(file.path);
          defaultPath = path.join(dirPath, `${baseName}.${format}`);
        } else {
          // For multiple files, use the parent directory name + "_archive"
          const commonDir = path.dirname(files[0].path);
          const dirName = path.basename(commonDir);
          defaultPath = path.join(commonDir, `${dirName}_archive.${format}`);
        }

        setOutputPath(defaultPath);
      } else {
        // For extraction mode, set the parent directory as default output
        const file = files[0];
        const dirPath = path.dirname(file.path);
        const baseName = path.basename(file.path, path.extname(file.path));
        const extractDir = path.join(dirPath, baseName);

        setOutputPath(extractDir);
      }
    } else if (initialOutputPath) {
      setOutputPath(initialOutputPath);
    }
  }, [files, mode, format, initialOutputPath]);

  const handleFormatChange = (e) => {
    const newFormat = e.target.value;
    setFormat(newFormat);

    // Update the output path extension if we're in compress mode
    if (mode === 'compress' && outputPath) {
      const dirPath = path.dirname(outputPath);
      const baseName = path.basename(outputPath, path.extname(outputPath));
      setOutputPath(path.join(dirPath, `${baseName}.${newFormat}`));
    }
  };

  const validateForm = () => {
    if (sourcePaths.length === 0) {
      setMessage({
        type: 'error',
        text: 'No files selected for operation'
      });
      return false;
    }

    if (!outputPath) {
      setMessage({
        type: 'error',
        text: 'Please specify an output path'
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsProcessing(true);
      setMessage(null);

      if (mode === 'compress') {
        // Compress files
        const result = await window.electron.fileManager.compressFiles({
          sourcePaths,
          outputPath,
          format,
          options: {
            compressionLevel: 9,
            gzip: format === 'tar' // Enable gzip for tar files
          }
        });

        if (result.success) {
          setMessage({
            type: 'success',
            text: `Files successfully compressed. Archive saved to ${result.outputPath}`
          });
        } else {
          setMessage({
            type: 'error',
            text: result.error || 'An error occurred during compression'
          });
        }
      } else {
        // Extract archive
        const archivePath = sourcePaths[0];

        const result = await window.electron.fileManager.extractArchive({
          archivePath,
          outputPath
        });

        if (result.success) {
          setMessage({
            type: 'success',
            text: `Archive successfully extracted to ${result.outputPath}`
          });
        } else {
          setMessage({
            type: 'error',
            text: result.error || 'An error occurred during extraction'
          });
        }
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'An error occurred'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const browseOutputLocation = async () => {
    try {
      const result = await window.electron.fileManager.browseDirectory();
      if (result.success) {
        let newPath = result.path;

        // If we're compressing, append a filename
        if (mode === 'compress') {
          const suggestedName = files.length === 1
            ? path.basename(files[0].path)
            : 'archive';

          newPath = path.join(newPath, `${suggestedName}.${format}`);
        }

        setOutputPath(newPath);
      }
    } catch (error) {
      console.error('Error browsing directory:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            {mode === 'compress' ? (
              <>
                <FaFileArchive /> Compress Files
              </>
            ) : (
              <>
                <FaArchive /> Extract Archive
              </>
            )}
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>
        <ModalBody>
          <CompressionForm>
            <FormGroup>
              <Label>{mode === 'compress' ? 'Files to Compress' : 'Archive to Extract'}</Label>
              <FileInfo>
                {files.map((file, index) => (
                  <FileItem key={index}>
                    {file.isDirectory ? <FaFolder color="#f39c12" /> : <FaFileArchive color="#3498db" />}
                    <div>
                      <FileName>{file.name}</FileName>
                      <FilePath>{file.path}</FilePath>
                    </div>
                  </FileItem>
                ))}
              </FileInfo>
            </FormGroup>

            {mode === 'compress' && (
              <FormGroup>
                <Label>Archive Format</Label>
                <Radio>
                  <RadioOption>
                    <input
                      type="radio"
                      name="format"
                      value="zip"
                      checked={format === 'zip'}
                      onChange={handleFormatChange}
                      id="format-zip"
                    />
                    <label htmlFor="format-zip">ZIP</label>
                  </RadioOption>
                  <RadioOption>
                    <input
                      type="radio"
                      name="format"
                      value="tar"
                      checked={format === 'tar'}
                      onChange={handleFormatChange}
                      id="format-tar"
                    />
                    <label htmlFor="format-tar">TAR.GZ</label>
                  </RadioOption>
                </Radio>
              </FormGroup>
            )}

            <FormGroup>
              <Label>{mode === 'compress' ? 'Output Archive Path' : 'Extract to Directory'}</Label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Input
                  type="text"
                  value={outputPath}
                  onChange={(e) => setOutputPath(e.target.value)}
                  disabled={isProcessing}
                />
                <ActionButton
                  onClick={browseOutputLocation}
                  disabled={isProcessing}
                >
                  Browse
                </ActionButton>
              </div>
            </FormGroup>

            <ButtonContainer>
              <ActionButton
                $primary
                onClick={handleSubmit}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Spinner /> Processing...
                  </>
                ) : mode === 'compress' ? (
                  <>
                    <FaFileArchive /> Compress Files
                  </>
                ) : (
                  <>
                    <FaArchive /> Extract Archive
                  </>
                )}
              </ActionButton>
              <ActionButton
                onClick={onClose}
                disabled={isProcessing}
              >
                <FaTimes /> Cancel
              </ActionButton>
            </ButtonContainer>
          </CompressionForm>

          {message && (
            <Message $type={message.type}>
              <MessageIcon>
                {message.type === 'success' ? <FaCheck /> :
                 message.type === 'error' ? <FaTimes /> :
                 <FaInfoCircle />}
              </MessageIcon>
              <div>{message.text}</div>
            </Message>
          )}

          <InfoBox>
            <strong><FaInfoCircle style={{ marginRight: '5px' }} /> Information</strong>
            <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
              {mode === 'compress' ? (
                <>
                  <li>Files will be compressed into a {format === 'zip' ? 'ZIP' : 'TAR.GZ'} archive</li>
                  <li>Directory structures will be preserved in the archive</li>
                  <li>Large files may take longer to compress</li>
                </>
              ) : (
                <>
                  <li>The archive will be extracted to the specified directory</li>
                  <li>If the directory doesn't exist, it will be created</li>
                  <li>Existing files may be overwritten</li>
                </>
              )}
            </ul>
          </InfoBox>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
}

export default FileCompressionModal;