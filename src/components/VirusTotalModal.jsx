import React from 'react';
import { styled } from 'styled-components';
import { FaTimes, FaShieldAlt, FaExclamationTriangle, FaCheck, FaSpinner, FaExternalLinkAlt, FaInfoCircle } from 'react-icons/fa';

const VirusTotalModal = ({ 
  isOpen, 
  onClose, 
  file, 
  results, 
  isScanning 
}) => {
  if (!isOpen) return null;

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const getThreatLevel = (positives, total) => {
    if (positives === 0) return 'clean';
    if (positives <= 2) return 'low';
    if (positives <= 5) return 'medium';
    return 'high';
  };

  const renderScanResults = () => {
    if (isScanning) {
      return (
        <ScanningContainer>
          <FaSpinner className="spinning" size={48} />
          <h3>Scanning file with VirusTotal...</h3>
          <p>Please wait while we analyze your file.</p>
        </ScanningContainer>
      );
    }

    if (!results) {
      return (
        <ErrorContainer>
          <FaExclamationTriangle size={48} />
          <h3>Scan Failed</h3>
          <p>Unable to scan the file. Please try again.</p>
        </ErrorContainer>
      );
    }

    if (!results.scanned) {
      return (
        <UploadContainer>
          <FaInfoCircle size={48} />
          <h3>File Uploaded for Analysis</h3>
          <p>{results.message}</p>
          {results.permalink && (
            <ViewOnlineButton href={results.permalink} target="_blank" rel="noopener noreferrer">
              <FaExternalLinkAlt /> View Analysis Online
            </ViewOnlineButton>
          )}
        </UploadContainer>
      );
    }

    const threatLevel = getThreatLevel(results.positives, results.total);

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
              {results.positives} / {results.total} detections
            </h3>
            <p>
              {threatLevel === 'clean' && 'File appears to be clean'}
              {threatLevel === 'low' && 'Low threat detected'}
              {threatLevel === 'medium' && 'Medium threat detected'}
              {threatLevel === 'high' && 'High threat detected'}
            </p>
          </div>
        </ResultsHeader>

        <ResultsInfo>
          <InfoRow>
            <InfoLabel>Scan Date:</InfoLabel>
            <InfoValue>{formatDate(results.scanDate)}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>File Name:</InfoLabel>
            <InfoValue>{file?.name || 'Unknown'}</InfoValue>
          </InfoRow>
        </ResultsInfo>

        {results.positives > 0 && (
          <ThreatDetails>
            <h4>Threat Detections:</h4>
            <DetectionsList>
              {Object.entries(results.results)
                .filter(([engine, result]) => result.category === 'malicious')
                .map(([engine, result]) => (
                  <DetectionItem key={engine}>
                    <EngineName>{engine}</EngineName>
                    <ThreatName>{result.result}</ThreatName>
                  </DetectionItem>
                ))}
            </DetectionsList>
          </ThreatDetails>
        )}

        {results.permalink && (
          <ViewOnlineButton href={results.permalink} target="_blank" rel="noopener noreferrer">
            <FaExternalLinkAlt /> View Full Report Online
          </ViewOnlineButton>
        )}
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

const InfoValue = styled.span`
  color: #6c757d;
  word-break: break-word;
`;

const ThreatDetails = styled.div`
  margin-bottom: 20px;
  
  h4 {
    margin: 0 0 15px 0;
    color: #2c3e50;
    font-size: 16px;
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

const ThreatName = styled.span`
  color: #dc3545;
  font-size: 14px;
  font-weight: 500;
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
  align-self: flex-start;
  
  &:hover {
    background: #0056b3;
    transform: translateY(-1px);
    color: white;
    text-decoration: none;
  }
`;

export default VirusTotalModal;
