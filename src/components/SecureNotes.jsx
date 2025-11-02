import React, { useState, useEffect, useRef } from 'react';
import { styled } from 'styled-components';
import { FaLock, FaEye, FaEyeSlash, FaPlus, FaTrash, FaEdit, FaFolder, FaCopy,
         FaSave, FaTimes, FaCheck, FaExclamationTriangle, FaInfoCircle,
         FaClipboard, FaSearch, FaKey, FaFile, FaFileAlt, FaCreditCard,
         FaLockOpen, FaSpinner, FaIdCard, FaStickyNote, FaSort, FaFilter } from 'react-icons/fa';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

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

const TwoColumnLayout = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 24px;
  flex: 1;

  @media (max-width: 1024px) {
    grid-template-columns: 250px 1fr;
    gap: 16px;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  @media (max-width: 480px) {
    gap: 12px;
  }
`;

const CategoryPanel = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 20px;
  height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    padding: 16px;
    height: auto;
    max-height: 400px;
    border-radius: 6px;
  }

  @media (max-width: 480px) {
    padding: 12px;
    max-height: 300px;
  }
`;

const CategoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const CategoryTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CategoryList = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: 16px;
`;

const CategoryItem = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.2s ease;
  background-color: ${props => props.$active ? '#f0f7ff' : 'transparent'};
  border-left: 3px solid ${props => props.$active ? '#3498db' : 'transparent'};

  &:hover {
    background-color: ${props => props.$active ? '#f0f7ff' : '#f8f9fa'};
  }

  &:not(:last-child) {
    margin-bottom: 4px;
  }
`;

const CategoryIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  color: ${props => props.$active ? '#3498db' : '#7f8c8d'};
`;

const CategoryName = styled.div`
  flex: 1;
  margin-left: 8px;
  color: ${props => props.$active ? '#2c3e50' : '#34495e'};
  font-weight: ${props => props.$active ? '600' : '400'};
`;

const CategoryCount = styled.div`
  background-color: ${props => props.$active ? '#3498db' : '#ecf0f1'};
  color: ${props => props.$active ? 'white' : '#7f8c8d'};
  font-size: 12px;
  font-weight: 600;
  border-radius: 16px;
  padding: 2px 8px;
  min-width: 24px;
  text-align: center;
`;

const ContentPanel = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;
`;

const ContentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eaeaea;
  flex-wrap: wrap;
  gap: 10px;
`;

const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  max-width: 400px;
`;

const SearchInput = styled.input`
  padding: 10px 16px 10px 36px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  width: 100%;

  &:focus {
    border-color: #3498db;
    outline: none;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #7f8c8d;
`;

const ActionButton = styled.button`
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
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${props => props.$primary ? '#2980b9' : '#1a252f'};
  }

  &:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
`;

const ContentList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: #7f8c8d;
  text-align: center;
  height: 100%;
`;

const IconContainer = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EntryItem = styled.div`
  background-color: ${props => props.$selected ? '#f0f7ff' : 'white'};
  border: 1px solid ${props => props.$selected ? '#3498db' : '#eaeaea'};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const EntryHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
`;

const EntryIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: ${props => props.$bg || '#3498db'};
  color: white;
  margin-right: 12px;
  flex-shrink: 0;
`;

const EntryTitle = styled.div`
  flex: 1;
  font-weight: 600;
  color: #2c3e50;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const EntryActions = styled.div`
  display: flex;
  gap: 8px;
  opacity: 0.5;
  transition: opacity 0.2s ease;

  ${EntryItem}:hover & {
    opacity: 1;
  }
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  background-color: ${props => props.$bg || '#f8f9fa'};
  color: ${props => props.$color || '#34495e'};
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.$bgHover || '#eaeaea'};
  }
`;

const EntryMeta = styled.div`
  display: flex;
  align-items: center;
  margin-top: 10px;
  font-size: 12px;
  color: #7f8c8d;
`;

const EntryCategory = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  background-color: #f8f9fa;
  padding: 3px 8px;
  border-radius: 4px;
  margin-right: 10px;
`;

const EntryDate = styled.div`
  margin-left: auto;
`;

const EntryField = styled.div`
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const EntryFieldLabel = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #7f8c8d;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const EntryFieldValue = styled.div`
  position: relative;
  background-color: #f8f9fa;
  padding: 8px 10px;
  border-radius: 4px;
  color: #2c3e50;
  font-family: ${props => props.$monospace ? 'monospace' : 'inherit'};

  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const EntryFieldActions = styled.div`
  display: flex;
  gap: 8px;
`;

