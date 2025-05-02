import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

function Root() {
  const [isElectronAvailable, setIsElectronAvailable] = useState(false);

  useEffect(() => {
    // Check if the Electron bridge is properly initialized
    if (window.electron && window.electron.fileManager) {
      console.log('Electron bridge detected!', window.electron);
      setIsElectronAvailable(true);
    } else {
      console.error('Electron bridge not found.');
      setIsElectronAvailable(false);
    }
  }, []);

  return (
    <React.StrictMode>
      <BrowserRouter>
        {isElectronAvailable ? (
          <App />
        ) : (
          <div style={{ padding: 20, textAlign: 'center' }}>
            <h1>Electron Bridge Not Detected</h1>
            <p>This application requires Electron to run properly. If you're seeing this message, it means the application is running in a browser without Electron integration.</p>
          </div>
        )}
      </BrowserRouter>
    </React.StrictMode>
  );
}

// Create a root instead of using the deprecated ReactDOM.render
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Root />);