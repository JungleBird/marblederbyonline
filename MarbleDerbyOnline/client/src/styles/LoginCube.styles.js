// Face content styling (was faceStyle)
export const FaceContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  min-width: 320px;
  background: rgba(30, 41, 59, 0.95);
  border-radius: 18px;
  box-shadow: 0 6px 32px 0 rgba(0, 0, 0, 0.18);
  padding: 32px;
  gap: 18px;
  position: relative;
`;

// Error box styling (was errorBoxStyle)
export const ErrorBox = styled.div`
  min-height: 24px;
  margin-bottom: 4px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: min-height 0.2s;
`;

// Shake animation for error
export const shake = keyframes`
  0% { transform: translateX(0); }
  10% { transform: translateX(-6px); }
  20% { transform: translateX(6px); }
  30% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  50% { transform: translateX(-2px); }
  60% { transform: translateX(2px); }
  70% { transform: translateX(-1px); }
  80% { transform: translateX(1px); }
  90% { transform: translateX(0); }
  100% { transform: translateX(0); }
`;

export const ShakeWrapper = styled.div`
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  ${(props) =>
    props.$shouldShake &&
    css`
      animation: ${shake} 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    `}
`;
import styled, { keyframes, css } from "styled-components";

// Centering wrapper
export const PageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background: radial-gradient(circle at center, #1a1a2e 0%, #000000 100%);
  overflow: hidden;
`;

export const Scene = styled.div`
  width: 400px;
  height: 400px;
  perspective: 1000px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const Cube = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transform: translateZ(-200px) rotateY(${(props) => props.$rotation}deg);
  transition: transform 1.5s cubic-bezier(0.25, 0.8, 0.25, 1);
`;

// Shared Face Face Styling
export const Face = styled.div`
  position: absolute;
  transform-style: preserve-3d;
  width: 400px;
  height: 400px;
  padding: 20px;
  box-sizing: border-box;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 24px;

  /* Text Styles */
  color: #fff;
  text-align: center;

  backface-visibility: hidden;

  /* Move visual styles to pseudo-element to avoid flattening 3D context */
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(20, 20, 25, 0.95);
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.5),
      inset 0 0 20px rgba(138, 77, 255, 0.1);
    backdrop-filter: blur(10px);
    transform: translateZ(-5px);
  }
`;

// Specific Orientations
// Note: We used 320px width, so translateZ is half of that (160px)
export const FaceFront = styled(Face)`
  transform: rotateY(0deg) translateZ(200px);
  /* raised circle centered on the front face (extruded) */
`;

export const FaceRight = styled(Face)`
  transform: rotateY(90deg) translateZ(200px);
`;

export const FaceBack = styled(Face)`
  transform: rotateY(180deg) translateZ(200px);
`;

export const FaceLeft = styled(Face)`
  transform: rotateY(-90deg) translateZ(200px);
`;

export const Title = styled.h2`
  margin: 0;
  font-size: 28px;
  background: linear-gradient(135deg, #fff 0%, #a5b4fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-transform: uppercase;
  letter-spacing: 2px;

`;

export const Input = styled.input`
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
  font-size: 16px;
  outline: none;
  transition: all 0.3s ease;

  &:focus {
    border-color: #8a4dff;
    box-shadow: 0 0 15px rgba(138, 77, 255, 0.3);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`;

export const Button = styled.button`
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  text-transform: uppercase;
  letter-spacing: 1px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(118, 75, 162, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  /* Outline variant for 'Back' button */
  ${(props) =>
    props.$variant === "outline" &&
    css`
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
      margin-top: 0;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.4);
        box-shadow: none;
      }
    `}
`;

export const ErrorText = styled.div`
  color: #ff6b6b;
  font-size: 14px;
  font-weight: 500;
  background: rgba(255, 107, 107, 0.1);
  padding: 8px 12px;
  border-radius: 8px;
  width: 100%;
`;
