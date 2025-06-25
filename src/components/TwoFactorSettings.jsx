import React, { useState, useEffect } from 'react';
import { styled, keyframes } from 'styled-components';
import { FaMobileAlt, FaCheck, FaTimes, FaExclamationTriangle, FaInfoCircle, FaShieldAlt, FaQrcode, FaKey } from 'react-icons/fa';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const TwoFactorContainer = styled.div`
  /* animation: ${fadeIn} 0.3s ease; */
`;

const StatusCard = styled.div`
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  background-color: ${props => props.$enabled ? '#d4edda' : '#fff3cd'};
  border: 1px solid ${props => props.$enabled ? '#c3e6cb' : '#ffeaa7'};
  color: ${props => props.$enabled ? '#155724' : '#856404'};
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SetupCard = styled.div`
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 20px;
  /* animation: ${slideUp} 0.4s ease; */
`;

const QRContainer = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
  text-align: center;
  /* box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); */
`;

const SecretKey = styled.div`
  background-color: #e9ecef;
  padding: 12px;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #495057;
  margin: 15px 0;
  word-break: break-all;
  border: 1px solid #dee2e6;
  text-align: center;
`;

const SetupInstructions = styled.div`
  margin: 20px 0;
  color: #495057;
  line-height: 1.6;
  
  ol {
    padding-left: 20px;
    margin: 10px 0;
  }
  
  li {
    margin-bottom: 8px;
  }
`;

const CodeInput = styled.input`
  width: 100%;
  padding: 12px;
  border: 2px solid ${props => props.$error ? '#dc3545' : '#ced4da'};
  border-radius: 6px;
  font-size: 18px;
  text-align: center;
  letter-spacing: 0.5em;
  transition: all 0.3s;
  background-color: ${props => props.$error ? '#fff5f5' : 'white'};
  
  &:focus {
    border-color: ${props => props.$error ? '#dc3545' : '#007bff'};
    outline: none;
    box-shadow: 0 0 0 3px ${props => props.$error ? 'rgba(220, 53, 69, 0.25)' : 'rgba(0, 123, 255, 0.25)'};
  }
  
  &::placeholder {
    letter-spacing: normal;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 20px;
  
  @media (max-width: 576px) {
    flex-direction: column;
  }
`;

