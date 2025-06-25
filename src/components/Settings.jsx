import React, { useState, useEffect } from 'react';
import { styled } from 'styled-components';
import { FaCog, FaLock, FaClock, FaKey, FaSave, FaTimes, FaCheck, FaExclamationTriangle, FaInfoCircle, FaMobileAlt } from 'react-icons/fa';
import TwoFactorSettings from './TwoFactorSettings';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 100%;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h2`
  margin: 0;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SettingsCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
  overflow: hidden;
`;

const CardHeader = styled.div`
  background-color: #f8f9fa;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eaeaea;
`;

const CardTitle = styled.h3`
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CardContent = styled.div`
  padding: 24px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #34495e;
`;

const Description = styled.div`
  color: #7f8c8d;
  font-size: 14px;
  margin-bottom: 12px;
`;

const InputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  
  @media (max-width: 576px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
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
`;

const Select = styled.select`
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border 0.3s ease;
  min-width: 150px;
  
  &:focus {
    border-color: #3498db;
    outline: none;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
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
  
  &:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
`;

const SwitchContainer = styled.label`
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
`;

const SwitchInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
  
  &:checked + span {
    background-color: #2ecc71;
  }
  
  &:checked + span:before {
    transform: translateX(24px);
  }
`;

const SwitchSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 34px;
  
  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
  }
`;

const Message = styled.div`
  padding: 15px;
  margin-bottom: 20px;
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

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: currentColor;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  display: flex;
  align-items: center;
  margin-left: auto;
`;

const InfoBox = styled.div`
  padding: 15px;
  margin-top: 20px;
  border-radius: 6px;
  background-color: #f8f9fa;
  border-left: 4px solid #3498db;
  color: #34495e;
  font-size: 14px;
`;

const TimeoutRadio = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
`;

const RadioOption = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background-color: ${props => props.$checked ? '#ebf5fd' : '#f8f9fa'};
  border: 1px solid ${props => props.$checked ? '#3498db' : '#e0e0e0'};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #ebf5fd;
    border-color: #3498db;
  }
  
  input {
    cursor: pointer;
  }
`;

