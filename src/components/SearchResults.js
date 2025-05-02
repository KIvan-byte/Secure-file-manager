import React from 'react';
import { styled } from 'styled-components';
import { FaFile, FaFolder, FaSearch, FaTimes, FaEye } from 'react-icons/fa';
import path from 'path-browserify';

const ResultsContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
  overflow: hidden;
`;

const ResultsHeader = styled.div`
  background-color: #f8f9fa;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eaeaea;
`;

const ResultsTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #2c3e50;
`;

const ResultsCount = styled.span`
  background-color: #3498db;
  color: white;
  border-radius: 16px;
  padding: 2px 10px;
  font-size: 14px;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #7f8c8d;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #34495e;
  }
`;

const ResultsContent = styled.div`
  padding: 0;
  max-height: 60vh;
  overflow-y: auto;
`;

const ResultItem = styled.div`
  padding: 16px;
  border-bottom: 1px solid #eaeaea;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f5f6fa;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const ResultHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
`;

const FileIcon = styled.span`
  color: #3498db;
  display: flex;
  align-items: center;
`;

const FileName = styled.div`
  font-weight: 600;
  flex: 1;
  word-break: break-all;
`;

const FileInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
  color: #7f8c8d;
  margin-bottom: 12px;
`;

const FileSize = styled.div`
  white-space: nowrap;
`;

const ViewButton = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &:hover {
    background-color: #2980b9;
  }
`;

const CodeSnippets = styled.div`
  margin-top: 12px;
  font-family: monospace;
  font-size: 13px;
  line-height: 1.5;
  border: 1px solid #eaeaea;
  border-radius: 4px;
  overflow: hidden;
`;

const SnippetTitle = styled.div`
  background-color: #f8f9fa;
  padding: 6px 10px;
  font-size: 12px;
  color: #7f8c8d;
  border-bottom: 1px solid #eaeaea;
`;

const SnippetContent = styled.pre`
  margin: 0;
  padding: 12px;
  overflow-x: auto;
  background-color: white;
  white-space: pre-wrap;
  word-break: break-all;
`;

const HighlightedLine = styled.div`
  background-color: #ffecb3;
  padding: 2px 0;
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: #7f8c8d;
  text-align: center;
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

function formatSize(size) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let fileSize = size;
  
  while (fileSize >= 1024 && unitIndex < units.length - 1) {
    fileSize /= 1024;
    unitIndex++;
  }
  
  return `${fileSize.toFixed(1)} ${units[unitIndex]}`;
}

function formatDate(date) {
  return new Date(date).toLocaleString();
}

// Function to highlight search term in a snippet text while preserving line numbers
function HighlightedSnippet({ text, searchTerm, caseSensitive }) {
  if (!text) return null;
  
  // Break into lines
  const lines = text.split('\n');
  
  return (
    <SnippetContent>
      {lines.map((line, index) => {
        const hasMatch = caseSensitive 
          ? line.includes(searchTerm)
          : line.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (hasMatch) {
          return <HighlightedLine key={index}>{line}</HighlightedLine>;
        }
        
        return <div key={index}>{line}</div>;
      })}
    </SnippetContent>
  );
}

function SearchResults({ results, searchTerm, onClose, onFileClick, isLoading, caseSensitive = false }) {
  return (
    <ResultsContainer>
      <ResultsHeader>
        <ResultsTitle>
          <FaSearch /> Search Results
          {!isLoading && results.length > 0 && (
            <ResultsCount>{results.length}</ResultsCount>
          )}
        </ResultsTitle>
        <CloseButton onClick={onClose}>
          <FaTimes />
        </CloseButton>
      </ResultsHeader>
      
      <ResultsContent>
        {isLoading ? (
          <LoadingState>
            <IconContainer>
              <FaSearch />
            </IconContainer>
            <p>Searching for "{searchTerm}"...</p>
          </LoadingState>
        ) : results.length === 0 ? (
          <EmptyState>
            <IconContainer>
              <FaSearch />
            </IconContainer>
            <p>No results found for "{searchTerm}"</p>
            <p>Try a different search term or check search options</p>
          </EmptyState>
        ) : (
          results.map((result, index) => (
            <ResultItem key={index}>
              <ResultHeader>
                <FileIcon>
                  <FaFile />
                </FileIcon>
                <FileName>{path.basename(result.path)}</FileName>
                <ViewButton onClick={() => onFileClick(result)}>
                  <FaEye /> View
                </ViewButton>
              </ResultHeader>
              
              <FileInfo>
                <div>
                  <strong>Path:</strong> {path.dirname(result.path)}
                </div>
                <FileSize>
                  <strong>Size:</strong> {formatSize(result.size)}
                </FileSize>
                <div>
                  <strong>Modified:</strong> {formatDate(result.mtime)}
                </div>
              </FileInfo>
              
              {result.snippets && result.snippets.length > 0 && (
                <CodeSnippets>
                  <SnippetTitle>Matches:</SnippetTitle>
                  {result.snippets.map((snippet, snippetIndex) => (
                    <div key={snippetIndex}>
                      <HighlightedSnippet 
                        text={snippet.text}
                        searchTerm={searchTerm}
                        caseSensitive={caseSensitive}
                      />
                      {snippetIndex < result.snippets.length - 1 && (
                        <hr style={{ margin: 0, borderTop: '1px dashed #eaeaea', borderBottom: 'none' }} />
                      )}
                    </div>
                  ))}
                </CodeSnippets>
              )}
            </ResultItem>
          ))
        )}
      </ResultsContent>
    </ResultsContainer>
  );
}

export default SearchResults;