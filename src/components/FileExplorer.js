import React, { useState, useEffect, useRef, useCallback } from 'react';
import { styled } from 'styled-components';
import { FaFolder, FaFile, FaArrowUp, FaShare, FaEye, FaSearch, FaExclamationTriangle, FaInfoCircle, FaFilePdf, FaFileImage, FaFileAlt, FaFileVideo, FaFileAudio, FaFile as FaFileGeneric, FaSearchPlus, FaSearchMinus, FaRedo, FaTimesCircle, FaCode, FaLock, FaLockOpen, FaFileArchive, FaArchive, FaCompress, FaClone, FaCheck, FaHome, FaTimes, FaCalendarAlt, FaList, FaThLarge } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import path from 'path-browserify';
import SearchResults from './SearchResults';
import FileEncryptionModal from './FileEncryptionModal';
import FileCompressionModal from './FileCompressionModal';
// Import the FilePropertiesModal component
import FilePropertiesModal from './FilePropertiesModal';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const ContextMenu = styled.div`
  position: fixed;
  z-index: 1000;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 180px;
  display: ${props => props.$show ? 'block' : 'none'};
  left: ${props => props.$x}px;
  top: ${props => props.$y}px;
`;

const ContextMenuItem = styled.div`
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  color: ${props => props.$disabled ? '#bbb' : '#2c3e50'};
  border-bottom: 1px solid #f0f0f0;
  
  &:hover {
    background-color: ${props => props.$disabled ? 'transparent' : '#f8f9fa'};
  }
  
  &:last-child {
    border-bottom: none;
  }
  
  ${props => props.$disabled && `
    cursor: not-allowed;
    opacity: 0.5;
  `}
`;

const ContextMenuSeparator = styled.div`
  height: 1px;
  background-color: #eee;
  margin: 4px 0;
`;

const PathInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const NavigationBar = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  color: ${props => props.$disabled ? '#bbb' : '#2c3e50'};
  font-size: 18px;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  
  &:hover {
    background-color: ${props => props.$disabled ? 'white' : '#3498db'};
    color: ${props => props.$disabled ? '#bbb' : 'white'};
    transform: ${props => props.$disabled ? 'none' : 'translateY(-1px)'};
    box-shadow: ${props => props.$disabled ? '0 1px 3px rgba(0, 0, 0, 0.05)' : '0 4px 8px rgba(52, 152, 219, 0.3)'};
  }
  
  &:disabled {
    cursor: not-allowed;
  }
  
  &:active {
    transform: ${props => props.$disabled ? 'none' : 'translateY(0)'};
  }
`;

const ViewToggle = styled.div`
  display: flex;
  border: 1px solid #ddd;
  border-radius: 6px;
  overflow: hidden;
  margin-left: auto;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const ViewButton = styled.button`
  padding: 10px 16px;
  border: none;
  background: ${props => props.$active ? '#3498db' : 'white'};
  color: ${props => props.$active ? 'white' : '#2c3e50'};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
  min-width: 80px;
  justify-content: center;
  
  &:hover {
    background: ${props => props.$active ? '#2980b9' : '#f8f9fa'};
  }
  
  &:first-child {
    border-right: 1px solid #ddd;
  }
`;

// Add FilePropertiesModal component styles
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #eaeaea;
`;

const ModalTitle = styled.h3`
  margin: 0;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ModalBody = styled.div`
  padding: 20px;
`;

const ModalCloseButton = styled.button`
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #7f8c8d;
  padding: 5px;
  
  &:hover {
    color: #34495e;
  }
`;

const PropertyRow = styled.div`
  display: flex;
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const PropertyLabel = styled.div`
  flex: 0 0 30%;
  font-weight: 600;
  color: #34495e;
`;

const PropertyValue = styled.div`
  flex: 0 0 70%;
  word-break: break-all;
`;

const Title = styled.h2`
  margin: 0;
  font-weight: 600;
  color: #2c3e50;
`;

// Add sorting components
const SortDropdown = styled.div`
  position: relative;
  display: inline-block;
  margin-left: 10px;
`;

const SortButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  color: #2c3e50;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #e9ecef;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const SortIcon = styled.span`
  display: flex;
  align-items: center;
  transform: ${props => props.$descending ? 'rotate(180deg)' : 'none'};
  transition: transform 0.2s ease;
`;

const SortMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 100;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 180px;
  display: ${props => props.$show ? 'block' : 'none'};
  margin-top: 4px;
`;

const SortMenuItem = styled.div`
  padding: 10px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background-color: #f8f9fa;
  }
  
  ${props => props.$active && `
    background-color: #ebf5fb;
    color: #3498db;
    font-weight: 500;
  `}
`;

const ActionBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
  
  @media (max-width: 576px) {
    flex-direction: column;
  }
`;

const CurrentPath = styled.div`
  background-color: white;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-family: monospace;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border-left: 4px solid #3498db;
  word-break: break-all;
`;

const FileList = styled.div`
  flex: 1;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: auto;
  position: relative;
`;

const FileListHeader = styled.div`
  display: grid;
  grid-template-columns: 40px 40px 1fr auto auto;
  align-items: center;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #eaeaea;
  font-weight: 600;
  color: #34495e;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const FileListHeaderItem = styled.div`
  padding: 0 8px;
`;

const FileItem = styled.div`
  display: grid;
  grid-template-columns: 40px 40px 1fr auto;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
  opacity: ${props => props.$isDragging ? 0.5 : 1};
  background-color: ${props => props.$isOver ? '#e3f2fd' : props.$isSelected ? '#f0f7ff' : props.$isDragTarget ? '#e8f5e9' : props.$isDragging ? '#f5f5f5' : props.$isHighlighted ? '#fff8e1' : ''};

  &:hover {
    background-color: ${props => props.$isOver ? '#bbdefb' : props.$isDragTarget ? '#c8e6c9' : '#f9f9f9'};
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 40px 40px 1fr auto;
  }
  
  @media (max-width: 576px) {
    grid-template-columns: 40px 40px 1fr;
    grid-row-gap: 8px;
  }
`;

const FileIcon = styled.div`
  margin-right: 12px;
  color: ${props => props.$isDirectory ? '#f39c12' : '#3498db'};
  display: flex;
  align-items: center;
  font-size: 18px;
`;

const FileInfo = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0; /* Allows for proper text truncation */
`;

const FileName = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
`;

const FileDetails = styled.div`
  display: flex;
  gap: 16px;
  color: #7f8c8d;
  font-size: 12px;
  margin-top: 4px;
`;

const FileSize = styled.div`
`;

const FileDate = styled.div`
  white-space: nowrap;
