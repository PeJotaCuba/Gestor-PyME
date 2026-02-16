
import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  onlyIcon?: boolean; // If true, shows only the icon
}

export const Logo: React.FC<LogoProps> = ({ className = "h-10", showText = true, onlyIcon = false }) => {
  return (
    <svg 
      viewBox={onlyIcon ? "0 0 50 50" : "0 0 220 50"} 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* --- ICON GROUP (40x40 coordinate space centered in 50x50) --- */}
      <g transform="translate(5, 5)">
        
        {/* Coins Stack (Orange) - Centered at 20,20 */}
        <g>
            {/* Bottom Coin */}
            <path 
                d="M 20 32 C 26 32 30 30 30 28 V 25 C 30 27 26 29 20 29 C 14 29 10 27 10 25 V 28 C 10 30 14 32 20 32 Z" 
                fill="#ea580c" // Darker shade for depth
            />
            <path 
                d="M 20 29 C 26 29 30 27 30 25 C 30 23 26 21 20 21 C 14 21 10 23 10 25 C 10 27 14 29 20 29 Z" 
                fill="#f97316" // Main Orange
            />
            
            {/* Middle Coin */}
            <path 
                d="M 20 26 C 26 26 30 24 30 22 V 19 C 30 21 26 23 20 23 C 14 23 10 21 10 19 V 22 C 10 24 14 26 20 26 Z" 
                fill="#ea580c" 
            />
            <path 
                d="M 20 23 C 26 23 30 21 30 19 C 30 17 26 15 20 15 C 14 15 10 17 10 19 C 10 21 14 23 20 23 Z" 
                fill="#f97316" 
            />

            {/* Top Coin */}
            <path 
                d="M 20 20 C 26 20 30 18 30 16 V 13 C 30 15 26 17 20 17 C 14 17 10 15 10 13 V 16 C 10 18 14 20 20 20 Z" 
                fill="#ea580c" 
            />
            <ellipse cx="20" cy="13" rx="10" ry="4" fill="#fb923c" /> {/* Lightest Orange Top */}
        </g>

        {/* --- Cycling Arrows (Black/White) --- */}
        
        {/* Left Arrow (Upwards) */}
        {/* Curve */}
        <path 
            d="M 12 36 Q -2 20 12 4" 
            stroke="currentColor" 
            strokeWidth="3.5" 
            strokeLinecap="round"
            fill="none"
            className="text-slate-900 dark:text-white"
        />
        {/* Defined Head (Triangle) */}
        <path 
            d="M 12 0 L 5 9 L 19 9 Z" 
            fill="currentColor" 
            className="text-slate-900 dark:text-white" 
        />

        {/* Right Arrow (Downwards) */}
        {/* Curve */}
        <path 
            d="M 28 4 Q 42 20 28 36" 
            stroke="currentColor" 
            strokeWidth="3.5" 
            strokeLinecap="round"
            fill="none"
            className="text-slate-900 dark:text-white"
        />
        {/* Defined Head (Triangle) */}
        <path 
            d="M 28 40 L 21 31 L 35 31 Z" 
            fill="currentColor" 
            className="text-slate-900 dark:text-white" 
        />

      </g>

      {/* --- TEXT GROUP --- */}
      {showText && !onlyIcon && (
        <>
            <text x="50" y="33" fontSize="26" fontWeight="800" fontFamily="Manrope, sans-serif" className="fill-slate-900 dark:fill-white">Gestor</text>
            <text x="138" y="33" fontSize="26" fontWeight="800" fontFamily="Manrope, sans-serif" fill="#f97316">PyME</text>
        </>
      )}
    </svg>
  );
};
