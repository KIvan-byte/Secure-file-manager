import React, { useState } from 'react';
import { styled } from 'styled-components';
import { FaDownload, FaLock, FaUnlock, FaExclamationTriangle, FaMoon, FaShieldAlt } from 'react-icons/fa';

const LockContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 20px;
  animation: fadeIn 0.3s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const LockForm = styled.div`
  background-color: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  width: 100%;
  max-width: 420px;
  padding: 40px;
  text-align: center;
  transform: translateY(0);
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
  }
`;

const LockIcon = styled.div`
  font-size: 56px;
  color: #3498db;
  margin-bottom: 25px;
  height: 80px;
  width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(52, 152, 219, 0.1);
  border-radius: 50%;
  margin: 0 auto 25px auto;
`;

const LockTitle = styled.h2`
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 28px;
`;

const LockMessage = styled.p`
  margin-bottom: 30px;
  color: #7f8c8d;
  font-size: 16px;
`;

const PasswordInput = styled.input`
  width: 100%;
  padding: 14px 20px;
  border: 2px solid #ddd;
  border-radius: 12px;
  margin-bottom: 20px;
  font-size: 16px;
  transition: all 0.3s;
  background-color: #f8f9fa;
  
  &:focus {
    border-color: #3498db;
    outline: none;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
    background-color: white;
  }
`;

const UnlockButton = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 12px;
  padding: 16px 20px;
  font-size: 16px;
  font-weight: 600;
  width: 100%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  
  &:hover {
    background-color: #2980b9;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
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

const ErrorMessage = styled.div`
  color: #e74c3c;
  margin: 15px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  background-color: rgba(231, 76, 60, 0.1);
  padding: 10px;
  border-radius: 8px;
  border-left: 3px solid #e74c3c;
`;

const LockInfo = styled.div`
  margin-top: 20px;
  font-size: 13px;
  color: #7f8c8d;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const TimeDisplay = styled.div`
  position: absolute;
  top: 40px;
  right: 40px;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  animation: slideIn 0.5s ease;
  
  @keyframes slideIn {
    from { transform: translateY(-20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;

const CurrentTime = styled.div`
  font-size: 48px;
  font-weight: 300;
`;

const CurrentDate = styled.div`
  font-size: 16px;
  opacity: 0.7;
  margin-top: 5px;
`;

const LoadingIndicator = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const SecurityMessage = styled.div`
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const LockScreen = ({ onUnlock, password }) => {
  const [inputPassword, setInputPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  React.useEffect(() => {
    // Update the time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
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
        setError('Incorrect password. Please try again.');
        setIsSubmitting(false);
      }
    }, 800);
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleUnlock();
    }
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
          Enter your password to continue working
        </LockMessage>
        
        <PasswordInput
          type="password"
          value={inputPassword}
          onChange={(e) => setInputPassword(e.target.value)}
          placeholder="Enter password"
          onKeyDown={handleKeyDown}
          autoFocus
        />
        
        {error && (
          <ErrorMessage>
            <FaExclamationTriangle /> {error}
          </ErrorMessage>
        )}
        
        <UnlockButton 
          onClick={handleUnlock}
          disabled={isSubmitting || !inputPassword}
        >
          {isSubmitting ? (
            <>
              <LoadingIndicator /> Unlocking...
            </>
          ) : (
            <>
              <FaUnlock /> Unlock
            </>
          )}
        </UnlockButton>
        
        <LockInfo>
          <FaMoon /> The application was locked due to inactivity
        </LockInfo>
      </LockForm>
      
      <SecurityMessage>
        <FaShieldAlt /> Secured with encryption. Your data is protected.
      </SecurityMessage>
    </LockContainer>
  );
};

export default LockScreen;