`;

const FileActions = styled.div`
  display: flex;
  gap: 8px;
  opacity: 0.7;
  margin-left: auto;
  
  ${FileItem}:hover & {
    opacity: 1;
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 6px;
  background-color: ${props => props.$color || '#3498db'};
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.$hoverColor || '#2980b9'};
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  /* Ensure the icon is properly centered and sized */
  svg {
    width: 16px;
    height: 16px;
    display: block;
  }
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 18px;
  background-color: ${props => props.$primary ? '#3498db' : '#2c3e50'};
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  min-height: 44px;
  
  &:hover {
    background-color: ${props => props.$primary ? '#2980b9' : '#1a252f'};
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const InfoMessage = styled.div`
  background-color: ${props => props.$type === 'error' ? '#fdeded' : '#f0f7ff'};
  color: ${props => props.$type === 'error' ? '#ef5350' : '#3498db'};
  border-left: 4px solid ${props => props.$type === 'error' ? '#ef5350' : '#3498db'};
  padding: 16px;
  border-radius: 0 8px 8px 0;
  margin-bottom: 20px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const MessageIcon = styled.div`
  margin-top: 2px;
`;

const SearchContainer = styled.div`
  position: relative;
  margin-left: auto;
`;

const SearchInput = styled.input`
  padding: 10px 16px 10px 40px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border 0.3s ease;
  width: 200px;
  
  &:focus {
    border-color: #3498db;
    outline: none;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
    width: 300px;
  }
  
  @media (max-width: 768px) {
    width: 140px;
    &:focus {
      width: 180px;
    }
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #7f8c8d;
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

const FilePreview = styled.div`
  margin-top: 20px;
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: auto;
  max-height: 80vh;
`;

const PreviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
`;

const PreviewTitle = styled.h3`
  margin: 0;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PreviewContent = styled.div`
  font-family: ${props => props.$monospace ? 'monospace' : 'inherit'};
  font-size: ${props => props.$monospace ? '14px' : 'inherit'};
  line-height: 1.5;
  text-align: ${props => props.$centered ? 'center' : 'left'};
`;

const ImagePreview = styled.img`
  max-width: ${props => `${props.$zoom * 100}%`};
  max-height: ${props => props.$zoom <= 1 ? '70vh' : 'none'};
  margin: 0 auto;
  display: block;
  object-fit: contain;
  transition: max-width 0.2s ease;
`;

const ImagePreviewContainer = styled.div`
  overflow: auto;
  max-height: 70vh;
  position: relative;
`;

const ZoomControls = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 5px;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  padding: 5px;
  z-index: 10;
`;

const ZoomButton = styled.button`
  background-color: transparent;
  color: white;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

const PdfPreview = styled.iframe`
  width: 100%;
  height: 70vh;
  border: none;
`;

const VideoPreview = styled.video`
  max-width: 100%;
  max-height: 70vh;
  margin: 0 auto;
  display: block;
`;

const AudioPreview = styled.audio`
  width: 100%;
  margin: 20px 0;
`;

const UnsupportedPreview = styled.div`
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 4px;
  text-align: center;
`;

const PreviewActions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
  justify-content: center;
`;

const LoadingIndicator = styled.div`
  padding: 20px;
  text-align: center;
  color: #7f8c8d;
`;

const Breadcrumbs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
`;

const BreadcrumbItem = styled.span`
  cursor: pointer;
  color: ${props => props.$active ? '#34495e' : '#3498db'};
  font-weight: ${props => props.$active ? '600' : '400'};
  
  &:hover {
    text-decoration: ${props => props.$active ? 'none' : 'underline'};
  }
  
  &:after {
    content: ${props => props.$active ? 'none' : '"/"'};
    margin-left: 8px;
    color: #95a5a6;
    font-weight: 400;
  }
`;

const SearchButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #2980b9;
  }
  
  &:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
`;

const AdvancedSearchContainer = styled.div`
  margin-top: 16px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
`;

const SearchHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const SearchTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SearchForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SearchRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchOptionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchOption = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DragIndicator = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #3498db;
  height: 3px;
  display: ${props => props.$visible ? 'block' : 'none'};
`;

const DropOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(52, 152, 219, 0.1);
  border: 2px dashed #3498db;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  font-size: 24px;
  color: #3498db;
  pointer-events: none;
`;

const StatusBadge = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #34495e;
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 10px;
  transform: translateY(${props => props.$visible ? '0' : '100px'});
  transition: transform 0.3s ease;
`;

const FileGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  padding: 16px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }
`;

const FileGridItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: ${props => props.$isSelected ? '#f0f7ff' : 'transparent'};
  border: 2px solid ${props => props.$isSelected ? '#3498db' : 'transparent'};
  position: relative;
  
  &:hover {
    background-color: ${props => props.$isSelected ? '#e3f2fd' : '#f9f9f9'};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const GridFileIcon = styled.div`
  color: ${props => props.$isDirectory ? '#f39c12' : '#3498db'};
  display: flex;
  align-items: center;
  font-size: 48px;
  margin-bottom: 12px;
`;

const GridFileName = styled.div`
  text-align: center;
  font-weight: 500;
  font-size: 14px;
  word-break: break-word;
  line-height: 1.3;
  max-width: 100%;
`;

const GridFileDetails = styled.div`
  text-align: center;
  color: #7f8c8d;
  font-size: 12px;
  margin-top: 8px;
`;

const GridCheckbox = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
`;

