import styled from "styled-components";

export const Dashboard = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
  color: #f0e6ff;
  background: linear-gradient(180deg, #0a0a0a 0%, #000000 100%);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial;
  overflow: hidden;
`;

export const Sidebar = styled.aside`
  width: 260px;
  background: linear-gradient(180deg, #1a0a2e, #0d0515);
  padding: 28px 18px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  box-shadow: 6px 0 18px rgba(138, 77, 255, 0.3);

  @media (max-width: 980px) {
    width: 220px;
  }

  @media (max-width: 640px) {
    width: 100%;
    flex-direction: row;
    align-items: center;
    padding: 14px;
    gap: 10px;
  }
`;

export const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: all 160ms ease-in-out;

  background: rgba(138, 77, 255, 0.15);
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 160ms ease-in-out;
  border: 1px solid rgba(138, 77, 255, 0.3);

  &:hover {
    transform: scale(1.05);
    opacity: 0.8;
  }

  &.active {
    background: linear-gradient(
      90deg,
      rgba(138, 77, 255, 0.3),
      rgba(255, 167, 38, 0.2)
    );
    border-color: rgba(255, 167, 38, 0.4);
    box-shadow: 0 0 10px rgba(255, 167, 38, 0.2);
  }
`;

export const Logo = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: white;
  background: transparent;
  box-shadow: none;
`;

export const BrandTitle = styled.h1`
  font-size: 18px;
  margin: 0;
  color: #f7f7f7ff;
`;

export const Menu = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 8px;

  @media (max-width: 640px) {
    flex-direction: row;
    gap: 6px;
    overflow: auto;
  }
`;

export const MenuItem = styled.button`
  background: transparent;
  color: #c4b5fd;
  border: none;
  outline: none;
  text-align: left;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 160ms ease-in-out;

  &:hover {
    background: rgba(138, 77, 255, 0.15);
    color: #ffa726;
    transform: translateX(4px);
  }

  &.active {
    background: linear-gradient(
      90deg,
      rgba(138, 77, 255, 0.3),
      rgba(255, 167, 38, 0.2)
    );
    color: #ffa726;
    box-shadow: inset 0 0 0 1px rgba(255, 167, 38, 0.4);
  }

  &:focus {
    outline: none;
  }

  @media (max-width: 640px) {
    padding: 8px 10px;
    white-space: nowrap;

    &:hover {
      transform: translateX(0);
    }
  }
`;

export const SidebarHeader = styled.div`
  font-size: 14px;
  color: #ffa726;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 8px 12px;
  border-bottom: 2px solid rgba(138, 77, 255, 0.3);
  margin-bottom: 12px;
`;

export const SidebarFooter = styled.div`
  margin-top: auto;
  font-size: 13px;
  color: #c4b5fd;
`;

export const Content = styled.main`
  flex: 1;
  padding: 32px 36px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  overflow: auto;

  @media (max-width: 640px) {
    padding: 16px;
  }
`;

export const ContentHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 10%;
`;

export const PageTitle = styled.h2`
  margin: 0;
  font-size: 22px;
  color: #ffa726;
`;

export const ContentBody = styled.section`
  display: flex;
  flex-direction: column;
  gap: 18px;
  flex: 1;
  height: 100%;
`;

export const Cards = styled.div`
  display: flex;
  flex-direction: row;
  gap: 18px;
`;

export const Card = styled.div`
  display: flex;
  flex-direction: column;
  background: linear-gradient(
    180deg,
    rgba(138, 77, 255, 0.08),
    rgba(26, 10, 46, 0.4)
  );
  border-radius: 12px;
  padding: 18px;
  min-height: 110px;
  width: 32%;
  box-shadow: 0 6px 18px rgba(138, 77, 255, 0.2);
  border: 1px solid rgba(138, 77, 255, 0.3);

  h3 {
    margin: 0 0 8px 0;
    color: #830088ff;
  }

  p {
    margin: 0;
    color: #28d694ff;
  }

  &.large {
    @media (max-width: 640px) {
      grid-column: auto;
    }
  }
`;

export const TokenShopButton = styled.button`
  padding: 14px 32px;
  background-color: #ffa726;
  color: #000000;
  border: 2px solid #ffd700;
  border-radius: 12px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.5px;
  transition: all 200ms ease-in-out;
  box-shadow: 0 0 20px rgba(255, 167, 38, 0.6),
    inset 0 0 20px rgba(255, 215, 0, 0.1);
  text-transform: uppercase;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

  &:hover {
    background-color: #ffb84d;
    transform: scale(1.08);
    box-shadow: 0 0 30px rgba(255, 167, 38, 0.9),
      inset 0 0 20px rgba(255, 215, 0, 0.2);
  }
`;
