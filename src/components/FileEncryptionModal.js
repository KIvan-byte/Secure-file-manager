import React, { useState, useEffect } from 'react';
import { styled } from 'styled-components';
import { FaLock, FaLockOpen, FaKey, FaTimes, FaCheck, FaSpinner, FaInfoCircle } from 'react-icons/fa';
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

const EncryptionForm = styled.div`
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

const FileInfo = styled.div`
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const FileName = styled.div`
  font-weight: 600;
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

const PasswordStrengthContainer = styled.div`
  margin-top: 8px;
`;

const PasswordStrengthBar = styled.div`
  height: 5px;
  background-color: #ecf0f1;
  border-radius: 5px;
  margin-bottom: 5px;
  overflow: hidden;
`;

const PasswordStrengthIndicator = styled.div`
  height: 100%;
  border-radius: 5px;
  width: ${props => props.$percent}%;
  background-color: ${props => {
    if (props.$strength === 'weak') return '#e74c3c';
    if (props.$strength === 'medium') return '#f39c12';
    if (props.$strength === 'strong') return '#2ecc71';
    if (props.$strength === 'very-strong') return '#27ae60';
    return '#ecf0f1';
  }};
  transition: all 0.3s ease;
`;

const PasswordStrengthText = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 12px;
`;

const PasswordStrengthLabel = styled.span`
  color: ${props => {
    if (props.$strength === 'weak') return '#e74c3c';
    if (props.$strength === 'medium') return '#f39c12';
    if (props.$strength === 'strong') return '#2ecc71';
    if (props.$strength === 'very-strong') return '#27ae60';
    return '#7f8c8d';
  }};
  font-weight: 600;
`;

const PasswordRequirements = styled.div`
  font-size: 12px;
  color: #7f8c8d;
  margin-top: 5px;
`;

