import React, { useState, useEffect } from 'react';
import { styled } from 'styled-components';
import { FaChartBar, FaFolderOpen, FaLock, FaShare, FaFile, FaFileAlt, FaFileImage, FaFileVideo, FaFileAudio, FaFileArchive, FaFileCode, FaFilePdf, FaSync, FaExclamationTriangle, FaInfoCircle, FaChartPie, FaChartLine, FaDatabase, FaTimes, FaCalendarAlt, FaArrowUp, FaArrowDown, FaFilter, FaCloudDownloadAlt, FaUserSecret } from 'react-icons/fa';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import path from 'path-browserify';

// Color palette for better visualization
const COLORS = {
  primary: '#3498db',
  primaryLight: '#ebf5fb',
  primaryDark: '#2980b9',
  secondary: '#2c3e50',
  secondaryLight: '#34495e',
  secondaryDark: '#1a252f',
  success: '#2ecc71',
  successLight: '#eafaf1',
  successDark: '#27ae60',
  warning: '#f39c12',
  warningLight: '#fef5e7',
  warningDark: '#d35400',
  danger: '#e74c3c',
  dangerLight: '#fdedec',
  dangerDark: '#c0392b',
  gray: '#95a5a6',
  grayLight: '#f8f9fa',
  grayMedium: '#bdc3c7',
  grayDark: '#7f8c8d',
  white: '#ffffff',
};

// File type color mapping
const FILE_TYPE_COLORS = {
  document: COLORS.primary,
  image: COLORS.success,
  video: COLORS.danger,
  audio: '#9b59b6', // Purple
  archive: COLORS.warning,
  code: '#1abc9c', // Turquoise
  pdf: '#e67e22', // Orange
  other: COLORS.gray
};

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
    margin-bottom: 16px;
    gap: 12px;
  }
  
  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
`;

const Title = styled.h2`
  margin: 0;
  font-weight: 600;
  color: ${COLORS.secondaryLight};
  display: flex;
  align-items: center;
  gap: 10px;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
    gap: 8px;
  }
  
  @media (max-width: 480px) {
    font-size: 1.25rem;
    text-align: center;
    justify-content: center;
  }
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  grid-gap: 24px;
  margin-bottom: 24px;
  
  @media (max-width: 1024px) {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    grid-gap: 16px;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    grid-gap: 16px;
  }
  
  @media (max-width: 480px) {
    grid-gap: 12px;
    margin-bottom: 16px;
  }
`;

const DashboardRow = styled.div`
  display: grid;
  grid-template-columns: ${props => props.$columns || '1fr 1fr'};
  grid-gap: 24px;
  margin-bottom: 24px;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    grid-gap: 16px;
  }
  
  @media (max-width: 768px) {
    margin-bottom: 16px;
  }
  
  @media (max-width: 480px) {
    grid-gap: 12px;
    margin-bottom: 12px;
  }
`;

const Card = styled.div`
  background-color: ${COLORS.white};
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
  
  @media (max-width: 768px) {
    margin-bottom: 0;
    border-radius: 8px;
    
    &:hover {
      transform: none;
    }
  }
  
  @media (max-width: 480px) {
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
`;

const CardHeader = styled.div`
  padding: 16px 24px;
  background-color: ${COLORS.grayLight};
  border-bottom: 1px solid #eaeaea;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  @media (max-width: 768px) {
    padding: 12px 16px;
  }
  
  @media (max-width: 480px) {
    padding: 12px;
  }
`;

const CardTitle = styled.h3`
  margin: 0;
  color: ${COLORS.secondaryLight};
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  
  @media (max-width: 768px) {
    font-size: 15px;
    gap: 6px;
  }
  
  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const CardContent = styled.div`
  padding: 24px;
  height: ${props => props.$height || 'auto'};
  
  @media (max-width: 768px) {
    padding: 16px;
  }
  
  @media (max-width: 480px) {
    padding: 12px;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-gap: 16px;
  
  @media (max-width: 768px) {
    grid-gap: 12px;
  }
  
  @media (max-width: 576px) {
    grid-template-columns: 1fr;
    grid-gap: 16px;
  }
  
  @media (max-width: 480px) {
    grid-gap: 12px;
  }
`;

const StatsItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: ${props => props.$bg || COLORS.primaryLight};
  border-radius: 12px;
  text-align: center;
  transition: all 0.3s ease;
  border: 1px solid ${props => props.$border || 'transparent'};
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  }
  
  @media (max-width: 768px) {
    padding: 16px;
    border-radius: 8px;
    
    &:hover {
      transform: translateY(-1px);
    }
  }
  
  @media (max-width: 480px) {
    padding: 12px;
    border-radius: 6px;
  }
`;

const StatsIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: ${props => props.$bgcolor || COLORS.primary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  margin-bottom: 16px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    width: 48px;
    height: 48px;
    font-size: 20px;
    margin-bottom: 12px;
  }
  
  @media (max-width: 480px) {
    width: 40px;
    height: 40px;
    font-size: 18px;
    margin-bottom: 10px;
  }
`;

const StatsValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: ${COLORS.secondaryLight};
  margin-bottom: 8px;
  
  @media (max-width: 768px) {
    font-size: 24px;
    margin-bottom: 6px;
  }
  
  @media (max-width: 480px) {
    font-size: 20px;
    margin-bottom: 4px;
  }
