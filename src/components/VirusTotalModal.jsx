import React, { useState, useEffect } from 'react';
import { styled } from 'styled-components';
import { FaTimes, FaShieldAlt, FaExclamationTriangle, FaCheck, FaSpinner, FaExternalLinkAlt, FaInfoCircle, FaRedo, FaClock, FaFile, FaHashtag } from 'react-icons/fa';

const VirusTotalModal = ({ 
  isOpen, 
  onClose, 
  file, 
  results, 
  isScanning,
  onRescan 
}) => {
  const [pollResults, setPollResults] = useState(results);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingError, setPollingError] = useState(null);

  useEffect(() => {
    setPollResults(results);
    setPollingError(null);
  }, [results]);

  // Auto-poll for results if analysis is pending
  useEffect(() => {
    if (!isOpen || !pollResults || isScanning) return;

    // Check if analysis is pending (file uploaded but no scan results yet)
    if (!pollResults.scanned && pollResults.scanId) {
      startPolling(pollResults.scanId);
    }
  }, [isOpen, pollResults, isScanning]);

  const startPolling = async (analysisId) => {
    if (isPolling) return;
    
    setIsPolling(true);
    setPollingError(null);
    
    const maxAttempts = 20; // Poll for up to 10 minutes (30s * 20)
    let attempts = 0;
    
    const poll = async () => {
      try {
        attempts++;
        console.log(`Polling attempt ${attempts}/${maxAttempts} for analysis: ${analysisId}`);
        
        const result = await window.electron.virusTotalGetAnalysisResults(analysisId);
        
        if (result.success && result.data) {
          const analysis = result.data.data;
          console.log('Analysis result:', analysis);
          
          if (analysis.attributes && analysis.attributes.status === 'completed') {
            // Analysis completed, get the file results
            const stats = analysis.attributes.stats;
            const scanResults = {
              scanned: true,
              scanDate: analysis.attributes.date,
              positives: stats.malicious + stats.suspicious,
              total: stats.malicious + stats.suspicious + stats.undetected + stats.harmless,
              results: analysis.attributes.results || {},
              permalink: `https://www.virustotal.com/gui/file-analysis/${analysisId}`,
              fileHash: pollResults.fileHash,
              fileSize: pollResults.fileSize,
              stats: stats
            };
            
            setPollResults(scanResults);
            setIsPolling(false);
            return;
          } else if (analysis.attributes && analysis.attributes.status === 'queued') {
            // Still queued, continue polling
            if (attempts < maxAttempts) {
              setTimeout(poll, 30000); // Poll every 30 seconds
            } else {
              setPollingError('Analysis is taking longer than expected. Please check the online report.');
              setIsPolling(false);
            }
          } else {
            // Unknown status
            setPollingError(`Analysis status: ${analysis.attributes?.status || 'unknown'}`);
            setIsPolling(false);
          }
        } else {
          // Error or no data
          if (attempts < maxAttempts) {
            setTimeout(poll, 30000);
          } else {
            setPollingError(result.error || 'Failed to get analysis results');
            setIsPolling(false);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
        if (attempts < maxAttempts) {
          setTimeout(poll, 30000);
        } else {
          setPollingError('Failed to check analysis status');
          setIsPolling(false);
        }
      }
    };
    
    // Start polling after 10 seconds (give VirusTotal time to process)
    setTimeout(poll, 10000);
  };

  const handleRescan = async () => {
    if (onRescan && file) {
      onRescan(file);
    }
  };
  if (!isOpen) return null;

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const getThreatLevel = (positives, total) => {
    if (positives === 0) return 'clean';
    const percentage = (positives / total) * 100;
    if (percentage <= 5) return 'low';
    if (percentage <= 15) return 'medium';
    return 'high';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const renderScanResults = () => {
    const currentResults = pollResults || results;

    if (isScanning) {
      return (
        <ScanningContainer>
          <FaSpinner className="spinning" size={48} />
          <h3>Scanning file with VirusTotal...</h3>
          <p>Please wait while we analyze your file.</p>
        </ScanningContainer>
      );
    }

    if (!currentResults) {
      return (
        <ErrorContainer>
          <FaExclamationTriangle size={48} />
          <h3>Scan Failed</h3>
          <p>Unable to scan the file. Please try again.</p>
          <RetryButton onClick={handleRescan}>
            <FaRedo /> Try Again
          </RetryButton>
        </ErrorContainer>
      );
    }

    // Show polling status for pending analysis
    if (!currentResults.scanned && currentResults.scanId) {
      return (
        <AnalysisPendingContainer>
          <div className="status-icon">
            {isPolling ? (
              <FaSpinner className="spinning" size={48} />
            ) : (
              <FaClock size={48} />
            )}
          </div>
          <h3>
            {isPolling ? 'Checking Analysis Status...' : 'Analysis in Progress'}
          </h3>
          <p>
            {isPolling 
              ? 'Waiting for VirusTotal to complete the analysis...'
              : currentResults.message || 'Your file has been submitted for analysis.'
            }
          </p>
          
          {pollingError && (
            <ErrorMessage>
              <FaExclamationTriangle />
              {pollingError}
            </ErrorMessage>
          )}
          
          <ButtonGroup>
            {currentResults.permalink && (
              <ViewOnlineButton href={currentResults.permalink} target="_blank" rel="noopener noreferrer">
                <FaExternalLinkAlt /> View Analysis Online
              </ViewOnlineButton>
            )}
            <RetryButton onClick={handleRescan}>
              <FaRedo /> Rescan File
            </RetryButton>
          </ButtonGroup>
        </AnalysisPendingContainer>
      );
    }

    if (!currentResults.scanned) {
      return (
        <UploadContainer>
          <FaInfoCircle size={48} />
          <h3>File Uploaded for Analysis</h3>
          <p>{currentResults.message}</p>
          {currentResults.permalink && (
            <ViewOnlineButton href={currentResults.permalink} target="_blank" rel="noopener noreferrer">
              <FaExternalLinkAlt /> View Analysis Online
            </ViewOnlineButton>
          )}
        </UploadContainer>
      );
    }

    const threatLevel = getThreatLevel(currentResults.positives, currentResults.total);

    return (
      <ResultsContainer>
        <ResultsHeader $threatLevel={threatLevel}>
          {threatLevel === 'clean' ? (
            <FaCheck size={32} />
          ) : (
            <FaExclamationTriangle size={32} />
          )}
          <div>
            <h3>
              {currentResults.positives} / {currentResults.total} detections
            </h3>
            <p>
              {threatLevel === 'clean' && 'File appears to be clean'}
              {threatLevel === 'low' && 'Low threat detected'}
              {threatLevel === 'medium' && 'Medium threat detected'}
              {threatLevel === 'high' && 'High threat detected'}
            </p>
          </div>
        </ResultsHeader>

        {/* File Information */}
        <FileInfoSection>
          <h4><FaFile /> File Information</h4>
          <FileInfoGrid>
            <InfoRow>
              <InfoLabel>File Name:</InfoLabel>
              <InfoValue>{file?.name || 'Unknown'}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>File Size:</InfoLabel>
              <InfoValue>{formatFileSize(currentResults.fileSize || file?.size)}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Scan Date:</InfoLabel>
              <InfoValue>{formatDate(currentResults.scanDate)}</InfoValue>
            </InfoRow>
            {currentResults.fileHash && (
              <InfoRow>
                <InfoLabel>SHA256:</InfoLabel>
                <InfoValue className="hash">{currentResults.fileHash}</InfoValue>
              </InfoRow>
            )}
          </FileInfoGrid>
        </FileInfoSection>

        {/* Scan Statistics */}
        {currentResults.stats && (
          <StatsSection>
            <h4><FaShieldAlt /> Scan Statistics</h4>
            <StatsGrid>
              <StatItem $type="clean">
                <StatNumber>{currentResults.stats.harmless || 0}</StatNumber>
                <StatLabel>Clean</StatLabel>
              </StatItem>
              <StatItem $type="suspicious">
                <StatNumber>{currentResults.stats.suspicious || 0}</StatNumber>
                <StatLabel>Suspicious</StatLabel>
              </StatItem>
              <StatItem $type="malicious">
                <StatNumber>{currentResults.stats.malicious || 0}</StatNumber>
                <StatLabel>Malicious</StatLabel>
              </StatItem>
              <StatItem $type="undetected">
                <StatNumber>{currentResults.stats.undetected || 0}</StatNumber>
                <StatLabel>Undetected</StatLabel>
              </StatItem>
            </StatsGrid>
          </StatsSection>
        )}

        {currentResults.positives > 0 && currentResults.results && (
          <ThreatDetails>
            <h4><FaExclamationTriangle /> Threat Detections</h4>
            <DetectionsList>
              {Object.entries(currentResults.results)
                .filter(([engine, result]) => 
                  result.category === 'malicious' || result.category === 'suspicious'
                )
                .map(([engine, result]) => (
                  <DetectionItem key={engine}>
                    <EngineName>{engine}</EngineName>
                    <ThreatName $category={result.category}>
                      {result.result}
                    </ThreatName>
                  </DetectionItem>
                ))}
            </DetectionsList>
          </ThreatDetails>
        )}

        <ButtonGroup>
          {currentResults.permalink && (
            <ViewOnlineButton href={currentResults.permalink} target="_blank" rel="noopener noreferrer">
              <FaExternalLinkAlt /> View Full Report Online
            </ViewOnlineButton>
          )}
          <RetryButton onClick={handleRescan}>
            <FaRedo /> Rescan File
          </RetryButton>
        </ButtonGroup>
      </ResultsContainer>
    );
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <HeaderTitle>
            <FaShieldAlt />
            VirusTotal Scan Results
          </HeaderTitle>
          <CloseButton onClick={onClose}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          {renderScanResults()}
        </ModalBody>

        <ModalFooter>
          <ActionButton onClick={onClose}>
            Close
          </ActionButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

// Styled Components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  
  @media (max-width: 768px) {
    max-width: 95%;
    border-radius: 8px;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px 12px 0 0;
  
  @media (max-width: 768px) {
    padding: 16px;
    border-radius: 8px 8px 0 0;
  }
`;

const HeaderTitle = styled.h2`
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  
  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const ModalBody = styled.div`
  padding: 20px;
  
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e9ecef;
  
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const ActionButton = styled.button`
  padding: 10px 20px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  
  &:hover {
    background: #5a6268;
    transform: translateY(-1px);
  }
`;

const ScanningContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #007bff;
  
  .spinning {
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  h3 {
    margin: 0 0 10px 0;
    color: #2c3e50;
  }
  
  p {
    margin: 0;
    color: #6c757d;
  }
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #dc3545;
  
  h3 {
    margin: 20px 0 10px 0;
    color: #2c3e50;
  }
  
  p {
    margin: 0;
    color: #6c757d;
  }
`;

const UploadContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #007bff;
  
  h3 {
    margin: 20px 0 10px 0;
    color: #2c3e50;
  }
  
  p {
    margin: 0 0 20px 0;
    color: #6c757d;
  }
`;

const ResultsContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const ResultsHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  
  ${props => {
    switch (props.$threatLevel) {
      case 'clean':
        return `
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        `;
      case 'low':
        return `
          background: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
        `;
      case 'medium':
        return `
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        `;
      case 'high':
        return `
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        `;
      default:
        return `
          background: #f8f9fa;
          color: #495057;
          border: 1px solid #dee2e6;
        `;
    }
  }}
  
  h3 {
    margin: 0;
    font-size: 18px;
  }
  
  p {
    margin: 5px 0 0 0;
    font-size: 14px;
    opacity: 0.8;
  }
`;

const ResultsInfo = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled.span`
  font-weight: 600;
  color: #495057;
`;

const ThreatDetails = styled.div`
  margin-bottom: 20px;
  
  h4 {
    margin: 0 0 15px 0;
    color: #2c3e50;
    font-size: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const DetectionsList = styled.div`
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e9ecef;
  border-radius: 6px;
`;

const DetectionItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid #f8f9fa;
  
  &:last-child {
    border-bottom: none;
  }
`;

const EngineName = styled.span`
  font-weight: 600;
  color: #495057;
  font-size: 14px;
`;

const ViewOnlineButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s ease;
  
  &:hover {
    background: #0056b3;
    transform: translateY(-1px);
    color: white;
    text-decoration: none;
  }
`;

const RetryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: #218838;
    transform: translateY(-1px);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-start;
  flex-wrap: wrap;
  margin-top: 20px;
`;

const AnalysisPendingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  
  .status-icon {
    color: #007bff;
    margin-bottom: 20px;
  }
  
  .spinning {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  h3 {
    margin: 0 0 10px 0;
    color: #2c3e50;
  }
  
  p {
    margin: 0 0 20px 0;
    color: #6c757d;
  }
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
  margin: 15px 0;
  font-size: 14px;
`;

const FileInfoSection = styled.div`
  margin-bottom: 25px;
  
  h4 {
    margin: 0 0 15px 0;
    color: #2c3e50;
    font-size: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const FileInfoGrid = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
`;

const StatsSection = styled.div`
  margin-bottom: 25px;
  
  h4 {
    margin: 0 0 15px 0;
    color: #2c3e50;
    font-size: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 15px;
  
  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StatItem = styled.div`
  text-align: center;
  padding: 15px 10px;
  border-radius: 8px;
  
  ${props => {
    switch (props.$type) {
      case 'clean':
        return `
          background: #d4edda;
          border: 1px solid #c3e6cb;
        `;
      case 'suspicious':
        return `
          background: #fff3cd;
          border: 1px solid #ffeaa7;
        `;
      case 'malicious':
        return `
          background: #f8d7da;
          border: 1px solid #f5c6cb;
        `;
      case 'undetected':
        return `
          background: #e2e3e5;
          border: 1px solid #d6d8db;
        `;
      default:
        return `
          background: #f8f9fa;
          border: 1px solid #dee2e6;
        `;
    }
  }}
`;

const StatNumber = styled.div`
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
  color: #2c3e50;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #6c757d;
  font-weight: 500;
  text-transform: uppercase;
`;

const InfoValue = styled.span`
  color: #6c757d;
  word-break: break-word;
  
  &.hash {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    word-break: break-all;
  }
`;

const ThreatName = styled.span`
  font-size: 14px;
  font-weight: 500;
  
  ${props => {
    switch (props.$category) {
      case 'malicious':
        return 'color: #dc3545;';
      case 'suspicious':
        return 'color: #fd7e14;';
      default:
        return 'color: #6c757d;';
    }
  }}
`;

export default VirusTotalModal;