function FileEncryptionModal({ isOpen, onClose, file, mode = 'encrypt' }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [outputPath, setOutputPath] = useState('');
  const [message, setMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [strengthPercent, setStrengthPercent] = useState(0);
  
  useEffect(() => {
    if (file) {
      if (mode === 'encrypt') {
        setOutputPath(`${file.path}.enc`);
      } else {
        setOutputPath(file.path.endsWith('.enc') ? file.path.slice(0, -4) : `${file.path}.decrypted`);
      }
    }
  }, [file, mode]);
  
  useEffect(() => {
    if (mode === 'encrypt') {
      calculatePasswordStrength(password);
    }
  }, [password, mode]);
  
  const calculatePasswordStrength = (pass) => {
    if (!pass) {
      setPasswordStrength('');
      setStrengthPercent(0);
      return;
    }
    
    let score = 0;
    
    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;
    if (pass.length >= 16) score += 1;
    
    if (/\d/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    if (!/(123|abc|password|qwerty|admin)/i.test(pass)) score += 1;
    
    const percent = (score / 8) * 100;
    setStrengthPercent(percent);
    
    if (percent < 30) {
      setPasswordStrength('weak');
    } else if (percent < 60) {
      setPasswordStrength('medium');
    } else if (percent < 80) {
      setPasswordStrength('strong');
    } else {
      setPasswordStrength('very-strong');
    }
  };
  
  const getStrengthLabel = () => {
    switch (passwordStrength) {
      case 'weak': return 'Weak';
      case 'medium': return 'Medium';
      case 'strong': return 'Strong';
      case 'very-strong': return 'Very Strong';
      default: return '';
    }
  };
  
  const validateForm = () => {
    if (!password) {
      setMessage({
        type: 'error',
        text: 'Please enter a password'
      });
      return false;
    }
    
    if (mode === 'encrypt' && passwordStrength === 'weak') {
      setMessage({
        type: 'error',
        text: 'Please use a stronger password for better security'
      });
      return false;
    }
    
    if (mode === 'encrypt' && password !== confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Passwords do not match'
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
      
      const params = {
        filePath: file.path,
        password,
        outputPath: mode === 'encrypt' ? outputPath : null
      };
      
      const result = mode === 'encrypt' 
        ? await window.electron.fileManager.encryptFile(params)
        : await window.electron.fileManager.decryptFile(params);
      
      if (result.success) {
        setOutputPath(result.outputPath);
        
        setMessage({
          type: 'success',
          text: mode === 'encrypt' 
            ? `File encrypted successfully. Saved to ${result.outputPath}`
            : `File decrypted successfully. Saved to ${result.outputPath}${result.originalExtension ? ` with original extension (${result.originalExtension})` : ''}`
        });
        
        setPassword('');
        setConfirmPassword('');
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'An error occurred'
        });
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
  
  if (!isOpen || !file) return null;
  
  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            {mode === 'encrypt' ? (
              <>
                <FaLock /> Encrypt File
              </>
            ) : (
              <>
                <FaLockOpen /> Decrypt File
              </>
            )}
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>
        <ModalBody>
          <FileInfo>
            <FileName>{file.name}</FileName>
            <FilePath>{file.path}</FilePath>
          </FileInfo>
          
          <EncryptionForm>
            <FormGroup>
              <Label>Password</Label>
              <Input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isProcessing}
                placeholder="Enter password for encryption"
              />
              {mode === 'encrypt' && password && (
                <PasswordStrengthContainer>
                  <PasswordStrengthBar>
                    <PasswordStrengthIndicator 
                      $percent={strengthPercent} 
                      $strength={passwordStrength} 
                    />
                  </PasswordStrengthBar>
                  <PasswordStrengthText>
                    <PasswordStrengthLabel $strength={passwordStrength}>
                      {getStrengthLabel()}
                    </PasswordStrengthLabel>
                    <span>{strengthPercent.toFixed(0)}%</span>
                  </PasswordStrengthText>
                  {passwordStrength === 'weak' && (
                    <PasswordRequirements>
                      For a strong password, use at least 12 characters with uppercase, lowercase, numbers, and special characters.
                    </PasswordRequirements>
                  )}
                </PasswordStrengthContainer>
              )}
            </FormGroup>
            
            {mode === 'encrypt' && (
              <FormGroup>
                <Label>Confirm Password</Label>
                <Input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isProcessing}
                  placeholder="Confirm password"
                />
              </FormGroup>
            )}
            
            {mode === 'encrypt' && (
              <FormGroup>
                <Label>Output File Path</Label>
                <Input 
                  type="text" 
                  value={outputPath}
                  onChange={(e) => setOutputPath(e.target.value)}
                  disabled={isProcessing}
                />
              </FormGroup>
            )}
            
            {mode === 'decrypt' && (
              <div style={{ marginBottom: '15px' }}>
                <small style={{ color: '#7f8c8d' }}>
                  <FaInfoCircle style={{ marginRight: '5px' }} />
                  The original file extension will be automatically restored from the encrypted file metadata.
                </small>
              </div>
            )}
            
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
                ) : mode === 'encrypt' ? (
                  <>
                    <FaLock /> Encrypt File
                  </>
                ) : (
                  <>
                    <FaLockOpen /> Decrypt File
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
          </EncryptionForm>
          
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
            <strong><FaInfoCircle style={{ marginRight: '5px' }} /> Security Information</strong>
            <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
              <li>Files are encrypted using AES-256-CBC algorithm</li>
              <li>Your password is never stored anywhere</li>
              <li>
                {mode === 'encrypt' 
                  ? 'Make sure to remember your password. There is no way to recover encrypted files without it.'
                  : 'If decryption fails, double-check your password and ensure the file is not corrupted.'}
              </li>
              {mode === 'encrypt' && (
                <li>Stronger passwords provide better protection against unauthorized access</li>
              )}
            </ul>
          </InfoBox>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
}

export default FileEncryptionModal;