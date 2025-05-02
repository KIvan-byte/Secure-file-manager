import React, { useState } from 'react';
import { styled } from 'styled-components';
import { FaLock, FaUnlock, FaTimes, FaExclamationTriangle } from 'react-icons/fa';

const LockContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(5px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 20px;
`;

const LockForm = styled.div`
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 400px;
  padding: 30px;
  text-align: center;
`;

const LockIcon = styled.div`
  font-size: 48px;
  color: #3498db;
  margin-bottom: 20px;
`;

const LockTitle = styled.h2`
  margin: 0 0 20px 0;
  color: #2c3e50;
`;

const LockMessage = styled.p`
  margin-bottom: 30px;
  color: #7f8c8d;
`;

const PasswordInput = styled.input`
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #ddd;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 16px;
  transition: border-color 0.3s;
  
  &:focus {
    border-color: #3498db;
    outline: none;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const UnlockButton = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px 20px;
  font-size: 16px;
  font-weight: 600;
  width: 100%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #2980b9;
  }
  
  &:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
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
`;

const LockInfo = styled.div`
  margin-top: 20px;
  font-size: 13px;
  color: #7f8c8d;
  text-align: center;
`;

const TimeDisplay = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  color: white;
  font-size: 18px;
  font-weight: 300;
  opacity: 0.7;
`;

const LockScreen = ({ onUnlock, password }) => {
  const [inputPassword, setInputPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  
  React.useEffect(() => {
    // Update the time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  const handleUnlock = () => {
    setIsSubmitting(true);
    setError('');
    
    // Simple timeout to simulate checking
    setTimeout(() => {
      if (inputPassword === password) {
        onUnlock();
      } else {
        setError('Incorrect password');
        setIsSubmitting(false);
      }
    }, 500);
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleUnlock();
    }
  };
  
  return (
    <LockContainer>
      <TimeDisplay>{currentTime}</TimeDisplay>
      
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
          {isSubmitting ? 'Unlocking...' : (
            <>
              <FaUnlock /> Unlock
            </>
          )}
        </UnlockButton>
        
        <LockInfo>
          The application was locked due to inactivity
        </LockInfo>
      </LockForm>
    </LockContainer>
  );
};

export default LockScreen;