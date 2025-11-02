import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
// Assuming some icons, e.g.,
import { FaCopy, FaTrash, FaExternalLinkAlt } from 'react-icons/fa';

// Styled Components
const Container = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px; // Adds space between title and table/messages

  @media (max-width: 768px) {
    padding: 16px;
    gap: 16px;
  }

  @media (max-width: 480px) {
    padding: 12px;
    gap: 12px;
  }
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50; // Dark blue-grey
  margin-bottom: 0; // Gap handles spacing

  @media (max-width: 768px) {
    font-size: 20px;
    text-align: center;
  }

  @media (max-width: 480px) {
    font-size: 18px;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border-radius: 8px;
  overflow: hidden; // For border-radius on table
  th, td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid #e0e0e0; // Lighter border
    word-break: break-word; // Helps with long file paths or links
  }
  th {
    background-color: #f4f6f8; // Light grey background for headers
    color: #34495e; // Darker text for headers
    font-weight: 600;
  }
  tbody tr:hover {
    background-color: #f9f9f9; // Subtle hover for rows
  }
  tbody tr:last-child td {
    border-bottom: none; // No border for the last row
  }

  @media (max-width: 768px) {
    th, td {
      padding: 8px 10px;
      font-size: 14px;
    }

    th {
      font-size: 13px;
    }
  }

  @media (max-width: 480px) {
    th, td {
      padding: 6px 8px;
      font-size: 12px;
    }

    th {
      font-size: 11px;
    }

    border-radius: 6px;
  }
`;

const Button = styled.button`
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  display: inline-flex; // To align icon and text
  align-items: center;
  gap: 6px; // Space between icon and text
  transition: background-color 0.2s ease, transform 0.1s ease;

  &:active {
    transform: translateY(1px);
  }

  @media (max-width: 768px) {
    padding: 6px 10px;
    gap: 4px;
    font-size: 14px;
  }

  @media (max-width: 480px) {
    padding: 6px 8px;
    font-size: 12px;
    gap: 3px;
  }
`;

const ActionButton = styled(Button)`
  background-color: #3498db; // Blue
  color: white;
  &:hover {
    background-color: #2980b9; // Darker blue
  }
`;

const RevokeButton = styled(Button)`
  background-color: #e74c3c; // Red
  color: white;
  &:hover {
    background-color: #c0392b; // Darker red
  }
`;

const EmptyMessage = styled.p`
  color: #7f8c8d;
  text-align: center;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
`;

const ErrorMessage = styled.p`
  color: #c0392b; // Darker red for errors
  text-align: center;
  padding: 20px;
  background-color: #fdeded; // Light red background
  border: 1px solid #e74c3c;
  border-radius: 8px;
`;

const LoadingMessage = styled(EmptyMessage)` // Style loading like empty message
  color: #34495e;
`;

// Utility to get filename (since 'path' module isn't directly in browser)
const getFileName = (filePath) => {
  if (!filePath) return '';
  // Handles both / and \ separators
  const lastSlash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
  return filePath.substring(lastSlash + 1);
};

function ManageLinks() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedLinkId, setCopiedLinkId] = useState(null);

  const fetchLinks = async () => {
    setLoading(true);
    setError(null);
    try {
      // IMPORTANT: This assumes 'listActiveShares' is exposed on window.electron.fileManager in preload.js
      const result = await window.electron.fileManager.listActiveShares();
      if (result.success) {
        setLinks(result.links);
      } else {
        setError(result.error || 'Failed to fetch links.');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
      console.error("Error fetching links:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleCopyLink = async (url, linkId) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLinkId(linkId);
      setTimeout(() => setCopiedLinkId(null), 2000); // Reset after 2s
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Optionally set an error message for copying
      setError('Failed to copy link. Please try again or copy manually.');
    }
  };

  const handleRevokeLink = async (tokenId) => {
    // Confirmation dialog is good practice here
    if (!window.confirm("Are you sure you want to revoke this link? This action cannot be undone.")) {
      return;
    }
    try {
      // IMPORTANT: Assumes 'revokeShareLink' is exposed in preload.js
      const result = await window.electron.fileManager.revokeShareLink(tokenId);
      if (result.success) {
        fetchLinks(); // Refresh the list
      } else {
        setError(result.error || 'Failed to revoke link.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while revoking the link.');
      console.error("Error revoking link:", err);
    }
  };

  if (loading) return <Container><LoadingMessage>Loading active links...</LoadingMessage></Container>;
  // Keep existing error handling for when no links are loaded due to an error
  if (error && links.length === 0) return <Container><Title>Manage Shared Links</Title><ErrorMessage>Error: {error}</ErrorMessage></Container>;


  return (
    <Container>
      <Title>Manage Shared Links</Title>
      {/* Display error message even if some links are loaded, but an error occurred (e.g., copy failed) */}
      {error && <ErrorMessage style={{ marginBottom: '15px' }}>Error: {error}</ErrorMessage>}

      {links.length === 0 && !loading && !error ? ( // Only show empty message if no links and no initial loading error
        <EmptyMessage>No active shared links found.</EmptyMessage>
      ) : links.length > 0 ? ( // Only render table if there are links
        <Table>
          <thead>
            <tr>
              <th>File Name</th>
              <th>Share Link</th>
              <th>Created At</th>
              <th>Expires At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {links.map(link => (
              <tr key={link.id}>
                <td title={link.filePath}>{getFileName(link.filePath)}</td>
                <td>
                  <a
                    href={link.shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={link.shareUrl}
                    style={{display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#3498db', textDecoration: 'none'}}
                    onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                    onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                  >
                    {link.shareUrl.length > 45 ? `${link.shareUrl.substring(0, 45)}...` : link.shareUrl}
                    <FaExternalLinkAlt size="0.9em" />
                  </a>
                </td>
                <td>{new Date(link.createdAt).toLocaleString()}</td>
                <td>{link.expiresAt ? new Date(link.expiresAt).toLocaleString() : 'One-time link'}</td>
                <td style={{ display: 'flex', gap: '8px' }}>
                  <ActionButton onClick={() => handleCopyLink(link.shareUrl, link.id)}>
                    <FaCopy /> {copiedLinkId === link.id ? 'Copied!' : 'Copy'}
                  </ActionButton>
                  <RevokeButton onClick={() => handleRevokeLink(link.id)}>
                    <FaTrash /> Revoke
                  </RevokeButton>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : null /* If !loading and links.length is 0 and there was an error, it's handled by the condition above the return */
    }
    </Container>
  );
}

export default ManageLinks;