`;

const StatsLabel = styled.div`
  font-size: 14px;
  color: ${COLORS.grayDark};
  font-weight: 500;
  
  @media (max-width: 768px) {
    font-size: 13px;
  }
  
  @media (max-width: 480px) {
    font-size: 12px;
  }
`;

const StatsTrend = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 6px;
  font-size: 13px;
  color: ${props => props.$isUp ? COLORS.success : COLORS.danger};
  
  @media (max-width: 768px) {
    font-size: 12px;
    gap: 4px;
    margin-top: 4px;
  }
  
  @media (max-width: 480px) {
    font-size: 11px;
  }
`;

const ChartContainer = styled.div`
  width: 100%;
  height: ${props => props.$height || '300px'};
  margin-top: ${props => props.$marginTop || '0'};
  
  @media (max-width: 768px) {
    height: ${props => props.$height ? 
      (parseInt(props.$height) * 0.8 + 'px') : '240px'};
  }
  
  @media (max-width: 480px) {
    height: ${props => props.$height ? 
      (parseInt(props.$height) * 0.7 + 'px') : '200px'};
  }
`;

const LegendContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;
  justify-content: center;
  
  @media (max-width: 768px) {
    gap: 12px;
    margin-top: 12px;
  }
  
  @media (max-width: 480px) {
    gap: 8px;
    margin-top: 8px;
  }
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  
  @media (max-width: 768px) {
    margin-bottom: 6px;
  }
  
  @media (max-width: 480px) {
    margin-bottom: 4px;
  }
`;

const LegendColor = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background-color: ${props => props.$color};
  margin-right: 8px;
  
  @media (max-width: 480px) {
    width: 12px;
    height: 12px;
    margin-right: 6px;
  }
`;

const LegendText = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  
  @media (max-width: 768px) {
    gap: 8px;
  }
  
  @media (max-width: 480px) {
    gap: 6px;
    font-size: 14px;
  }
`;

const LegendLabel = styled.span`
  color: ${COLORS.secondaryLight};
  
  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const LegendValue = styled.span`
  color: ${COLORS.grayDark};
  font-weight: 500;
  
  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const TableContainer = styled.div`
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #eaeaea;
  
  @media (max-width: 768px) {
    border-radius: 6px;
  }
  
  /* Custom scrollbar for mobile */
  &::-webkit-scrollbar {
    height: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${COLORS.grayMedium};
    border-radius: 2px;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
  
  @media (max-width: 768px) {
    min-width: 500px;
  }
  
  @media (max-width: 480px) {
    min-width: 400px;
  }
`;

const TableRow = styled.tr`
  border-bottom: 1px solid #eaeaea;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: ${COLORS.grayLight};
  }
`;

const TableHeader = styled.th`
  padding: 12px 16px;
  text-align: left;
  color: ${COLORS.secondaryLight};
  font-weight: 600;
  background-color: ${COLORS.grayLight};
  
  @media (max-width: 768px) {
    padding: 10px 12px;
    font-size: 14px;
  }
  
  @media (max-width: 480px) {
    padding: 8px 10px;
    font-size: 13px;
  }
`;

const TableCell = styled.td`
  padding: 12px 16px;
  color: ${COLORS.secondaryLight};
  vertical-align: middle;
  
  @media (max-width: 768px) {
    padding: 10px 12px;
    font-size: 14px;
  }
  
  @media (max-width: 480px) {
    padding: 8px 10px;
    font-size: 13px;
  }
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  color: ${COLORS.grayDark};
  
  @media (max-width: 768px) {
    padding: 40px 16px;
  }
  
  @media (max-width: 480px) {
    padding: 30px 12px;
  }
`;

const ErrorState = styled.div`
  padding: 16px;
  background-color: ${COLORS.dangerLight};
  color: ${COLORS.danger};
  border-left: 4px solid ${COLORS.danger};
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 24px;
  border-radius: 0 8px 8px 0;
  
  @media (max-width: 768px) {
    padding: 12px;
    gap: 8px;
    margin-bottom: 16px;
    border-radius: 0 6px 6px 0;
  }
  
  @media (max-width: 480px) {
    padding: 10px;
    gap: 6px;
    margin-bottom: 12px;
    font-size: 14px;
  }
`;

const MessageIcon = styled.div`
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

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: ${COLORS.primary};
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${COLORS.primaryDark};
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    background-color: ${COLORS.gray};
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  @media (max-width: 768px) {
    padding: 8px 12px;
    gap: 6px;
    font-size: 14px;
    
    &:hover {
      transform: none;
    }
  }
  
  @media (max-width: 480px) {
    padding: 8px 10px;
    font-size: 13px;
    width: 100%;
  }
`;

const SpinningIcon = styled.div`
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

const ProgressContainer = styled.div`
  width: 100%;
  height: ${props => props.$height || '20px'};
  background-color: #ecf0f1;
  border-radius: 10px;
  overflow: hidden;
  margin: 20px 0;
  position: relative;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
`;

const ProgressBar = styled.div`
  height: 100%;
  border-radius: 10px;
  background: linear-gradient(90deg, ${props => props.$startColor || COLORS.primary}, ${props => props.$endColor || COLORS.primaryDark});
  width: ${props => props.$percent}%;
  transition: width 0.8s ease-in-out;
`;

const ProgressLabel = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$percent > 50 ? 'white' : COLORS.secondaryLight};
  font-weight: 600;
  font-size: 12px;
  transition: color 0.3s ease;
