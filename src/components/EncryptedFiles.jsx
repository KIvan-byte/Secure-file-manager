import React, { useState, useEffect } from 'react';
import { styled } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { FaLock, FaShare, FaEye, FaUnlock, FaKey, FaCopy, FaCheck, FaQrcode, FaTimes, FaExclamationTriangle, FaFile, FaInfoCircle, FaSearch, FaSpinner, FaLink } from 'react-icons/fa';
import path from 'path-browserify';
import FileEncryptionModal from './FileEncryptionModal';
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
  display: flex;
  align-items: center;
  gap: 10px;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
    gap: 8px;
    justify-content: center;
  }
  
  @media (max-width: 480px) {
    font-size: 1.25rem;
    gap: 6px;
  }
`;

const Card = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin-bottom: 24px;
  
  @media (max-width: 768px) {
    border-radius: 6px;
    margin-bottom: 16px;
  }
  
  @media (max-width: 480px) {
    margin-bottom: 12px;
  }
`;

const CardHeader = styled.div`
  padding: 16px 24px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #eaeaea;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  @media (max-width: 768px) {
    padding: 12px 16px;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  @media (max-width: 480px) {
    padding: 10px 12px;
  }
`;

const CardTitle = styled.h3`
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  @media (max-width: 768px) {
    font-size: 16px;
    gap: 6px;
    justify-content: center;
  }
  
  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const CardContent = styled.div`
  padding: ${props => props.$noPadding ? '0' : '24px'};
  
  @media (max-width: 768px) {
    padding: ${props => props.$noPadding ? '0' : '16px'};
  }
  
  @media (max-width: 480px) {
    padding: ${props => props.$noPadding ? '0' : '12px'};
  }
`;

const Message = styled.div`
  padding: 15px;
  margin-bottom: 15px;
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
  
  &:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
`;

const FileList = styled.div`
  border-radius: 8px;
  overflow: hidden;
`;

const FileRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  padding: 16px 24px;
  border-bottom: 1px solid #eaeaea;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #f8f9fa;
  }
  
  &:last-child {
    border-bottom: none;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 10px;
  }
`;

const FileInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FileName = styled.div`
  font-weight: 500;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const FileIcon = styled.div`
  color: #3498db;
  display: flex;
  align-items: center;
`;

const FilePath = styled.div`
  font-family: monospace;
  font-size: 12px;
  color: #7f8c8d;
  margin-left: 34px;
  word-break: break-all;
`;

const FileMeta = styled.div`
  display: flex;
  margin-left: 34px;
  gap: 16px;
  margin-top: 4px;
  
  @media (max-width: 576px) {
    flex-direction: column;
    gap: 4px;
  }
`;

const FileMetaItem = styled.div`
  color: #7f8c8d;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const OriginalFile = styled.div`
  margin-left: 34px;
  color: #2c3e50;
  font-size: 13px;
  margin-top: 8px;
  padding: 6px 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  display: inline-block;
`;

const FileActions = styled.div`
  display: flex;
  gap: 8px;
  align-self: center;
  
  @media (max-width: 768px) {
    justify-content: flex-end;
  }
  
  @media (max-width: 576px) {
    flex-wrap: wrap;
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  background-color: ${props => props.$color || '#3498db'};
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: ${props => props.$hoverColor || '#2980b9'};
  }
  
  svg {
    font-size: 14px;
  }
  
  @media (max-width: 576px) {
    flex: 1;
    min-width: 120px;
  }
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

const SearchInput = styled.input`
  padding: 10px 12px 10px 40px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border 0.3s ease;
  width: 250px;
  
  &:focus {
    border-color: #3498db;
    outline: none;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  margin-left: auto;
  
  @media (max-width: 768px) {
    margin-top: 16px;
    width: 100%;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #7f8c8d;
`;

const Modal = styled.div`
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

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #34495e;
`;

const Input = styled.input`
  width: 100%;
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
  
  &:disabled {
    background-color: #f5f5f5;
  }
`;

const Checkbox = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
  cursor: pointer;
  
  input {
    cursor: pointer;
  }
  
  label {
    cursor: pointer;
    margin-bottom: 0;
    font-weight: normal;
  }
`;

const ShareLinkContainer = styled.div`
  margin-top: 20px;
  background-color: #f8f9fa;
  border: 1px solid #eaeaea;
  border-radius: 6px;
  overflow: hidden;
`;

const ShareLinkHeader = styled.div`
  padding: 12px 16px;
  background-color: #eaeaea;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ShareLinkTitle = styled.h4`
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #2c3e50;
`;

const ShareLinkContent = styled.div`
  padding: 16px;
`;

const ShareLink = styled.div`
  background-color: white;
  padding: 12px;
  border-radius: 4px;
  border: 1px solid #eaeaea;
  font-family: monospace;
  word-break: break-all;
  margin-bottom: 15px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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

const LoadingIndicator = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;
  color: #7f8c8d;
`;

const Spinner = styled(FaSpinner)`
  font-size: 30px;
  margin-bottom: 16px;
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

