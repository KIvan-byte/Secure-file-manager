import React, { useState, useEffect } from 'react';
import { styled } from 'styled-components';
import { FaShieldAlt, FaEye, FaEyeSlash, FaCheck, FaTimes, FaSpinner, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

const VirusTotalSettings = ({ onSettingsChange }) => {
  const [settings, setSettings] = useState({
    enabled: false,
    apiKey: '',
    autoScan: false,
    scanOnDownload: true,
    scanOnUpload: false,
    maxFileSize: 32 // MB
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      if (window.electron && window.electron.security && window.electron.security.getVirusTotalSettings) {
        const result = await window.electron.security.getVirusTotalSettings();
        if (result.success) {
          setSettings(result.data);
          // If API key exists, validate it
          if (result.data.apiKey) {
            const validation = await validateApiKey(result.data.apiKey);
            setValidationResult(validation);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load VirusTotal settings:', error);
    }
  };

  const validateApiKey = async (apiKey) => {
    if (!apiKey || apiKey.length < 10) {
      return { valid: false, message: 'API key is too short' };
    }

    setIsValidating(true);
    try {
      if (window.electron && window.electron.virusTotalValidateApiKey) {
        const result = await window.electron.virusTotalValidateApiKey(apiKey);
        if (result.success) {
          if (result.valid) {
            return {
              valid: true,
              message: `API key valid${result.userInfo ? ` - User: ${result.userInfo.id}` : ''}`,
              userInfo: result.userInfo
            };
          } else {
            return { valid: false, message: result.error || 'Invalid API key' };
          }
        } else {
          return { valid: false, message: result.error || 'Failed to validate API key' };
        }
      }
    } catch (error) {
      return { valid: false, message: 'Failed to validate API key' };
    } finally {
      setIsValidating(false);
    }
  };

  const handleSettingChange = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    // Validate API key when it changes
    if (key === 'apiKey' && value) {
      const result = await validateApiKey(value);
      setValidationResult(result);
    }

    // Call parent callback
    if (onSettingsChange) {
      onSettingsChange(newSettings);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // If VirusTotal is enabled, ensure API key is provided
      if (settings.enabled && !settings.apiKey) {
        setSaveMessage({
          type: 'error',
          text: 'API key is required when VirusTotal is enabled'
        });
        return;
      }

      if (window.electron && window.electron.security && window.electron.security.setVirusTotalSettings) {
        const result = await window.electron.security.setVirusTotalSettings(settings);
        if (result.success) {
          setSaveMessage({
            type: 'success',
            text: 'VirusTotal settings saved successfully'
          });
          console.log('VirusTotal settings saved');
        } else {
          setSaveMessage({
            type: 'error',
            text: result.error || 'Failed to save settings'
          });
        }
      } else {
        setSaveMessage({
          type: 'error',
          text: 'VirusTotal API not available'
        });
      }
    } catch (error) {
      console.error('Failed to save VirusTotal settings:', error);
      setSaveMessage({
        type: 'error',
        text: 'Failed to save VirusTotal settings: ' + error.message
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <VirusTotalContainer>
      <Header>
        <Title>
          <FaShieldAlt />
          VirusTotal Integration
        </Title>
        <StatusBadge $enabled={settings.enabled}>
          {settings.enabled ? 'Enabled' : 'Disabled'}
        </StatusBadge>
      </Header>

      <Content>
        {saveMessage && (
          <SaveMessage $type={saveMessage.type}>
            {saveMessage.type === 'success' ? <FaCheck /> : <FaExclamationTriangle />}
            {saveMessage.text}
            <CloseButton onClick={() => setSaveMessage(null)}>
              <FaTimes />
            </CloseButton>
          </SaveMessage>
        )}

        <FormGroup>
          <Label>
            <CheckboxContainer>
              <Checkbox
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => handleSettingChange('enabled', e.target.checked)}
              />
              <CheckboxLabel>Enable VirusTotal scanning</CheckboxLabel>
            </CheckboxContainer>
          </Label>
          <Description>
            When enabled, files can be scanned using VirusTotal's extensive malware detection database.
          </Description>
        </FormGroup>

        {settings.enabled && (
          <>
            <FormGroup>
              <Label>VirusTotal API Key</Label>
              <Description>
                Get your free API key from <a href="https://www.virustotal.com/gui/join-us" target="_blank" rel="noopener noreferrer">VirusTotal</a>
              </Description>
              <InputGroup>
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  value={settings.apiKey}
                  onChange={(e) => handleSettingChange('apiKey', e.target.value)}
                  placeholder="Enter your VirusTotal API key"
                  disabled={isSaving}
                />
                <IconButton
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  title={showApiKey ? 'Hide API key' : 'Show API key'}
                >
                  {showApiKey ? <FaEyeSlash /> : <FaEye />}
                </IconButton>
              </InputGroup>

              {isValidating && (
                <ValidationMessage $type="info">
                  <FaSpinner className="spinning" />
                  Validating API key...
                </ValidationMessage>
              )}

              {validationResult && !isValidating && (
                <ValidationMessage $type={validationResult.valid ? 'success' : 'error'}>
                  {validationResult.valid ? <FaCheck /> : <FaTimes />}
                  {validationResult.message}
                </ValidationMessage>
              )}
            </FormGroup>

            <FormGroup>
              <Label>Scan Options</Label>
              <CheckboxGroup>
                <CheckboxContainer>
                  <Checkbox
                    type="checkbox"
                    checked={settings.autoScan}
                    onChange={(e) => handleSettingChange('autoScan', e.target.checked)}
                  />
                  <CheckboxLabel>Auto-scan new files</CheckboxLabel>
                </CheckboxContainer>
                <CheckboxContainer>
                  <Checkbox
                    type="checkbox"
                    checked={settings.scanOnDownload}
                    onChange={(e) => handleSettingChange('scanOnDownload', e.target.checked)}
                  />
                  <CheckboxLabel>Scan files on download</CheckboxLabel>
                </CheckboxContainer>
                <CheckboxContainer>
                  <Checkbox
                    type="checkbox"
                    checked={settings.scanOnUpload}
                    onChange={(e) => handleSettingChange('scanOnUpload', e.target.checked)}
                  />
                  <CheckboxLabel>Scan files on upload/share</CheckboxLabel>
                </CheckboxContainer>
              </CheckboxGroup>
            </FormGroup>

            <FormGroup>
              <Label>Maximum file size for scanning</Label>
              <Description>
                VirusTotal has a 32MB limit for file uploads. Larger files will be skipped.
              </Description>
              <Select
                value={settings.maxFileSize}
                onChange={(e) => handleSettingChange('maxFileSize', parseInt(e.target.value))}
              >
                <option value="8">8 MB</option>
                <option value="16">16 MB</option>
                <option value="32">32 MB</option>
              </Select>
            </FormGroup>

            <InfoBox>
              <FaInfoCircle />
              <div>
                <strong>Important:</strong> VirusTotal is a third-party service. Files sent for scanning
                will be uploaded to VirusTotal's servers and may be stored for analysis.
                Do not scan sensitive or confidential files.
              </div>
            </InfoBox>
          </>
        )}

        <ButtonGroup>
          <SaveButton
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <FaSpinner className="spinning" /> : <FaCheck />}
            {isSaving ? 'Saving...' : 'Save Settings'}
          </SaveButton>
        </ButtonGroup>
      </Content>
    </VirusTotalContainer>
  );
};

// Styled Components
const VirusTotalContainer = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 20px;
`;

const Header = styled.div`
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px 8px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h3`
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
`;

const StatusBadge = styled.span`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => props.$enabled ? '#28a745' : '#6c757d'};
  color: white;
`;

const Content = styled.div`
  padding: 20px;
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
  color: #2c3e50;
`;

const Description = styled.p`
  font-size: 14px;
  color: #6c757d;
  margin: 5px 0 10px 0;
  line-height: 1.4;

  a {
    color: #007bff;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const InputGroup = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const Input = styled.input`
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
  }

  &:disabled {
    background: #f8f9fa;
    cursor: not-allowed;
  }
`;

const IconButton = styled.button`
  background: none;
  border: none;
  padding: 12px;
  color: #6c757d;
  cursor: pointer;
  margin-left: 8px;

  &:hover {
    color: #495057;
  }
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
`;

const CheckboxGroup = styled.div`
  margin-top: 10px;
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
`;

const CheckboxLabel = styled.span`
  font-size: 14px;
  color: #495057;
  cursor: pointer;
`;

const Select = styled.select`
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background: white;

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
  }
`;

const ValidationMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;

  ${props => {
    if (props.$type === 'success') {
      return `
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
      `;
    } else if (props.$type === 'error') {
      return `
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      `;
    } else {
      return `
        background: #d1ecf1;
        color: #0c5460;
        border: 1px solid #bee5eb;
      `;
    }
  }}

  .spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const InfoBox = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  color: #856404;
  font-size: 14px;
  margin-top: 15px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
`;

const SaveMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  padding: 12px 16px;
  border-radius: 4px;
  font-size: 14px;
  position: relative;

  ${props => {
    if (props.$type === 'success') {
      return `
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
      `;
    } else {
      return `
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      `;
    }
  }}
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: currentColor;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  margin-left: auto;
  display: flex;
  align-items: center;

  &:hover {
    opacity: 0.7;
  }
`;

const SaveButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    background: #218838;
    transform: translateY(-1px);
  }

  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }

  .spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export default VirusTotalSettings;
