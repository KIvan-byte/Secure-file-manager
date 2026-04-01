import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { styled } from 'styled-components';
import { FaFolder, FaShareAlt, FaListAlt, FaBars, FaTimes, FaLock, FaChartBar, FaSignOutAlt, FaCog, FaStickyNote, FaLink, FaSync } from 'react-icons/fa';

const SidebarContainer = styled.div`
  background-color: #2c3e50;
  color: white;
  width: ${props => props.$isOpen ? '240px' : '70px'};
  transition: all 0.3s ease;
  position: relative;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media (max-width: 768px) {
    position: fixed;
    width: ${props => props.$isOpen ? '280px' : '0'};
    height: 100vh;
    top: 0;
    left: 0;
    transform: translateX(${props => props.$isOpen ? '0' : '-100%'});
    opacity: 1;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
  }

  @media (max-width: 480px) {
    width: ${props => props.$isOpen ? '100vw' : '0'};
  }
`;

const AppTitle = styled.h1`
  font-size: 20px;
  margin: 0;
  padding: 20px;
  border-bottom: 1px solid #34495e;
  text-align: ${props => props.$collapsed ? 'center' : 'left'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  justify-content: ${props => props.$collapsed ? 'center' : 'space-between'};

  @media (max-width: 768px) {
    font-size: 18px;
    padding: 16px 20px;
  }

  @media (max-width: 480px) {
    font-size: 16px;
    padding: 16px;
  }
`;

const AppTitleText = styled.span`
  display: ${props => props.$collapsed ? 'none' : 'inline'};

  @media (max-width: 480px) {
    font-size: 16px;
  }
`;

const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  padding: 14px 20px;
  color: ${props => props.$active ? 'white' : '#bdc3c7'};
  text-decoration: none;
  background-color: ${props => props.$active ? '#34495e' : 'transparent'};
  transition: all 0.2s ease;

  &:hover {
    background-color: #34495e;
    color: white;
  }

  @media (max-width: 768px) {
    padding: 16px 20px;
    font-size: 16px;
  }

  @media (max-width: 480px) {
    padding: 16px;
    font-size: 15px;
  }
`;

const NavIcon = styled.span`
  margin-right: ${props => props.$collapsed ? '0' : '12px'};
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${props => props.$collapsed ? '100%' : 'auto'};
  font-size: 18px;

  @media (max-width: 768px) {
    margin-right: 16px;
    font-size: 20px;
  }

  @media (max-width: 480px) {
    margin-right: 12px;
    font-size: 18px;
  }
`;

const NavText = styled.span`
  display: ${props => props.$collapsed ? 'none' : 'inline'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Navigation = styled.nav`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const ToggleButton = styled.button`
  position: fixed;
  top: 10px;
  left: ${props => props.$isOpen ? '250px' : '10px'};
  background-color: #34495e;
  color: white;
  border: none;
  border-radius: 4px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1001;
  transition: left 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);

  @media (max-width: 768px) {
    left: ${props => props.$isOpen ? '10px' : '10px'};
    top: 10px;
    background-color: ${props => props.$isOpen ? '#e74c3c' : '#34495e'};
    width: 44px;
    height: 44px;
    border-radius: 6px;
  }

  @media (max-width: 480px) {
    width: 48px;
    height: 48px;
    border-radius: 8px;
  }

  @media (min-width: 769px) {
    display: none;
  }
