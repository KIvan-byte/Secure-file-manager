import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { styled } from 'styled-components';
import { FaFolder, FaShareAlt, FaListAlt } from 'react-icons/fa';

const SidebarContainer = styled.div`
  width: 240px;
  background-color: #2c3e50;
  color: white;
  padding: 20px 0;
`;

const AppTitle = styled.h1`
  font-size: 20px;
  margin: 0 0 30px 0;
  padding: 0 20px 20px 20px;
  border-bottom: 1px solid #34495e;
  text-align: center;
`;

const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: ${props => props.active ? 'white' : '#bdc3c7'};
  text-decoration: none;
  background-color: ${props => props.active ? '#34495e' : 'transparent'};
  
  &:hover {
    background-color: #34495e;
    color: white;
  }
`;

const NavIcon = styled.span`
  margin-right: 10px;
`;

function Sidebar() {
  const location = useLocation();
  
  return (
    <SidebarContainer>
      <AppTitle>Secure File Manager</AppTitle>
      
      <nav>
        <NavLink to="/" active={location.pathname === '/' ? "true" : undefined}>
          <NavIcon><FaFolder /></NavIcon>
          File Explorer
        </NavLink>
        
        <NavLink to="/share" active={location.pathname === '/share' ? "true" : undefined}>
          <NavIcon><FaShareAlt /></NavIcon>
          File Sharing
        </NavLink>
        
        <NavLink to="/logs" active={location.pathname === '/logs' ? "true" : undefined}>
          <NavIcon><FaListAlt /></NavIcon>
          Access Logs
        </NavLink>
      </nav>
    </SidebarContainer>
  );
}

export default Sidebar;