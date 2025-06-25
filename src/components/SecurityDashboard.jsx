import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaShieldAlt, FaExclamationTriangle, FaEye, FaLock, FaClock, FaTrash } from 'react-icons/fa';

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
        <LoadingIndicator>
          <FaLock />
          <span>Loading security data...</span>
        </LoadingIndicator>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorMessage>
          <FaExclamationTriangle />
          <span>{error}</span>
        </ErrorMessage>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          <FaShieldAlt />
          Security Dashboard
        </Title>
        <RefreshButton onClick={loadSecurityData}>
          Refresh
        </RefreshButton>
      </Header>

      {securityStats && (
        <StatsGrid>
          <StatCard>
            <StatIcon style={{ color: '#4caf50' }}>
              <FaShieldAlt />
            </StatIcon>
            <StatInfo>
              <StatTitle>Active Rate Limits</StatTitle>
              <StatValue>{securityStats.security.rateLimits}</StatValue>
            </StatInfo>
          </StatCard>

          <StatCard>
            <StatIcon style={{ color: '#2196f3' }}>
              <FaLock />
            </StatIcon>
            <StatInfo>
              <StatTitle>CSRF Tokens</StatTitle>
              <StatValue>{securityStats.security.csrfTokens}</StatValue>
            </StatInfo>
          </StatCard>

          <StatCard>
            <StatIcon style={{ color: '#f44336' }}>
              <FaExclamationTriangle />
            </StatIcon>
            <StatInfo>
              <StatTitle>Blocked Clients</StatTitle>
              <StatValue>{securityStats.security.blockedClients}</StatValue>
            </StatInfo>
          </StatCard>

          <StatCard>
            <StatIcon style={{ color: '#ff9800' }}>
              <FaEye />
            </StatIcon>
            <StatInfo>
              <StatTitle>Suspicious Activity</StatTitle>
              <StatValue>{securityStats.security.suspiciousClients}</StatValue>
            </StatInfo>
          </StatCard>

          <StatCard>
            <StatIcon style={{ color: '#9c27b0' }}>
              <FaClock />
            </StatIcon>
            <StatInfo>
              <StatTitle>Recent Events</StatTitle>
              <StatValue>{securityStats.security.recentEvents}</StatValue>
            </StatInfo>
          </StatCard>

          <StatCard>
            <StatIcon style={{ color: '#607d8b' }}>
              <FaLock />
            </StatIcon>
            <StatInfo>
              <StatTitle>Secure Storage</StatTitle>
              <StatValue>{securityStats.storage.sessionActive ? 'Active' : 'Inactive'}</StatValue>
            </StatInfo>
          </StatCard>
        </StatsGrid>
      )}

      <EventsSection>
        <EventsHeader>
          <EventsTitle onClick={() => setShowEvents(!showEvents)}>
            Security Events ({securityEvents.length})
            <ToggleIcon $expanded={showEvents}>▼</ToggleIcon>
          </EventsTitle>
          {securityEvents.length > 0 && (
            <ClearButton onClick={clearSecurityEvents}>
              <FaTrash />
              Clear Events
            </ClearButton>
          )}
        </EventsHeader>

        {showEvents && (
          <EventsList>
            {securityEvents.length === 0 ? (
              <NoEvents>No security events recorded</NoEvents>
            ) : (
              securityEvents.map((event, index) => (
                <EventItem key={index}>
                  <EventIndicator $color={getSeverityColor(event.type)} />
                  <EventContent>
                    <EventType>{formatEventType(event.type)}</EventType>
                    <EventTime>{formatTimestamp(event.timestamp)}</EventTime>
                    {event.details && Object.keys(event.details).length > 0 && (
                      <EventDetails>
                        {Object.entries(event.details).map(([key, value]) => (
                          <EventDetail key={key}>
                            <strong>{key}:</strong> {String(value)}
                          </EventDetail>
                        ))}
                      </EventDetails>
                    )}
                  </EventContent>
                </EventItem>
              ))
            )}
          </EventsList>
        )}
      </EventsSection>
    </Container>
  );
};

const Container = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  display: flex;
  align-items: center;
  gap: 10px;
  color: #333;
  margin: 0;
  
  svg {
    color: #4caf50;
  }
`;

const RefreshButton = styled.button`
  background: #2196f3;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
  
  &:hover {
    background: #1976d2;
  }
`;

const LoadingIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px;
  color: #666;
  font-size: 16px;
  
  svg {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px;
  background: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 6px;
  color: #c62828;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
`;

const StatIcon = styled.div`
  font-size: 24px;
  padding: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
`;

const StatInfo = styled.div`
  flex: 1;
`;

const StatTitle = styled.div`
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: #333;
`;

const EventsSection = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
`;

const EventsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
`;

const EventsTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  cursor: pointer;
  color: #333;
  user-select: none;
  
  &:hover {
    color: #2196f3;
  }
`;

const ToggleIcon = styled.span`
  transition: transform 0.2s;
  transform: ${props => props.$expanded ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

const ClearButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f44336;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
  
  &:hover {
    background: #d32f2f;
  }
`;

const EventsList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const NoEvents = styled.div`
  padding: 40px;
  text-align: center;
  color: #666;
  font-style: italic;
`;

const EventItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: #f9f9f9;
  }
`;

const EventIndicator = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.$color};
  margin-top: 6px;
  flex-shrink: 0;
`;

const EventContent = styled.div`
  flex: 1;
`;

const EventType = styled.div`
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
`;

const EventTime = styled.div`
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
`;

const EventDetails = styled.div`
  font-size: 12px;
  color: #777;
  background: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
`;

const EventDetail = styled.div`
  margin-bottom: 2px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

export default SecurityDashboard;
