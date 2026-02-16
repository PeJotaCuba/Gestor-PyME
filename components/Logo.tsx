
import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  onlyIcon?: boolean; // If true, shows G and P combined as an icon
}

export const Logo: React.FC<LogoProps> = ({ className = "h-10", showText = true, onlyIcon = false }) => {
  return (
    <svg 
      viewBox={onlyIcon ? "0 0 50 50" : "0 0 260 50"} 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* --- G with Arrow --- */}
      <g transform={onlyIcon ? "translate(0, 5) scale(0.8)" : "translate(0, 5)"}>
        {/* G Body */}
        <path 
            d="M 30 35 C 15 35, 5 25, 5 15 C 5 5, 15 -5, 30 -5" 
            stroke="currentColor" 
            strokeWidth="7" 
            strokeLinecap="round" 
            className="text-slate-900 dark:text-white" 
            fill="none"
        />
        <path 
            d="M 5 15 L 12 15" 
            stroke="currentColor" 
            strokeWidth="7" 
            strokeLinecap="round" 
            className="text-slate-900 dark:text-white hidden" 
        />
        
        {/* Arrow (Orange) */}
        <path 
            d="M 30 15 L 45 -5 M 45 -5 L 32 -5 M 45 -5 L 45 8" 
            stroke="#f97316" 
            strokeWidth="5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
        />
      </g>

      {/* --- Text "estor" --- */}
      {showText && !onlyIcon && (
        <text x="55" y="35" fontSize="32" fontWeight="800" fontFamily="Manrope, sans-serif" className="fill-slate-900 dark:fill-white">estor</text>
      )}

      {/* --- P with Coins (Orange) --- */}
      <g transform={onlyIcon ? "translate(30, 8) scale(0.8)" : "translate(145, 8)"}>
         {/* P Stem */}
         <rect x="0" y="2" width="7" height="28" rx="2" fill="#f97316" />
         
         {/* Coins Stack (The Bowl) */}
         <g>
            <ellipse cx="14" cy="6" rx="11" ry="4" fill="#f97316" />
            <ellipse cx="14" cy="13" rx="11" ry="4" fill="#f97316" />
            <ellipse cx="14" cy="20" rx="11" ry="4" fill="#f97316" />
            
            {/* Coin Detail Lines (White/Dark separators) */}
            <path d="M5 13 Q 14 17 23 13" stroke="white" strokeWidth="1" fill="none" opacity="0.4" className="dark:stroke-slate-900"/>
            <path d="M5 20 Q 14 24 23 20" stroke="white" strokeWidth="1" fill="none" opacity="0.4" className="dark:stroke-slate-900"/>
         </g>
      </g>

      {/* --- Text "yme" --- */}
      {showText && !onlyIcon && (
        <text x="180" y="35" fontSize="32" fontWeight="800" fontFamily="Manrope, sans-serif" fill="#f97316">yme</text>
      )}
    </svg>
  );
};
