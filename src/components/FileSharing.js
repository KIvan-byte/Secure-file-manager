import React, { useState } from 'react';
import { styled } from 'styled-components';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaClipboard, FaCheck, FaQrcode } from 'react-icons/fa';
import QRCode from 'qrcode.react';

const Container = styled.div`
  display: flex;
  flex-direction: column;
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

const Card = styled.div`
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
`;

const FileInput = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ShareLinkContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
  background-color: #f0f0f0;
  padding: 12px;
  border-radius: 4px;
`;

const ShareLink = styled.div`
  flex: 1;
  font-family: monospace;
  word-break: break-all;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 5px;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;
`;

const InfoText = styled.div`
  margin-top: 15px;
  padding: 10px;
  background-color: #f8f9fa;
  border-left: 4px solid #2980b9;
  color: #333;
`;

const QRCodeContainer = styled.div`
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

function FileSharing() {
  const location = useLocation();
  const navigate = useNavigate();
  const [filePath, setFilePath] = useState(location.state?.filePath || '');
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [showQRCode, setShowQRCode] = useState(false);

  const browseFile = async () => {
    try {
      const result = await window.electron.fileManager.browseDirectory();
      if (result.success) {
        setFilePath(result.path);
      }
    } catch (error) {
      console.error('Error browsing file:', error);
      setError('Error browsing file: ' + error.message);
    }
  };

  const shareFile = async () => {
    if (!filePath) {
      setError('Please select a file to share');
      return;
    }

    try {
      const result = await window.electron.fileManager.shareFile(filePath);
      if (result.success) {
        setShareLink(result.shareLink);
        setError('');
      } else {
        setError('Error sharing file: ' + result.error);
      }
    } catch (error) {
      console.error('Error sharing file:', error);
      setError('Error sharing file: ' + error.message);
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

  return (
    <Container>
      <Header>
        <Title>Secure File Sharing</Title>
      </Header>

      <Card>
        <FormGroup>
          <Label>Select a file to share</Label>
          <FileInput>
            <input 
              type="text" 
              value={filePath} 
              onChange={e => setFilePath(e.target.value)} 
              placeholder="File path" 
              style={{ flex: 1 }}
              readOnly
            />
            <button onClick={browseFile}>Browse</button>
          </FileInput>
        </FormGroup>

        <FormGroup>
          <button onClick={shareFile}>Generate Secure Share Link</button>
        </FormGroup>

        {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

        {shareLink && (
          <>
            <div>
              <Label>Share Link (One-time Use)</Label>
              <ShareLinkContainer>
                <ShareLink>{shareLink}</ShareLink>
                <ButtonGroup>
                  <ActionButton onClick={() => copyToClipboard(shareLink)}>
                    {copied ? <><FaCheck /> Copied</> : <><FaClipboard /> Copy</>}
                  </ActionButton>
                  <ActionButton onClick={toggleQRCode}>
                    <FaQrcode /> QR
                  </ActionButton>
                </ButtonGroup>
              </ShareLinkContainer>
            </div>

            {showQRCode && (
              <QRCodeContainer>
                <h3>Scan QR Code to Download</h3>
                <div style={{ background: 'white', padding: '15px' }}>
                  <QRCode value={shareLink} size={200} />
                </div>
              </QRCodeContainer>
            )}

            <InfoText>
              <p><strong>Security information:</strong></p>
              <p>This link can only be used once. Anyone with this link can download the file.</p>
              <p>The link includes an encryption key and will expire after it has been accessed once.</p>
              <p>The file will be served directly from your computer - you must keep this application running for the link to work.</p>
            </InfoText>
          </>
        )}
      </Card>
    </Container>
  );
}

export default FileSharing;