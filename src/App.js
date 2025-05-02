import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { styled } from 'styled-components';
import Sidebar from './components/Sidebar';
import FileExplorer from './components/FileExplorer';
import FileSharing from './components/FileSharing';
import AccessLogs from './components/AccessLogs';
import AccessSharedFile from './components/AccessSharedFile';

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  background-color: #f5f6fa;
  color: #333;
`;

const ContentArea = styled.div`
  flex: 1;
  padding: 20px;
  overflow: auto;
`;

function App() {
  return (
    <AppContainer>
      <Sidebar />
      <ContentArea>
        <Routes>
          <Route path="/" element={<FileExplorer />} />
          <Route path="/share" element={<FileSharing />} />
          <Route path="/logs" element={<AccessLogs />} />
          <Route path="/access/:token" element={<AccessSharedFile />} />
        </Routes>
      </ContentArea>
    </AppContainer>
  );
}

export default App;