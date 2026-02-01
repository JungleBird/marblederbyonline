import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import MarbleIcon from "../../styles/MarbleIcon";
import {
  Sidebar,
  Brand,
  Logo,
  BrandTitle,
  Menu,
  MenuItem,
  SidebarHeader,
  SidebarFooter,
} from "../../styles/LandingPage.styles";


import marble_logo from "../../assets/marble_logo_cropped.png";

export default function SidebarMenu() {
  const [activeItem, setActiveItem] = useState(null);

  const menuItems = [
    { path: "/leaderboards", label: "Leaderboards" },
    { path: "/characters", label: "Characters" },
    { path: "/achievements", label: "Achievements" },
    { path: "/analytics", label: "Analytics" },
    { path: "/settings", label: "Settings" },
  ];

  const handleMenuClick = (path) => {
    setActiveItem(path);
  };

  return (
    <Sidebar>
      <SidebarHeader>Game Modes</SidebarHeader>
      <NavLink
        to="/"
        style={{ textDecoration: "none", color: "inherit" }}
        onClick={() => handleMenuClick("/")}
      >
        <Brand className={activeItem === "/" ? "active" : ""}>
          <Logo>
            <img src={marble_logo} alt="Marble Logo" style={{ width: 48, height: 48 }} />
          </Logo>
          <BrandTitle>Marble World</BrandTitle>
        </Brand>
      </NavLink>

      <SidebarHeader>Collections</SidebarHeader>

      <Menu>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={{ textDecoration: "none", color: "inherit" }}
            onClick={() => handleMenuClick(item.path)}
          >
            <MenuItem className={activeItem === item.path ? "active" : ""}>
              {item.label}
            </MenuItem>
          </NavLink>
        ))}
      </Menu>

      <SidebarFooter>footer text</SidebarFooter>
    </Sidebar>
  );
}