function EncryptedFiles() {
  const [encryptedFiles, setEncryptedFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showEncryptionModal, setShowEncryptionModal] = useState(false);
  const [encryptionMode, setEncryptionMode] = useState('decrypt');
  
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareFile, setShareFile] = useState(null);
  const [sharePassword, setSharePassword] = useState('');
  const [allowDecryption, setAllowDecryption] = useState(true);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [isSharingLoading, setIsSharingLoading] = useState(false);
  
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchEncryptedFiles();
  }, []);
  
  useEffect(() => {
    if (searchTerm) {
      const filtered = encryptedFiles.filter(file => 
        file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.path.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFiles(filtered);
    } else {
      setFilteredFiles(encryptedFiles);
    }
  }, [searchTerm, encryptedFiles]);
  
  const fetchEncryptedFiles = async () => {
    try {
      setLoading(true);
      
      const result = await window.electron.fileManager.listEncryptedFiles();
      if (result.success) {
        setEncryptedFiles(result.files);
        setFilteredFiles(result.files);
      } else {
        setMessage({ 
          type: 'error', 
          text: `Error loading encrypted files: ${result.error}` 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: `Error loading encrypted files: ${error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };
  
  const getFileDetails = async (file) => {
    try {
      const result = await window.electron.fileManager.getEncryptedFileDetails(file.path);
      if (result.success) {
        return result.details;
      }
    } catch (error) {
      console.error("Error getting file details:", error);
    }
    return null;
  };
  
  const handleDecrypt = (file) => {
    setSelectedFile(file);
    setEncryptionMode('decrypt');
    setShowEncryptionModal(true);
  };
  
  const handleShare = async (file) => {
    // Get detailed info about the file
    const details = await getFileDetails(file);
    setShareFile({...file, ...details});
    setSharePassword('');
    setAllowDecryption(true);
    setShareLink('');
    setShowQRCode(false);
    setShowShareModal(true);
  };
  
  const shareEncryptedFile = async () => {
    if (!shareFile) return;
    
    try {
      setIsSharingLoading(true);
      
      // If decryption is allowed but no password is provided
      if (allowDecryption && !sharePassword) {
        setMessage({
          type: 'error',
          text: 'Please provide a decryption password or disable decryption on download'
        });
        setIsSharingLoading(false);
        return;
      }
      
      const result = await window.electron.fileManager.shareEncryptedFileWithDecryption({
        filePath: shareFile.path,
        password: sharePassword,
        allowDecryption
      });
      
      if (result.success) {
        setShareLink(result.shareLink);
        setMessage({
          type: 'success',
          text: 'Share link generated successfully!'
        });
      } else {
        setMessage({
          type: 'error',
          text: `Error sharing file: ${result.error}`
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Error sharing file: ${error.message}`
      });
    } finally {
      setIsSharingLoading(false);
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
  
  const closeEncryptionModal = () => {
    setShowEncryptionModal(false);
    fetchEncryptedFiles(); // Refresh list after encryption/decryption
  };
  
  const viewInExplorer = (file) => {
    navigate('/', { state: { openDirectory: path.dirname(file.path) } });
  };
  
  return (
    <Container>
      <Header>
        <Title>
          <FaLock /> Encrypted Files
        </Title>
        <SearchContainer>
          <SearchIcon><FaSearch /></SearchIcon>
          <SearchInput 
            type="text"
            placeholder="Search encrypted files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchContainer>
      </Header>
      
      {message && (
        <Message $type={message.type}>
          <MessageIcon>
            {message.type === 'error' 
              ? <FaExclamationTriangle /> 
              : message.type === 'success' 
                ? <FaCheck /> 
                : <FaInfoCircle />}
          </MessageIcon>
          <div>{message.text}</div>
          <CloseButton onClick={() => setMessage(null)}>
            <FaTimes />
          </CloseButton>
        </Message>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>
            <FaLock /> Your Encrypted Files
          </CardTitle>
          <Button 
            $primary
            onClick={fetchEncryptedFiles}
            disabled={loading}
          >
            Refresh
          </Button>
        </CardHeader>
        
        <CardContent $noPadding>
          {loading ? (
            <LoadingIndicator>
              <Spinner />
              <div>Loading encrypted files...</div>
            </LoadingIndicator>
          ) : filteredFiles.length === 0 ? (
            <EmptyState>
              <IconContainer>
                <FaLock />
              </IconContainer>
              {searchTerm ? (
                <>
                  <p>No encrypted files match your search</p>
                  <Button onClick={() => setSearchTerm('')}>
                    Clear Search
                  </Button>
                </>
              ) : (
                <>
                  <p>You haven't encrypted any files yet</p>
                  <p>Use the File Explorer to encrypt your files</p>
                  <Button 
                    $primary
                    onClick={() => navigate('/')}
                    style={{ marginTop: '16px' }}
                  >
                    Go to File Explorer
                  </Button>
                </>
              )}
            </EmptyState>
          ) : (
            <FileList>
              {filteredFiles.map((file, index) => (
                <FileRow key={index}>
                  <FileInfo>
                    <FileName>
                      <FileIcon><FaLock /></FileIcon>
                      {file.name}
                    </FileName>
                    <FilePath>{file.path}</FilePath>
                    <FileMeta>
                      <FileMetaItem>
                        <FaFile /> {formatSize(file.size)}
                      </FileMetaItem>
                      <FileMetaItem>
                        Last modified: {formatDate(file.mtime)}
                      </FileMetaItem>
                    </FileMeta>
                  </FileInfo>
                  
                  <FileActions>
                    <ActionButton 
                      $color="#27ae60" 
                      $hoverColor="#219653"
                      onClick={() => handleDecrypt(file)}
                      title="Decrypt file"
                    >
                      <FaUnlock /> Decrypt
                    </ActionButton>
                    
                    <ActionButton 
                      $color="#e74c3c" 
                      $hoverColor="#c0392b"
                      onClick={() => handleShare(file)}
                      title="Share encrypted file"
                    >
                      <FaShare /> Share
                    </ActionButton>
                    
                    <ActionButton 
                      $color="#3498db" 
                      $hoverColor="#2980b9"
                      onClick={() => viewInExplorer(file)}
                      title="View in file explorer"
                    >
                      <FaEye /> View in Explorer
                    </ActionButton>
                  </FileActions>
                </FileRow>
              ))}
            </FileList>
          )}
        </CardContent>
      </Card>
      
      <FileEncryptionModal 
        isOpen={showEncryptionModal}
        onClose={closeEncryptionModal}
        file={selectedFile}
        mode={encryptionMode}
      />
      
      {/* Share Encrypted File Modal */}
      {showShareModal && (
        <Modal onClick={() => !isSharingLoading && setShowShareModal(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                <FaShare /> Share Encrypted File
              </ModalTitle>
              <CloseButton 
                onClick={() => !isSharingLoading && setShowShareModal(false)}
                disabled={isSharingLoading}
              >
                <FaTimes />
              </CloseButton>
            </ModalHeader>
            
            <ModalBody>
              {shareFile && (
                <>
                  <div style={{ marginBottom: '20px' }}>
                    <strong>File:</strong> {shareFile.name}
                    <div style={{ fontSize: '13px', fontFamily: 'monospace', marginTop: '5px', wordBreak: 'break-all' }}>
                      {shareFile.path}
                    </div>
                    
                    {shareFile.originalFileName && (
                      <OriginalFile>
                        Original file: {shareFile.originalFileName}
                      </OriginalFile>
                    )}
                  </div>
                  
                  <FormGroup>
                    <Checkbox>
                      <input 
                        type="checkbox"
                        id="allowDecryption"
                        checked={allowDecryption}
                        onChange={() => setAllowDecryption(!allowDecryption)}
                        disabled={isSharingLoading}
                      />
                      <label htmlFor="allowDecryption">Allow recipient to decrypt file</label>
                    </Checkbox>
                    
                    <div style={{ fontSize: '13px', color: '#7f8c8d', marginLeft: '25px' }}>
                      When enabled, the recipient can download the decrypted file directly
                    </div>
                  </FormGroup>
                  
                  {allowDecryption && (
                    <FormGroup>
                      <Label>Decryption Password</Label>
                      <Input 
                        type="password"
                        value={sharePassword}
                        onChange={e => setSharePassword(e.target.value)}
                        placeholder="Enter the password used to encrypt this file"
                        disabled={isSharingLoading}
                      />
                    </FormGroup>
                  )}
                  
                  <Button 
                    $primary 
                    onClick={shareEncryptedFile}
                    style={{ width: '100%' }}
                    disabled={isSharingLoading}
                  >
                    {isSharingLoading ? (
                      <>
                        <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> 
                        Creating Share Link...
                      </>
                    ) : (
                      <>
                        <FaShare /> Generate Secure Share Link
                      </>
                    )}
                  </Button>
                  
                  {shareLink && (
                    <>
                      <ShareLinkContainer>
                        <ShareLinkHeader>
                          <ShareLinkTitle>
                            <FaLink /> Share Link (One-time Use)
                          </ShareLinkTitle>
                        </ShareLinkHeader>
                        <ShareLinkContent>
                          <ShareLink>{shareLink}</ShareLink>
                          <ButtonGroup>
                            <ActionButton onClick={() => copyToClipboard(shareLink)}>
                              {copied ? <><FaCheck /> Copied!</> : <><FaCopy /> Copy Link</>}
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
                          <h3>Scan QR Code to Access File</h3>
                          <QRCodeFrame>
                            <QRCode value={shareLink} size={250} renderAs="svg" includeMargin={true} />
                          </QRCodeFrame>
                        </QRCodeContainer>
                      )}
                      
                      <InfoBox>
                        <strong><FaInfoCircle style={{ marginRight: '5px' }} /> Sharing Information</strong>
                        <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                          <li>This link can only be used <strong>once</strong></li>
                          <li>After download, the link will expire</li>
                          {allowDecryption ? (
                            <li>The recipient will be asked for the decryption password when they access the file</li>
                          ) : (
                            <li>The recipient will receive the encrypted file and will need to decrypt it separately</li>
                          )}
                          <li>This application must remain running for the link to work</li>
                        </ul>
                      </InfoBox>
                    </>
                  )}
                </>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
}

export default EncryptedFiles;