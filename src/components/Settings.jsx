import React, { useState, useEffect } from 'react';
import { styled } from 'styled-components';
import { FaCog, FaLock, FaClock, FaKey, FaSave, FaTimes, FaCheck, FaExclamationTriangle, FaInfoCircle, FaMobileAlt, FaShieldAlt, FaVirus } from 'react-icons/fa';
import TwoFactorSettings from './TwoFactorSettings';
import SecurityDashboard from './SecurityDashboard';
import VirusTotalSettings from './VirusTotalSettings';

// Enhanced password validation component
const PasswordValidator = ({ password, onValidationChange }) => {
  const [validation, setValidation] = useState(null);

  useEffect(() => {
    if (!password) {
      setValidation(null);
      onValidationChange?.(null);
      return;
    }

    // Use the new security API for password validation
    window.electron.security.validatePassword(password)
      .then(result => {
        if (result.success) {
          setValidation(result.data);
          onValidationChange?.(result.data);
        }
      })
      .catch(err => {
        console.error('Password validation error:', err);
      });
  }, [password, onValidationChange]);

  if (!validation) return null;

  return (
    <ValidationContainer>
      <ValidationHeader $isValid={validation.isValid}>
        {validation.isValid ? <FaCheck /> : <FaExclamationTriangle />}
        Password Strength: {validation.isValid ? 'Strong' : 'Weak'}
      </ValidationHeader>
      <ValidationScore>
        <ScoreBar>
          <ScoreFill $score={validation.score} />
        </ScoreBar>
        <ScoreText>Score: {validation.score}/6</ScoreText>
      </ValidationScore>
      {validation.issues.length > 0 && (
        <ValidationIssues>
          <IssuesTitle>Issues to fix:</IssuesTitle>
          {validation.issues.map((issue, index) => (
            <ValidationIssue key={index}>
              <FaExclamationTriangle />
              {issue}
            </ValidationIssue>
          ))}
        </ValidationIssues>
      )}
    </ValidationContainer>
  );
};

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
    margin-bottom: 16px;
    gap: 12px;
  }

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
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
  }

  @media (max-width: 480px) {
    font-size: 1.25rem;
    text-align: center;
    justify-content: center;
  }
`;

const SettingsCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
  overflow: hidden;

  @media (max-width: 768px) {
    margin-bottom: 16px;
    border-radius: 6px;
  }

  @media (max-width: 480px) {
    margin-bottom: 12px;
    border-radius: 4px;
  }
`;

const CardHeader = styled.div`
  background-color: #f8f9fa;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eaeaea;

  @media (max-width: 768px) {
    padding: 12px 16px;
  }

  @media (max-width: 480px) {
    padding: 12px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
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
  }

  @media (max-width: 480px) {
    font-size: 15px;
  }
`;

const CardContent = styled.div`
  padding: 24px;

  @media (max-width: 768px) {
    padding: 16px;
  }

  @media (max-width: 480px) {
    padding: 12px;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 768px) {
    margin-bottom: 16px;
  }

  @media (max-width: 480px) {
    margin-bottom: 12px;
  }
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #34495e;

  @media (max-width: 768px) {
    font-size: 14px;
  }

  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const Description = styled.div`
  color: #7f8c8d;
  font-size: 14px;
  margin-bottom: 12px;

  @media (max-width: 768px) {
    font-size: 13px;
    margin-bottom: 10px;
  }

  @media (max-width: 480px) {
    font-size: 12px;
    margin-bottom: 8px;
  }
`;

const InputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: 768px) {
    gap: 10px;
  }

  @media (max-width: 576px) {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
`;

