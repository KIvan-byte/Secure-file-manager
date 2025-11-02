import React, { useState, useEffect } from 'react';
import { styled } from 'styled-components';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaClipboard, FaCheck, FaQrcode, FaFolder, FaFile, FaShare, FaLink, FaTimes, FaUpload } from 'react-icons/fa';
import QRCode from 'qrcode.react';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 100%;
  padding: 0 16px;

  @media (max-width: 768px) {
    padding: 0 12px;
  }

  @media (max-width: 480px) {
    padding: 0 8px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    margin-bottom: 16px;
  }
`;

const Title = styled.h2`
  margin: 0;
  font-weight: 600;
  color: #2c3e50;

  @media (max-width: 768px) {
    font-size: 1.5rem;
    text-align: center;
  }

  @media (max-width: 480px) {
    font-size: 1.25rem;
  }
`;

const Card = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 24px;
  margin-bottom: 24px;
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    padding: 16px;
    margin-bottom: 16px;
    border-radius: 6px;
  }

  @media (max-width: 480px) {
    padding: 12px;
    margin-bottom: 12px;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;

  @media (max-width: 768px) {
    margin-bottom: 16px;
  }

  @media (max-width: 480px) {
    margin-bottom: 12px;
  }
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #34495e;
`;

const FileInput = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;

  @media (max-width: 576px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  flex: 1;
  transition: border 0.3s ease;

  &:focus {
    border-color: #3498db;
    outline: none;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }

  @media (max-width: 768px) {
    padding: 8px 10px;
    font-size: 13px;
  }

  @media (max-width: 480px) {
    padding: 8px;
    font-size: 12px;
  }
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 10px;

  @media (max-width: 576px) {
    width: 100%;
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

  @media (max-width: 576px) {
    flex: 1;
    padding: 12px 16px;
  }
`;

const ShareLinkContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 24px;
  background-color: #f8f9fa;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #eaeaea;
`;

const ShareLinkHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #eaeaea;
  padding: 10px 16px;
`;

const ShareLinkTitle = styled.div`
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #34495e;
`;

const ShareLinkContent = styled.div`
  padding: 16px;
`;

const ShareLink = styled.div`
  font-family: monospace;
  word-break: break-all;
  background-color: white;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #eaeaea;
  margin-bottom: 12px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  background-color: ${props => props.$color || '#3498db'};
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${props => props.$hoverColor || '#2980b9'};
  }
`;

const InfoText = styled.div`
  margin-top: 20px;
  padding: 16px;
  background-color: #f8f9fa;
  border-left: 4px solid #3498db;
  color: #34495e;
  border-radius: 0 4px 4px 0;
`;

const QRCodeContainer = styled.div`
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const QRCodeFrame = styled.div`
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 24px;
  border-bottom: 1px solid #ddd;
`;

const Tab = styled.div`
  padding: 12px 20px;
  cursor: pointer;
  border-bottom: 3px solid ${props => props.$active ? '#3498db' : 'transparent'};
  color: ${props => props.$active ? '#3498db' : '#7f8c8d'};
  font-weight: ${props => props.$active ? '600' : '400'};
  transition: all 0.3s ease;

  &:hover {
    color: #3498db;
  }
`;

const FileExplorer = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin-bottom: 24px;
`;

const FileHeader = styled.div`
  background-color: #f8f9fa;
  padding: 12px 16px;
  font-weight: 600;
  color: #34495e;
  border-bottom: 1px solid #eaeaea;
`;

const FileItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f9f9f9;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const FileIcon = styled.div`
  margin-right: 12px;
  color: ${props => props.$isDirectory ? '#f39c12' : '#3498db'};
  display: flex;
  align-items: center;
`;

const FileName = styled.div`
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FileActions = styled.div`
  display: flex;
  gap: 8px;
`;

const FileSize = styled.div`
  color: #7f8c8d;
  font-size: 14px;
  margin-right: 16px;
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

const Alert = styled.div`
  padding: 12px 16px;
  margin-bottom: 20px;
  border-radius: 6px;
  background-color: ${props => props.$type === 'error' ? '#fdeded' : '#edf7ed'};
  color: ${props => props.$type === 'error' ? '#ef5350' : '#4caf50'};
  border-left: 4px solid ${props => props.$type === 'error' ? '#ef5350' : '#4caf50'};
  display: flex;
  align-items: center;
  gap: 12px;
`;

const AlertIcon = styled.div`
  font-size: 20px;
`;

const AlertContent = styled.div`
  flex: 1;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: currentColor;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  display: flex;
  align-items: center;
`;

const DropZone = styled.div`
  border: 2px dashed ${props => props.$isDragOver ? '#3498db' : '#ddd'};
  border-radius: 8px;
  padding: 30px 20px;
  text-align: center;
  transition: all 0.3s ease;
  background-color: ${props => props.$isDragOver ? 'rgba(52, 152, 219, 0.1)' : '#f9f9f9'};
  margin-bottom: 16px;
  cursor: pointer;

  &:hover {
    border-color: #3498db;
    background-color: rgba(52, 152, 219, 0.05);
  }
`;

const DropZoneIcon = styled.div`
  font-size: 36px;
  color: ${props => props.$isDragOver ? '#3498db' : '#95a5a6'};
  margin-bottom: 12px;
  transition: all 0.3s ease;
`;

const DropZoneText = styled.div`
  font-size: 16px;
  color: ${props => props.$isDragOver ? '#3498db' : '#7f8c8d'};
  margin-bottom: 8px;
  transition: all 0.3s ease;
`;

const DropZoneSubtext = styled.div`
  font-size: 14px;
  color: #95a5a6;
`;

function FileSharing() {
  const location = useLocation();
  const navigate = useNavigate();
  const [filePath, setFilePath] = useState(location.state?.filePath || '');
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [currentTab, setCurrentTab] = useState('select');
  const [currentDirectory, setCurrentDirectory] = useState('');
  const [files, setFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [daysValid, setDaysValid] = useState('');
  // State for encrypted file decryption option
  const [allowDecryption, setAllowDecryption] = useState(false);

  useEffect(() => {
    if (location.state?.filePath) {
      setFilePath(location.state.filePath);
    }
  }, [location.state]);

  useEffect(() => {
    if (currentDirectory) {
      loadDirectory(currentDirectory);
    }
  }, [currentDirectory]);

  const loadDirectory = async (directoryPath) => {
    try {
      const result = await window.electron.fileManager.readDirectory(directoryPath);
      if (result.success) {
        setFiles(result.items);
      } else {
        showAlert('error', `Error reading directory: ${result.error}`);
      }
    } catch (error) {
      showAlert('error', `Error reading directory: ${error.message}`);
    }
  };

  const browseDirectory = async () => {
    try {
      const result = await window.electron.fileManager.browseDirectory();
      if (result.success) {
        setCurrentDirectory(result.path);
        setCurrentTab('browse');
      }
    } catch (error) {
      showAlert('error', `Error browsing directory: ${error.message}`);
    }
  };

  const selectFile = async () => {
    try {
      const result = await window.electron.fileManager.selectFile();
      if (result.success) {
        setFilePath(result.path);
        setCurrentTab('select');
      }
    } catch (error) {
      showAlert('error', `Error selecting file: ${error.message}`);
    }
  };

  const handleFileSelect = (file) => {
    if (!file.isDirectory) {
      setFilePath(file.path);
      setCurrentTab('select');
    } else {
      setCurrentDirectory(file.path);
    }
  };

  const shareFile = async () => {
    if (!filePath) {
      showAlert('error', 'Please select a file to share');
      return;
    }

    try {
      const shareParams = {
        filePath,
        daysValid: daysValid ? parseInt(daysValid, 10) : null
      };

      // Add decryption option for encrypted files (no password needed here)
      const isEncrypted = filePath.endsWith('.enc');
      if (isEncrypted && allowDecryption) {
        shareParams.allowDecryption = true;
      }

      const result = await window.electron.fileManager.shareFile(shareParams);
      if (result.success) {
        setShareLink(result.shareLink);
        showAlert('success', 'Share link generated successfully!');
      } else {
        showAlert('error', `Error sharing file: ${result.error}`);
      }
    } catch (error) {
      showAlert('error', `Error sharing file: ${error.message}`);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleQRCode = () => {
    setShowQRCode(!showQRCode);
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    if (type === 'success') {
      setTimeout(() => setAlert(null), 5000);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);

    if (files.length === 0) {
      return;
    }

    const file = files[0];

    if (file.path) {
      setFilePath(file.path);
    } else {
      try {
        const result = await window.electron.fileManager.saveExternalFile({
          name: file.name,
          type: file.type,
          data: await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(file);
          })
        });

        if (result.success) {
          setFilePath(result.path);
          showAlert('success', 'File uploaded successfully');
        } else {
          showAlert('error', `Error saving file: ${result.error}`);
        }
      } catch (error) {
        showAlert('error', `Error processing file: ${error.message}`);
      }
    }
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
        <Title>Secure File Sharing</Title>
      </Header>

      <TabContainer>
        <Tab
          $active={currentTab === 'select'}
          onClick={() => setCurrentTab('select')}
        >
          Select File
        </Tab>
        <Tab
          $active={currentTab === 'browse'}
          onClick={() => setCurrentTab('browse')}
        >
          Browse Files
        </Tab>
      </TabContainer>

      {alert && (
        <Alert $type={alert.type}>
          <AlertIcon>
            {alert.type === 'error' ? '⚠️' : '✅'}
          </AlertIcon>
          <AlertContent>{alert.message}</AlertContent>
          <CloseButton onClick={() => setAlert(null)}>
            <FaTimes />
          </CloseButton>
        </Alert>
      )}

      {currentTab === 'select' ? (
        <Card>
          <DropZone
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={selectFile}
            $isDragOver={isDragOver}
          >
            <DropZoneIcon $isDragOver={isDragOver}>
              {isDragOver ? <FaFile /> : <FaUpload />}
            </DropZoneIcon>
            <DropZoneText $isDragOver={isDragOver}>
              {isDragOver ? 'Drop file here' : 'Drag & Drop your file here'}
            </DropZoneText>
            <DropZoneSubtext>
              or click to select from your computer
            </DropZoneSubtext>
          </DropZone>

          <FormGroup>
            <Label>File to share</Label>
            <FileInput>
              <Input
                type="text"
                value={filePath}
                onChange={e => setFilePath(e.target.value)}
                placeholder="Select or browse for a file"
                readOnly
              />
              <ButtonsContainer>
                <Button onClick={selectFile}>
                  <FaFile /> Select File
                </Button>
                <Button onClick={browseDirectory}>
                  <FaFolder /> Browse
                </Button>
              </ButtonsContainer>
            </FileInput>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="daysValidInput">Link valid for (days):</Label>
            <Input
              id="daysValidInput"
              type="number"
              value={daysValid}
              onChange={e => setDaysValid(e.target.value)}
              placeholder="Enter number of days (optional, leave blank for one-time link)"
              min="1"
            />
          </FormGroup>

          {/* Show decryption options only for encrypted files */}
          {filePath.endsWith('.enc') && (
            <FormGroup>
              <CheckboxContainer>
                <Checkbox
                  id="allowDecryption"
                  type="checkbox"
                  checked={allowDecryption}
                  onChange={e => setAllowDecryption(e.target.checked)}
                />
                <Label htmlFor="allowDecryption">Allow recipients to decrypt and download the original file</Label>
              </CheckboxContainer>
              <small style={{ color: '#6c757d', marginTop: '8px', display: 'block' }}>
                Recipients will enter the original encryption password on the download page to get the decrypted file.
              </small>
            </FormGroup>
          )}

          <FormGroup>
            <Button $primary onClick={shareFile}>
              <FaShare /> Generate Secure Share Link
            </Button>
          </FormGroup>

          {shareLink && (
            <>
              <ShareLinkContainer>
                <ShareLinkHeader>
                  <ShareLinkTitle>
                    <FaLink /> Share Link {daysValid && parseInt(daysValid, 10) > 0 ? `(Expires in ${daysValid} days)` : '(One-time Use)'}
                  </ShareLinkTitle>
                </ShareLinkHeader>
                <ShareLinkContent>
                  <ShareLink>{shareLink}</ShareLink>
                  <ButtonGroup>
                    <ActionButton onClick={() => copyToClipboard(shareLink)}>
                      {copied ? <><FaCheck /> Copied!</> : <><FaClipboard /> Copy Link</>}
                    </ActionButton>
                    <ActionButton
                      $color={showQRCode ? '#e74c3c' : '#3498db'}
                      $hoverColor={showQRCode ? '#c0392b' : '#2980b9'}
                      onClick={toggleQRCode}
                    >
                      <FaQrcode /> {showQRCode ? 'Hide QR Code' : 'Show QR Code'}
                    </ActionButton>
                  </ButtonGroup>
                </ShareLinkContent>
              </ShareLinkContainer>

              {showQRCode && (
                <QRCodeContainer>
                  <h3>Scan QR Code to Download</h3>
                  <QRCodeFrame>
                    <QRCode value={shareLink} size={250} renderAs="svg" includeMargin={true} />
                  </QRCodeFrame>
                </QRCodeContainer>
              )}

              <InfoText>
                <h4>Security Information</h4>
                <ul>
                  {daysValid && parseInt(daysValid, 10) > 0 ? (
                    <li>This link will expire after <strong>{daysValid} days</strong>. It can be accessed multiple times until this expiration date.</li>
                  ) : (
                    <li>This link can only be used <strong>once</strong>. After someone downloads the file, the link will expire.</li>
                  )}
                  <li>Anyone with this link can download the file - share it only with trusted recipients.</li>
                  <li>The link includes an encryption key that helps protect the file during transfer.</li>
                  {filePath.endsWith('.enc') && allowDecryption && (
                    <li><strong>Decryption enabled:</strong> Recipients will be prompted to enter the original encryption password to download the decrypted file.</li>
                  )}
                  {filePath.endsWith('.enc') && !allowDecryption && (
                    <li><strong>Encrypted file:</strong> Recipients will download the encrypted file (.enc) and will need to decrypt it manually using the application.</li>
                  )}
                  <li>This application must remain running for the link to work, as the file is served directly from your computer.</li>
                </ul>
              </InfoText>
            </>
          )}
        </Card>
      ) : (
        <>
          {currentDirectory ? (
            <FileExplorer>
              <FileHeader>
                {currentDirectory}
              </FileHeader>
              {files.length > 0 ? (
                files.map((file, index) => (
                  <FileItem key={index} onClick={() => handleFileSelect(file)}>
                    <FileIcon $isDirectory={file.isDirectory}>
                      {file.isDirectory ? <FaFolder /> : <FaFile />}
                    </FileIcon>
                    <FileName>{file.name}</FileName>
                    <FileSize>{formatSize(file.size)}</FileSize>
                    {!file.isDirectory && (
                      <FileActions onClick={(e) => e.stopPropagation()}>
                        <ActionButton
                          $color="#e74c3c"
                          $hoverColor="#c0392b"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilePath(file.path);
                            setCurrentTab('select');
                          }}
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
                  <p>This directory is empty</p>
                </EmptyState>
              )}
            </FileExplorer>
          ) : (
            <Card>
              <EmptyState>
                <IconContainer>
                  <FaFolder />
                </IconContainer>
                <p>Select a directory to browse files</p>
                <Button $primary onClick={browseDirectory} style={{ marginTop: '16px' }}>
                  <FaFolder /> Browse Directory
                </Button>
              </EmptyState>
            </Card>
          )}
        </>
      )}
    </Container>
  );
}

export default FileSharing;