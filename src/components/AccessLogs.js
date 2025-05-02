import React, { useState, useEffect } from 'react';
import { styled } from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h2`
  margin: 0;
`;

const Card = styled.div`
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
  overflow: auto;
`;

const FilterBar = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
`;

const Badge = styled.span`
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 12px;
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
`;

function AccessLogs() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
        setLogs(result.logs);
        setFilteredLogs(result.logs);
        setError('');
      } else {
        setError('Error fetching logs: ' + result.error);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      setError('Error fetching logs: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
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

  return (
    <Container>
      <Header>
        <Title>Access Logs</Title>
        <button onClick={fetchLogs}>Refresh</button>
      </Header>

      <FilterBar>
        <button 
          onClick={() => setFilter('all')} 
          style={{ 
            backgroundColor: filter === 'all' ? '#2c3e50' : '#95a5a6'
          }}
        >
          All
        </button>
        <button 
          onClick={() => setFilter('read_file')} 
          style={{ 
            backgroundColor: filter === 'read_file' ? '#3498db' : '#95a5a6'
          }}
        >
          File Reads
        </button>
        <button 
          onClick={() => setFilter('read_directory')} 
          style={{ 
            backgroundColor: filter === 'read_directory' ? '#2ecc71' : '#95a5a6'
          }}
        >
          Directory Access
        </button>
        <button 
          onClick={() => setFilter('share_file')} 
          style={{ 
            backgroundColor: filter === 'share_file' ? '#e74c3c' : '#95a5a6'
          }}
        >
          File Shares
        </button>
        <button 
          onClick={() => setFilter('access_shared_file')} 
          style={{ 
            backgroundColor: filter === 'access_shared_file' ? '#f39c12' : '#95a5a6'
          }}
        >
          Shared File Access
        </button>
      </FilterBar>

      {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

      <Card>
        {isLoading ? (
          <div>Loading logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div>No logs found</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Path</th>
                <th>Timestamp</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, index) => (
                <tr key={index}>
                  <td>
                    <Badge $action={log.action}>{getActionName(log.action)}</Badge>
                  </td>
                  <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {log.path}
                  </td>
                  <td>{formatTimestamp(log.timestamp)}</td>
                  <td>
                    {log.token && <div>Token: {log.token}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </Container>
  );
}

export default AccessLogs;