import React, { useState, useEffect } from 'react';
import { styled } from 'styled-components';
import { FaSync, FaFilter, FaBook, FaFolder, FaFile, FaShare, FaDownload, FaExclamationTriangle, FaTimes, FaCheck } from 'react-icons/fa';

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
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    margin-bottom: 16px;
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
    justify-content: center;
  }

  @media (max-width: 480px) {
    font-size: 1.25rem;
    gap: 6px;
  }
`;

const Card = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 24px;
  margin-bottom: 24px;
  overflow: auto;
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    padding: 16px;
    margin-bottom: 16px;
    border-radius: 6px;
  }

  @media (max-width: 480px) {
    padding: 12px;
    margin-bottom: 12px;
  }
`;

const FilterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    gap: 8px;
    margin-bottom: 16px;
  }

  @media (max-width: 576px) {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
  }

  @media (max-width: 480px) {
    margin-bottom: 12px;
  }
`;

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: ${props => props.$active ? props.$color : '#95a5a6'};
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.$active ? props.$hoverColor : '#7f8c8d'};
  }

  @media (max-width: 768px) {
    padding: 8px 12px;
    gap: 6px;
    font-size: 14px;
  }

  @media (max-width: 576px) {
    justify-content: flex-start;
  }

  @media (max-width: 480px) {
    padding: 8px 10px;
    font-size: 13px;
  }
`;

const Badge = styled.span`
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  background-color: ${props => {
    switch (props.$action) {
      case 'read_file': return '#3498db';
      case 'read_directory': return '#2ecc71';
      case 'share_file': return '#e74c3c';
      case 'access_shared_file': return '#f39c12';
      default: return '#95a5a6';
    }
  }};
  color: white;
  display: inline-flex;
  align-items: center;
  gap: 5px;
`;

const BadgeIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
`;

const StatusMessage = styled.div`
  padding: 12px 16px;
  margin-bottom: 20px;
  border-radius: 6px;
  background-color: ${props => props.$type === 'error' ? '#fdeded' : '#edf7ed'};
  color: ${props => props.$type === 'error' ? '#ef5350' : '#4caf50'};
  border-left: 4px solid ${props => props.$type === 'error' ? '#ef5350' : '#4caf50'};
  display: flex;
  align-items: center;
  gap: 12px;
`;

const MessageIcon = styled.div`
  font-size: 20px;
`;

const MessageContent = styled.div`
  flex: 1;
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
`;

const TableContainer = styled.div`
  overflow-x: auto;
  border-radius: 6px;
  border: 1px solid #eaeaea;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
`;

const TableHead = styled.thead`
  background-color: #f8f9fa;

  th {
    position: sticky;
    top: 0;
    background-color: #f8f9fa;
    z-index: 10;
  }
`;

const TableRow = styled.tr`
  border-bottom: 1px solid #eaeaea;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f9f9f9;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const TableCell = styled.td`
  padding: 12px 16px;
  text-align: ${props => props.$align || 'left'};
  max-width: ${props => props.$maxWidth ? props.$maxWidth : 'none'};
  overflow: ${props => props.$overflow ? 'hidden' : 'visible'};
  text-overflow: ${props => props.$overflow ? 'ellipsis' : 'clip'};
  white-space: ${props => props.$wrap ? 'normal' : 'nowrap'};

  @media (max-width: 768px) {
    padding: 10px;
    font-size: 13px;
  }
