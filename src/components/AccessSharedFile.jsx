import React, { useState } from 'react';
import { styled } from 'styled-components';
import { useParams } from 'react-router-dom';
import { FaDownload, FaLock } from 'react-icons/fa';

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

const FileCard = styled.div`
  background-color: #f7f9fa;
  border-radius: 4px;
  padding: 20px;
  margin-top: 20px;
  text-align: center;
`;

const FileName = styled.h3`
  margin-top: 0;
`;

const DownloadButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 20px auto 0;
  padding: 10px 20px;
  background-color: #2ecc71;
  
  &:hover {
    background-color: #27ae60;
  }
`;

const AccessForm = styled.div`
  max-width: 500px;
  margin: 40px auto;
`;

const LockIcon = styled.div`
  font-size: 48px;
  color: #3498db;
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
`;

function AccessSharedFile() {
  const { token } = useParams();
  const [encryptionKey, setEncryptionKey] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const accessFile = async () => {
    if (!token || !encryptionKey) {
      setError('Both token and encryption key are required');
      return;
    }

    try {
      setIsLoading(true);
      const result = await window.electron.fileManager.accessSharedFile({ 
        token, 
        encryptionKey 
      });
      
      if (result.success) {
        setFileName(result.fileName);
        setFileContent(result.content);
        setError('');
      } else {
        setError('Error accessing file: ' + result.error);
      }
    } catch (error) {
      console.error('Error accessing file:', error);
      setError('Error accessing file: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = () => {
    if (!fileContent || !fileName) return;
    
    const element = document.createElement('a');
    const content = atob(fileContent);
    const byteArray = new Uint8Array(content.length);
    
    for (let i = 0; i < content.length; i++) {
      byteArray[i] = content.charCodeAt(i);
    }
    
    const blob = new Blob([byteArray]);
    const url = URL.createObjectURL(blob);
    
    element.href = url;
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    
    setTimeout(() => {
      document.body.removeChild(element);
      URL.revokeObjectURL(url);
    }, 100);
  };

  return (
    <Container>
      <Header>
        <Title>Access Shared File</Title>
      </Header>

      {!fileContent ? (
        <AccessForm>
          <LockIcon>
            <FaLock />
          </LockIcon>
          
          <Card>
            <h3>Access Secure File</h3>
            <p>Enter the encryption key to access the shared file.</p>
            
            <FormGroup>
              <Label>Token</Label>
              <input 
                type="text" 
                value={token} 
                readOnly 
                style={{ width: '100%' }}
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Encryption Key</Label>
              <input 
                type="text" 
                value={encryptionKey} 
                onChange={e => setEncryptionKey(e.target.value)} 
                placeholder="Enter encryption key" 
                style={{ width: '100%' }}
              />
            </FormGroup>
            
            <button 
              onClick={accessFile} 
              disabled={isLoading}
              style={{ width: '100%' }}
            >
              {isLoading ? 'Accessing...' : 'Access File'}
            </button>
            
            {error && <div style={{ color: 'red', marginTop: '15px' }}>{error}</div>}
          </Card>
        </AccessForm>
      ) : (
        <Card>
          <FileCard>
            <FileName>{fileName}</FileName>
            <p>The file has been securely retrieved.</p>
            <DownloadButton onClick={downloadFile}>
              <FaDownload /> Download File
            </DownloadButton>
          </FileCard>
        </Card>
      )}
    </Container>
  );
}

export default AccessSharedFile;