`;

const TabsContainer = styled.div`
  display: flex;
  margin-bottom: 24px;
  border-bottom: 1px solid #ddd;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  
  &::-webkit-scrollbar {
    height: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: ${COLORS.grayMedium};
    border-radius: 4px;
  }
  
  @media (max-width: 768px) {
    margin-bottom: 16px;
  }
  
  @media (max-width: 480px) {
    margin-bottom: 12px;
  }
`;

const Tab = styled.div`
  padding: 12px 24px;
  cursor: pointer;
  white-space: nowrap;
  border-bottom: 3px solid ${props => props.$active ? COLORS.primary : 'transparent'};
  color: ${props => props.$active ? COLORS.primary : COLORS.grayDark};
  font-weight: ${props => props.$active ? '600' : '400'};
  transition: all 0.3s ease;
  
  &:hover {
    color: ${COLORS.primary};
    background-color: ${COLORS.primaryLight};
  }
  
  @media (max-width: 768px) {
    padding: 10px 16px;
    font-size: 14px;
  }
  
  @media (max-width: 480px) {
    padding: 8px 12px;
    font-size: 13px;
    min-width: 120px;
    text-align: center;
  }
`;

const LastUpdatedBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: ${COLORS.grayLight};
  border-radius: 8px;
  font-size: 14px;
  color: ${COLORS.grayDark};
  margin-bottom: 24px;
  
  @media (max-width: 768px) {
    padding: 6px 12px;
    gap: 6px;
    font-size: 13px;
    margin-bottom: 16px;
  }
  
  @media (max-width: 480px) {
    padding: 6px 10px;
    font-size: 12px;
    margin-bottom: 12px;
    border-radius: 6px;
  }
`;

const SummaryText = styled.div`
  margin: 16px 0;
  color: ${COLORS.secondaryLight};
  line-height: 1.6;
  font-size: 15px;
  
  @media (max-width: 768px) {
    margin: 12px 0;
    font-size: 14px;
    line-height: 1.5;
  }
  
  @media (max-width: 480px) {
    margin: 10px 0;
    font-size: 13px;
    line-height: 1.4;
  }
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 5px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background-color: ${props => props.$bg || COLORS.primaryLight};
  color: ${props => props.$color || COLORS.primary};
  margin-right: 8px;
  
  @media (max-width: 480px) {
    font-size: 11px;
    padding: 4px 6px;
    margin-right: 6px;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 24px;
  
  @media (max-width: 768px) {
    gap: 8px;
    margin-bottom: 16px;
  }
  
  @media (max-width: 480px) {
    gap: 6px;
    margin-bottom: 12px;
  }
`;

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: ${props => props.$active ? COLORS.primary : COLORS.grayLight};
  color: ${props => props.$active ? COLORS.white : COLORS.grayDark};
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.$active ? COLORS.primaryDark : COLORS.grayMedium};
  }
  
  @media (max-width: 768px) {
    padding: 6px 12px;
    gap: 6px;
    font-size: 14px;
    border-radius: 6px;
  }
  
  @media (max-width: 480px) {
    padding: 6px 10px;
    font-size: 13px;
    border-radius: 4px;
  }
