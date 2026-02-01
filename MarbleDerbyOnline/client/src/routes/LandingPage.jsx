import React from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import {
  Dashboard,
  Content,
  ContentHeader,
  PageTitle,
  ContentBody,
  TokenShopButton,
} from "../styles/LandingPage.styles";

import SidebarMenu from "../components/navigation/SidebarMenu";
import CharacterPage from "./Characters";
import Leaderboards from "./Leaderboards";
import AchievementsPage from "./Achievements";
import AnalyticsPage from "./Analytics";
import SettingsPage from "./Settings";
import GameModesPage from "./GameModes";
import TokenShopPage from "./TokenShop";

export default function LandingPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const pageTitles = {
    "/": "Game Modes",
    "/characters": "Character Collection",
    "/leaderboards": "Top Players",
    "/achievements": "Achievements",
    "/analytics": "Game Analytics",
    "/settings": "Settings",
    "/token-shop": "Token Shop",
  };

  const currentTitle = pageTitles[location.pathname] || "Game Modes";
  const isCharactersPage = location.pathname === "/characters";

  return (
    <Dashboard>
      <SidebarMenu />

      <Content>
        <ContentHeader>
          <PageTitle>{currentTitle}</PageTitle>
          {isCharactersPage && (
            <TokenShopButton onClick={() => navigate("/token-shop")}>
              Use Tokens
            </TokenShopButton>
          )}
        </ContentHeader>

        <ContentBody>
          <Routes>
            <Route index element={<GameModesPage />} />
            <Route path="characters" element={<CharacterPage />} />
            <Route path="leaderboards" element={<Leaderboards />} />
            <Route path="achievements" element={<AchievementsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="token-shop" element={<TokenShopPage />} />
          </Routes>
        </ContentBody>
      </Content>
    </Dashboard>
  );
}