const CustomTimeInput = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
`;

const NumberInput = styled.input`
  width: 80px;
  text-align: center;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  
  &:focus {
    border-color: #3498db;
    outline: none;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
  
  /* Hide spinner buttons */
  &::-webkit-inner-spin-button, 
  &::-webkit-outer-spin-button { 
    -webkit-appearance: none;
    margin: 0;
  }
  &[type=number] {
    -moz-appearance: textfield;
  }
`;

function Settings() {
  const [autoLockEnabled, setAutoLockEnabled] = useState(true);
  const [lockTimeout, setLockTimeout] = useState(5); // minutes
  const [customTimeout, setCustomTimeout] = useState('5');
  const [lockPassword, setLockPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Load settings from local storage or settings service
    loadSettings();
  }, []);
  
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      // Try to get settings from electron
      // This is a placeholder - in a real app, you'd fetch from an actual settings service
      
      /* Uncomment when the settings service is implemented
      const result = await window.electron.settings.getSettings('security');
      if (result.success) {
        const { autoLock, timeout, password } = result.settings;
        setAutoLockEnabled(autoLock ?? true);
        setLockTimeout(timeout ?? 5);
        setLockPassword(password ?? '');
        setConfirmPassword(password ?? '');
      }
      */
      
      // For now, load from localStorage
      const storedSettings = localStorage.getItem('securitySettings');
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        setAutoLockEnabled(parsedSettings.autoLock ?? true);
        
        // Check if timeout is a standard option or custom
        const timeout = parsedSettings.timeout ?? 5;
        if ([1, 5, 10, 15, 30].includes(timeout)) {
          setLockTimeout(timeout);
        } else {
          setLockTimeout('custom');
          setCustomTimeout(timeout.toString());
        }
        
        setLockPassword(parsedSettings.password ?? '');
        setConfirmPassword(parsedSettings.password ?? '');
      }
      
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load security settings: ' + error.message
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveSettings = async () => {
    try {
      // Validate settings
      if (autoLockEnabled && !lockPassword) {
        setMessage({
          type: 'error',
          text: 'Please set a password for auto-lock feature'
        });
        return;
      }
      
      if (lockPassword !== confirmPassword) {
        setMessage({
          type: 'error',
          text: 'Passwords do not match'
        });
        return;
      }
      
      // Validate custom timeout
      if (lockTimeout === 'custom') {
        const customTimeoutValue = parseInt(customTimeout, 10);
        if (isNaN(customTimeoutValue) || customTimeoutValue <= 0) {
          setMessage({
            type: 'error',
            text: 'Please enter a valid timeout value (greater than 0)'
          });
          return;
        }
      }
      
      setIsLoading(true);
      
      const securitySettings = {
        autoLock: autoLockEnabled,
        timeout: lockTimeout === 'custom' ? parseInt(customTimeout, 10) : lockTimeout,
        password: lockPassword
      };
      
      /* Uncomment when the settings service is implemented
      const result = await window.electron.settings.saveSettings('security', securitySettings);
      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Security settings saved successfully'
        });
      } else {
        throw new Error(result.error);
      }
      */
      
      // For now, save to localStorage
      localStorage.setItem('securitySettings', JSON.stringify(securitySettings));
      
      // Dispatch a custom event that App.js can listen to
      window.dispatchEvent(new CustomEvent('securitySettingsChanged', { 
        detail: securitySettings 
      }));
      
      setMessage({
        type: 'success',
        text: 'Security settings saved successfully'
      });
      
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({
        type: 'error',
        text: 'Failed to save security settings: ' + error.message
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Container>
      <Header>
        <Title>
          <FaCog /> Settings
        </Title>
      </Header>
      
      {message && (
        <Message $type={message.type}>
          <MessageIcon>
            {message.type === 'success' ? <FaCheck /> : 
             message.type === 'error' ? <FaExclamationTriangle /> : 
             <FaInfoCircle />}
          </MessageIcon>
          <div>{message.text}</div>
          <CloseButton onClick={() => setMessage(null)}>
            <FaTimes />
          </CloseButton>
        </Message>
      )}
      
      <SettingsCard>
        <CardHeader>
          <CardTitle>
            <FaLock /> Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormGroup>
            <Label>Auto-Lock Application</Label>
            <Description>
              Automatically lock the application after a period of inactivity
            </Description>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <SwitchContainer>
                <SwitchInput 
                  type="checkbox" 
                  checked={autoLockEnabled}
                  onChange={(e) => setAutoLockEnabled(e.target.checked)}
                />
                <SwitchSlider />
              </SwitchContainer>
              <span>{autoLockEnabled ? 'Enabled' : 'Disabled'}</span>
            </div>
          </FormGroup>
          
          {autoLockEnabled && (
            <>
              <FormGroup>
                <Label>Inactivity Timeout</Label>
                <Description>
                  Lock the application after this period of inactivity
                </Description>
                <TimeoutRadio>
                  <RadioOption $checked={lockTimeout === 1}>
                    <input 
                      type="radio" 
                      name="timeout" 
                      value="1"
                      checked={lockTimeout === 1}
                      onChange={() => setLockTimeout(1)}
                    />
                    1 minute
                  </RadioOption>
                  <RadioOption $checked={lockTimeout === 5}>
                    <input 
                      type="radio" 
                      name="timeout" 
                      value="5"
                      checked={lockTimeout === 5}
                      onChange={() => setLockTimeout(5)}
                    />
                    5 minutes
                  </RadioOption>
                  <RadioOption $checked={lockTimeout === 10}>
                    <input 
                      type="radio" 
                      name="timeout" 
                      value="10"
                      checked={lockTimeout === 10}
                      onChange={() => setLockTimeout(10)}
                    />
                    10 minutes
                  </RadioOption>
                  <RadioOption $checked={lockTimeout === 15}>
                    <input 
                      type="radio" 
                      name="timeout" 
                      value="15"
                      checked={lockTimeout === 15}
                      onChange={() => setLockTimeout(15)}
                    />
                    15 minutes
                  </RadioOption>
                  <RadioOption $checked={lockTimeout === 30}>
                    <input 
                      type="radio" 
                      name="timeout" 
                      value="30"
                      checked={lockTimeout === 30}
                      onChange={() => setLockTimeout(30)}
                    />
                    30 minutes
                  </RadioOption>
                  <RadioOption $checked={lockTimeout === 'custom'}>
                    <input 
                      type="radio" 
                      name="timeout" 
                      value="custom"
                      checked={lockTimeout === 'custom'}
                      onChange={() => setLockTimeout('custom')}
                    />
                    Custom
                  </RadioOption>
                </TimeoutRadio>
                {lockTimeout === 'custom' && (
                  <CustomTimeInput>
                    <NumberInput 
                      type="number" 
                      value={customTimeout}
                      onChange={(e) => setCustomTimeout(e.target.value)}
                      min="1"
                      placeholder="Minutes"
                    />
                    <span>minutes</span>
                  </CustomTimeInput>
                )}
              </FormGroup>
              
              <FormGroup>
                <Label>Lock Password</Label>
                <Description>
                  Set the password to unlock the application
                </Description>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <InputContainer>
                    <Input 
                      type="password" 
                      value={lockPassword}
                      onChange={(e) => setLockPassword(e.target.value)}
                      placeholder="Enter lock password"
                    />
                  </InputContainer>
                  <InputContainer>
                    <Input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm lock password"
                    />
                  </InputContainer>
                </div>
              </FormGroup>
            </>
          )}
          
          <Button 
            $primary 
            onClick={saveSettings}
            disabled={isLoading}
          >
            <FaSave /> Save Security Settings
          </Button>
          
          <InfoBox>
            <strong><FaInfoCircle style={{ marginRight: '5px' }} /> Security Information</strong>
            <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
              <li>The auto-lock feature helps protect your data when you step away from your computer</li>
              <li>The application will lock after the specified period of inactivity</li>
              <li>Activity is defined as mouse movement, keyboard input, or button clicks within the application</li>
              <li>Make sure to remember your password, as it cannot be recovered</li>
            </ul>
          </InfoBox>
        </CardContent>
      </SettingsCard>

      <SettingsCard>
        <CardHeader>
          <CardTitle>
            <FaMobileAlt /> Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TwoFactorSettings />
        </CardContent>
      </SettingsCard>
    </Container>
  );
}

export default Settings;