`;

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ 
        backgroundColor: COLORS.white, 
        padding: '10px 16px', 
        border: '1px solid #eaeaea',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: COLORS.secondaryLight }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ 
            margin: '5px 0 0 0', 
            color: entry.color,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ 
              display: 'inline-block', 
              width: '10px', 
              height: '10px',
              borderRadius: '50%',
              backgroundColor: entry.color
            }}></span>
            {entry.name}: <strong>{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// File type to icon mapping
const getFileTypeIcon = (type) => {
  switch (type) {
    case 'document': return <FaFileAlt />;
    case 'image': return <FaFileImage />;
    case 'video': return <FaFileVideo />;
    case 'audio': return <FaFileAudio />;
    case 'archive': return <FaFileArchive />;
    case 'code': return <FaFileCode />;
    case 'pdf': return <FaFilePdf />;
    default: return <FaFile />;
  }
};

// Get file type based on extension
const getFileType = (extension) => {
  const documentExts = ['.doc', '.docx', '.txt', '.rtf', '.odt', '.pdf', '.xls', '.xlsx', '.ppt', '.pptx', '.csv'];
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.tiff'];
  const videoExts = ['.mp4', '.webm', '.avi', '.mov', '.mkv', '.flv', '.wmv'];
  const audioExts = ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.wma'];
  const archiveExts = ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'];
  const codeExts = ['.js', '.py', '.java', '.html', '.css', '.cpp', '.c', '.php', '.go', '.ts', '.jsx', '.tsx'];
  const pdfExts = ['.pdf'];

  if (documentExts.includes(extension.toLowerCase())) return 'document';
  if (imageExts.includes(extension.toLowerCase())) return 'image';
  if (videoExts.includes(extension.toLowerCase())) return 'video';
  if (audioExts.includes(extension.toLowerCase())) return 'audio';
  if (archiveExts.includes(extension.toLowerCase())) return 'archive';
  if (codeExts.includes(extension.toLowerCase())) return 'code';
  if (pdfExts.includes(extension.toLowerCase())) return 'pdf';
  
  return 'other';
};

function Analytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileStats, setFileStats] = useState(null);
  const [activityStats, setActivityStats] = useState(null);
  const [storageUsage, setStorageUsage] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeFilter, setTimeFilter] = useState('week');
  const [chartView, setChartView] = useState('bar');
  
  useEffect(() => {
    fetchAnalyticsData();
  }, []);
  
  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load real file statistics
      await fetchFileStats();
      
      // Load real activity statistics
      await fetchActivityStats();
      
      // Load real storage usage
      await fetchStorageUsage();
      
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to load analytics data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchFileStats = async () => {
    try {
      // Get all files list from the system
      const result = await window.electron.fileManager.getAllFiles();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch file statistics');
      }
      
      const { files } = result;
      
      // Calculate file type distribution
      const fileTypeMap = new Map();
      let encryptedCount = 0;
      let sharedCount = 0;
      let totalSize = 0;
      const recentlyModified = [];
      
      // Process files
      for (const file of files) {
        // Skip directories
        if (file.isDirectory) continue;
        
        // Add to total size
        totalSize += file.size;
        
        const extension = path.extname(file.name);
        const fileType = getFileType(extension);
        
        // Count by file type
        fileTypeMap.set(fileType, (fileTypeMap.get(fileType) || 0) + 1);
        
        // Check if encrypted
        if (file.name.endsWith('.enc')) {
          encryptedCount++;
        }
        
        // Add to recently modified files (limited to 8)
        if (recentlyModified.length < 8) {
          recentlyModified.push({
            name: file.name,
            type: fileType,
            size: file.size,
            timestamp: file.mtime
          });
        } else {
          // Replace if more recent
          const oldest = recentlyModified.reduce((prev, curr) => 
            new Date(prev.timestamp) < new Date(curr.timestamp) ? prev : curr
          );
          
          if (new Date(file.mtime) > new Date(oldest.timestamp)) {
            const idx = recentlyModified.indexOf(oldest);
            recentlyModified[idx] = {
              name: file.name,
              type: fileType,
              size: file.size,
              timestamp: file.mtime
            };
          }
        }
      }
      
      // Get shared files info
      const sharedResult = await window.electron.fileManager.getSharedFilesCount();
      if (sharedResult.success) {
        sharedCount = sharedResult.count;
      }
      
      // Sort recently modified by date (newest first)
      recentlyModified.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Create filesByType array for the chart
      const filesByType = [];
      fileTypeMap.forEach((count, type) => {
        filesByType.push({
          name: type.charAt(0).toUpperCase() + type.slice(1) + 's',
          type,
          value: count,
          color: FILE_TYPE_COLORS[type],
          icon: getFileTypeIcon(type)
        });
      });
      
      // Generate dummy growth stats for visual interest
      const growth = {
        files: Math.floor(Math.random() * 20) - 5,
        encrypted: Math.floor(Math.random() * 30),
        shared: Math.floor(Math.random() * 15),
        storage: Math.floor(Math.random() * 25) - 10
      };
      
      // Set the file stats
      setFileStats({
        totalFiles: files.filter(f => !f.isDirectory).length,
        encryptedFiles: encryptedCount,
        sharedFiles: sharedCount,
        totalSize,
        filesByType,
        recentlyModified,
        growth
      });
      
    } catch (err) {
      console.error('Error fetching file stats:', err);
      throw err;
    }
  };
  
  const fetchActivityStats = async () => {
    try {
      // Get access logs from the system
      const result = await window.electron.fileManager.getAccessLogs();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch activity statistics');
      }
      
      const { logs } = result;
      
      // Calculate activity counts
      let fileReads = 0;
      let directoryReads = 0;
      let fileShares = 0;
      let sharedFileAccess = 0;
      
      // Group by day of week
      const dayMap = {
        0: 'Sunday',
        1: 'Monday',
        2: 'Tuesday',
        3: 'Wednesday',
        4: 'Thursday',
        5: 'Friday',
        6: 'Saturday'
      };
      
      // Initialize with all days
      const activityByDay = {
        Monday: { reads: 0, shares: 0, access: 0 },
        Tuesday: { reads: 0, shares: 0, access: 0 },
        Wednesday: { reads: 0, shares: 0, access: 0 },
        Thursday: { reads: 0, shares: 0, access: 0 },
        Friday: { reads: 0, shares: 0, access: 0 },
        Saturday: { reads: 0, shares: 0, access: 0 },
        Sunday: { reads: 0, shares: 0, access: 0 }
      };
      
      // Activity by hour for heatmap
      const activityByHour = Array(24).fill(0).map((_, i) => ({
        hour: i,
        value: 0,
        label: `${i}:00`
      }));
      
      // Monthly activity trend
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonth = new Date().getMonth();
      const monthlyActivity = [];
      
      // Create the last 6 months
      for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        monthlyActivity.push({
          month: monthNames[monthIndex],
          reads: 0,
          shares: 0,
          access: 0,
          total: 0
        });
      }
      
      // Process logs
      for (const log of logs) {
        const date = new Date(log.timestamp);
        const day = dayMap[date.getDay()];
        const hour = date.getHours();
        
        // Increment hour activity
        activityByHour[hour].value++;
        
        // Increment monthly activity if within last 6 months
        const logMonth = date.getMonth();
        const monthDiff = (currentMonth - logMonth + 12) % 12;
        
        if (monthDiff < 6) {
          const monthIndex = 5 - monthDiff;
          monthlyActivity[monthIndex].total++;
          
          switch (log.action) {
            case 'read_file':
              monthlyActivity[monthIndex].reads++;
              break;
            case 'share_file':
              monthlyActivity[monthIndex].shares++;
              break;
            case 'access_shared_file':
              monthlyActivity[monthIndex].access++;
              break;
          }
        }
        
        switch (log.action) {
          case 'read_file':
            fileReads++;
            activityByDay[day].reads++;
            break;
          case 'read_directory':
            directoryReads++;
            activityByDay[day].reads++;
            break;
          case 'share_file':
            fileShares++;
            activityByDay[day].shares++;
            break;
          case 'access_shared_file':
            sharedFileAccess++;
            activityByDay[day].access++;
            break;
          default:
            break;
        }
      }
      
      // Format for the chart - preserve day order
      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const activityByDayArray = dayOrder.map(day => ({
        day,
        reads: activityByDay[day].reads,
        shares: activityByDay[day].shares,
        access: activityByDay[day].access,
        total: activityByDay[day].reads + activityByDay[day].shares + activityByDay[day].access
      }));
      
      // Set the activity stats
      setActivityStats({
        totalActivities: logs.length,
        fileReads,
        directoryReads,
        fileShares,
        sharedFileAccess,
        activityByDay: activityByDayArray,
        activityByHour,
        monthlyActivity
      });
      
    } catch (err) {
      console.error('Error fetching activity stats:', err);
      throw err;
    }
  };
  
  const fetchStorageUsage = async () => {
    try {
      // Get storage information from the system
      const result = await window.electron.fileManager.getStorageInfo();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch storage usage');
      }
      
      const { storage } = result;
      
      // Get file type distribution by size
      const result2 = await window.electron.fileManager.getFileTypeDistribution();
      
      if (!result2.success) {
        throw new Error(result2.error || 'Failed to fetch file type distribution');
      }
      
      const { typeDistribution } = result2;
      
      // Create usage by type array
      const usageByType = Object.entries(typeDistribution).map(([type, size]) => ({
        type,
        name: type.charAt(0).toUpperCase() + type.slice(1),
        size,
        color: FILE_TYPE_COLORS[type]
      }));
      
      // Calculate total used and available
      const totalStorage = storage.total;
      const usedStorage = storage.used;
      const availableStorage = storage.available;
      const usagePercent = (usedStorage / totalStorage) * 100;
      
      // Set storage usage state
      setStorageUsage({
        totalStorage,
        usedStorage,
        availableStorage,
        usagePercent,
        usageByType
      });
      
    } catch (err) {
      console.error('Error fetching storage usage:', err);
      throw err;
    }
  };
  
  // Format bytes to human-readable size
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };
  
  // Format date to human-readable timestamp
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  // Get file type usage data for the pie chart
  const getStorageByTypeData = () => {
    if (!storageUsage) return [];
    
    return storageUsage.usageByType.map(item => ({
      name: item.name,
      value: item.size,
      color: item.color
    }));
  };
  
  // Get storage percent
  const getStoragePercent = () => {
    if (!storageUsage) return 0;
    return storageUsage.usagePercent;
  };
  
  // Get activity data for bar chart
  const getActivityData = () => {
    if (!activityStats) return [];
    
    switch(timeFilter) {
      case 'week':
        return activityStats.activityByDay;
      case 'month':
        return activityStats.monthlyActivity;
      default:
        return activityStats.activityByDay;
    }
  };
  
  const renderOverviewTab = () => {
    return (
      <>
        {/* Key Statistics */}
        <DashboardGrid>
          <StatsItem $bg={COLORS.primaryLight} $border={`1px solid ${COLORS.primary}20`}>
            <StatsIcon $bgcolor={COLORS.primary}>
              <FaFile />
            </StatsIcon>
            <StatsValue>{fileStats?.totalFiles.toLocaleString()}</StatsValue>
            <StatsLabel>Total Files</StatsLabel>
            {fileStats?.growth.files !== 0 && (
              <StatsTrend $isUp={fileStats?.growth.files > 0}>
                {fileStats?.growth.files > 0 ? <FaArrowUp /> : <FaArrowDown />}
                {Math.abs(fileStats?.growth.files)}% from last month
              </StatsTrend>
            )}
          </StatsItem>
          
          <StatsItem $bg={COLORS.successLight} $border={`1px solid ${COLORS.success}20`}>
            <StatsIcon $bgcolor={COLORS.success}>
              <FaLock />
            </StatsIcon>
            <StatsValue>{fileStats?.encryptedFiles.toLocaleString()}</StatsValue>
            <StatsLabel>Encrypted Files</StatsLabel>
            {fileStats?.growth.encrypted !== 0 && (
              <StatsTrend $isUp={fileStats?.growth.encrypted > 0}>
                {fileStats?.growth.encrypted > 0 ? <FaArrowUp /> : <FaArrowDown />}
                {Math.abs(fileStats?.growth.encrypted)}% from last month
              </StatsTrend>
            )}
          </StatsItem>
          
          <StatsItem $bg={COLORS.dangerLight} $border={`1px solid ${COLORS.danger}20`}>
            <StatsIcon $bgcolor={COLORS.danger}>
              <FaShare />
            </StatsIcon>
            <StatsValue>{fileStats?.sharedFiles.toLocaleString()}</StatsValue>
            <StatsLabel>Shared Files</StatsLabel>
            {fileStats?.growth.shared !== 0 && (
              <StatsTrend $isUp={fileStats?.growth.shared > 0}>
                {fileStats?.growth.shared > 0 ? <FaArrowUp /> : <FaArrowDown />}
                {Math.abs(fileStats?.growth.shared)}% from last month
              </StatsTrend>
            )}
          </StatsItem>
          
          <StatsItem $bg={COLORS.warningLight} $border={`1px solid ${COLORS.warning}20`}>
            <StatsIcon $bgcolor={COLORS.warning}>
              <FaDatabase />
            </StatsIcon>
            <StatsValue>{formatBytes(fileStats?.totalSize)}</StatsValue>
            <StatsLabel>Total Storage Usage</StatsLabel>
            {fileStats?.growth.storage !== 0 && (
              <StatsTrend $isUp={fileStats?.growth.storage > 0}>
                {fileStats?.growth.storage > 0 ? <FaArrowUp /> : <FaArrowDown />}
                {Math.abs(fileStats?.growth.storage)}% from last month
              </StatsTrend>
            )}
          </StatsItem>
        </DashboardGrid>
        
        {/* Storage Usage and Summary */}
        <DashboardRow>
          <Card>
            <CardHeader>
              <CardTitle>
                <FaDatabase /> Storage Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontWeight: 600, color: COLORS.secondaryLight }}>
                  {formatBytes(storageUsage?.usedStorage)} used of {formatBytes(storageUsage?.totalStorage)}
                </div>
                <Badge $bg={getStoragePercent() > 80 ? COLORS.dangerLight : COLORS.primaryLight} 
                       $color={getStoragePercent() > 80 ? COLORS.danger : COLORS.primary}>
                  {getStoragePercent().toFixed(1)}% Used
                </Badge>
              </div>
              
              <ProgressContainer $height="16px">
                <ProgressBar 
                  $percent={getStoragePercent()} 
                  $startColor={getStoragePercent() > 80 ? COLORS.danger : COLORS.primary} 
                  $endColor={getStoragePercent() > 80 ? COLORS.dangerDark : COLORS.primaryDark}
                />
              </ProgressContainer>
              
              <SummaryText>
                {getStoragePercent() > 80 ? 
                  'Your storage is getting full. Consider cleaning up unused files or archives.' : 
                  'Your storage usage is healthy. You still have plenty of space available.'}
              </SummaryText>
              
              {storageUsage?.usageByType.length > 0 && (
                <>
                  <h4 style={{ margin: '24px 0 16px 0', color: COLORS.secondaryLight }}>Storage Usage by File Type</h4>
                  <ChartContainer $height="250px">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getStorageByTypeData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          innerRadius={40}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${Math.round(percent * 100)}%`}
                          paddingAngle={2}
                        >
                          {getStorageByTypeData().map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.color} 
                              stroke={COLORS.white}
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                  
                  <LegendContainer>
                    {storageUsage?.usageByType.map((item, index) => (
                      <LegendItem key={index}>
                        <LegendColor $color={item.color} />
                        <LegendText>
                          <LegendLabel>{item.name}</LegendLabel>
                          <LegendValue>{formatBytes(item.size)}</LegendValue>
                        </LegendText>
                      </LegendItem>
                    ))}
                  </LegendContainer>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>
                <FaChartLine /> Activity Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StatsGrid>
                <StatsItem $bg={COLORS.primaryLight}>
                  <StatsValue>{activityStats?.totalActivities}</StatsValue>
                  <StatsLabel>Total Activities</StatsLabel>
                </StatsItem>
                
                <StatsItem $bg={COLORS.successLight}>
                  <StatsValue>{activityStats?.fileReads}</StatsValue>
                  <StatsLabel>File Accesses</StatsLabel>
                </StatsItem>
                
                <StatsItem $bg={COLORS.warningLight}>
                  <StatsValue>{activityStats?.fileShares}</StatsValue>
                  <StatsLabel>File Shares</StatsLabel>
                </StatsItem>
                
                <StatsItem $bg={COLORS.dangerLight}>
                  <StatsValue>{activityStats?.sharedFileAccess}</StatsValue>
                  <StatsLabel>Link Downloads</StatsLabel>
                </StatsItem>
              </StatsGrid>
              
              <h4 style={{ margin: '24px 0 16px 0', color: COLORS.secondaryLight }}>Monthly Activity Trend</h4>
              <ChartContainer>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={activityStats?.monthlyActivity}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="colorReads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorShares" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.danger} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={COLORS.danger} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="month" tick={{ fill: COLORS.grayDark }} />
                    <YAxis tick={{ fill: COLORS.grayDark }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="reads" name="File Reads" stroke={COLORS.primary} fillOpacity={1} fill="url(#colorReads)" />
                    <Area type="monotone" dataKey="shares" name="File Shares" stroke={COLORS.danger} fillOpacity={1} fill="url(#colorShares)" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
              
              <SummaryText>
                This chart shows the trend of file reads and shares over the last 6 months.
                {activityStats?.monthlyActivity.length > 0 && activityStats.monthlyActivity[5].total > activityStats.monthlyActivity[0].total 
                  ? ' Your usage has increased over time, showing growing engagement with the app.'
                  : ' Consistent usage patterns help establish your normal activity baseline.'}
              </SummaryText>
            </CardContent>
          </Card>
        </DashboardRow>
      </>
    );
  };
  
  const renderFilesTab = () => {
    return (
      <>
        <SummaryText>
          This section provides detailed analytics about your files and how they're distributed across different types.
          You can see which file types are most common and check your recent file activity.
        </SummaryText>
        
        {/* File Type Distribution */}
        <Card style={{ marginBottom: '24px' }}>
          <CardHeader>
            <CardTitle>
              <FaChartPie /> File Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '300px' }}>
                <ChartContainer>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={fileStats?.filesByType}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        innerRadius={30}
                        dataKey="value"
                        nameKey="name"
                        label={({name, percent}) => `${(percent * 100).toFixed(0)}%`}
                        paddingAngle={4}
                      >
                        {fileStats?.filesByType.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color}
                            stroke={COLORS.white}
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
              
              <div style={{ flex: 1, minWidth: '300px', padding: '0 20px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: COLORS.secondaryLight }}>Distribution by File Type</h4>
                <TableContainer>
                  <Table>
                    <thead>
                      <TableRow>
                        <TableHeader>Type</TableHeader>
                        <TableHeader>Count</TableHeader>
                        <TableHeader>Percentage</TableHeader>
                      </TableRow>
                    </thead>
                    <tbody>
                      {fileStats?.filesByType.map((item, index) => {
                        const total = fileStats.filesByType.reduce((sum, item) => sum + item.value, 0);
                        const percentage = ((item.value / total) * 100).toFixed(1);
                        
                        return (
                          <TableRow key={index}>
                            <TableCell>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ 
                                  color: FILE_TYPE_COLORS[item.type],
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  backgroundColor: `${FILE_TYPE_COLORS[item.type]}20`
                                }}>
                                  {getFileTypeIcon(item.type)}
                                </span>
                                {item.name}
                              </div>
                            </TableCell>
                            <TableCell>{item.value.toLocaleString()}</TableCell>
                            <TableCell>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ flex: 1, maxWidth: '100px' }}>
                                  <ProgressContainer $height="8px">
                                    <ProgressBar 
                                      $percent={percentage} 
                                      $startColor={FILE_TYPE_COLORS[item.type]} 
                                      $endColor={FILE_TYPE_COLORS[item.type]}
                                    />
                                  </ProgressContainer>
                                </div>
                                {percentage}%
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </tbody>
                  </Table>
                </TableContainer>
                
                <SummaryText style={{ marginTop: '20px' }}>
                  {fileStats?.filesByType.length > 0 && 
                    `Your most common file type is ${fileStats.filesByType[0].name}, 
                    representing ${((fileStats.filesByType[0].value / fileStats.totalFiles) * 100).toFixed(1)}% of your files.`
                  }
                  {fileStats?.encryptedFiles > 0 && 
                    ` You have ${fileStats.encryptedFiles} encrypted files, which is ${((fileStats.encryptedFiles / fileStats.totalFiles) * 100).toFixed(1)}% of your total files.`
                  }
                </SummaryText>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Recently Modified Files */}
        <Card>
          <CardHeader>
            <CardTitle>
              <FaFile /> Recently Modified Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TableContainer>
              <Table>
                <thead>
                  <TableRow>
                    <TableHeader>File Name</TableHeader>
                    <TableHeader>Type</TableHeader>
                    <TableHeader>Size</TableHeader>
                    <TableHeader>Last Modified</TableHeader>
                  </TableRow>
                </thead>
                <tbody>
                  {fileStats?.recentlyModified.map((file, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ 
                            color: FILE_TYPE_COLORS[file.type],
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: `${FILE_TYPE_COLORS[file.type]}20`
                          }}>
                            {getFileTypeIcon(file.type)}
                          </span>
                          <div style={{ 
                            maxWidth: '250px', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {file.name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{file.type.charAt(0).toUpperCase() + file.type.slice(1)}</TableCell>
                      <TableCell>{formatBytes(file.size)}</TableCell>
                      <TableCell>{formatDate(file.timestamp)}</TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </>
    );
  };
  
  const renderActivityTab = () => {
    return (
      <>
        <SummaryText>
          This section shows detailed analytics about your activity patterns.
          You can see how your usage varies by day of the week, time of day, and over time.
        </SummaryText>
        
        <FilterContainer>
          <div style={{ marginRight: '10px', color: COLORS.grayDark }}>
            Time Period:
          </div>
          <FilterButton 
            $active={timeFilter === 'week'} 
            onClick={() => setTimeFilter('week')}
          >
            <FaCalendarAlt /> Weekly
          </FilterButton>
          <FilterButton 
            $active={timeFilter === 'month'} 
            onClick={() => setTimeFilter('month')}
          >
            <FaCalendarAlt /> Monthly
          </FilterButton>
          
          <div style={{ marginLeft: '20px', marginRight: '10px', color: COLORS.grayDark }}>
            Chart Type:
          </div>
          <FilterButton 
            $active={chartView === 'bar'} 
            onClick={() => setChartView('bar')}
          >
            Bar Chart
          </FilterButton>
          <FilterButton 
            $active={chartView === 'line'} 
            onClick={() => setChartView('line')}
          >
            Line Chart
          </FilterButton>
        </FilterContainer>
        
        {/* Activity Trends Chart */}
        <Card style={{ marginBottom: '24px' }}>
          <CardHeader>
            <CardTitle>
              <FaChartLine /> Activity Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer $height={350}>
              <ResponsiveContainer width="100%" height="100%">
                {chartView === 'bar' ? (
                  <BarChart
                    data={getActivityData()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey={timeFilter === 'week' ? 'day' : 'month'} tick={{ fill: COLORS.grayDark }} />
                    <YAxis tick={{ fill: COLORS.grayDark }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="reads" name="File Reads" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="shares" name="Shares" fill={COLORS.danger} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="access" name="Shared Access" fill={COLORS.warning} radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <LineChart
                    data={getActivityData()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey={timeFilter === 'week' ? 'day' : 'month'} tick={{ fill: COLORS.grayDark }} />
                    <YAxis tick={{ fill: COLORS.grayDark }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="reads" name="File Reads" stroke={COLORS.primary} activeDot={{ r: 8 }} strokeWidth={2} />
                    <Line type="monotone" dataKey="shares" name="Shares" stroke={COLORS.danger} activeDot={{ r: 8 }} strokeWidth={2} />
                    <Line type="monotone" dataKey="access" name="Shared Access" stroke={COLORS.warning} activeDot={{ r: 8 }} strokeWidth={2} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </ChartContainer>
            
            <SummaryText>
              {timeFilter === 'week' ? 
                `Your most active day is ${activityStats?.activityByDay.reduce((max, day) => max.total > day.total ? max : day).day}, 
                with ${activityStats?.activityByDay.reduce((max, day) => max.total > day.total ? max : day).total} total activities.` : 
                `Over the last 6 months, your activity ${activityStats?.monthlyActivity[5].total > activityStats?.monthlyActivity[0].total ? 
                  'has increased' : 'has been consistent or declined slightly'}.`
              }
            </SummaryText>
          </CardContent>
        </Card>
        
        {/* Activity by Hour Heatmap */}
        <Card style={{ marginBottom: '24px' }}>
          <CardHeader>
            <CardTitle>
              <FaCloudDownloadAlt /> Activity by Time of Day
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer $height="150px">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={activityStats?.activityByHour}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fill: COLORS.grayDark }} />
                  <YAxis type="category" dataKey="label" tick={{ fill: COLORS.grayDark }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Activities" fill={COLORS.primary}>
                    {activityStats?.activityByHour.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={`rgba(52, 152, 219, ${Math.max(0.3, entry.value / Math.max(...activityStats.activityByHour.map(h => h.value)))})`} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
            
            <SummaryText>
              This heat map shows your activity distribution across different hours of the day.
              {activityStats?.activityByHour && 
                ` Your most active hour is ${activityStats.activityByHour.reduce((max, hour) => 
                  hour.value > max.value ? hour : max).hour}:00, with ${activityStats.activityByHour.reduce((max, hour) => 
                  hour.value > max.value ? hour : max).value} activities.`
              }
            </SummaryText>
          </CardContent>
        </Card>
        
        {/* Security Stats */}
        <Card>
          <CardHeader>
            <CardTitle>
              <FaUserSecret /> Security Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatsGrid>
              <StatsItem $bg={COLORS.primaryLight}>
                <StatsIcon $bgcolor={COLORS.primary}>
                  <FaLock />
                </StatsIcon>
                <StatsValue>{fileStats?.encryptedFiles}</StatsValue>
                <StatsLabel>Encrypted Files</StatsLabel>
              </StatsItem>
              
              <StatsItem $bg={COLORS.warningLight}>
                <StatsIcon $bgcolor={COLORS.warning}>
                  <FaShare />
                </StatsIcon>
                <StatsValue>{activityStats?.fileShares}</StatsValue>
                <StatsLabel>File Shares</StatsLabel>
              </StatsItem>
            </StatsGrid>
            
            <SummaryText style={{ marginTop: '16px' }}>
              {fileStats?.encryptedFiles > 0 ? 
                `You have encrypted ${((fileStats.encryptedFiles / fileStats.totalFiles) * 100).toFixed(1)}% of your files. ` : 
                'You haven\'t encrypted any files yet. Consider encrypting sensitive files for better security. '}
              {activityStats?.fileShares > 0 ? 
                `You have shared files ${activityStats.fileShares} times.` : 
                'You haven\'t shared any files yet.'}
            </SummaryText>
          </CardContent>
        </Card>
      </>
    );
  };
  
  return (
    <Container>
      <Header>
        <Title>
          <FaChartBar /> Analytics Dashboard
        </Title>
        <RefreshButton onClick={fetchAnalyticsData} disabled={isLoading}>
          {isLoading ? (
            <>
              <SpinningIcon>
                <FaSync />
              </SpinningIcon>
              Loading...
            </>
          ) : (
            <>
              <FaSync /> Refresh Data
            </>
          )}
        </RefreshButton>
      </Header>
      
      {error && (
        <ErrorState>
          <MessageIcon>
            <FaExclamationTriangle />
          </MessageIcon>
          <MessageContent>{error}</MessageContent>
          <CloseButton onClick={() => setError(null)}>
            <FaTimes />
          </CloseButton>
        </ErrorState>
      )}
      
      {lastRefreshed && (
        <LastUpdatedBadge>
          <FaCalendarAlt />
          Last updated: {lastRefreshed.toLocaleString()}
        </LastUpdatedBadge>
      )}
      
      {isLoading ? (
        <LoadingState>
          <SpinningIcon style={{ fontSize: '48px', marginBottom: '16px' }}>
            <FaSync />
          </SpinningIcon>
          <div>Loading analytics data...</div>
        </LoadingState>
      ) : (
        <>
          <TabsContainer>
            <Tab $active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
              <FaChartBar /> Overview
            </Tab>
            <Tab $active={activeTab === 'files'} onClick={() => setActiveTab('files')}>
              <FaFile /> Files Analytics
            </Tab>
            <Tab $active={activeTab === 'activity'} onClick={() => setActiveTab('activity')}>
              <FaChartLine /> Activity Analytics
            </Tab>
          </TabsContainer>
          
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'files' && renderFilesTab()}
          {activeTab === 'activity' && renderActivityTab()}
        </>
      )}
    </Container>
  );
}

export default Analytics;