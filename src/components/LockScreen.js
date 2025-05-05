import React, { useState, useEffect } from 'react';
import { styled, keyframes } from 'styled-components';
import { FaLock, FaUnlock, FaExclamationTriangle, FaMoon, FaShieldAlt, FaFingerprint, FaQuestion, FaEye, FaEyeSlash } from 'react-icons/fa';

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
  
  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: white;
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  &:active:after {
    opacity: 0.2;
  }
`;

const BiometricButton = styled(UnlockButton)`
  flex: 0 0 60px;
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  box-shadow: 0 4px 15px rgba(46, 204, 113, 0.3);
  
  &:hover {
    background: linear-gradient(135deg, #219955 0%, #25a25a 100%);
    box-shadow: 0 7px 15px rgba(46, 204, 113, 0.4);
  }
  
  &:disabled {
    background: linear-gradient(135deg, #bdc3c7 0%, #95a5a6 100%);
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

const spin = keyframes`
  to { transform: rotate(360deg); }
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

const AttemptCounter = styled.div`
  color: ${props => props.attempts <= 2 ? '#e74c3c' : '#7f8c8d'};
  font-size: 13px;
  margin-top: 5px;
  text-align: right;
  animation: ${fadeIn} 0.3s ease;
`;

const LockScreen = ({ onUnlock, password, onForgotPassword }) => {
  const [inputPassword, setInputPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attempts, setAttempts] = useState(5);
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  
  useEffect(() => {
    // Update the time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    // Check if biometric auth is available
    // This is a placeholder. In a real app, you'd check actual device capabilities
    const checkBiometricAvailability = () => {
      // Simulate checking biometric capability
      setTimeout(() => {
        // Randomly determine if biometric is available for demo purposes
        const available = Math.random() > 0.5;
        setBiometricAvailable(available);
      }, 500);
    };
    
    checkBiometricAvailability();
    
    return () => clearInterval(timer);
  }, []);
  
  const formatDate = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };
  
  const handleUnlock = () => {
    setIsSubmitting(true);
    setError('');
    
    // Simple timeout to simulate checking
    setTimeout(() => {
      if (inputPassword === password) {
        onUnlock();
      } else {
        setAttempts(prev => prev - 1);
        if (attempts <= 1) {
          setError('Too many failed attempts. Try again in 30 seconds.');
          setTimeout(() => {
            setAttempts(5);
            setError('');
          }, 30000);
        } else {
          setError(`Incorrect password. ${attempts - 1} ${attempts - 1 === 1 ? 'attempt' : 'attempts'} remaining.`);
        }
        setIsSubmitting(false);
      }
    }, 800);
  };
  
  const handleBiometricAuth = () => {
    setIsSubmitting(true);
    setError('');
    
    // Simulate biometric authentication process
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% chance of success for demo
      
      if (success) {
        onUnlock();
      } else {
        setError('Biometric authentication failed. Please try again or use your password.');
        setIsSubmitting(false);
      }
    }, 1500);
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isSubmitting && attempts > 0) {
      handleUnlock();
    }
  };
  
  const handleForgotPassword = () => {
    if (onForgotPassword) {
      onForgotPassword();
    } else {
      alert('Password recovery feature is currently unavailable. Please contact your administrator.');
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  return (
    <LockContainer>
      <TimeDisplay>
        <CurrentTime>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</CurrentTime>
        <CurrentDate>{formatDate(currentTime)}</CurrentDate>
      </TimeDisplay>
      
      <LockForm>
        <LockIcon>
          <FaLock />
        </LockIcon>
        <LockTitle>Application Locked</LockTitle>
        <LockMessage>
          Enter your password to continue working with your secure files
        </LockMessage>
        
        <InputWrapper>
          <PasswordInput
            type={showPassword ? "text" : "password"}
            value={inputPassword}
            onChange={(e) => setInputPassword(e.target.value)}
            placeholder="Enter password"
            onKeyDown={handleKeyDown}
            autoFocus
            error={!!error}
            disabled={isSubmitting || attempts <= 0}
          />
          <PasswordToggle 
            onClick={togglePasswordVisibility} 
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </PasswordToggle>
          {error && attempts <= 2 && attempts > 0 && (
            <AttemptCounter attempts={attempts}>
              {attempts} {attempts === 1 ? 'attempt' : 'attempts'} remaining
            </AttemptCounter>
          )}
        </InputWrapper>
        
        {error && (
          <ErrorMessage>
            <FaExclamationTriangle /> {error}
          </ErrorMessage>
        )}
        
        <ButtonGroup>
          <UnlockButton 
            onClick={handleUnlock}
            disabled={isSubmitting || !inputPassword || attempts <= 0}
          >
            {isSubmitting && !biometricAvailable ? (
              <>
                <LoadingIndicator /> Unlocking...
              </>
            ) : (
              <>
                <FaUnlock /> Unlock
              </>
            )}
          </UnlockButton>
          
          {biometricAvailable && (
            <BiometricButton
              onClick={handleBiometricAuth}
              disabled={isSubmitting || attempts <= 0}
              aria-label="Use fingerprint to unlock"
            >
              {isSubmitting ? <LoadingIndicator /> : <FaFingerprint />}
            </BiometricButton>
          )}
        </ButtonGroup>
        
        <ForgotPasswordLink onClick={handleForgotPassword}>
          <FaQuestion size={12} /> Forgot password?
        </ForgotPasswordLink>
        
        <LockInfo>
          <FaMoon /> Your application was locked for security reasons
        </LockInfo>
      </LockForm>
      
      <SecurityMessage>
        <FaShieldAlt /> Secured with end-to-end encryption. Your data is protected.
      </SecurityMessage>
    </LockContainer>
  );
};

export default LockScreen;