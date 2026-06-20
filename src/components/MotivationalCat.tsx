'use client'

import { useEffect, useState } from 'react'

interface Props {
  celebrating?: boolean
  size?: number
}

export default function MotivationalCat({ celebrating = false, size = 100 }: Props) {
  const [blink, setBlink] = useState(false)
  const [happy, setHappy] = useState(celebrating)

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true)
      setTimeout(() => setBlink(false), 120)
    }, 3500)
    return () => clearInterval(blinkInterval)
  }, [])

  useEffect(() => {
    if (celebrating) {
      setHappy(true)
    }
  }, [celebrating])

  const scale = size / 100

  return (
    <>
      <style>{`
        @keyframes tailWag {
          0%   { transform: rotate(-20deg); }
          100% { transform: rotate(20deg); }
        }
        @keyframes catBounce {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
        @keyframes catBreath {
          0%, 100% { transform: scaleY(1); }
          50%       { transform: scaleY(1.04); }
        }
        @keyframes sparkle {
          0%   { opacity: 0; transform: scale(0) rotate(0deg); }
          50%  { opacity: 1; transform: scale(1.2) rotate(180deg); }
          100% { opacity: 0; transform: scale(0) rotate(360deg); }
        }
        .cat-container {
          animation: ${celebrating ? 'catBounce 0.6s ease-in-out infinite' : 'catBreath 3s ease-in-out infinite'};
          display: inline-block;
        }
        .cat-tail {
          transform-origin: 75px 85px;
          animation: tailWag 0.8s ease-in-out infinite alternate;
        }
        .cat-sparkle {
          animation: sparkle 1s ease-in-out infinite;
        }
        .cat-sparkle-2 {
          animation: sparkle 1s ease-in-out 0.3s infinite;
        }
        .cat-sparkle-3 {
          animation: sparkle 1s ease-in-out 0.6s infinite;
        }
      `}</style>

      <div className="cat-container" style={{ transform: `scale(${scale})`, transformOrigin: 'center bottom' }}>
        <svg width="100" height="110" viewBox="0 0 100 110" fill="none">
          {/* Sparkles when celebrating */}
          {celebrating && (
            <>
              <text x="5" y="20" fontSize="14" className="cat-sparkle">✨</text>
              <text x="75" y="15" fontSize="12" className="cat-sparkle-2">⭐</text>
              <text x="82" y="50" fontSize="10" className="cat-sparkle-3">✨</text>
            </>
          )}

          {/* Tail */}
          <path
            className="cat-tail"
            d="M 75 82 Q 98 65 92 42"
            stroke="#EA580C"
            strokeWidth="7"
            fill="none"
            strokeLinecap="round"
          />

          {/* Body */}
          <ellipse
            cx="50" cy="78" rx="28" ry="22"
            fill="#FB923C"
          />

          {/* Head */}
          <circle cx="50" cy="40" r="23" fill="#FB923C" />

          {/* Inner ear left */}
          <polygon points="28,23 34,6 43,23" fill="#FB923C" />
          <polygon points="30,21 34,10 41,21" fill="#FBCFE8" />

          {/* Inner ear right */}
          <polygon points="57,23 66,6 72,23" fill="#FB923C" />
          <polygon points="59,21 66,10 70,21" fill="#FBCFE8" />

          {/* Eyes */}
          {blink ? (
            <>
              <path d="M 38 37 Q 43 41 48 37" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M 52 37 Q 57 41 62 37" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </>
          ) : happy ? (
            <>
              {/* Happy crescent eyes */}
              <path d="M 38 38 Q 43 33 48 38" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M 52 38 Q 57 33 62 38" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              {/* Normal round eyes */}
              <ellipse cx="43" cy="37" rx="5.5" ry="5.5" fill="#1F2937" />
              <ellipse cx="57" cy="37" rx="5.5" ry="5.5" fill="#1F2937" />
              {/* Shine */}
              <ellipse cx="45" cy="35" rx="2" ry="2" fill="white" />
              <ellipse cx="59" cy="35" rx="2" ry="2" fill="white" />
            </>
          )}

          {/* Nose */}
          <polygon points="50,45 47,48 53,48" fill="#F43F5E" />

          {/* Mouth */}
          {happy ? (
            <path d="M 45 49 Q 50 54 55 49" stroke="#1F2937" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          ) : (
            <path d="M 46 49 Q 50 52 54 49" stroke="#1F2937" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          )}

          {/* Whiskers left */}
          <line x1="12" y1="43" x2="42" y2="46" stroke="#92400E" strokeWidth="1" opacity="0.5" />
          <line x1="12" y1="49" x2="42" y2="48" stroke="#92400E" strokeWidth="1" opacity="0.5" />
          <line x1="14" y1="55" x2="43" y2="51" stroke="#92400E" strokeWidth="1" opacity="0.5" />

          {/* Whiskers right */}
          <line x1="58" y1="46" x2="88" y2="43" stroke="#92400E" strokeWidth="1" opacity="0.5" />
          <line x1="58" y1="48" x2="88" y2="49" stroke="#92400E" strokeWidth="1" opacity="0.5" />
          <line x1="57" y1="51" x2="86" y2="55" stroke="#92400E" strokeWidth="1" opacity="0.5" />

          {/* Paws */}
          <ellipse cx="35" cy="96" rx="10" ry="7" fill="#FB923C" />
          <ellipse cx="65" cy="96" rx="10" ry="7" fill="#FB923C" />

          {/* Toe details */}
          <path d="M 29 96 Q 30 100 32 96" stroke="#EA580C" strokeWidth="1" fill="none" />
          <path d="M 34 97 Q 35 101 37 97" stroke="#EA580C" strokeWidth="1" fill="none" />
          <path d="M 39 96 Q 40 100 42 96" stroke="#EA580C" strokeWidth="1" fill="none" />

          <path d="M 59 96 Q 60 100 62 96" stroke="#EA580C" strokeWidth="1" fill="none" />
          <path d="M 64 97 Q 65 101 67 97" stroke="#EA580C" strokeWidth="1" fill="none" />
          <path d="M 69 96 Q 70 100 72 96" stroke="#EA580C" strokeWidth="1" fill="none" />

          {/* Stripes on forehead */}
          <path d="M 44 22 Q 50 19 56 22" stroke="#EA580C" strokeWidth="1.5" fill="none" opacity="0.4" />
          <path d="M 42 27 Q 50 24 58 27" stroke="#EA580C" strokeWidth="1.5" fill="none" opacity="0.3" />
        </svg>
      </div>
    </>
  )
}
