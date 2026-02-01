import React from 'react'
import { StyledMarble } from './MarbleIcon.styles'

export default function MarbleIcon({ size = 48 }) {
  return (
    <StyledMarble 
      width={size} 
      height={size} 
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Main marble gradient */}
        <radialGradient id="marbleGradient" cx="35%" cy="35%">
          <stop offset="0%" stopColor="#b8f3ff" />
          <stop offset="40%" stopColor="#6e9fff" />
          <stop offset="70%" stopColor="#4a5bff" />
          <stop offset="100%" stopColor="#1a237e" />
        </radialGradient>

        {/* Glossy highlight */}
        <radialGradient id="glossHighlight" cx="30%" cy="30%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>

        {/* Swirl pattern */}
        <radialGradient id="swirlPattern" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#ff6ec7" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#7c5cff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#4bd4ff" stopOpacity="0.3" />
        </radialGradient>

        {/* Shadow */}
        <radialGradient id="shadowGradient" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* Filter for depth */}
        <filter id="marbleGlow">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Shadow underneath */}
      <ellipse 
        cx="50" 
        cy="92" 
        rx="28" 
        ry="6" 
        fill="url(#shadowGradient)" 
        opacity="0.4"
      />

      {/* Main marble sphere */}
      <circle 
        cx="50" 
        cy="50" 
        r="38" 
        fill="url(#marbleGradient)" 
        filter="url(#marbleGlow)"
      />

      {/* Swirl pattern overlay */}
      <path
        d="M 30 30 Q 50 20, 70 30 Q 75 50, 70 70 Q 50 75, 30 70 Q 25 50, 30 30"
        fill="url(#swirlPattern)"
        opacity="0.6"
      />
      
      {/* Secondary swirl */}
      <path
        d="M 40 45 Q 50 40, 60 45 Q 62 50, 60 55 Q 50 58, 40 55 Q 38 50, 40 45"
        fill="url(#swirlPattern)"
        opacity="0.5"
        transform="rotate(45 50 50)"
      />

      {/* Glossy highlight on top */}
      <ellipse 
        cx="38" 
        cy="35" 
        rx="18" 
        ry="14" 
        fill="url(#glossHighlight)" 
        opacity="0.7"
      />

      {/* Small specular highlight */}
      <circle 
        cx="35" 
        cy="32" 
        r="6" 
        fill="#ffffff" 
        opacity="0.8"
      />
    </StyledMarble>
  )
}