const Button = styled.button`
  flex: ${props => props.$flex || 'none'};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          background-color: #007bff;
          color: white;
          &:hover { background-color: #0056b3; }
        `;
      case 'success':
        return `
          background-color: #28a745;
          color: white;
          &:hover { background-color: #1e7e34; }
        `;
      case 'danger':
        return `
          background-color: #dc3545;
          color: white;
          &:hover { background-color: #c82333; }
        `;
      case 'secondary':
        return `
          background-color: #6c757d;
          color: white;
          &:hover { background-color: #545b62; }
        `;
      default:
        return `
          background-color: #f8f9fa;
          color: #495057;
          border: 1px solid #ced4da;
          &:hover { background-color: #e9ecef; }
        `;
    }
  }}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &:active {
    transform: translateY(1px);
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 12px;
  border-radius: 6px;
  margin: 15px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SuccessMessage = styled.div`
  color: #155724;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  padding: 12px;
  border-radius: 6px;
  margin: 15px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const TwoFactorSettings = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [secretKey, setSecretKey] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    checkTwoFactorStatus();
  }, []);

  const checkTwoFactorStatus = async () => {
    try {
      setIsLoading(true);
      const result = await window.electron.auth.checkTwoFactorSetup();
      setIsEnabled(result.isSetup);
    } catch (error) {
      console.error('Error checking 2FA status:', error);
      setError('Failed to check two-factor authentication status');
    } finally {
      setIsLoading(false);
    }
  };

  const startSetup = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const result = await window.electron.auth.generateTwoFactorSecret();
      if (result.success) {
        setSecretKey(result.secret);
        setQrCodeUrl(result.qrCode);
        setIsSetupMode(true);
      } else {
        setError('Failed to generate setup data');
      }
    } catch (error) {
      console.error('Error starting 2FA setup:', error);
      setError('Failed to start two-factor authentication setup');
    } finally {
      setIsLoading(false);
    }
  };

  const completeSetup = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      const result = await window.electron.auth.setupTwoFactor(secretKey, verificationCode);
      if (result.success) {
        setIsEnabled(true);
        setIsSetupMode(false);
        setVerificationCode('');
        setSuccess('Two-factor authentication has been successfully enabled!');
      } else {
        setError('Invalid verification code. Please check your authenticator app and try again.');
      }
    } catch (error) {
      console.error('Error completing 2FA setup:', error);
      setError('Failed to complete two-factor authentication setup');
    } finally {
      setIsLoading(false);
    }
  };

  const disable2FA = async () => {
    if (!window.confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      const result = await window.electron.auth.disableTwoFactor();
      if (result.success) {
        setIsEnabled(false);
        setSuccess('Two-factor authentication has been disabled');
      } else {
        setError('Failed to disable two-factor authentication');
      }
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      setError('Failed to disable two-factor authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSetup = () => {
    setIsSetupMode(false);
    setVerificationCode('');
    setSecretKey('');
    setQrCodeUrl('');
    setError('');
  };

  return (
    <TwoFactorContainer>
      {error && (
        <ErrorMessage>
          <FaExclamationTriangle />
          {error}
        </ErrorMessage>
      )}

      {success && (
        <SuccessMessage>
          <FaCheck />
          {success}
        </SuccessMessage>
      )}

      <StatusCard $enabled={isEnabled}>
        <FaShieldAlt size={20} />
        <div>
          <strong>Two-Factor Authentication: {isEnabled ? 'Enabled' : 'Disabled'}</strong>
          <div style={{ fontSize: '14px', marginTop: '4px' }}>
            {isEnabled 
              ? 'Your account is protected with two-factor authentication'
              : 'Add an extra layer of security to your account'
            }
          </div>
        </div>
      </StatusCard>

      {!isSetupMode && !isEnabled && (
        <div>
          <h4>Enable Two-Factor Authentication</h4>
          <p>
            Two-factor authentication adds an extra layer of security to your account by requiring 
            a code from your mobile device in addition to your password.
          </p>
          <ButtonGroup>
            <Button 
              $variant="primary" 
              onClick={startSetup}
              disabled={isLoading}
            >
              {isLoading ? <LoadingSpinner /> : <FaMobileAlt />}
              Set Up Two-Factor Authentication
            </Button>
          </ButtonGroup>
        </div>
      )}

      {isSetupMode && (
        <SetupCard>
          <h4>
            <FaQrcode style={{ marginRight: '8px' }} />
            Set Up Two-Factor Authentication
          </h4>
          
          <SetupInstructions>
            <ol>
              <li>Download Google Authenticator or another TOTP app on your mobile device</li>
              <li>Scan the QR code below or manually enter the secret key</li>
              <li>Enter the 6-digit code from your authenticator app to verify</li>
            </ol>
          </SetupInstructions>

          <QRContainer>
            {qrCodeUrl ? (
              <img 
                src={qrCodeUrl} 
                alt="QR Code for 2FA setup" 
                style={{ maxWidth: '200px', height: 'auto' }}
                onError={(e) => {
                  console.error('QR Code failed to load:', e);
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div style={{ padding: '20px', color: '#6c757d' }}>
                Generating QR code...
              </div>
            )}
            
            <div style={{ marginTop: '15px' }}>
              <strong>Manual Entry Key:</strong>
              <SecretKey>{secretKey}</SecretKey>
            </div>
          </QRContainer>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
              Verification Code
            </label>
            <CodeInput
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength="6"
              $error={error && verificationCode.length === 6}
            />
          </div>

          <ButtonGroup>
            <Button 
              $variant="secondary" 
              onClick={cancelSetup}
              disabled={isLoading}
            >
              <FaTimes />
              Cancel
            </Button>
            <Button 
              $variant="success" 
              $flex="1"
              onClick={completeSetup}
              disabled={isLoading || verificationCode.length !== 6}
            >
              {isLoading ? <LoadingSpinner /> : <FaCheck />}
              Complete Setup
            </Button>
          </ButtonGroup>
        </SetupCard>
      )}

      {!isSetupMode && isEnabled && (
        <div>
          <h4>Manage Two-Factor Authentication</h4>
          <p>
            Two-factor authentication is currently enabled for your account. 
            You can disable it below, but this will make your account less secure.
          </p>
          <ButtonGroup>
            <Button 
              $variant="danger" 
              onClick={disable2FA}
              disabled={isLoading}
            >
              {isLoading ? <LoadingSpinner /> : <FaTimes />}
              Disable Two-Factor Authentication
            </Button>
          </ButtonGroup>
        </div>
      )}

      {!isSetupMode && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#e9ecef', 
          borderRadius: '6px',
          borderLeft: '4px solid #007bff'
        }}>
          <FaInfoCircle style={{ marginRight: '8px', color: '#007bff' }} />
          <strong>Security Tips:</strong>
          <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
            <li>Use a trusted authenticator app like Google Authenticator, Authy, or Microsoft Authenticator</li>
            <li>Keep backup codes in a safe place in case you lose access to your phone</li>
            <li>Don't share your secret key or QR code with anyone</li>
            <li>If you change phones, you'll need to set up 2FA again</li>
          </ul>
        </div>
      )}
    </TwoFactorContainer>
  );
};

export default TwoFactorSettings;