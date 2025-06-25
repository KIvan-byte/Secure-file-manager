import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaShieldAlt, FaExclamationTriangle, FaEye, FaLock, FaClock, FaTrash, FaSync, FaInfoCircle } from 'react-icons/fa';

const SecurityDashboard = () => {
  const [securityStats, setSecurityStats] = useState(null);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEvents, setShowEvents] = useState(false);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      
      // Get security statistics
      const statsResult = await window.electron.security.getStats();
      if (statsResult.success) {
        setSecurityStats(statsResult.data);
      }
      
      // Get recent security events
      const eventsResult = await window.electron.security.getEvents(100);
      if (eventsResult.success) {
        setSecurityEvents(eventsResult.data);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error loading security data:', err);
      setError('Failed to load security data');
    } finally {
      setLoading(false);
    }
  };

  const clearSecurityEvents = async () => {
    try {
      const result = await window.electron.security.clearEvents();
      if (result.success) {
        setSecurityEvents([]);
      }
    } catch (err) {
      console.error('Error clearing security events:', err);
    }
  };

  const getSeverityColor = (eventType) => {
    const highSeverity = ['auto_blocked_suspicious', 'path_traversal_attempt', 'csrf_violation'];
    const mediumSeverity = ['rate_limit_exceeded', '2fa_failed_attempt', 'failed_auth'];
    
    if (highSeverity.includes(eventType)) return '#f44336';
    if (mediumSeverity.includes(eventType)) return '#ff9800';
    return '#4caf50';
  };

  const formatEventType = (eventType) => {
    return eventType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  useEffect(() => {
    loadSecurityData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadSecurityData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Container>
        <SettingsCard>
          <CardContent>
            <LoadingIndicator>
              <FaLock />
              <span>Loading security data...</span>
            </LoadingIndicator>
          </CardContent>
        </SettingsCard>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <SettingsCard>
          <CardContent>
            <ErrorMessage>
              <FaExclamationTriangle />
              <span>{error}</span>
            </ErrorMessage>
          </CardContent>
        </SettingsCard>
      </Container>
    );
  }

  return (
    <Container>
      {/* Security Statistics Card */}
      <SettingsCard>
        <CardHeader>
          <CardTitle>
            <FaShieldAlt /> Security Statistics
          </CardTitle>
          <RefreshButton onClick={loadSecurityData}>
            <FaSync /> Refresh
          </RefreshButton>
        </CardHeader>
        <CardContent>
          {securityStats && (
            <StatsGrid>
              <StatItem>
                <StatIcon style={{ color: '#4caf50' }}>
                  <FaShieldAlt />
                </StatIcon>
                <StatContent>
                  <StatValue>{securityStats.security.rateLimits}</StatValue>
                  <StatLabel>Active Rate Limits</StatLabel>
                </StatContent>
              </StatItem>

              <StatItem>
                <StatIcon style={{ color: '#2196f3' }}>
                  <FaLock />
                </StatIcon>
                <StatContent>
                  <StatValue>{securityStats.security.csrfTokens}</StatValue>
                  <StatLabel>CSRF Tokens</StatLabel>
                </StatContent>
              </StatItem>

              <StatItem>
                <StatIcon style={{ color: '#f44336' }}>
                  <FaExclamationTriangle />
                </StatIcon>
                <StatContent>
                  <StatValue>{securityStats.security.blockedClients}</StatValue>
                  <StatLabel>Blocked Clients</StatLabel>
                </StatContent>
              </StatItem>

              <StatItem>
                <StatIcon style={{ color: '#ff9800' }}>
                  <FaEye />
                </StatIcon>
                <StatContent>
                  <StatValue>{securityStats.security.suspiciousClients}</StatValue>
                  <StatLabel>Suspicious Activity</StatLabel>
                </StatContent>
              </StatItem>

              <StatItem>
                <StatIcon style={{ color: '#9c27b0' }}>
                  <FaClock />
                </StatIcon>
                <StatContent>
                  <StatValue>{securityStats.security.recentEvents}</StatValue>
                  <StatLabel>Recent Events</StatLabel>
                </StatContent>
              </StatItem>

              <StatItem>
                <StatIcon style={{ color: '#607d8b' }}>
                  <FaLock />
                </StatIcon>
                <StatContent>
                  <StatValue>{securityStats.storage.sessionActive ? 'Active' : 'Inactive'}</StatValue>
                  <StatLabel>Secure Storage</StatLabel>
                </StatContent>
              </StatItem>
            </StatsGrid>
          )}

          <InfoBox>
            <FaInfoCircle style={{ marginRight: '8px' }} />
            Security statistics are updated in real-time. High numbers in blocked clients or suspicious activity may indicate potential threats.
          </InfoBox>
        </CardContent>
      </SettingsCard>

      {/* Security Events Card */}
      <SettingsCard>
        <CardHeader>
          <CardTitle>
            <FaClock /> Security Events ({securityEvents.length})
          </CardTitle>
          <EventActions>
            <ToggleButton onClick={() => setShowEvents(!showEvents)}>
              {showEvents ? 'Hide Events' : 'Show Events'}
            </ToggleButton>
            {securityEvents.length > 0 && (
              <ClearButton onClick={clearSecurityEvents}>
                <FaTrash /> Clear Events
              </ClearButton>
            )}
          </EventActions>
        </CardHeader>

        {showEvents && (
          <CardContent>
            {securityEvents.length === 0 ? (
              <NoEvents>
                <FaShieldAlt />
                <span>No security events recorded</span>
              </NoEvents>
            ) : (
              <EventsList>
                {securityEvents.map((event, index) => (
                  <EventItem key={index}>
                    <EventIndicator $color={getSeverityColor(event.type)} />
                    <EventContent>
                      <EventHeader>
                        <EventType>{formatEventType(event.type)}</EventType>
                        <EventTime>{formatTimestamp(event.timestamp)}</EventTime>
                      </EventHeader>
                      {event.details && Object.keys(event.details).length > 0 && (
                        <EventDetails>
                          {Object.entries(event.details).map(([key, value]) => (
                            <DetailItem key={key}>
                              <strong>{key}:</strong> {JSON.stringify(value)}
                            </DetailItem>
                          ))}
                        </EventDetails>
                      )}
                    </EventContent>
                  </EventItem>
                ))}
              </EventsList>
            )}
          </CardContent>
        )}
      </SettingsCard>
    </Container>
  );
};

