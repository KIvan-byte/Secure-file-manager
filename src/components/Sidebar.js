import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { styled } from 'styled-components';
import { FaFolder, FaShareAlt, FaListAlt, FaBars, FaTimes } from 'react-icons/fa';

const SidebarContainer = styled.div`
  background-color: #2c3e50;
  color: white;
  width: ${props => props.$isOpen ? '240px' : '70px'};
  transition: width 0.3s ease;
  position: relative;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
  height: 100%;
  display: flex;
  flex-direction: column;
  
  @media (max-width: 768px) {
    position: fixed;
    width: ${props => props.$isOpen ? '240px' : '0'};
    height: 100vh;
    top: 0;
    left: 0;
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
`;

const AppTitleText = styled.span`
  display: ${props => props.$collapsed ? 'none' : 'inline'};
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
`;

const NavIcon = styled.span`
  margin-right: ${props => props.$collapsed ? '0' : '12px'};
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${props => props.$collapsed ? '100%' : 'auto'};
  font-size: 18px;
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
  position: absolute;
  top: 10px;
  right: ${props => props.$isOpen ? '10px' : '-40px'};
  background-color: #34495e;
  color: white;
  border: none;
  border-radius: ${props => props.$isOpen ? '4px' : '0 4px 4px 0'};
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 100;
  
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
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 90;
  display: ${props => props.$isOpen ? 'block' : 'none'};
  
  @media (min-width: 769px) {
    display: none;
  }
`;

function Sidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);
  
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };
  
  const closeSidebar = () => {
    if (window.innerWidth <= 768) {
      setIsOpen(false);
    }
  };
  
  const collapsed = !isOpen;

  return (
    <>
      <SidebarContainer $isOpen={isOpen}>
        <AppTitle $collapsed={collapsed}>
          <AppTitleText $collapsed={collapsed}>Secure File Manager</AppTitleText>
          {collapsed ? <FaFolder /> : null}
        </AppTitle>
        
        <Navigation>
          <NavLink 
            to="/" 
            $active={location.pathname === '/' ? "true" : undefined}
            onClick={closeSidebar}
          >
            <NavIcon $collapsed={collapsed}><FaFolder /></NavIcon>
            <NavText $collapsed={collapsed}>File Explorer</NavText>
          </NavLink>
          
          <NavLink 
            to="/share" 
            $active={location.pathname === '/share' ? "true" : undefined}
            onClick={closeSidebar}
          >
            <NavIcon $collapsed={collapsed}><FaShareAlt /></NavIcon>
            <NavText $collapsed={collapsed}>File Sharing</NavText>
          </NavLink>
          
          <NavLink 
            to="/logs" 
            $active={location.pathname === '/logs' ? "true" : undefined}
            onClick={closeSidebar}
          >
            <NavIcon $collapsed={collapsed}><FaListAlt /></NavIcon>
            <NavText $collapsed={collapsed}>Access Logs</NavText>
          </NavLink>
        </Navigation>
        
        <AppInfo $collapsed={collapsed}>
          v1.0.0 | Secure File Manager
        </AppInfo>
        
        <ToggleButton onClick={toggleSidebar} $isOpen={isOpen}>
          {isOpen ? <FaTimes /> : <FaBars />}
        </ToggleButton>
      </SidebarContainer>
      
      <Overlay $isOpen={isOpen} onClick={() => setIsOpen(false)} />
    </>
  );
}

export default Sidebar;