function FileExplorer() {
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileType, setFileType] = useState('');
  const [base64Content, setBase64Content] = useState('');
  const [zoom, setZoom] = useState(1);
  const imageContainerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdvancedSearchVisible, setIsAdvancedSearchVisible] = useState(false);
  const [searchContent, setSearchContent] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  
  const [showEncryptionModal, setShowEncryptionModal] = useState(false);
  const [encryptionFile, setEncryptionFile] = useState(null);
  const [encryptionMode, setEncryptionMode] = useState('encrypt');
  
  const [showCompressionModal, setShowCompressionModal] = useState(false);
  const [compressionFiles, setCompressionFiles] = useState([]);
  const [compressionMode, setCompressionMode] = useState('compress');
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  const [showPropertiesModal, setShowPropertiesModal] = useState(false);
  const [propertiesFile, setPropertiesFile] = useState(null);
  
  // Add modal states for folder creation and renaming
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameFile, setRenameFile] = useState(null);
  const [folderName, setFolderName] = useState('');
  const [newFileName, setNewFileName] = useState('');

  // Drag and Drop state
  const [draggedFile, setDraggedFile] = useState(null);
  const [dragOverFile, setDragOverFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showStatusMessage, setShowStatusMessage] = useState(false);
  const fileListRef = useRef(null);
  const mounted = useRef(false);

  // Add sorting state
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  
  // Add keyboard shortcut handling
  const fileExplorerRef = useRef(null);
  const [clipboard, setClipboard] = useState(null);
  const [clipboardOperation, setClipboardOperation] = useState(null); // 'copy' or 'cut'
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, file: null });
  const [isPathEditing, setIsPathEditing] = useState(false);
  const [pathInputValue, setPathInputValue] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

  useEffect(() => {
    mounted.current = true;
    
    // Check if we're returning to the component with a saved path
    const savedPath = localStorage.getItem('lastBrowsedPath');
    
    // Check if there's a specific directory to open from location state
    if (location.state?.openDirectory) {
      setCurrentPath(location.state.openDirectory);
    } else if (savedPath && !currentPath) {
      setCurrentPath(savedPath);
    }
    
    setInitialLoadDone(true);
    
    // Add keyboard event listeners
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'c':
            if (selectedFiles.length > 0) {
              e.preventDefault();
              handleCopy();
            }
            break;
          case 'x':
            if (selectedFiles.length > 0) {
              e.preventDefault();
              handleCut();
            }
            break;
          case 'v':
            if (clipboard) {
              e.preventDefault();
              handlePaste();
            }
            break;
          case 'a':
            e.preventDefault();
            handleSelectAll();
            break;
          case 'r':
            e.preventDefault();
            if (currentPath) {
              loadDirectory(currentPath);
            }
            break;
          default:
            break;
        }
      } else {
        switch (e.key) {
          case 'Delete':
            if (selectedFiles.length > 0) {
              handleDeleteFiles();
            }
            break;
          case 'F2':
            if (selectedFiles.length === 1) {
              handleRenameFile(selectedFiles[0]);
            }
            break;
          case 'Escape':
            setContextMenu({ show: false, x: 0, y: 0, file: null });
            setSelectedFiles([]);
            break;
          case 'Backspace':
            if (!isPathEditing) {
              navigateUp();
            }
            break;
          default:
            break;
        }
      }
    };
    
    // Add click handler to close context menu
    const handleClick = () => {
      setContextMenu({ show: false, x: 0, y: 0, file: null });
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClick);
    
    return () => {
      mounted.current = false;
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClick);
      // Clean up any pending operations
      setDraggedFile(null);
      setDragOverFile(null);
      setIsDragging(false);
      setIsDraggingOver(false);
    };
  }, [location.state, selectedFiles, clipboard, currentPath, isPathEditing]);

  useEffect(() => {
    if (currentPath && initialLoadDone) {
      loadDirectory(currentPath);
      // Save the current path to localStorage for persistence
      localStorage.setItem('lastBrowsedPath', currentPath);
    }
  }, [currentPath, initialLoadDone]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = files.filter(file => 
        file.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFiles(filtered);
    } else {
      setFilteredFiles(files);
    }
  }, [searchTerm, files]);

  // Sort files based on current sort settings
  const sortFiles = useCallback((filesToSort) => {
    if (!filesToSort || filesToSort.length === 0) return [];
    
    const sorted = [...filesToSort].sort((a, b) => {
      // Always show directories first
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      
      switch (sortBy) {
        case 'name':
          return sortDirection === 'asc' 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        case 'size':
          return sortDirection === 'asc' 
            ? a.size - b.size
            : b.size - a.size;
        case 'date':
          return sortDirection === 'asc' 
            ? new Date(a.mtime) - new Date(b.mtime)
            : new Date(b.mtime) - new Date(a.mtime);
        case 'type':
          // Compare file extensions
          const extA = a.isDirectory ? '' : path.extname(a.name).toLowerCase() || '';
          const extB = b.isDirectory ? '' : path.extname(b.name).toLowerCase() || '';
          return sortDirection === 'asc' 
            ? extA.localeCompare(extB) || a.name.localeCompare(b.name)
            : extB.localeCompare(extA) || b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });
    
    return sorted;
  }, [sortBy, sortDirection]);
  
  // Apply sorting when files change
  useEffect(() => {
    setFilteredFiles(sortFiles(filteredFiles));
  }, [sortBy, sortDirection, sortFiles]);
  
  // Update filtered files when search or sorting changes
  useEffect(() => {
    if (searchTerm) {
      const filtered = files.filter(file => 
        file.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFiles(sortFiles(filtered));
    } else {
      setFilteredFiles(sortFiles(files));
    }
  }, [searchTerm, files, sortFiles]);
  
  // Toggle sort direction or change sort property
  const handleSort = (property) => {
    if (sortBy === property) {
      // Toggle direction if same property
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Change property and reset to ascending
      setSortBy(property);
      setSortDirection('asc');
    }
    setShowSortMenu(false);
  };
  
  // Get sort icon and label
  const getSortLabel = () => {
    switch (sortBy) {
      case 'name': return 'Name';
      case 'size': return 'Size';
      case 'date': return 'Date Modified';
      case 'type': return 'Type';
      default: return 'Name';
    }
  };

  const browseDirectory = async () => {
    try {
      setIsLoading(true);
      const result = await window.electron.fileManager.browseDirectory();
      if (result.success) {
        setCurrentPath(result.path);
        setError(null);
      }
    } catch (error) {
      setError(`Error browsing directory: ${error.message}`);
    } finally {
      if (mounted.current) {
        setIsLoading(false);
      }
    }
  };

  const loadDirectory = useCallback(async (directoryPath) => {
    try {
      setIsLoading(true);
      setSelectedFile(null);
      setFileContent('');
      setBase64Content('');
      
      // Check if directoryPath is valid
      if (!directoryPath) {
        setError('Invalid directory path');
        setIsLoading(false);
        return;
      }
      
      const result = await window.electron.fileManager.readDirectory(directoryPath);
      if (result.success && mounted.current) {
        setFiles(result.items || []);
        setFilteredFiles(result.items || []);
        setError(null);
      } else if (mounted.current) {
        setError(`Error reading directory: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error reading directory:', error);
      if (mounted.current) {
        setError(`Error reading directory: ${error.message}`);
      }
    } finally {
      if (mounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const handleFileClick = async (file) => {
    if (file.isDirectory) {
      setCurrentPath(file.path);
    } else {
      try {
        setIsLoading(true);
        setSelectedFile(file);
        setZoom(1);
        
        const fileExtension = path.extname(file.name).toLowerCase();
        const type = getFileType(fileExtension);
        setFileType(type);
        
        if (type === 'image' || type === 'pdf' || type === 'video' || type === 'audio') {
          try {
            const result = await window.electron.fileManager.readFileBinary(file.path);
            if (result.success && mounted.current) {
              setBase64Content(result.content);
              setFileContent('');
              setError(null);
            } else if (mounted.current) {
              setError(`Error reading file: ${result.error || 'Unknown error'}`);
              setBase64Content('');
              setFileContent('');
            }
          } catch (error) {
            if (mounted.current) {
              setError(`Error reading file: ${error.message}`);
              setBase64Content('');
              setFileContent('');
            }
          }
        } else {
          const result = await window.electron.fileManager.readFile(file.path);
          if (result.success && mounted.current) {
            setFileContent(result.content);
            setBase64Content('');
            setError(null);
          } else if (mounted.current) {
            setError(`Error reading file: ${result.error || 'Unknown error'}`);
            setFileContent('');
            setBase64Content('');
          }
        }
      } catch (error) {
        if (mounted.current) {
          setError(`Error reading file: ${error.message}`);
          setFileContent('');
          setBase64Content('');
        }
      } finally {
        if (mounted.current) {
          setIsLoading(false);
        }
      }
    }
  };

  const navigateUp = () => {
    if (currentPath) {
      const parentPath = path.dirname(currentPath);
      if (parentPath !== currentPath) {
        setCurrentPath(parentPath);
      }
    }
  };

  const handleShareFile = (file) => {
    navigate('/share', { state: { filePath: file.path, fileName: file.name } });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const formatSize = (size) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let unitIndex = 0;
    let fileSize = size;

    while (fileSize >= 1024 && unitIndex < units.length - 1) {
      fileSize /= 1024;
      unitIndex++;
    }

    return `${fileSize.toFixed(1)} ${units[unitIndex]}`;
  };
  
  const closePreview = () => {
    setSelectedFile(null);
    setFileContent('');
    setBase64Content('');
  };
  
  const getPathParts = (pathString) => {
    if (!pathString) return [];
    
    const parts = pathString.split(path.sep).filter(Boolean);
    
    if (pathString.match(/^[A-Z]:\\/i)) {
      parts[0] = pathString.substring(0, 3);
    }
    
    if (pathString.startsWith('/')) {
      parts.unshift('/');
    }
    
    return parts;
  };
  
  const navigateToBreadcrumb = (index) => {
    const parts = getPathParts(currentPath);
    const newPath = parts.slice(0, index + 1).join(path.sep);
    
    if (parts[0] === '/' && index === 0) {
      setCurrentPath('/');
    } else if (parts[0].match(/^[A-Z]:\\/i) && index === 0) {
      setCurrentPath(parts[0]);
    } else {
      setCurrentPath(newPath);
    }
  };
  
  const buildBreadcrumbs = () => {
    const parts = getPathParts(currentPath);
    
    return (
      <Breadcrumbs>
        {parts.map((part, index) => (
          <BreadcrumbItem 
            key={index}
            onClick={() => navigateToBreadcrumb(index)}
            $active={index === parts.length - 1}
          >
            {part}
          </BreadcrumbItem>
        ))}
      </Breadcrumbs>
    );
  };

  const getFileType = (extension) => {
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'];
    const textExts = ['.txt', '.md', '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.json', '.yml', '.yaml', '.xml', '.csv'];
    const pdfExts = ['.pdf'];
    const videoExts = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
    const audioExts = ['.mp3', '.wav', '.ogg', '.m4a', '.flac'];
    
    if (imageExts.includes(extension)) return 'image';
    if (textExts.includes(extension)) return 'text';
    if (pdfExts.includes(extension)) return 'pdf';
    if (videoExts.includes(extension)) return 'video';
    if (audioExts.includes(extension)) return 'audio';
    
    return 'other';
  };

  const isArchive = (fileName) => {
    const extension = path.extname(fileName).toLowerCase();
    return extension === '.zip' || extension === '.tar' || extension === '.gz' || 
           extension === '.tgz' || fileName.toLowerCase().endsWith('.tar.gz');
  };

  const getFileIcon = (file) => {
    if (file.isDirectory) return <FaFolder />;
    
    const extension = path.extname(file.name).toLowerCase();
    
    if (isArchive(file.name)) return <FaFileArchive />;
    
    const type = getFileType(extension);
    
    switch (type) {
      case 'image': return <FaFileImage />;
      case 'text': return <FaFileAlt />;
      case 'pdf': return <FaFilePdf />;
      case 'video': return <FaFileVideo />;
      case 'audio': return <FaFileAudio />;
      default: return <FaFileGeneric />;
    }
  };

  const zoomIn = () => {
    setZoom(prevZoom => Math.min(prevZoom + 0.25, 3));
  };

  const zoomOut = () => {
    setZoom(prevZoom => Math.max(prevZoom - 0.25, 0.5));
  };

  const resetZoom = () => {
    setZoom(1);
  };

  const renderPreview = () => {
    if (!selectedFile) return null;
    
    switch (fileType) {
      case 'image':
        return (
          <PreviewContent $centered>
            <ImagePreviewContainer ref={imageContainerRef}>
              <ZoomControls>
                <ZoomButton onClick={zoomIn} title="Zoom In">
                  <FaSearchPlus />
                </ZoomButton>
                <ZoomButton onClick={zoomOut} title="Zoom Out">
                  <FaSearchMinus />
                </ZoomButton>
                <ZoomButton onClick={resetZoom} title="Reset Zoom">
                  <FaRedo />
                </ZoomButton>
              </ZoomControls>
              <ImagePreview 
                src={`data:image;base64,${base64Content}`} 
                alt={selectedFile.name} 
                $zoom={zoom}
              />
            </ImagePreviewContainer>
          </PreviewContent>
        );
        
      case 'pdf':
        return (
          <PreviewContent>
            <PdfPreview src={`data:application/pdf;base64,${base64Content}`} title={selectedFile.name} />
          </PreviewContent>
        );
        
      case 'video':
        return (
          <PreviewContent $centered>
            <VideoPreview controls>
              <source src={`data:video;base64,${base64Content}`} type="video/mp4" />
              Your browser does not support the video tag.
            </VideoPreview>
          </PreviewContent>
        );
        
      case 'audio':
        return (
          <PreviewContent $centered>
            <AudioPreview controls>
              <source src={`data:audio;base64,${base64Content}`} type="audio/mpeg" />
              Your browser does not support the audio tag.
            </AudioPreview>
          </PreviewContent>
        );
        
      case 'text':
        return (
          <PreviewContent $monospace>
            {fileContent}
          </PreviewContent>
        );
        
      default:
        return (
          <UnsupportedPreview>
            <FaFileGeneric style={{ fontSize: '48px', opacity: 0.5, marginBottom: '20px' }} />
            <h3>Preview not available</h3>
            <p>This file type cannot be previewed directly.</p>
            <PreviewActions>
              <Button onClick={() => handleShareFile(selectedFile)}>
                <FaShare /> Share File
              </Button>
            </PreviewActions>
          </UnsupportedPreview>
        );
    }
  };

  const closeSearchResults = () => {
    setShowSearchResults(false);
    setSearchResults([]);
  };

  const toggleAdvancedSearch = () => {
    setIsAdvancedSearchVisible(!isAdvancedSearchVisible);
    if (!isAdvancedSearchVisible) {
      setSearchContent('');
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleContentSearch = async () => {
    if (!currentPath) {
      setError('Please select a directory first');
      return;
    }

    if (!searchContent.trim()) {
      setError('Please enter a search term');
      return;
    }

    try {
      setIsSearching(true);
      setError(null);
      
      const options = {
        caseSensitive,
        maxResults: 100
      };
      
      const result = await window.electron.fileManager.searchFileContent({
        directoryPath: currentPath,
        searchText: searchContent,
        options
      });
      
      if (result.success && mounted.current) {
        setSearchResults(result.results);
        setShowSearchResults(true);
      } else if (mounted.current) {
        setError(`Error searching files: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error during search:', error);
      if (mounted.current) {
        setError(`Error searching files: ${error.message}`);
      }
    } finally {
      if (mounted.current) {
        setIsSearching(false);
      }
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleContentSearch();
    }
  };

  const handleEncryptFile = (file) => {
    setEncryptionFile(file);
    setEncryptionMode('encrypt');
    setShowEncryptionModal(true);
  };

  const handleDecryptFile = (file) => {
    setEncryptionFile(file);
    setEncryptionMode('decrypt');
    setShowEncryptionModal(true);
  };

  const closeEncryptionModal = () => {
    setShowEncryptionModal(false);
    if (currentPath) {
      loadDirectory(currentPath);
    }
  };

  const isEncryptedFile = (fileName) => {
    return fileName.endsWith('.enc');
  };

  const handleCompressFiles = () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file or directory to compress');
      return;
    }
    
    setCompressionFiles(selectedFiles);
    setCompressionMode('compress');
    setShowCompressionModal(true);
  };
  
  const handleExtractArchive = (file) => {
    if (!isArchive(file.name)) {
      setError('This file is not a recognized archive format');
      return;
    }
    
    setCompressionFiles([file]);
    setCompressionMode('extract');
    setShowCompressionModal(true);
  };
  
  const toggleFileSelection = (file, event) => {
    event.stopPropagation();
    
    const isSelected = selectedFiles.some(f => f.path === file.path);
    
    if (isSelected) {
      setSelectedFiles(selectedFiles.filter(f => f.path !== file.path));
    } else {
      setSelectedFiles([...selectedFiles, file]);
    }
  };
  
  const clearSelection = () => {
    setSelectedFiles([]);
  };

  const closeCompressionModal = () => {
    setShowCompressionModal(false);
    if (currentPath) {
      loadDirectory(currentPath);
    }
  };

  const handleDragStart = (e, file) => {
    if (file.isDirectory) return; // Only allow dragging files, not directories
    
    setDraggedFile(file);
    setIsDragging(true);
    
    // Set the drag image and data
    const dragImage = new Image();
    dragImage.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAEtAI8Aw5T5AAAAABJRU5ErkJggg==';
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    e.dataTransfer.setData('text/plain', file.path);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, file) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    
    if (file && file.isDirectory && draggedFile && file.path !== draggedFile.path) {
      setDragOverFile(file);
    } else {
      setDragOverFile(null);
    }
  };

  const handleDragEnter = (e, file) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (file && file.isDirectory && draggedFile && file.path !== draggedFile.path) {
      setDragOverFile(file);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFile(null);
  };

  const handleDragEnd = () => {
    setDraggedFile(null);
    setDragOverFile(null);
    setIsDragging(false);
  };

  const handleDrop = async (e, targetFile) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragOverFile(null);
    
    if (!draggedFile) return;
    
    // If target is a directory, move the file to that directory
    if (targetFile && targetFile.isDirectory) {
      try {
        setStatusMessage('Moving file...');
        setShowStatusMessage(true);
        
        const destinationPath = path.join(targetFile.path, path.basename(draggedFile.path));
        
        const result = await window.electron.fileManager.moveFile({
          sourcePath: draggedFile.path,
          destinationPath
        });
        
        if (result.success && mounted.current) {
          setStatusMessage('File moved successfully');
          // Refresh the current directory
          loadDirectory(currentPath);
        } else if (mounted.current) {
          setStatusMessage(`Error moving file: ${result.error || 'Unknown error'}`);
          setError(`Error moving file: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        if (mounted.current) {
          setStatusMessage(`Error moving file: ${error.message}`);
          setError(`Error moving file: ${error.message}`);
        }
      } finally {
        if (mounted.current) {
          setTimeout(() => {
            setShowStatusMessage(false);
          }, 3000);
        }
      }
    }
    
    setDraggedFile(null);
    setIsDragging(false);
  };

  const handleFileListDragOver = (e) => {
    e.preventDefault();
    if (isDragging) return;
    
    // Handle files dragged from outside the application
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingOver(true);
    }
  };

  const handleFileListDragLeave = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleFileListDrop = async (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    
    if (!currentPath) return;
    
    // Handle files dragged from outside the application
    if (e.dataTransfer.files.length > 0) {
      try {
        setStatusMessage('Copying files...');
        setShowStatusMessage(true);
        
        const files = Array.from(e.dataTransfer.files);
        let successCount = 0;
        
        for (const file of files) {
          const destinationPath = path.join(currentPath, file.name);
          
          const result = await window.electron.fileManager.copyFileFromPath({
            sourcePath: file.path,
            destinationPath
          });
          
          if (result.success) {
            successCount++;
          }
        }
        
        if (successCount > 0 && mounted.current) {
          setStatusMessage(`${successCount} file(s) copied successfully`);
          // Refresh the current directory
          loadDirectory(currentPath);
        } else if (mounted.current) {
          setStatusMessage('No files were copied');
        }
      } catch (error) {
        if (mounted.current) {
          setStatusMessage(`Error copying files: ${error.message}`);
          setError(`Error copying files: ${error.message}`);
        }
      } finally {
        if (mounted.current) {
          setTimeout(() => {
            setShowStatusMessage(false);
          }, 3000);
        }
      }
    }
  };

  const handleShowProperties = (file) => {
    setPropertiesFile(file);
    setShowPropertiesModal(true);
  };

  const closePropertiesModal = () => {
    setShowPropertiesModal(false);
  };

  // Clipboard operations
  const handleCopy = () => {
    if (selectedFiles.length > 0) {
      setClipboard(selectedFiles);
      setClipboardOperation('copy');
      setStatusMessage(`${selectedFiles.length} file(s) copied to clipboard`);
      setShowStatusMessage(true);
      setTimeout(() => setShowStatusMessage(false), 2000);
    }
  };

  const handleCut = () => {
    if (selectedFiles.length > 0) {
      setClipboard(selectedFiles);
      setClipboardOperation('cut');
      setStatusMessage(`${selectedFiles.length} file(s) cut to clipboard`);
      setShowStatusMessage(true);
      setTimeout(() => setShowStatusMessage(false), 2000);
    }
  };

  const handlePaste = async () => {
    if (!clipboard || !currentPath) return;

    try {
      setStatusMessage('Pasting files...');
      setShowStatusMessage(true);

      for (const file of clipboard) {
        const destinationPath = path.join(currentPath, file.name);
        
        if (clipboardOperation === 'copy') {
          await window.electron.fileManager.copyFile({
            sourcePath: file.path,
            destinationPath
          });
        } else if (clipboardOperation === 'cut') {
          await window.electron.fileManager.moveFile({
            sourcePath: file.path,
            destinationPath
          });
        }
      }

      // Clear clipboard if cut operation
      if (clipboardOperation === 'cut') {
        setClipboard(null);
        setClipboardOperation(null);
      }

      setStatusMessage(`${clipboard.length} file(s) pasted successfully`);
      loadDirectory(currentPath);
    } catch (error) {
      setStatusMessage(`Error pasting files: ${error.message}`);
      setError(`Error pasting files: ${error.message}`);
    } finally {
      setTimeout(() => setShowStatusMessage(false), 3000);
    }
  };

  const handleSelectAll = () => {
    setSelectedFiles([...filteredFiles]);
  };

  const handleDeleteFiles = async () => {
    if (selectedFiles.length === 0) return;

    const confirmed = window.confirm(`Are you sure you want to delete ${selectedFiles.length} file(s)?`);
    if (!confirmed) return;

    try {
      setStatusMessage('Deleting files...');
      setShowStatusMessage(true);

      for (const file of selectedFiles) {
        await window.electron.fileManager.deleteFile(file.path);
      }

      setStatusMessage(`${selectedFiles.length} file(s) deleted successfully`);
      setSelectedFiles([]);
      loadDirectory(currentPath);
    } catch (error) {
      setStatusMessage(`Error deleting files: ${error.message}`);
      setError(`Error deleting files: ${error.message}`);
    } finally {
      setTimeout(() => setShowStatusMessage(false), 3000);
    }
  };

  const handleRenameFile = (file) => {
    setRenameFile(file);
    setNewFileName(file.name);
    setShowRenameModal(true);
  };

  const confirmRename = async () => {
    if (!newFileName || newFileName === renameFile.name) {
      setShowRenameModal(false);
      return;
    }

    try {
      const newPath = path.join(path.dirname(renameFile.path), newFileName);
      await window.electron.fileManager.moveFile({
        sourcePath: renameFile.path,
        destinationPath: newPath
      });

      setStatusMessage('File renamed successfully');
      setShowStatusMessage(true);
      setTimeout(() => setShowStatusMessage(false), 2000);
      loadDirectory(currentPath);
      setShowRenameModal(false);
    } catch (error) {
      setStatusMessage(`Error renaming file: ${error.message}`);
      setError(`Error renaming file: ${error.message}`);
    }
  };

  const handleCreateFolder = async () => {
    setShowCreateFolderModal(true);
  };

  const confirmCreateFolder = async () => {
    if (!folderName) return;

    try {
      const folderPath = path.join(currentPath, folderName);
      await window.electron.fileManager.createDirectory(folderPath);

      setStatusMessage('Folder created successfully');
      setShowStatusMessage(true);
      setTimeout(() => setShowStatusMessage(false), 2000);
      loadDirectory(currentPath);
      setShowCreateFolderModal(false);
      setFolderName('');
    } catch (error) {
      setStatusMessage(`Error creating folder: ${error.message}`);
      setError(`Error creating folder: ${error.message}`);
    }
  };

  // Context menu handlers
  const handleContextMenu = (e, file) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      file
    });
  };

  // Path editing
  const handlePathEdit = () => {
    setIsPathEditing(true);
    setPathInputValue(currentPath);
  };

  const handlePathSubmit = (e) => {
    if (e.key === 'Enter') {
      setCurrentPath(pathInputValue);
      setIsPathEditing(false);
    } else if (e.key === 'Escape') {
      setIsPathEditing(false);
      setPathInputValue('');
    }
  };

  return (
    <Container>
      <Header>
        <Title>File Explorer</Title>
        <SearchContainer>
          <SearchIcon><FaSearch /></SearchIcon>
          <SearchInput 
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchContainer>
      </Header>

      <ActionBar>
        <Button $primary onClick={browseDirectory}>
          <FaFolder /> Browse Directory
        </Button>
        
        {currentPath && (
          <>
            <Button onClick={handleCreateFolder}>
              <FaFolder /> New Folder
            </Button>
            
            <SearchButton 
              onClick={toggleAdvancedSearch}
              title="Search file contents"
            >
              <FaSearch /> {isAdvancedSearchVisible ? 'Hide Content Search' : 'Search Contents'}
            </SearchButton>
            
            {selectedFiles.length > 0 && (
              <Button 
                onClick={handleCompressFiles}
                title="Compress selected files"
                style={{ backgroundColor: '#f39c12', marginLeft: 'auto' }}
              >
                <FaCompress /> Compress ({selectedFiles.length})
              </Button>
            )}
            
            {selectedFiles.length > 0 && (
              <Button 
                onClick={clearSelection}
                title="Clear selection"
                style={{ backgroundColor: '#95a5a6' }}
              >
                <FaTimesCircle /> Clear Selection
              </Button>
            )}
          </>
        )}
      </ActionBar>

      {currentPath && (
        <>
          <NavigationBar>
            <NavButton 
              onClick={navigateUp}
              $disabled={!currentPath || currentPath === path.dirname(currentPath)}
              title="Go Up (Backspace)"
            >
              <FaArrowUp />
            </NavButton>
            <NavButton 
              onClick={() => loadDirectory(currentPath)}
              title="Refresh (Ctrl+R)"
            >
              <FaRedo />
            </NavButton>
            <NavButton 
              onClick={() => setCurrentPath(localStorage.getItem('homeDirectory') || '/')}
              title="Home"
            >
              <FaHome />
            </NavButton>
            
            <div style={{ flex: 1, margin: '0 12px' }}>
              {isPathEditing ? (
                <PathInput
                  value={pathInputValue}
                  onChange={(e) => setPathInputValue(e.target.value)}
                  onKeyDown={handlePathSubmit}
                  onBlur={() => setIsPathEditing(false)}
                  autoFocus
                />
              ) : (
                <div 
                  onClick={handlePathEdit}
                  style={{ 
                    padding: '8px 12px', 
                    background: '#f8f9fa', 
                    borderRadius: '4px', 
                    fontFamily: 'monospace',
                    cursor: 'text',
                    wordBreak: 'break-all'
                  }}
                >
                  {currentPath}
                </div>
              )}
            </div>
            
            <SortDropdown>
              <SortButton onClick={() => setShowSortMenu(!showSortMenu)}>
                Sort: {getSortLabel()}
                <SortIcon $descending={sortDirection === 'desc'}>
                  <FaArrowUp />
                </SortIcon>
              </SortButton>
              <SortMenu $show={showSortMenu}>
                <SortMenuItem 
                  $active={sortBy === 'name'} 
                  onClick={() => handleSort('name')}
                >
                  <FaFileAlt /> Name
                </SortMenuItem>
                <SortMenuItem 
                  $active={sortBy === 'size'} 
                  onClick={() => handleSort('size')}
                >
                  <FaFile /> Size
                </SortMenuItem>
                <SortMenuItem 
                  $active={sortBy === 'date'} 
                  onClick={() => handleSort('date')}
                >
                  <FaCalendarAlt /> Date Modified
                </SortMenuItem>
                <SortMenuItem 
                  $active={sortBy === 'type'} 
                  onClick={() => handleSort('type')}
                >
                  <FaFileAlt /> Type
                </SortMenuItem>
              </SortMenu>
            </SortDropdown>
            
            <ViewToggle>
              <ViewButton 
                $active={viewMode === 'list'} 
                onClick={() => setViewMode('list')}
              >
                <FaList /> List
              </ViewButton>
              <ViewButton 
                $active={viewMode === 'grid'} 
                onClick={() => setViewMode('grid')}
              >
                <FaThLarge /> Grid
              </ViewButton>
            </ViewToggle>
          </NavigationBar>
          
          {selectedFiles.length > 0 && (
            <div style={{ 
              padding: '16px 20px', 
              background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', 
              borderRadius: '12px', 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              border: '1px solid #90caf9',
              boxShadow: '0 2px 8px rgba(33, 150, 243, 0.1)'
            }}>
              <span style={{ 
                fontWeight: '600', 
                color: '#1565c0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <FaCheck style={{ color: '#2196f3' }} />
                {selectedFiles.length} file(s) selected
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Button onClick={handleCopy} style={{ 
                  padding: '8px 16px', 
                  fontSize: '13px', 
                  minHeight: '36px',
                  backgroundColor: '#2196f3'
                }}>
                  <FaClone /> Copy
                </Button>
                <Button onClick={handleCut} style={{ 
                  padding: '8px 16px', 
                  fontSize: '13px', 
                  minHeight: '36px',
                  backgroundColor: '#ff9800'
                }}>
                  Cut
                </Button>
                {clipboard && (
                  <Button onClick={handlePaste} style={{ 
                    padding: '8px 16px', 
                    fontSize: '13px', 
                    minHeight: '36px',
                    backgroundColor: '#4caf50'
                  }}>
                    Paste
                  </Button>
                )}
                <Button onClick={handleDeleteFiles} style={{ 
                  padding: '8px 16px', 
                  fontSize: '13px', 
                  minHeight: '36px',
                  backgroundColor: '#f44336' 
                }}>
                  <FaTimes /> Delete
                </Button>
                <Button onClick={clearSelection} style={{ 
                  padding: '8px 16px', 
                  fontSize: '13px', 
                  minHeight: '36px',
                  backgroundColor: '#9e9e9e' 
                }}>
                  Clear
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {error && (
        <InfoMessage $type="error">
          <MessageIcon><FaExclamationTriangle /></MessageIcon>
          <div>{error}</div>
        </InfoMessage>
      )}

      {isAdvancedSearchVisible && currentPath && (
        <AdvancedSearchContainer>
          <SearchHeader>
            <SearchTitle>
              <FaCode /> Search File Contents
            </SearchTitle>
          </SearchHeader>
          <SearchForm>
            <SearchRow>
              <SearchInput 
                type="text"
                placeholder="Enter text to search for within files..."
                value={searchContent}
                onChange={(e) => setSearchContent(e.target.value)}
                onKeyPress={handleSearchKeyPress}
              />
              <Button 
                $primary 
                onClick={handleContentSearch}
                disabled={isSearching || !searchContent.trim()}
              >
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </SearchRow>
            <SearchOptionRow>
              <SearchOption>
                <input 
                  type="checkbox" 
                  id="caseSensitive" 
                  checked={caseSensitive}
                  onChange={(e) => setCaseSensitive(e.target.checked)}
                />
                <label htmlFor="caseSensitive">Case sensitive</label>
              </SearchOption>
              <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
                <FaInfoCircle style={{ marginRight: '5px' }} />
                Search will be performed in {currentPath}
              </div>
            </SearchOptionRow>
          </SearchForm>
        </AdvancedSearchContainer>
      )}

      {showSearchResults && (
        <SearchResults
          results={searchResults}
          searchTerm={searchContent}
          onClose={closeSearchResults}
          onFileClick={handleFileClick}
          isLoading={isSearching}
        />
      )}

      {currentPath && !showSearchResults ? (
        <>
          {buildBreadcrumbs()}
          {viewMode === 'list' ? (
            <FileList 
              ref={fileListRef}
              onDragOver={handleFileListDragOver}
              onDragLeave={handleFileListDragLeave}
              onDrop={handleFileListDrop}
            >
              <FileListHeader>
                <div></div>
                <div>Type</div>
                <div>Name</div>
                <div>Size</div>
                <div>Modified</div>
              </FileListHeader>
              
              {isLoading ? (
                <LoadingIndicator>Loading files...</LoadingIndicator>
              ) : filteredFiles.length > 0 ? (
                filteredFiles.map((file, index) => (
                  <FileItem 
                    key={index}
                    onClick={() => handleFileClick(file)}
                    onContextMenu={(e) => handleContextMenu(e, file)}
                    draggable={!file.isDirectory}
                    onDragStart={(e) => handleDragStart(e, file)}
                    onDragOver={(e) => handleDragOver(e, file)}
                    onDragEnter={(e) => handleDragEnter(e, file)}
                    onDragLeave={handleDragLeave}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDrop(e, file)}
                    $isDragging={draggedFile && draggedFile.path === file.path}
                    $isOver={dragOverFile && dragOverFile.path === file.path}
                    $isDragTarget={file.isDirectory}
                    $isSelected={selectedFiles.some(f => f.path === file.path)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedFiles.some(f => f.path === file.path)}
                        onChange={(e) => toggleFileSelection(file, e)} 
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <FileIcon $isDirectory={file.isDirectory}>
                      {getFileIcon(file)}
                    </FileIcon>
                    <FileInfo>
                      <FileName>{file.name}</FileName>
                      <FileDetails>
                        <FileSize>{formatSize(file.size)}</FileSize>
                        <FileDate>{formatDate(file.mtime)}</FileDate>
                      </FileDetails>
                    </FileInfo>
                    {!file.isDirectory && (
                      <FileActions onClick={(e) => e.stopPropagation()}>
                        <ActionButton 
                          $color="#3498db" 
                          $hoverColor="#2980b9"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFileClick(file);
                          }}
                          title="View file"
                        >
                          <FaEye />
                        </ActionButton>
                        
                        {isArchive(file.name) ? (
                          <ActionButton 
                            $color="#9b59b6" 
                            $hoverColor="#8e44ad"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExtractArchive(file);
                            }}
                            title="Extract archive"
                          >
                            <FaArchive />
                          </ActionButton>
                        ) : isEncryptedFile(file.name) ? (
                          <ActionButton 
                            $color="#27ae60" 
                            $hoverColor="#219653"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDecryptFile(file);
                            }}
                            title="Decrypt file"
                          >
                            <FaLockOpen />
                          </ActionButton>
                        ) : (
                          <ActionButton 
                            $color="#f39c12" 
                            $hoverColor="#d35400"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEncryptFile(file);
                            }}
                            title="Encrypt file"
                          >
                            <FaLock />
                          </ActionButton>
                        )}
                        
                        <ActionButton 
                          $color="#e74c3c" 
                          $hoverColor="#c0392b"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareFile(file);
                          }}
                          title="Share file"
                        >
                          <FaShare />
                        </ActionButton>
                        <ActionButton 
                          $color="#34495e" 
                          $hoverColor="#2c3e50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowProperties(file);
                          }}
                          title="File Properties"
                        >
                          <FaInfoCircle />
                        </ActionButton>
                      </FileActions>
                    )}
                    {dragOverFile && dragOverFile.path === file.path && <DragIndicator $visible={true} />}
                  </FileItem>
                ))
              ) : (
                <EmptyState>
                  <IconContainer>
                    <FaFolder />
                  </IconContainer>
                  <p>This directory is empty{searchTerm ? ' or no files match your search' : ''}</p>
                </EmptyState>
              )}
              
              {isDraggingOver && (
                <DropOverlay>
                  <div>Drop files here to upload</div>
                </DropOverlay>
              )}
            </FileList>
          ) : (
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '8px', 
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', 
              overflow: 'auto', 
              position: 'relative',
              minHeight: '400px'
            }}>
              {isLoading ? (
                <LoadingIndicator>Loading files...</LoadingIndicator>
              ) : filteredFiles.length > 0 ? (
                <FileGrid>
                  {filteredFiles.map((file, index) => (
                    <FileGridItem 
                      key={index}
                      onClick={() => handleFileClick(file)}
                      onContextMenu={(e) => handleContextMenu(e, file)}
                      draggable={!file.isDirectory}
                      onDragStart={(e) => handleDragStart(e, file)}
                      onDragOver={(e) => handleDragOver(e, file)}
                      onDragEnter={(e) => handleDragEnter(e, file)}
                      onDragLeave={handleDragLeave}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, file)}
                      $isSelected={selectedFiles.some(f => f.path === file.path)}
                    >
                      <GridCheckbox>
                        <input 
                          type="checkbox" 
                          checked={selectedFiles.some(f => f.path === file.path)}
                          onChange={(e) => toggleFileSelection(file, e)} 
                          onClick={(e) => e.stopPropagation()}
                        />
                      </GridCheckbox>
                      <GridFileIcon $isDirectory={file.isDirectory}>
                        {getFileIcon(file)}
                      </GridFileIcon>
                      <GridFileName>{file.name}</GridFileName>
                      <GridFileDetails>
                        {file.isDirectory ? (
                          <div>Folder</div>
                        ) : (
                          <>
                            <div>{formatSize(file.size)}</div>
                            <div>{formatDate(file.mtime)}</div>
                          </>
                        )}
                      </GridFileDetails>
                    </FileGridItem>
                  ))}
                </FileGrid>
              ) : (
                <EmptyState>
                  <IconContainer>
                    <FaFolder />
                  </IconContainer>
                  <p>This directory is empty{searchTerm ? ' or no files match your search' : ''}</p>
                </EmptyState>
              )}
              
              {isDraggingOver && (
                <DropOverlay>
                  <div>Drop files here to upload</div>
                </DropOverlay>
              )}
            </div>
          )}
        </>
      ) : null}

      {!currentPath && !showSearchResults && (
        <EmptyState>
          <IconContainer>
            <FaFolder />
          </IconContainer>
          <p>Select a directory to start browsing files</p>
          <Button $primary onClick={browseDirectory} style={{ marginTop: '16px' }}>
            <FaFolder /> Browse Directory
          </Button>
        </EmptyState>
      )}

      {selectedFile && (fileContent || base64Content) && (
        <FilePreview>
          <PreviewHeader>
            <PreviewTitle>
              {getFileIcon(selectedFile)} {selectedFile.name}
            </PreviewTitle>
            <Button onClick={closePreview}>Close Preview</Button>
          </PreviewHeader>
          {renderPreview()}
        </FilePreview>
      )}

      <FileEncryptionModal 
        isOpen={showEncryptionModal}
        onClose={closeEncryptionModal}
        file={encryptionFile}
        mode={encryptionMode}
      />

      <FileCompressionModal 
        isOpen={showCompressionModal}
        onClose={closeCompressionModal}
        files={compressionFiles}
        mode={compressionMode}
      />

      <FilePropertiesModal 
        isOpen={showPropertiesModal}
        onClose={closePropertiesModal}
        file={propertiesFile}
      />

      {/* Create Folder Modal */}
      {showCreateFolderModal && (
        <ModalOverlay onClick={() => setShowCreateFolderModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                <FaFolder /> Create New Folder
              </ModalTitle>
              <ModalCloseButton onClick={() => setShowCreateFolderModal(false)}>
                <FaTimes />
              </ModalCloseButton>
            </ModalHeader>
            <ModalBody>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Folder Name:
                </label>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="Enter folder name..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmCreateFolder();
                    if (e.key === 'Escape') setShowCreateFolderModal(false);
                  }}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <Button
                  onClick={() => setShowCreateFolderModal(false)}
                  style={{ backgroundColor: '#95a5a6' }}
                >
                  Cancel
                </Button>
                <Button
                  $primary
                  onClick={confirmCreateFolder}
                  disabled={!folderName.trim()}
                >
                  Create Folder
                </Button>
              </div>
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Rename File Modal */}
      {showRenameModal && (
        <ModalOverlay onClick={() => setShowRenameModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                <FaFileAlt /> Rename File
              </ModalTitle>
              <ModalCloseButton onClick={() => setShowRenameModal(false)}>
                <FaTimes />
              </ModalCloseButton>
            </ModalHeader>
            <ModalBody>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  New Name:
                </label>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="Enter new file name..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmRename();
                    if (e.key === 'Escape') setShowRenameModal(false);
                  }}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <Button
                  onClick={() => setShowRenameModal(false)}
                  style={{ backgroundColor: '#95a5a6' }}
                >
                  Cancel
                </Button>
                <Button
                  $primary
                  onClick={confirmRename}
                  disabled={!newFileName.trim() || newFileName === renameFile?.name}
                >
                  Rename
                </Button>
              </div>
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}

      <StatusBadge $visible={showStatusMessage}>
        {statusMessage.includes('Error') ? (
          <FaExclamationTriangle style={{ color: '#e74c3c' }} />
        ) : (
          <FaCheck style={{ color: '#2ecc71' }} />
        )}
        {statusMessage}
      </StatusBadge>

      <ContextMenu $show={contextMenu.show} $x={contextMenu.x} $y={contextMenu.y}>
        {contextMenu.file && (
          <>
            <ContextMenuItem onClick={() => handleFileClick(contextMenu.file)}>
              <FaEye /> {contextMenu.file.isDirectory ? 'Open' : 'View'}
            </ContextMenuItem>
            
            <ContextMenuSeparator />
            
            <ContextMenuItem onClick={() => handleRenameFile(contextMenu.file)}>
              <FaFileAlt /> Rename
            </ContextMenuItem>
            
            {!contextMenu.file.isDirectory && (
              <>
                <ContextMenuItem onClick={() => handleShareFile(contextMenu.file)}>
                  <FaShare /> Share
                </ContextMenuItem>
                
                {isEncryptedFile(contextMenu.file.name) ? (
                  <ContextMenuItem onClick={() => handleDecryptFile(contextMenu.file)}>
                    <FaLockOpen /> Decrypt
                  </ContextMenuItem>
                ) : (
                  <ContextMenuItem onClick={() => handleEncryptFile(contextMenu.file)}>
                    <FaLock /> Encrypt
                  </ContextMenuItem>
                )}
                
                {isArchive(contextMenu.file.name) && (
                  <ContextMenuItem onClick={() => handleExtractArchive(contextMenu.file)}>
                    <FaArchive /> Extract
                  </ContextMenuItem>
                )}
              </>
            )}
            
            <ContextMenuSeparator />
            
            <ContextMenuItem onClick={() => {
              setSelectedFiles([contextMenu.file]);
              handleCopy();
            }}>
              <FaClone /> Copy
            </ContextMenuItem>
            
            <ContextMenuItem onClick={() => {
              setSelectedFiles([contextMenu.file]);
              handleCut();
            }}>
              Cut
            </ContextMenuItem>
            
            {clipboard && (
              <ContextMenuItem onClick={handlePaste}>
                Paste
              </ContextMenuItem>
            )}
            
            <ContextMenuSeparator />
            
            <ContextMenuItem onClick={() => handleShowProperties(contextMenu.file)}>
              <FaInfoCircle /> Properties
            </ContextMenuItem>
            
            <ContextMenuSeparator />
            
            <ContextMenuItem 
              onClick={() => {
                setSelectedFiles([contextMenu.file]);
                handleDeleteFiles();
              }}
              style={{ color: '#e74c3c' }}
            >
              <FaTimes /> Delete
            </ContextMenuItem>
          </>
        )}
      </ContextMenu>
    </Container>
  );
}

export default FileExplorer;