const PasswordValue = styled.div`
  letter-spacing: ${props => props.$revealed ? 'normal' : '0.25em'};
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: ${props => props.$revealed ? 'monospace' : 'inherit'};
`;

const EntryBody = styled.div`
  margin-top: 12px;
`;

const Message = styled.div`
  padding: 12px 16px;
  margin-bottom: 20px;
  border-radius: 6px;
  background-color: ${props => props.$type === 'error' ? '#fdeded' : props.$type === 'success' ? '#edf7ed' : '#e1f5fe'};
  color: ${props => props.$type === 'error' ? '#ef5350' : props.$type === 'success' ? '#4caf50' : '#03a9f4'};
  border-left: 4px solid ${props => props.$type === 'error' ? '#ef5350' : props.$type === 'success' ? '#4caf50' : '#03a9f4'};
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const MessageIcon = styled.div`
  font-size: 20px;
  margin-top: 2px;
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

const Modal = styled.div`
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
  max-width: 600px;
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

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #34495e;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;

  &:focus {
    border-color: #3498db;
    outline: none;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;

  &:focus {
    border-color: #3498db;
    outline: none;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const FieldRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
`;

const FieldInput = styled.div`
  flex: 1;
`;

const ButtonSmall = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 4px;
  background-color: ${props => props.$bg || '#f8f9fa'};
  color: ${props => props.$color || '#34495e'};
  border: none;
  cursor: pointer;

  &:hover {
    background-color: ${props => props.$bgHover || '#eaeaea'};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  min-height: 100px;

  &:focus {
    border-color: #3498db;
    outline: none;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #eaeaea;
`;

const ToolBar = styled.div`
  display: flex;
  gap: 8px;
  margin-left: auto;
  flex-wrap: wrap;

  @media (max-width: 576px) {
    margin-top: 10px;
    width: 100%;
  }
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
`;

const Tag = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  background-color: #f0f7ff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #3498db;
`;

const LockScreen = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80vh;
  text-align: center;
  max-width: 400px;
  margin: 0 auto;
`;

const LockIcon = styled.div`
  font-size: 64px;
  color: #3498db;
  margin-bottom: 24px;
`;

const LockTitle = styled.h2`
  margin-bottom: 16px;
  color: #2c3e50;
`;

const LockSubtitle = styled.p`
  margin-bottom: 24px;
  color: #7f8c8d;
`;

const PasswordInput = styled.div`
  position: relative;
  width: 100%;
  margin-bottom: 20px;
`;

const PasswordEye = styled.div`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #7f8c8d;
  cursor: pointer;

  &:hover {
    color: #34495e;
  }
`;

const ErrorText = styled.div`
  color: #e74c3c;
  font-size: 14px;
  margin-top: 8px;
  text-align: center;
`;

const PasswordStrengthContainer = styled.div`
  margin-top: 8px;
`;

const PasswordStrengthBar = styled.div`
  height: 5px;
  background-color: #ecf0f1;
  border-radius: 5px;
  margin-bottom: 5px;
  overflow: hidden;
`;

const PasswordStrengthIndicator = styled.div`
  height: 100%;
  border-radius: 5px;
  width: ${props => props.$percent}%;
  background-color: ${props => {
    if (props.$strength === 'weak') return '#e74c3c';
    if (props.$strength === 'medium') return '#f39c12';
    if (props.$strength === 'strong') return '#2ecc71';
    if (props.$strength === 'very-strong') return '#27ae60';
    return '#ecf0f1';
  }};
  transition: all 0.3s ease;
`;

const PasswordStrengthText = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 12px;
`;

const PasswordStrengthLabel = styled.span`
  color: ${props => {
    if (props.$strength === 'weak') return '#e74c3c';
    if (props.$strength === 'medium') return '#f39c12';
    if (props.$strength === 'strong') return '#2ecc71';
    if (props.$strength === 'very-strong') return '#27ae60';
    return '#7f8c8d';
  }};
  font-weight: 600;
`;

const PasswordRequirements = styled.div`
  font-size: 12px;
  color: #7f8c8d;
  margin-top: 5px;
`;

const LoadingSpinner = styled(FaSpinner)`
  animation: spin 1s linear infinite;

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

// Transition styles
const fadeTransition = `
  .fade-enter {
    opacity: 0;
  }

  .fade-enter-active {
    opacity: 1;
    transition: opacity 300ms;
  }

  .fade-exit {
    opacity: 1;
  }

  .fade-exit-active {
    opacity: 0;
    transition: opacity 300ms;
  }
`;

const GlobalStyle = styled.div`
  ${fadeTransition}
`;

// Predefined categories
const CATEGORIES = [
  {
    id: 'all',
    name: 'All Items',
    icon: <FaFolder />,
    default: true
  },
  {
    id: 'passwords',
    name: 'Passwords',
    icon: <FaKey />,
    entryType: 'password'
  },
  {
    id: 'notes',
    name: 'Secure Notes',
    icon: <FaFileAlt />,
    entryType: 'note'
  },
  {
    id: 'cards',
    name: 'Credit Cards',
    icon: <FaCreditCard />,
    entryType: 'card'
  },
  {
    id: 'identities',
    name: 'Identities',
    icon: <FaIdCard />,
    entryType: 'identity'
  }
];

// Entry field configurations
const FIELD_CONFIGS = {
  'password': [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'username', label: 'Username', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'password', label: 'Password', type: 'password', required: true },
    { name: 'website', label: 'Website', type: 'url' },
    { name: 'notes', label: 'Notes', type: 'textarea' }
  ],
  'note': [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'content', label: 'Content', type: 'textarea', required: true }
  ],
  'card': [
    { name: 'title', label: 'Card Name', type: 'text', required: true },
    { name: 'cardholderName', label: 'Cardholder Name', type: 'text' },
    { name: 'cardNumber', label: 'Card Number', type: 'password', required: true },
    { name: 'expirationMonth', label: 'Expiration Month', type: 'text' },
    { name: 'expirationYear', label: 'Expiration Year', type: 'text' },
    { name: 'cvv', label: 'CVV', type: 'password' },
    { name: 'notes', label: 'Notes', type: 'textarea' }
  ],
  'identity': [
    { name: 'title', label: 'Identity Name', type: 'text', required: true },
    { name: 'firstName', label: 'First Name', type: 'text' },
    { name: 'lastName', label: 'Last Name', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'phone', label: 'Phone', type: 'tel' },
    { name: 'address', label: 'Address', type: 'textarea' },
    { name: 'notes', label: 'Notes', type: 'textarea' }
  ]
};

// Icons mapping
const TYPE_ICONS = {
  'password': <FaKey />,
  'note': <FaFileAlt />,
  'card': <FaCreditCard />,
  'identity': <FaIdCard />
};

// Colors mapping
const TYPE_COLORS = {
  'password': '#3498db',
  'note': '#2ecc71',
  'card': '#e74c3c',
  'identity': '#f39c12'
};

// Function to generate a random password
const generatePassword = (length = 16, options = {
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true
}) => {
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  const symbolChars = '!@#$%^&*()_+~`|}{[]:;?><,./-=';

  let chars = '';
  if (options.uppercase) chars += uppercaseChars;
  if (options.lowercase) chars += lowercaseChars;
  if (options.numbers) chars += numberChars;
  if (options.symbols) chars += symbolChars;

  if (!chars) return '';

  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    password += chars[randomIndex];
  }

  return password;
};

