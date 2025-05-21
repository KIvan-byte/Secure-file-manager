import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { styled } from 'styled-components';
import Sidebar from './components/Sidebar';
import FileExplorer from './components/FileExplorer';
import FileSharing from './components/FileSharing';
import EncryptedFiles from './components/EncryptedFiles';
import SecureNotes from './components/SecureNotes';
import AccessLogs from './components/AccessLogs';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import LockScreen from './components/LockScreen';
import AccessSharedFile from './components/AccessSharedFile';
import ManageLinks from './components/ManageLinks';

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  background-color: #f5f6fa;
  color: #333;
`;

const MainContent = styled.div`
  flex: 1;
  padding: 20px;
  overflow: auto;
`;

function App() {
  const [selectedPage, setSelectedPage] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [securitySettings, setSecuritySettings] = useState({
    autoLock: true,
    timeout: 5,
    password: ''
  });
  const inactivityTimerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    const storedSettings = localStorage.getItem('securitySettings');
    if (storedSettings) {
      try {
        const parsedSettings = JSON.parse(storedSettings);
        setSecuritySettings(parsedSettings);
      } catch (error) {
        console.error('Error parsing security settings:', error);
      }
    }

    const handleSettingsChange = (event) => {
      setSecuritySettings(event.detail);
    };

    window.addEventListener('securitySettingsChanged', handleSettingsChange);

    return () => {
      window.removeEventListener('securitySettingsChanged', handleSettingsChange);
    };
  }, []);

  useEffect(() => {
    if (!securitySettings.autoLock || !securitySettings.password) {
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      return;
    }

    const checkInactivity = () => {
      const now = Date.now();
      const inactiveTime = now - lastActivityRef.current;
      const timeoutMs = securitySettings.timeout * 60 * 1000;

      if (inactiveTime > timeoutMs && !isLocked) {
        setIsLocked(true);
      }
    };

    inactivityTimerRef.current = setInterval(checkInactivity, 10000);

    const resetTimer = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('mousedown', resetTimer);
    window.addEventListener('keypress', resetTimer);
    window.addEventListener('scroll', resetTimer);
    window.addEventListener('touchmove', resetTimer);

    return () => {
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
      }

      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('mousedown', resetTimer);
      window.removeEventListener('keypress', resetTimer);
      window.removeEventListener('scroll', resetTimer);
      window.removeEventListener('touchmove', resetTimer);
    };
  }, [securitySettings, isLocked]);

  const handleUnlock = () => {
    setIsLocked(false);
    lastActivityRef.current = Date.now();
  };

  const lockApplication = () => {
    if (securitySettings.password) {
      setIsLocked(true);
    }
  };

  return (
    <AppContainer>
      {isLocked ? (
        <LockScreen 
          onUnlock={handleUnlock} 
          password={securitySettings.password} 
        />
      ) : (
        <>
          <Sidebar 
            selectedIndex={selectedPage} 
            onSelect={setSelectedPage} 
            onLock={lockApplication} 
          />
          <MainContent>
            <Routes>
              <Route path="/" element={<FileExplorer />} />
              <Route path="/notes" element={<SecureNotes />} />
              <Route path="/share" element={<FileSharing />} />
              <Route path="/encrypted" element={<EncryptedFiles />} />
              <Route path="/secure-notes" element={<SecureNotes />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/logs" element={<AccessLogs />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/manage-links" element={<ManageLinks />} />
              <Route path="/access/:token" element={<AccessSharedFile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </MainContent>
        </>
      )}
    </AppContainer>
  );
}

export default App;