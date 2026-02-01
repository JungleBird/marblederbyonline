import styled, { keyframes } from 'styled-components';

const marbleFloat = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-4px);
  }
`;

const marbleBounce = keyframes`
  0% {
    transform: translateY(0);
  }
  15% {
    transform: translateY(-10px);
  }
  30% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-6px);
  }
  50% {
    transform: translateY(0);
  }
  58% {
    transform: translateY(-3px);
  }
  65% {
    transform: translateY(0);
  }
  71% {
    transform: translateY(-1.5px);
  }
  77% {
    transform: translateY(0);
  }
  83% {
    transform: translateY(-0.5px);
  }
  89% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(0);
  }
`;

export const StyledMarble = styled.svg`
  display: block;
  filter: drop-shadow(0 4px 12px rgba(124, 92, 255, 0.3));
  animation: ${marbleFloat} 3s ease-in-out infinite;

  &:hover {
    animation: ${marbleBounce} 1s cubic-bezier(0.36, 0, 0.66, -0.56);
  }
`;