function SecureNotes() {
  // Authentication state
  const [isLocked, setIsLocked] = useState(true);
  const [masterPassword, setMasterPassword] = useState('');
  const [showMasterPassword, setShowMasterPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingPassword, setIsCreatingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [createError, setCreateError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');
  const [strengthPercent, setStrengthPercent] = useState(0);

  // Data state
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // UI state
  const [showAddModal, setShowAddModal] = useState(false);
  const [entryType, setEntryType] = useState('password');
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState(null);
  const [revealedFields, setRevealedFields] = useState({});
  const [sortOrder, setSortOrder] = useState('newest');

  // Track initial load
  const [initialLoad, setInitialLoad] = useState(true);

  // Load saved entries when unlocked
  useEffect(() => {
    if (!isLocked) {
      loadEntries();
    }
  }, [isLocked]);

  // Filter entries based on search and category
  useEffect(() => {
    if (!entries) return;

    let filtered = [...entries];

    // Filter by category
    if (selectedCategory !== 'all') {
      const category = CATEGORIES.find(c => c.id === selectedCategory);
      if (category && category.entryType) {
        filtered = filtered.filter(entry => entry.type === category.entryType);
      }
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(entry => {
        // Search in title
        if (entry.title.toLowerCase().includes(term)) return true;

        // Search in all fields
        for (const key in entry.fields) {
          const value = entry.fields[key];
          if (typeof value === 'string' && value.toLowerCase().includes(term)) {
            return true;
          }
        }

        // Search in tags
        if (entry.tags && entry.tags.some(tag => tag.toLowerCase().includes(term))) {
          return true;
        }

        return false;
      });
    }

    // Apply sorting
    if (sortOrder === 'newest') {
      filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } else if (sortOrder === 'oldest') {
      filtered.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
    } else if (sortOrder === 'alphabetical') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    setFilteredEntries(filtered);
  }, [entries, selectedCategory, searchTerm, sortOrder]);

  // Update password strength when masterPassword changes
  useEffect(() => {
    if (initialLoad && masterPassword) {
      calculatePasswordStrength(masterPassword);
    }
  }, [masterPassword, initialLoad]);

  // При монтировании сразу проверяем наличие мастер-пароля
  useEffect(() => {
    (async () => {
      if (window.electron && window.electron.auth && typeof window.electron.auth.validateMasterPassword === 'function') {
        const result = await window.electron.auth.validateMasterPassword('');
        if (result && result.newUser) {
          setIsCreatingPassword(true);
        }
      }
    })();
  }, []);

  // Calculate password strength
  const calculatePasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength('');
      setStrengthPercent(0);
      return;
    }

    let score = 0;

    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    if (/\d/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    if (!/(123|abc|password|qwerty|admin)/i.test(password)) score += 1;

    const percent = (score / 8) * 100;
    setStrengthPercent(percent);

    if (percent < 30) {
      setPasswordStrength('weak');
    } else if (percent < 60) {
      setPasswordStrength('medium');
    } else if (percent < 80) {
      setPasswordStrength('strong');
    } else {
      setPasswordStrength('very-strong');
    }
  };

  const getStrengthLabel = () => {
    switch (passwordStrength) {
      case 'weak': return 'Weak';
      case 'medium': return 'Medium';
      case 'strong': return 'Strong';
      case 'very-strong': return 'Very Strong';
      default: return '';
    }
  };

  // Load entries from secure storage
  const loadEntries = async () => {
    try {
      setIsLoading(true);
      const result = await window.electron.secureNotes.getEntries(masterPassword);

      if (result.success) {
        setEntries(result.entries);
      } else {
        setMessage({
          type: 'error',
          text: `Failed to load entries: ${result.error}`
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Failed to load entries: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle master password validation
  const handleUnlock = async () => {
    if (!masterPassword) {
      setAuthError('Please enter your master password');
      return;
    }

    try {
      setIsLoading(true);
      setAuthError('');

      if (!window.electron || !window.electron.auth || typeof window.electron.auth.validateMasterPassword !== 'function') {
        setIsCreatingPassword(true);
        setIsLoading(false);
        return;
      }

      const result = await window.electron.auth.validateMasterPassword(masterPassword);

      if (result.success) {
        setIsLocked(false);
      } else if (result.newUser) {
        setIsCreatingPassword(true);
      } else {
        setAuthError('Incorrect password');
      }
    } catch (error) {
      setAuthError(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePassword = async (e) => {
    e.preventDefault();
    setCreateError('');
    if (!newPassword || !confirmPassword) {
      setCreateError('Please fill in both fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      setCreateError('Passwords do not match');
      return;
    }
    calculatePasswordStrength(newPassword);
    if (passwordStrength === 'weak') {
      setCreateError('Password is too weak');
      return;
    }
    try {
      setIsLoading(true);
      if (!window.electron || !window.electron.secureNotes || typeof window.electron.secureNotes.setupVault !== 'function') {
        setCreateError('Secure API is not available.');
        setIsLoading(false);
        return;
      }
      const result = await window.electron.secureNotes.setupVault(newPassword);
      if (result.success) {
        setIsCreatingPassword(false);
        setMasterPassword(newPassword);
        setIsLocked(false);
      } else {
        setCreateError(result.error || 'Failed to create vault');
      }
    } catch (err) {
      setCreateError('Error: ' + (err.message || err.toString()));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle lock
  const handleLock = () => {
    setIsLocked(true);
    setMasterPassword('');
    setShowMasterPassword(false);
    setEntries([]);
    setFilteredEntries([]);
    setSelectedEntry(null);
  };

  // Handle category selection
  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setSelectedEntry(null);
  };

  // Open add/edit modal
  const handleOpenAddModal = (type = 'password') => {
    setEntryType(type);
    setFormData({});
    setIsEditing(false);
    setShowAddModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowAddModal(false);
    setFormData({});
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Create or update entry
  const handleSaveEntry = async () => {
    // Validate required fields
    const requiredFields = FIELD_CONFIGS[entryType]
      .filter(field => field.required)
      .map(field => field.name);

    const missingFields = requiredFields.filter(field => !formData[field]);

    if (missingFields.length > 0) {
      setMessage({
        type: 'error',
        text: `Please fill in all required fields: ${missingFields.join(', ')}`
      });
      return;
    }

    try {
      setIsLoading(true);

      const entryData = {
        id: isEditing ? formData.id : Date.now().toString(),
        type: entryType,
        title: formData.title,
        fields: { ...formData },
        tags: formData.tags || [],
        createdAt: isEditing ? formData.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Remove metadata from fields
      delete entryData.fields.id;
      delete entryData.fields.type;
      delete entryData.fields.title;
      delete entryData.fields.tags;
      delete entryData.fields.createdAt;
      delete entryData.fields.updatedAt;

      const result = await window.electron.secureNotes.saveEntry(entryData, masterPassword);

      if (result.success) {
        loadEntries();
        setShowAddModal(false);
        setFormData({});

        setMessage({
          type: 'success',
          text: isEditing ? 'Entry updated successfully' : 'Entry created successfully'
        });
      } else {
        setMessage({
          type: 'error',
          text: `Failed to save entry: ${result.error}`
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Failed to save entry: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit entry
  const handleEditEntry = (entry) => {
    setIsEditing(true);
    setEntryType(entry.type);
    setFormData({
      ...entry.fields,
      id: entry.id,
      title: entry.title,
      tags: entry.tags,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      type: entry.type
    });
    setShowAddModal(true);
  };

  // Handle delete entry
  const handleDeleteEntry = async (entry) => {
    if (!confirm(`Are you sure you want to delete "${entry.title}"?`)) {
      return;
    }

    try {
      setIsLoading(true);

      const result = await window.electron.secureNotes.deleteEntry(entry.id, masterPassword);

      if (result.success) {
        loadEntries();

        if (selectedEntry && selectedEntry.id === entry.id) {
          setSelectedEntry(null);
        }

        setMessage({
          type: 'success',
          text: 'Entry deleted successfully'
        });
      } else {
        setMessage({
          type: 'error',
          text: `Failed to delete entry: ${result.error}`
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Failed to delete entry: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Select an entry
  const handleSelectEntry = (entry) => {
    setSelectedEntry(entry === selectedEntry ? null : entry);
  };

  // Copy field value to clipboard
  const handleCopyToClipboard = (value) => {
    navigator.clipboard.writeText(value);

    setMessage({
      type: 'success',
      text: 'Copied to clipboard!'
    });

    // Clear message after 3 seconds
    setTimeout(() => {
      setMessage(null);
    }, 3000);
  };

  // Toggle field visibility
  const toggleFieldVisibility = (fieldName) => {
    setRevealedFields(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  // Generate a random password
  const handleGeneratePassword = () => {
    const password = generatePassword();
    setFormData(prev => ({ ...prev, password }));
  };

  // Handle master password form submit
  const handleMasterPasswordSubmit = (e) => {
    e.preventDefault();
    handleUnlock();
  };

  // Handle entry key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleUnlock();
    }
  };

  // Render the locked screen
  if (isLocked) {
    if (isCreatingPassword) {
      return (
        <Container>
          <Header>
            <Title>
              <FaLock /> Secure Notes & Passwords
            </Title>
          </Header>
          <LockScreen>
            <LockIcon>
              <FaLock />
            </LockIcon>
            <LockTitle>Create Master Password</LockTitle>
            <LockSubtitle>
              Set a strong password to protect your secure notes. Remember it — you won’t be able to recover it!
            </LockSubtitle>
            <form onSubmit={handleCreatePassword} style={{ width: '100%' }}>
              <PasswordInput>
                <Input
                  type={showMasterPassword ? 'text' : 'password'}
                  placeholder="Enter new master password"
                  value={newPassword}
                  onChange={e => { setNewPassword(e.target.value); calculatePasswordStrength(e.target.value); }}
                />
                <PasswordEye onClick={() => setShowMasterPassword(!showMasterPassword)}>
                  {showMasterPassword ? <FaEyeSlash /> : <FaEye />}
                </PasswordEye>
              </PasswordInput>
              <PasswordInput>
                <Input
                  type={showMasterPassword ? 'text' : 'password'}
                  placeholder="Confirm master password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </PasswordInput>
              {newPassword && (
                <PasswordStrengthContainer>
                  <PasswordStrengthBar>
                    <PasswordStrengthIndicator $percent={strengthPercent} $strength={passwordStrength} />
                  </PasswordStrengthBar>
                  <PasswordStrengthText>
                    <PasswordStrengthLabel $strength={passwordStrength}>
                      {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                    </PasswordStrengthLabel>
                    <span>{strengthPercent.toFixed(0)}%</span>
                  </PasswordStrengthText>
                  {passwordStrength === 'weak' && (
                    <PasswordRequirements>
                      For a strong password, use at least 12 characters with uppercase, lowercase, numbers, and special characters.
                    </PasswordRequirements>
                  )}
                </PasswordStrengthContainer>
              )}
              {createError && <ErrorText>{createError}</ErrorText>}
              <ActionButton $primary type="submit" style={{ width: '100%' }} disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Password'}
              </ActionButton>
            </form>
          </LockScreen>
        </Container>
      );
    }
    return (
      <Container>
        <Header>
          <Title>
            <FaLock /> Secure Notes & Passwords
          </Title>
        </Header>

        <GlobalStyle />

        <LockScreen>
          <LockIcon>
            <FaLock />
          </LockIcon>

          <LockTitle>Unlock Your Secure Vault</LockTitle>
          <LockSubtitle>
            Enter your master password to access your secure notes and passwords
          </LockSubtitle>

          <form onSubmit={handleMasterPasswordSubmit} style={{ width: '100%' }}>
            <PasswordInput>
              <Input
                type={showMasterPassword ? 'text' : 'password'}
                placeholder="Enter master password"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <PasswordEye onClick={() => setShowMasterPassword(!showMasterPassword)}>
                {showMasterPassword ? <FaEyeSlash /> : <FaEye />}
              </PasswordEye>
            </PasswordInput>

            {authError && <ErrorText>{authError}</ErrorText>}

            <ActionButton
              $primary
              type="submit"
              style={{ width: '100%' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner /> Verifying...
                </>
              ) : (
                <>
                  <FaLockOpen /> Unlock
                </>
              )}
            </ActionButton>
          </form>
        </LockScreen>
      </Container>
    );
  }

  // Get count of entries by category
  const getCategoryCount = (categoryId) => {
    if (categoryId === 'all') return entries.length;

    const category = CATEGORIES.find(c => c.id === categoryId);
    if (category && category.entryType) {
      return entries.filter(entry => entry.type === category.entryType).length;
    }

    return 0;
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Render entry field
  const renderEntryField = (entry, fieldName, fieldConfig) => {
    if (!entry.fields[fieldName] && fieldName !== 'tags') return null;

    const label = fieldConfig ? fieldConfig.label : fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    const isPassword = fieldConfig && fieldConfig.type === 'password';
    const isTextarea = fieldConfig && fieldConfig.type === 'textarea';
    const isRevealed = revealedFields[fieldName];

    return (
      <EntryField key={fieldName}>
        <EntryFieldLabel>
          {isPassword ? <FaKey /> : null}
          {label}
        </EntryFieldLabel>
        <EntryFieldValue $monospace={isPassword && isRevealed}>
          {isPassword ? (
            <PasswordValue $revealed={isRevealed}>
              {isRevealed ? entry.fields[fieldName] : '••••••••••••••••'}
            </PasswordValue>
          ) : isTextarea ? (
            <div style={{ whiteSpace: 'pre-wrap' }}>{entry.fields[fieldName]}</div>
          ) : (
            entry.fields[fieldName]
          )}

          <EntryFieldActions>
            {isPassword && (
              <IconButton
                onClick={() => toggleFieldVisibility(fieldName)}
                title={isRevealed ? 'Hide' : 'Show'}
              >
                {isRevealed ? <FaEyeSlash /> : <FaEye />}
              </IconButton>
            )}
            <IconButton
              onClick={() => handleCopyToClipboard(entry.fields[fieldName])}
              title="Copy to clipboard"
            >
              <FaCopy />
            </IconButton>
          </EntryFieldActions>
        </EntryFieldValue>
      </EntryField>
    );
  };

  return (
    <Container>
      <Header>
        <Title>
          <FaLock /> Secure Notes & Passwords
        </Title>
        <ActionButton onClick={handleLock}>
          <FaLock /> Lock Vault
        </ActionButton>
      </Header>

      <GlobalStyle />

      {message && (
        <Message $type={message.type}>
          <MessageIcon>
            {message.type === 'error' ? <FaExclamationTriangle /> :
             message.type === 'success' ? <FaCheck /> :
             <FaInfoCircle />}
          </MessageIcon>
          <MessageContent>{message.text}</MessageContent>
          <CloseButton onClick={() => setMessage(null)}>
            <FaTimes />
          </CloseButton>
        </Message>
      )}

      <TwoColumnLayout>
        <CategoryPanel>
          <CategoryHeader>
            <CategoryTitle>
              <FaFolder /> Categories
            </CategoryTitle>
          </CategoryHeader>

          <CategoryList>
            {CATEGORIES.map(category => (
              <CategoryItem
                key={category.id}
                $active={selectedCategory === category.id}
                onClick={() => handleCategorySelect(category.id)}
              >
                <CategoryIcon $active={selectedCategory === category.id}>
                  {category.icon}
                </CategoryIcon>
                <CategoryName $active={selectedCategory === category.id}>
                  {category.name}
                </CategoryName>
                <CategoryCount $active={selectedCategory === category.id}>
                  {getCategoryCount(category.id)}
                </CategoryCount>
              </CategoryItem>
            ))}
          </CategoryList>

          <ActionButton $primary onClick={() => handleOpenAddModal()}>
            <FaPlus /> Add New Item
          </ActionButton>
        </CategoryPanel>

        <ContentPanel>
          <ContentHeader>
            <SearchContainer>
              <SearchIcon><FaSearch /></SearchIcon>
              <SearchInput
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchContainer>

            <ToolBar>
              <ActionButton
                onClick={() => setSortOrder(prev =>
                  prev === 'newest' ? 'oldest' :
                  prev === 'oldest' ? 'alphabetical' : 'newest'
                )}
                title="Change sort order"
              >
                <FaSort /> {sortOrder === 'newest' ? 'Newest' :
                           sortOrder === 'oldest' ? 'Oldest' : 'A-Z'}
              </ActionButton>

              {selectedCategory !== 'all' && (
                <ActionButton
                  $primary
                  onClick={() => {
                    const category = CATEGORIES.find(c => c.id === selectedCategory);
                    if (category && category.entryType) {
                      handleOpenAddModal(category.entryType);
                    } else {
                      handleOpenAddModal();
                    }
                  }}
                >
                  <FaPlus /> Add {selectedCategory === 'passwords' ? 'Password' :
                             selectedCategory === 'notes' ? 'Note' :
                             selectedCategory === 'cards' ? 'Card' :
                             selectedCategory === 'identities' ? 'Identity' : 'Entry'}
                </ActionButton>
              )}
            </ToolBar>
          </ContentHeader>

          <ContentList>
            {isLoading ? (
              <EmptyState>
                <LoadingSpinner size={48} />
                <p>Loading entries...</p>
              </EmptyState>
            ) : filteredEntries.length === 0 ? (
              <EmptyState>
                <IconContainer>
                  {selectedCategory === 'all' ? <FaFolder /> :
                   selectedCategory === 'passwords' ? <FaKey /> :
                   selectedCategory === 'notes' ? <FaStickyNote /> :
                   selectedCategory === 'cards' ? <FaCreditCard /> :
                   selectedCategory === 'identities' ? <FaIdCard /> : <FaFile />}
                </IconContainer>

                {searchTerm ? (
                  <>
                    <p>No entries found matching "{searchTerm}"</p>
                    <ActionButton onClick={() => setSearchTerm('')}>
                      Clear Search
                    </ActionButton>
                  </>
                ) : (
                  <>
                    <p>No entries in this category</p>
                    <ActionButton
                      $primary
                      onClick={() => {
                        const category = CATEGORIES.find(c => c.id === selectedCategory);
                        if (category && category.entryType) {
                          handleOpenAddModal(category.entryType);
                        } else {
                          handleOpenAddModal();
                        }
                      }}
                      style={{ marginTop: '16px' }}
                    >
                      <FaPlus /> Add {selectedCategory === 'passwords' ? 'Password' :
                               selectedCategory === 'notes' ? 'Note' :
                               selectedCategory === 'cards' ? 'Card' :
                               selectedCategory === 'identities' ? 'Identity' : 'Entry'}
                    </ActionButton>
                  </>
                )}
              </EmptyState>
            ) : (
              <TransitionGroup>
                {filteredEntries.map(entry => (
                  <CSSTransition
                    key={entry.id}
                    timeout={300}
                    classNames="fade"
                  >
                    <EntryItem
                      $selected={selectedEntry && selectedEntry.id === entry.id}
                      onClick={() => handleSelectEntry(entry)}
                    >
                      <EntryHeader>
                        <EntryIcon $bg={TYPE_COLORS[entry.type]}>
                          {TYPE_ICONS[entry.type]}
                        </EntryIcon>
                        <EntryTitle>{entry.title}</EntryTitle>
                        <EntryActions>
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditEntry(entry);
                            }}
                            title="Edit"
                          >
                            <FaEdit />
                          </IconButton>
                          <IconButton
                            $bg="#f8d7da"
                            $bgHover="#f5c6cb"
                            $color="#e74c3c"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEntry(entry);
                            }}
                            title="Delete"
                          >
                            <FaTrash />
                          </IconButton>
                        </EntryActions>
                      </EntryHeader>

                      {selectedEntry && selectedEntry.id === entry.id && (
                        <EntryBody>
                          {Object.keys(entry.fields).map(fieldName => {
                            const fieldConfig = FIELD_CONFIGS[entry.type].find(f => f.name === fieldName);
                            return renderEntryField(entry, fieldName, fieldConfig);
                          })}

                          {entry.tags && entry.tags.length > 0 && (
                            <EntryField>
                              <EntryFieldLabel>Tags</EntryFieldLabel>
                              <TagsContainer>
                                {entry.tags.map((tag, index) => (
                                  <Tag key={index}>{tag}</Tag>
                                ))}
                              </TagsContainer>
                            </EntryField>
                          )}
                        </EntryBody>
                      )}

                      <EntryMeta>
                        <EntryCategory>
                          {TYPE_ICONS[entry.type]} {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                        </EntryCategory>
                        <EntryDate>Updated: {formatDate(entry.updatedAt)}</EntryDate>
                      </EntryMeta>
                    </EntryItem>
                  </CSSTransition>
                ))}
              </TransitionGroup>
            )}
          </ContentList>
        </ContentPanel>
      </TwoColumnLayout>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <Modal onClick={handleCloseModal}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {isEditing ? (
                  <>
                    <FaEdit /> Edit {entryType.charAt(0).toUpperCase() + entryType.slice(1)}
                  </>
                ) : (
                  <>
                    <FaPlus /> Add New {entryType.charAt(0).toUpperCase() + entryType.slice(1)}
                  </>
                )}
              </ModalTitle>
              <CloseButton onClick={handleCloseModal}>
                <FaTimes />
              </CloseButton>
            </ModalHeader>

            <ModalBody>
              <FormGroup>
                <Label>Entry Type</Label>
                <Select
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value)}
                  disabled={isEditing}
                >
                  <option value="password">Password</option>
                  <option value="note">Secure Note</option>
                  <option value="card">Credit Card</option>
                  <option value="identity">Identity</option>
                </Select>
              </FormGroup>

              {FIELD_CONFIGS[entryType].map(field => (
                <FormGroup key={field.name}>
                  <Label>{field.label}{field.required ? ' *' : ''}</Label>

                  {field.type === 'textarea' ? (
                    <TextArea
                      name={field.name}
                      value={formData[field.name] || ''}
                      onChange={handleInputChange}
                      placeholder={field.label}
                    />
                  ) : field.type === 'password' ? (
                    <FieldRow>
                      <FieldInput>
                        <Input
                          type="text"
                          name={field.name}
                          value={formData[field.name] || ''}
                          onChange={handleInputChange}
                          placeholder={field.label}
                        />
                      </FieldInput>

                      {field.name === 'password' && (
                        <ButtonSmall
                          title="Generate password"
                          onClick={handleGeneratePassword}
                          $bg="#3498db"
                          $color="white"
                          $bgHover="#2980b9"
                        >
                          <FaKey />
                        </ButtonSmall>
                      )}
                    </FieldRow>
                  ) : (
                    <Input
                      type={field.type}
                      name={field.name}
                      value={formData[field.name] || ''}
                      onChange={handleInputChange}
                      placeholder={field.label}
                    />
                  )}
                </FormGroup>
              ))}

              <FormGroup>
                <Label>Tags (comma separated)</Label>
                <Input
                  type="text"
                  name="tags"
                  value={formData.tags ? formData.tags.join(', ') : ''}
                  onChange={(e) => {
                    const tagsValue = e.target.value;
                    const tagsArray = tagsValue
                      .split(',')
                      .map(tag => tag.trim())
                      .filter(tag => tag.length > 0);
                    setFormData(prev => ({ ...prev, tags: tagsArray }));
                  }}
                  placeholder="Enter tags separated by commas"
                />
              </FormGroup>
            </ModalBody>

            <ModalFooter>
              <ActionButton onClick={handleCloseModal}>
                <FaTimes /> Cancel
              </ActionButton>
              <ActionButton
                $primary
                onClick={handleSaveEntry}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner /> Saving...
                  </>
                ) : (
                  <>
                    <FaSave /> Save
                  </>
                )}
              </ActionButton>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
}

export default SecureNotes;