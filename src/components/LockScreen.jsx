import React, { useState, useEffect } from 'react';
import { styled, keyframes } from 'styled-components';
import { FaLock, FaUnlock, FaExclamationTriangle, FaShieldAlt, FaQuestion, FaEye, FaEyeSlash, FaArrowLeft, FaKey, FaInfo } from 'react-icons/fa';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const LockContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #1a2a3a 0%, #0c1824 100%);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 20px;
  animation: ${fadeIn} 0.4s ease;
  
  @media (max-width: 768px) {
    padding: 16px;
  }
  
  @media (max-width: 480px) {
    padding: 12px;
  }
`;

const LockForm = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1);
  width: 100%;
  max-width: 440px;
  padding: 40px;
  text-align: center;
  transform: translateY(0);
  transition: all 0.3s ease;
  animation: ${slideUp} 0.5s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1);
  }
  
  @media (max-width: 768px) {
    max-width: 380px;
    padding: 32px;
    border-radius: 20px;
    
    &:hover {
      transform: none;
    }
  }
  
  @media (max-width: 480px) {
    max-width: 320px;
    padding: 24px;
    border-radius: 16px;
  }
`;

const LockIcon = styled.div`
  font-size: 32px;
  color: white;
  margin-bottom: 25px;
  height: 90px;
  width: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  border-radius: 50%;
  margin: 0 auto 30px auto;
  box-shadow: 0 10px 20px rgba(41, 128, 185, 0.3);
  transition: all 0.3s ease;
  animation: ${pulse} 2s infinite ease-in-out;
  
  &:hover {
    transform: scale(1.05) rotate(5deg);
  }
  
  @media (max-width: 768px) {
    height: 80px;
    width: 80px;
    font-size: 28px;
    margin-bottom: 20px;
    
    &:hover {
      transform: scale(1.02);
    }
  }
  
  @media (max-width: 480px) {
    height: 70px;
    width: 70px;
    font-size: 24px;
    margin-bottom: 16px;
  }
`;

const LockTitle = styled.h2`
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 28px;
  font-weight: 700;
`;

const LockMessage = styled.p`
  margin-bottom: 30px;
  color: #7f8c8d;
  font-size: 16px;
  line-height: 1.5;
`;

const InputWrapper = styled.div`
  position: relative;
  margin-bottom: 25px;
`;

const PasswordInput = styled.input`
  width: 100%;
  padding: 16px 20px;
  padding-right: 50px;
  border: 2px solid ${props => props.error ? '#e74c3c' : '#ddd'};
  border-radius: 16px;
  font-size: 16px;
  transition: all 0.3s;
  background-color: ${props => props.error ? 'rgba(231, 76, 60, 0.05)' : '#f8f9fa'};
  
  &:focus {
    border-color: ${props => props.error ? '#e74c3c' : '#3498db'};
    outline: none;
    box-shadow: 0 0 0 3px ${props => props.error ? 'rgba(231, 76, 60, 0.2)' : 'rgba(52, 152, 219, 0.2)'};
    background-color: white;
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #95a5a6;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  
  &:hover {
    color: #3498db;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
`;

const UnlockButton = styled.button`
  flex: 1;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border: none;
  border-radius: 16px;
  padding: 16px 20px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
  
  &:hover {
    background: linear-gradient(135deg, #2980b9 0%, #1a5276 100%);
    transform: translateY(-2px);
    box-shadow: 0 7px 15px rgba(52, 152, 219, 0.4);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 5px rgba(52, 152, 219, 0.4);
  }
  
  &:disabled {
    background: linear-gradient(135deg, #bdc3c7 0%, #95a5a6 100%);
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 4px 10px rgba(149, 165, 166, 0.3);
  }
`;

const ForgotPasswordLink = styled.button`
  background: none;
  border: none;
  color: #3498db;
  cursor: pointer;
  font-size: 14px;
  margin-top: 15px;
  text-decoration: underline;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  
  &:hover {
    color: #2980b9;
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  margin: 15px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  background-color: rgba(231, 76, 60, 0.1);
  padding: 12px;
  border-radius: 12px;
  border-left: 4px solid #e74c3c;
  animation: ${fadeIn} 0.3s ease;
`;

const LockInfo = styled.div`
  margin-top: 25px;
  font-size: 13px;
  color: #7f8c8d;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  background-color: rgba(236, 240, 241, 0.5);
  border-radius: 10px;
`;

const TimeDisplay = styled.div`
  position: absolute;
  top: 40px;
  right: 40px;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  animation: ${slideUp} 0.8s ease;
`;

const CurrentTime = styled.div`
  font-size: 48px;
  font-weight: 300;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
`;

const CurrentDate = styled.div`
  font-size: 16px;
  opacity: 0.8;
  margin-top: 5px;
  text-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
`;

const LoadingIndicator = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: ${spin} 1s ease-in-out infinite;
`;

const SecurityMessage = styled.div`
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  animation: ${fadeIn} 1s ease;
`;

const TwoFactorSection = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ecf0f1;
  display: ${props => props.$show ? 'block' : 'none'};
  animation: ${slideUp} 0.4s ease;
`;

const TwoFactorTitle = styled.h3`
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 18px;
  text-align: center;
`;

const TwoFactorInput = styled.input`
  width: 100%;
  padding: 16px 20px;
  border: 2px solid ${props => props.error ? '#e74c3c' : '#ddd'};
  border-radius: 16px;
  font-size: 18px;
  text-align: center;
  letter-spacing: 0.5em;
  transition: all 0.3s;
  background-color: ${props => props.error ? 'rgba(231, 76, 60, 0.05)' : '#f8f9fa'};
  
  &:focus {
    border-color: ${props => props.error ? '#e74c3c' : '#3498db'};
    outline: none;
    box-shadow: 0 0 0 3px ${props => props.error ? 'rgba(231, 76, 60, 0.2)' : 'rgba(52, 152, 219, 0.2)'};
    background-color: white;
  }
  
  &::placeholder {
    letter-spacing: normal;
  }
`;