// Styled components matching Settings.jsx style
const Container = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    padding: 16px 12px;
  }
  
  @media (max-width: 480px) {
    padding: 12px 8px;
  }
`;

// Using exact same components as Settings.jsx for consistency
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
  flex-wrap: wrap;
  gap: 12px;
  
  @media (max-width: 768px) {
    padding: 12px 16px;
    gap: 8px;
  }
  
  @media (max-width: 480px) {
    padding: 12px;
    flex-direction: column;
    align-items: stretch;
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
    justify-content: center;
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

const LoadingIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
  color: #7f8c8d;
  font-size: 16px;
  
  svg {
    animation: spin 1s linear infinite;
    color: #3498db;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 6px;
  color: #c62828;
  font-size: 14px;
  
  svg {
    color: #f44336;
  }
`;

const RefreshButton = styled.button`
  background: #3498db;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #2980b9;
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  transition: all 0.2s ease;
  
  &:hover {
    background: #e3f2fd;
    border-color: #3498db;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.15);
  }
`;

const StatIcon = styled.div`
  font-size: 20px;
  padding: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  min-height: 40px;
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatValue = styled.div`
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: #7f8c8d;
  font-weight: 500;
`;

const InfoBox = styled.div`
  padding: 15px;
  border-radius: 6px;
  background-color: #f8f9fa;
  border-left: 4px solid #3498db;
  color: #34495e;
  font-size: 14px;
  display: flex;
  align-items: flex-start;
  
  svg {
    color: #3498db;
    margin-top: 2px;
    flex-shrink: 0;
  }
`;

const EventActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const ToggleButton = styled.button`
  background: #95a5a6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #7f8c8d;
  }
`;

const ClearButton = styled.button`
  background: #e74c3c;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #c0392b;
  }
`;

const NoEvents = styled.div`
  padding: 40px;
  text-align: center;
  color: #7f8c8d;
  font-style: italic;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  
  svg {
    font-size: 32px;
    color: #bdc3c7;
  }
`;

const EventsList = styled.div`
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e9ecef;
  border-radius: 6px;
`;

const EventItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s ease;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: #f8f9fa;
  }
`;

const EventIndicator = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${props => props.$color};
  margin-top: 6px;
  flex-shrink: 0;
  box-shadow: 0 0 0 3px ${props => `${props.$color}20`};
`;

const EventContent = styled.div`
  flex: 1;
`;

const EventHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  
  @media (max-width: 576px) {
    flex-direction: column;
    gap: 4px;
  }
`;

const EventType = styled.div`
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
`;

const EventTime = styled.div`
  font-size: 12px;
  color: #7f8c8d;
  font-weight: 500;
`;

const EventDetails = styled.div`
  font-size: 12px;
  color: #34495e;
  background: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
  border-left: 3px solid #e9ecef;
`;

const DetailItem = styled.div`
  margin-bottom: 4px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  strong {
    color: #2c3e50;
    font-weight: 600;
  }
`;

export default SecurityDashboard;