`;

const AppInfo = styled.div`
  padding: 12px;
  font-size: 12px;
  text-align: center;
  color: #7f8c8d;
  border-top: 1px solid #34495e;
  margin-top: auto;
  display: ${props => props.$collapsed ? 'none' : 'block'};

  @media (max-width: 768px) {
    padding: 16px;
    font-size: 11px;
  }

  @media (max-width: 480px) {
    padding: 12px;
    font-size: 10px;
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 999;
  display: ${props => props.$isOpen ? 'block' : 'none'};
  transition: opacity 0.3s ease;

  @media (max-width: 480px) {
    background-color: rgba(0, 0, 0, 0.8);
  }

  @media (min-width: 769px) {
    display: none;
  }
`;

const LockButton = styled.button`
  display: flex;
  align-items: center;
  padding: 14px 20px;
  color: white;
  background-color: #e74c3c;
  border: none;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: all 0.2s ease;

  &:hover {
    background-color: #c0392b;
  }

  @media (max-width: 768px) {
    padding: 16px 20px;
    font-size: 16px;
  }

  @media (max-width: 480px) {
    padding: 16px;
    font-size: 15px;
  }
`;

function Sidebar({ selectedIndex, onSelect, onLock }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(window.innerWidth > 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      // Auto-close sidebar on mobile or keep it open on desktop
      if (mobile && isOpen) {
        setIsOpen(false);
      } else if (!mobile && !isOpen) {
        setIsOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const handleNavigation = (path, index) => {
    navigate(path);
    if (onSelect) {
      onSelect(index);
    }
    closeSidebar();
  };

  const collapsed = !isOpen;

  return (
    <>
      <Overlay $isOpen={isOpen && isMobile} onClick={() => setIsOpen(false)} />

      <ToggleButton onClick={toggleSidebar} $isOpen={isOpen}>
        {isOpen ? <FaTimes /> : <FaBars />}
      </ToggleButton>

      <SidebarContainer $isOpen={isOpen}>
        <AppTitle $collapsed={collapsed}>
          <AppTitleText $collapsed={collapsed}>Secure File Manager</AppTitleText>
          {collapsed ? <FaFolder /> : null}
        </AppTitle>

        <Navigation>
          <NavLink
            to="/"
            $active={location.pathname === '/' ? "true" : undefined}
            onClick={() => handleNavigation('/', 0)}
          >
            <NavIcon $collapsed={collapsed}><FaFolder /></NavIcon>
            <NavText $collapsed={collapsed}>File Explorer</NavText>
          </NavLink>

          <NavLink
            to="/share"
            $active={location.pathname === '/share' ? "true" : undefined}
            onClick={() => handleNavigation('/share', 1)}
          >
            <NavIcon $collapsed={collapsed}><FaShareAlt /></NavIcon>
            <NavText $collapsed={collapsed}>File Sharing</NavText>
          </NavLink>

          <NavLink
            to="/manage-links"
            $active={location.pathname === '/manage-links' ? "true" : undefined}
            onClick={() => handleNavigation('/manage-links', 2)}
          >
            <NavIcon $collapsed={collapsed}><FaLink /></NavIcon>
            <NavText $collapsed={collapsed}>Manage Links</NavText>
          </NavLink>

          <NavLink
            to="/encrypted"
            $active={location.pathname === '/encrypted' ? "true" : undefined}
            onClick={() => handleNavigation('/encrypted', 3)}
          >
            <NavIcon $collapsed={collapsed}><FaLock /></NavIcon>
            <NavText $collapsed={collapsed}>Encrypted Files</NavText>
          </NavLink>

          <NavLink
            to="/sync"
            $active={location.pathname === '/sync' ? "true" : undefined}
            onClick={() => handleNavigation('/sync', 4)}
          >
            <NavIcon $collapsed={collapsed}><FaSync /></NavIcon>
            <NavText $collapsed={collapsed}>Zero-Knowledge Sync</NavText>
          </NavLink>

          <NavLink
            to="/secure-notes"
            $active={location.pathname === '/secure-notes' ? "true" : undefined}
            onClick={() => handleNavigation('/secure-notes', 5)}
          >
            <NavIcon $collapsed={collapsed}><FaStickyNote /></NavIcon>
            <NavText $collapsed={collapsed}>Secure Notes</NavText>
          </NavLink>

          <NavLink
            to="/analytics"
            $active={location.pathname === '/analytics' ? "true" : undefined}
            onClick={() => handleNavigation('/analytics', 6)}
          >
            <NavIcon $collapsed={collapsed}><FaChartBar /></NavIcon>
            <NavText $collapsed={collapsed}>Analytics</NavText>
          </NavLink>

          <NavLink
            to="/logs"
            $active={location.pathname === '/logs' ? "true" : undefined}
            onClick={() => handleNavigation('/logs', 7)}
          >
            <NavIcon $collapsed={collapsed}><FaListAlt /></NavIcon>
            <NavText $collapsed={collapsed}>Access Logs</NavText>
          </NavLink>

          <NavLink
            to="/settings"
            $active={location.pathname === '/settings' ? "true" : undefined}
            onClick={() => handleNavigation('/settings', 8)}
          >
            <NavIcon $collapsed={collapsed}><FaCog /></NavIcon>
            <NavText $collapsed={collapsed}>Settings</NavText>
          </NavLink>
        </Navigation>

        <LockButton onClick={onLock}>
          <NavIcon $collapsed={collapsed}><FaSignOutAlt /></NavIcon>
          <NavText $collapsed={collapsed}>Lock App</NavText>
        </LockButton>

        <AppInfo $collapsed={collapsed}>
          v1.0.0 | Secure File Manager
        </AppInfo>
      </SidebarContainer>
    </>
  );
}

export default Sidebar;