const LockScreen = ({ onUnlock, password, onForgotPassword }) => {
  const [inputPassword, setInputPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorError, setTwoFactorError] = useState('');
  const [passwordVerified, setPasswordVerified] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    checkTwoFactorSetup();
  }, []);

  const checkTwoFactorSetup = async () => {
    try {
      const result = await window.electron.auth.checkTwoFactorSetup();
      // Don't show 2FA immediately, only after password is verified
      return result.isSetup;
    } catch (error) {
      console.error('Error checking 2FA setup:', error);
      return false;
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!inputPassword) {
      setError('Please enter password');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Try to initialize secure storage with the provided password
      const initResult = await window.electronAPI.secureStorage.initialize(inputPassword);
      
      if (initResult.success) {
        // Password is correct if secure storage initialization succeeds
        setPasswordVerified(true);
        
        // Try to load security settings from secure storage
        try {
          const hasPasswordResult = await window.electronAPI.secureStorage.retrieve('hasPassword');
          if (hasPasswordResult.success && hasPasswordResult.value) {
            // There are saved settings, load them
            const settingsResult = await window.electronAPI.secureStorage.retrieve('securitySettings');
            if (settingsResult.success && settingsResult.value) {
              const savedSettings = JSON.parse(settingsResult.value);
              // Restore the password for this session
              savedSettings.password = inputPassword;
              
              // Notify the app about the settings
              window.dispatchEvent(new CustomEvent('securitySettingsChanged', {
                detail: savedSettings
              }));
            }
          }
        } catch (settingsError) {
          console.warn('Could not load saved settings, using defaults:', settingsError);
        }
        
        // Check if 2FA is enabled after password verification
        const has2FA = await checkTwoFactorSetup();
        if (has2FA) {
          setShowTwoFactor(true);
        } else {
          // No 2FA setup, unlock directly
          onUnlock();
        }
      } else {
        // SecureStorage rejected the password
        setError('Invalid password');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError('Authentication error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTwoFactorSubmit = async (e) => {
    e.preventDefault();
    
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      setTwoFactorError('Please enter a 6-digit code');
      return;
    }

    setIsSubmitting(true);
    setTwoFactorError('');

    try {
      const result = await window.electron.auth.verifyTwoFactorCode(twoFactorCode);
      if (result.success) {
        onUnlock();
      } else {
        setTwoFactorError('Invalid code. Please try again.');
      }
    } catch (error) {
      setTwoFactorError('Error verifying code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <LockContainer>
      <TimeDisplay>
        <CurrentTime>{formatTime(currentTime)}</CurrentTime>
        <CurrentDate>{formatDate(currentTime)}</CurrentDate>
      </TimeDisplay>

      <LockForm>
        <LockIcon>
          <FaLock />
        </LockIcon>
        
        <LockTitle>Application Locked</LockTitle>
        <LockMessage>
          {showTwoFactor 
            ? 'Enter the code from your authenticator app' 
            : 'Enter your password to unlock the application'}
        </LockMessage>

        {!showTwoFactor ? (
          <form onSubmit={handlePasswordSubmit}>
            <InputWrapper>
              <PasswordInput
                type={showPassword ? 'text' : 'password'}
                value={inputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
                placeholder="Enter password"
                error={error}
                autoFocus
              />
              <PasswordToggle
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </PasswordToggle>
            </InputWrapper>

            {error && (
              <ErrorMessage>
                <FaExclamationTriangle />
                {error}
              </ErrorMessage>
            )}

            <ButtonGroup>
              <UnlockButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? <LoadingIndicator /> : <FaUnlock />}
                {isSubmitting ? 'Checking...' : 'Unlock'}
              </UnlockButton>
            </ButtonGroup>

            {onForgotPassword && (
              <ForgotPasswordLink onClick={onForgotPassword}>
                <FaQuestion />
                Forgot Password?
              </ForgotPasswordLink>
            )}
          </form>
        ) : (
          <TwoFactorSection $show={showTwoFactor}>
            <TwoFactorTitle>Two-Factor Authentication</TwoFactorTitle>
            <form onSubmit={handleTwoFactorSubmit}>
              <InputWrapper>
                <TwoFactorInput
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength="6"
                  error={twoFactorError}
                  autoFocus
                />
              </InputWrapper>

              {twoFactorError && (
                <ErrorMessage>
                  <FaExclamationTriangle />
                  {twoFactorError}
                </ErrorMessage>
              )}

              <ButtonGroup>
                <UnlockButton 
                  type="button" 
                  onClick={() => {
                    setShowTwoFactor(false);
                    setInputPassword('');
                    setTwoFactorCode('');
                    setTwoFactorError('');
                  }}
                  style={{background: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)'}}
                >
                  <FaArrowLeft />
                  Back
                </UnlockButton>
                <UnlockButton type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <LoadingIndicator /> : <FaUnlock />}
                  {isSubmitting ? 'Verifying...' : 'Unlock'}
                </UnlockButton>
              </ButtonGroup>
            </form>
          </TwoFactorSection>
        )}

        <LockInfo>
          <FaInfo />
          Application automatically locks for security
        </LockInfo>
      </LockForm>

      <SecurityMessage>
        <FaShieldAlt />
        Your files are protected with end-to-end encryption
      </SecurityMessage>
    </LockContainer>
  );
};

export default LockScreen;