const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border 0.3s ease;
  width: 100%;

  &:focus {
    border-color: #3498db;
    outline: none;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }

  @media (max-width: 768px) {
    padding: 8px 10px;
    font-size: 13px;
    border-radius: 4px;
  }

  @media (max-width: 480px) {
    padding: 8px;
    font-size: 14px;
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

  @media (max-width: 768px) {
    padding: 8px 10px;
    font-size: 13px;
    border-radius: 4px;
    min-width: 120px;
  }

  @media (max-width: 576px) {
    width: 100%;
    min-width: auto;
  }

  @media (max-width: 480px) {
    padding: 8px;
    font-size: 14px;
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

  @media (max-width: 768px) {
    padding: 8px 12px;
    font-size: 14px;
    gap: 6px;
    border-radius: 4px;

    &:hover {
      transform: none;
    }

    &:active {
      transform: none;
    }
  }

  @media (max-width: 576px) {
    width: 100%;
  }

  @media (max-width: 480px) {
    padding: 10px 12px;
    font-size: 14px;
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

// Validation components styles
const ValidationContainer = styled.div`
  margin-top: 10px;
  padding: 15px;
  border-radius: 6px;
  background: ${props => props.isValid ? '#e8f5e8' : '#fff3e0'};
  border: 1px solid ${props => props.isValid ? '#4caf50' : '#ff9800'};
`;

const ValidationHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  color: ${props => props.$isValid ? '#2e7d32' : '#e65100'};
  margin-bottom: 10px;
`;

const ValidationScore = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
`;

const ScoreBar = styled.div`
  flex: 1;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
`;

const ScoreFill = styled.div`
  height: 100%;
  width: ${props => (props.$score / 6) * 100}%;
  background: ${props => {
    if (props.$score >= 5) return '#4caf50';
    if (props.$score >= 3) return '#ff9800';
    return '#f44336';
  }};
  transition: width 0.3s ease, background 0.3s ease;
`;

const ScoreText = styled.span`
  font-size: 12px;
  color: #666;
  font-weight: bold;
`;

const ValidationIssues = styled.div`
  margin-top: 10px;
`;

const IssuesTitle = styled.div`
  font-size: 14px;
  font-weight: bold;
  color: #e65100;
  margin-bottom: 8px;
`;

const ValidationIssue = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #d84315;
  margin-bottom: 4px;

  svg {
    font-size: 12px;
  }
`;

// Tab styles
const TabContainer = styled.div`
  display: flex;
  border-bottom: 2px solid #e0e0e0;
  margin-bottom: 24px;
  background: white;
  border-radius: 8px 8px 0 0;
  overflow: hidden;
`;

const TabButton = styled.button`
  flex: 1;
  padding: 16px 24px;
  border: none;
  background: ${props => props.$active ? '#2196f3' : '#f5f5f5'};
  color: ${props => props.$active ? 'white' : '#666'};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    background: ${props => props.$active ? '#1976d2' : '#e0e0e0'};
  }

  &:not(:last-child) {
    border-right: 1px solid #e0e0e0;
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
  const [passwordValidation, setPasswordValidation] = useState(null);
  const [activeTab, setActiveTab] = useState('security'); // security, privacy, advanced
  const [securityDashboardVisible, setSecurityDashboardVisible] = useState(false);

  useEffect(() => {
    // Load settings from local storage or settings service
    loadSettings();
  }, []);

  const handlePasswordValidation = (validation) => {
    setPasswordValidation(validation);
  };

  const validatePasswordsMatch = () => {
    if (lockPassword && confirmPassword && lockPassword !== confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Passwords do not match'
      });
      return false;
    }
    return true;
  };

  const validatePasswordStrength = () => {
    if (lockPassword && passwordValidation && !passwordValidation.isValid) {
      setMessage({
        type: 'error',
        text: 'Password is not strong enough. Please address the issues shown above.'
      });
      return false;
    }
    return true;
  };

  const loadSettings = async () => {
    try {
      setIsLoading(true);

      // Check if secure storage has any saved settings
      try {
        const stats = await window.electronAPI.secureStorage.getStats();
        if (stats.success && stats.stats.hasDataFile) {
          console.log('Found saved settings, but password is required to access them');
          // We have saved settings but can't access them without the master password
          // User will need to enter password first
        } else {
          console.log('No saved settings found, using defaults');
        }
      } catch (error) {
        console.warn('Could not check for saved settings:', error);
      }

      // For security reasons, we don't pre-load the password
      // The user will need to re-enter it each time they change settings
      // This is intentional for security

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

      if (!validatePasswordsMatch()) {
        return;
      }

      if (!validatePasswordStrength()) {
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

      // Initialize secure storage with the password if it's provided
      if (securitySettings.password && securitySettings.password.length >= 8) {
        try {
          const initResult = await window.electronAPI.secureStorage.initialize(securitySettings.password);
          if (!initResult.success) {
            throw new Error('Failed to initialize secure storage');
          }

          // Save settings to secure storage (without the password for security)
          const settingsToSave = {
            ...securitySettings,
            password: '' // Don't save the actual password
          };

          const storeResult = await window.electronAPI.secureStorage.store('securitySettings', JSON.stringify(settingsToSave));
          if (!storeResult.success) {
            throw new Error('Failed to save settings to secure storage');
          }

          // Save a flag indicating that a password has been set
          await window.electronAPI.secureStorage.store('hasPassword', 'true');

          console.log('Settings saved to secure storage successfully');

        } catch (storageError) {
          console.error('Failed to save to secure storage:', storageError);
          setMessage({
            type: 'error',
            text: 'Failed to save settings securely: ' + storageError.message
          });
          return;
        }
      }

      // Dispatch a custom event that App.js can listen to
      window.dispatchEvent(new CustomEvent('securitySettingsChanged', {
        detail: securitySettings
      }));

      setMessage({
        type: 'success',
        text: 'Security settings saved successfully and will persist between application restarts'
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

      <TabContainer>
        <TabButton
          $active={activeTab === 'security'}
          onClick={() => setActiveTab('security')}
        >
          <FaLock /> Security
        </TabButton>
        <TabButton
          $active={activeTab === 'privacy'}
          onClick={() => setActiveTab('privacy')}
        >
          <FaShieldAlt /> Privacy
        </TabButton>
        <TabButton
          $active={activeTab === 'virustotal'}
          onClick={() => setActiveTab('virustotal')}
        >
          <FaVirus /> VirusTotal
        </TabButton>
        <TabButton
          $active={activeTab === 'dashboard'}
          onClick={() => setActiveTab('dashboard')}
        >
          <FaShieldAlt /> Security Dashboard
        </TabButton>
      </TabContainer>

      {activeTab === 'security' && (
        <>
          <SettingsCard>
            <CardHeader>
              <CardTitle>
                <FaLock /> Auto-Lock Settings
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
                <Label>Master Password</Label>
                <Description>
                  Set the master password for your secure file manager. This password will be used for authentication and data encryption.
                </Description>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <InputContainer>
                    <Input
                      type="password"
                      value={lockPassword}
                      onChange={(e) => setLockPassword(e.target.value)}
                      placeholder="Enter master password"
                    />
                  </InputContainer>
                  <InputContainer>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm master password"
                    />
                  </InputContainer>
                  <PasswordValidator
                    password={lockPassword}
                    onValidationChange={(validation) => setPasswordValidation(validation)}
                  />
                </div>
              </FormGroup>
            </>
          )}

          <Button
            $primary
            onClick={saveSettings}
            disabled={isLoading}
          >
            <FaSave /> Save Settings
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
        </>
      )}

      {activeTab === 'privacy' && (
        <SettingsCard>
          <CardHeader>
            <CardTitle>
              <FaShieldAlt /> Privacy Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormGroup>
              <Label>Data Storage</Label>
              <Description>
                All sensitive data is encrypted and stored locally. No data is sent to external servers.
              </Description>
            </FormGroup>

            <FormGroup>
              <Label>Session Management</Label>
              <Description>
                Sessions automatically expire after inactivity to protect your data.
              </Description>
            </FormGroup>
          </CardContent>
        </SettingsCard>
      )}

      {activeTab === 'virustotal' && (
        <VirusTotalSettings />
      )}

      {activeTab === 'dashboard' && (
        <SecurityDashboard />
      )}
    </Container>
  );
}

export default Settings;