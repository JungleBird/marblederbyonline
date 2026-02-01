import styled from 'styled-components';

export const AchievementsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  padding: 20px;
  width: 100%;
`;

export const AchievementCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border: 1px solid rgba(138, 77, 255, 0.1);
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(138, 77, 255, 0.3);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }

  &.locked {
    opacity: 0.6;
    filter: grayscale(0.8);
    
    &:hover {
      transform: none;
      opacity: 0.7;
    }
  }
`;

export const AchievementIcon = styled.div`
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #8a4dff 0%, #4d88ff 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 8px;
  box-shadow: 0 4px 12px rgba(138, 77, 255, 0.3);

  &.locked {
    background: #2a2a2a;
    box-shadow: none;
    color: #555;
  }
`;

export const AchievementTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  color: #fff;
  font-weight: 600;
`;

export const AchievementDescription = styled.p`
  margin: 0;
  font-size: 14px;
  color: #a0a0a0;
  line-height: 1.5;
`;

export const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  margin-top: auto;
  overflow: hidden;
`;

export const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #8a4dff, #4d88ff);
  width: ${props => props.progress}%;
  border-radius: 3px;
`;

export const StatusBadge = styled.span`
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  background: ${props => props.unlocked ? 'rgba(40, 214, 148, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.unlocked ? '#28d694' : '#888'};
  font-weight: 600;
`;