`;

const TableHeader = styled.th`
  padding: 14px 16px;
  text-align: ${props => props.$align || 'left'};
  font-weight: 600;
  color: #34495e;
  white-space: nowrap;

  @media (max-width: 768px) {
    padding: 10px;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: #7f8c8d;
  text-align: center;
`;

const IconContainer = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
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
`;

const LoadingIndicator = styled.div`
  padding: 20px;
  text-align: center;
  color: #7f8c8d;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const SpinningIcon = styled.div`
  animation: spin 1s linear infinite;
  font-size: 24px;

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const Timestamp = styled.div`
  color: #7f8c8d;
  font-size: 13px;
  display: flex;
  flex-direction: column;

  span:first-child {
    font-weight: 500;
    color: #34495e;
  }
`;

const PathCell = styled.div`
  word-break: break-all;
  white-space: normal;
  max-width: 300px;
  font-family: monospace;
  font-size: 12px;
  line-height: 1.4;
`;

const TokenSpan = styled.span`
  font-family: monospace;
  background-color: #f8f9fa;
  padding: 2px 4px;
  border-radius: 3px;
  border: 1px solid #eaeaea;
  font-size: 12px;
`;

function AccessLogs() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredLogs(logs);
    } else {
      setFilteredLogs(logs.filter(log => log.action === filter));
    }
  }, [filter, logs]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const result = await window.electron.fileManager.getAccessLogs();
      if (result.success) {
        // Sort logs from newest to oldest
        const sortedLogs = result.logs.sort((a, b) =>
          new Date(b.timestamp) - new Date(a.timestamp)
        );
        setLogs(sortedLogs);
        setFilteredLogs(sortedLogs);
        setMessage({ type: 'success', text: 'Logs refreshed successfully' });
        setLastRefreshed(new Date());
      } else {
        setMessage({ type: 'error', text: `Error fetching logs: ${result.error}` });
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      setMessage({ type: 'error', text: `Error fetching logs: ${error.message}` });
    } finally {
      setIsLoading(false);
      // Auto-dismiss success message after 3 seconds
      if (message?.type === 'success') {
        setTimeout(() => setMessage(null), 3000);
      }
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    };
  };

  const getActionName = (action) => {
    switch (action) {
      case 'read_file': return 'Read File';
      case 'read_directory': return 'Browse Directory';
      case 'share_file': return 'Share File';
      case 'access_shared_file': return 'Access Shared File';
      default: return action;
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'read_file': return <FaFile />;
      case 'read_directory': return <FaFolder />;
      case 'share_file': return <FaShare />;
      case 'access_shared_file': return <FaDownload />;
      default: return null;
    }
  };

  return (
    <Container>
      <Header>
        <Title>
          <FaBook /> Access Logs
        </Title>
        <Button onClick={fetchLogs} disabled={isLoading}>
          <FaSync /> Refresh
        </Button>
      </Header>

      {message && (
        <StatusMessage $type={message.type}>
          <MessageIcon>
            {message.type === 'error' ? <FaExclamationTriangle /> : <FaCheck />}
          </MessageIcon>
          <MessageContent>{message.text}</MessageContent>
          <CloseButton onClick={() => setMessage(null)}>
            <FaTimes />
          </CloseButton>
        </StatusMessage>
      )}

      <FilterBar>
        <FilterButton
          $active={filter === 'all'}
          $color="#2c3e50"
          $hoverColor="#1a252f"
          onClick={() => setFilter('all')}
        >
          <FaFilter /> All Activities
        </FilterButton>
        <FilterButton
          $active={filter === 'read_file'}
          $color="#3498db"
          $hoverColor="#2980b9"
          onClick={() => setFilter('read_file')}
        >
          <FaFile /> File Reads
        </FilterButton>
        <FilterButton
          $active={filter === 'read_directory'}
          $color="#2ecc71"
          $hoverColor="#27ae60"
          onClick={() => setFilter('read_directory')}
        >
          <FaFolder /> Directory Access
        </FilterButton>
        <FilterButton
          $active={filter === 'share_file'}
          $color="#e74c3c"
          $hoverColor="#c0392b"
          onClick={() => setFilter('share_file')}
        >
          <FaShare /> File Shares
        </FilterButton>
        <FilterButton
          $active={filter === 'access_shared_file'}
          $color="#f39c12"
          $hoverColor="#d35400"
          onClick={() => setFilter('access_shared_file')}
        >
          <FaDownload /> Shared File Access
        </FilterButton>
      </FilterBar>

      {lastRefreshed && (
        <div style={{ marginBottom: '16px', fontSize: '14px', color: '#7f8c8d' }}>
          Last refreshed: {lastRefreshed.toLocaleString()}
        </div>
      )}

      <Card>
        {isLoading ? (
          <LoadingIndicator>
            <SpinningIcon>
              <FaSync />
            </SpinningIcon>
            <div>Loading access logs...</div>
          </LoadingIndicator>
        ) : filteredLogs.length === 0 ? (
          <EmptyState>
            <IconContainer>
              <FaBook />
            </IconContainer>
            <p>No logs found for this filter</p>
            <Button $primary onClick={() => setFilter('all')} style={{ marginTop: '16px' }}>
              <FaFilter /> Show All Logs
            </Button>
          </EmptyState>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Activity</TableHeader>
                  <TableHeader>Path</TableHeader>
                  <TableHeader>Timestamp</TableHeader>
                  <TableHeader>Details</TableHeader>
                </TableRow>
              </TableHead>
              <tbody>
                {filteredLogs.map((log, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Badge $action={log.action}>
                        <BadgeIcon>{getActionIcon(log.action)}</BadgeIcon>
                        {getActionName(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell $overflow $maxWidth="300px">
                      <PathCell>{log.path}</PathCell>
                    </TableCell>
                    <TableCell>
                      <Timestamp>
                        <span>{formatTimestamp(log.timestamp).date}</span>
                        <span>{formatTimestamp(log.timestamp).time}</span>
                      </Timestamp>
                    </TableCell>
                    <TableCell>
                      {log.token && (
                        <div>Token: <TokenSpan>{log.token}</TokenSpan></div>
                      )}
                      {log.remote && (
                        <Badge $action="access_shared_file" style={{ marginTop: '5px' }}>
                          Remote Access
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Container>
  );
}

export default AccessLogs;