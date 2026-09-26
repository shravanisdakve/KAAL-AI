import React, { useState } from 'react';
import { Sparkles, Maximize2, X, Info } from 'lucide-react';
import { SituationVisual as SituationVisualType } from '../types/guidance.ts';

interface SituationalVisualProps {
  visual?: SituationVisualType | null;
  category?: string;
  question?: string;
}

export const SituationalVisual: React.FC<SituationalVisualProps> = ({
  visual,
  category = 'General Reflection',
  question = 'Reflection',
}) => {
  if (!visual) {
    return null;
  }

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPromptTooltip, setShowPromptTooltip] = useState(false);

  // Fallback defaults if visual is not provided
  const palette = visual?.palette || {
    skyTop: '#1e293b',
    skyBottom: '#fed7aa',
    mountainFar: '#334155',
    mountainNear: '#1e293b',
    ground: '#0f172a',
    accentGlow: 'rgba(251, 191, 36, 0.4)',
    sunGlow: '#fbbf24',
    waterReflection: undefined,
  };

  const elements = visual?.elements || {
    sunPosition: 'rising',
    hasSunRays: true,
    hasMountains: true,
    hasWater: false,
    hasPath: true,
    hasMist: true,
    hasStars: false,
    hasLanterns: false,
    hasLotus: false,
    hasStones: false,
  };

  const mood = visual?.mood || 'Contemplative Stillness';
  const title = visual?.title || 'Situational Reflection Scene';
  const prompt =
    visual?.prompt ||
    'A tranquil morning landscape with gentle sunlight breaking through misty mountain peaks, peaceful stillness, meditative contemplation.';
  const altText = visual?.altText || 'Serene landscape reflecting your current situation.';

  const uniqueId = visual?.id || `vis-${category.replace(/\s+/g, '-').toLowerCase()}`;

  // Render SVG landscape
  const renderSvgContent = (isExpanded: boolean = false) => (
    <svg
      viewBox="0 0 600 400"
      className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={altText}
    >
      <defs>
        {/* Sky Gradient */}
        <linearGradient id={`skyGrad-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={palette.skyTop} />
          <stop offset="65%" stopColor={palette.skyBottom} />
          <stop offset="100%" stopColor={palette.mountainFar} />
        </linearGradient>

        {/* Sun Radial Glow */}
        <radialGradient id={`sunGlowGrad-${uniqueId}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={palette.sunGlow} stopOpacity="1" />
          <stop offset="35%" stopColor={palette.sunGlow} stopOpacity="0.7" />
          <stop offset="70%" stopColor={palette.accentGlow} />
          <stop offset="100%" stopColor={palette.accentGlow} stopOpacity="0" />
        </radialGradient>

        {/* Mist Gradient */}
        <linearGradient id={`mistGrad-${uniqueId}`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor={palette.skyBottom} stopOpacity="0.6" />
          <stop offset="100%" stopColor={palette.skyBottom} stopOpacity="0" />
        </linearGradient>

        {/* Water Reflection Gradient */}
        <linearGradient id={`waterGrad-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={palette.mountainNear} />
          <stop offset="50%" stopColor={palette.skyBottom} stopOpacity="0.4" />
          <stop offset="100%" stopColor={palette.ground} />
        </linearGradient>
      </defs>

      {/* 1. Sky Background */}
      <rect width="600" height="400" fill={`url(#skyGrad-${uniqueId})`} />

      {/* 2. Stars (if dusk or twilight) */}
      {elements.hasStars && (
        <g opacity="0.75">
          <circle cx="95" cy="50" r="1.5" fill="#ffffff" />
          <circle cx="210" cy="35" r="1.2" fill="#fef08a" />
          <circle cx="340" cy="65" r="1.5" fill="#ffffff" />
          <circle cx="480" cy="40" r="1.2" fill="#ffffff" />
          <circle cx="530" cy="75" r="1.8" fill="#fef08a" />
          <circle cx="160" cy="85" r="1.2" fill="#ffffff" />
        </g>
      )}

      {/* 3. Sun or Moon with Glow */}
      {elements.sunPosition === 'rising' && (
        <g>
          <circle cx="300" cy="230" r="160" fill={`url(#sunGlowGrad-${uniqueId})`} />
          <circle cx="300" cy="225" r="32" fill="#fffbeb" />
          {elements.hasSunRays && (
            <g opacity="0.25">
              <polygon points="300,225 150,0 210,0" fill="#fef3c7" />
              <polygon points="300,225 270,0 330,0" fill="#fef3c7" />
              <polygon points="300,225 390,0 450,0" fill="#fef3c7" />
            </g>
          )}
        </g>
      )}

      {elements.sunPosition === 'center' && (
        <g>
          <circle cx="300" cy="140" r="140" fill={`url(#sunGlowGrad-${uniqueId})`} />
          <circle cx="300" cy="140" r="28" fill="#fffbeb" />
        </g>
      )}

      {elements.sunPosition === 'left' && (
        <g>
          <circle cx="160" cy="150" r="130" fill={`url(#sunGlowGrad-${uniqueId})`} />
          <circle cx="160" cy="150" r="26" fill="#fffbeb" />
        </g>
      )}

      {elements.sunPosition === 'right' && (
        <g>
          {/* Crescent Moon */}
          <path
            d="M 450,110 A 24,24 0 0,0 435,80 A 20,20 0 1,1 450,110 Z"
            fill="#e0f2fe"
            opacity="0.9"
          />
          <circle cx="442" cy="95" r="40" fill={`url(#sunGlowGrad-${uniqueId})`} opacity="0.3" />
        </g>
      )}

      {elements.sunPosition === 'dusk' && (
        <g>
          <circle cx="300" cy="220" r="120" fill={`url(#sunGlowGrad-${uniqueId})`} />
          <circle cx="300" cy="220" r="24" fill="#fed7aa" />
          <circle cx="460" cy="90" r="2.5" fill="#fff" opacity="0.9" /> {/* Evening star */}
        </g>
      )}

      {/* 4. Distant Mountain Silhouette Layer */}
      {elements.hasMountains && (
        <path
          d="M -20,260 Q 60,180 150,210 T 320,170 T 480,210 Q 550,190 620,250 L 620,400 L -20,400 Z"
          fill={palette.mountainFar}
          opacity="0.85"
        />
      )}

      {/* 5. Atmospheric Mist Layer */}
      {elements.hasMist && (
        <rect x="0" y="190" width="600" height="90" fill={`url(#mistGrad-${uniqueId})`} />
      )}

      {/* 6. Near Mountain / Foreground Hill Ridge */}
      {elements.hasMountains && (
        <path
          d="M -10,310 Q 110,240 230,270 T 420,250 Q 520,230 610,300 L 610,400 L -10,400 Z"
          fill={palette.mountainNear}
        />
      )}

      {/* 7. Water (Lakes, Rivers, Lotus Ponds) */}
      {elements.hasWater && (
        <g>
          <rect x="0" y="270" width="600" height="130" fill={`url(#waterGrad-${uniqueId})`} />
          {/* Subtle reflective ripples */}
          <line
            x1="180"
            y1="300"
            x2="320"
            y2="300"
            stroke={palette.sunGlow}
            strokeWidth="1.5"
            opacity="0.4"
          />
          <line
            x1="240"
            y1="320"
            x2="400"
            y2="320"
            stroke={palette.sunGlow}
            strokeWidth="2"
            opacity="0.5"
          />
          <line
            x1="140"
            y1="345"
            x2="350"
            y2="345"
            stroke={palette.sunGlow}
            strokeWidth="1.5"
            opacity="0.3"
          />
          <line
            x1="280"
            y1="370"
            x2="450"
            y2="370"
            stroke={palette.sunGlow}
            strokeWidth="1.2"
            opacity="0.3"
          />
        </g>
      )}

      {/* 8. Winding Path / Stone Steps */}
      {elements.hasPath && !elements.hasWater && (
        <g>
          {/* Path perspective */}
          <path
            d="M 280,260 Q 295,290 270,320 Q 230,355 190,400 L 330,400 Q 340,360 325,320 Q 310,290 295,260 Z"
            fill={palette.ground}
            opacity="0.9"
          />
          {/* Golden sunbeam highlight down the trail */}
          <path
            d="M 285,260 Q 300,290 280,320 Q 255,355 240,400 L 270,400 Q 285,360 295,320 Q 305,290 292,260 Z"
            fill={palette.sunGlow}
            opacity="0.25"
          />
        </g>
      )}

      {/* 9. Zen Balanced Stones */}
      {elements.hasStones && (
        <g transform="translate(300, 310)">
          <ellipse cx="0" cy="22" rx="36" ry="10" fill={palette.ground} />
          <ellipse cx="0" cy="10" rx="28" ry="8" fill={palette.mountainNear} />
          <ellipse cx="0" cy="0" rx="20" ry="6" fill={palette.mountainFar} />
          <ellipse cx="0" cy="-8" rx="12" ry="5" fill="#cbd5e1" opacity="0.9" />
          {/* Water reflection of cairn */}
          <ellipse cx="0" cy="38" rx="32" ry="6" fill={palette.sunGlow} opacity="0.2" />
        </g>
      )}

      {/* 10. Warm Paper Lanterns on Bridge */}
      {elements.hasLanterns && (
        <g>
          {/* Wooden Railing */}
          <line x1="120" y1="340" x2="480" y2="340" stroke="#262626" strokeWidth="4" />
          <line x1="200" y1="340" x2="200" y2="400" stroke="#262626" strokeWidth="4" />
          <line x1="400" y1="340" x2="400" y2="400" stroke="#262626" strokeWidth="4" />
          {/* Left Lantern */}
          <circle cx="200" cy="320" r="30" fill={`url(#sunGlowGrad-${uniqueId})`} opacity="0.7" />
          <rect x="190" y="308" width="20" height="24" rx="4" fill="#fb923c" />
          {/* Right Lantern */}
          <circle cx="400" cy="320" r="30" fill={`url(#sunGlowGrad-${uniqueId})`} opacity="0.7" />
          <rect x="390" y="308" width="20" height="24" rx="4" fill="#fb923c" />
        </g>
      )}

      {/* 11. Floating Sacred Lotus Blossoms */}
      {elements.hasLotus && (
        <g>
          <g transform="translate(240, 340)">
            <ellipse cx="0" cy="4" rx="14" ry="4" fill="#047857" opacity="0.7" />
            <path d="M 0,0 C -6,-10 0,-16 0,-16 C 0,-16 6,-10 0,0 Z" fill="#f472b6" />
            <path d="M 0,0 C -12,-6 -14,-12 -14,-12 C -14,-12 -6,-4 0,0 Z" fill="#fbcfe8" />
            <path d="M 0,0 C 12,-6 14,-12 14,-12 C 14,-12 6,-4 0,0 Z" fill="#fbcfe8" />
          </g>
          <g transform="translate(360, 360)">
            <ellipse cx="0" cy="4" rx="18" ry="5" fill="#047857" opacity="0.7" />
            <path d="M 0,0 C -8,-12 0,-20 0,-20 C 0,-20 8,-12 0,0 Z" fill="#f472b6" />
            <path d="M 0,0 C -14,-8 -16,-14 -16,-14 C -16,-14 -7,-5 0,0 Z" fill="#fbcfe8" />
            <path d="M 0,0 C 14,-8 16,-14 16,-14 C 16,-14 7,-5 0,0 Z" fill="#fbcfe8" />
          </g>
        </g>
      )}
    </svg>
  );

  return (
    <>
      {/* Situational Card Visual Container */}
      <div className="relative w-full md:w-52 h-36 md:h-40 shrink-0 rounded-2xl overflow-hidden shadow-xs border border-stone-200/80 bg-stone-900 select-none group">
        {renderSvgContent(false)}

        {/* Floating Situation Badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/50 backdrop-blur-md text-white/90 border border-white/10 shadow-xs pointer-events-none transition-opacity">
          <Sparkles size={10} className="text-amber-300 animate-pulse" />
          <span>{mood}</span>
        </div>

        {/* Action Controls on Hover */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => setShowPromptTooltip((prev) => !prev)}
            className="p-1 rounded-md bg-black/60 hover:bg-black/80 backdrop-blur-md text-white/80 hover:text-white transition cursor-pointer"
            title="View Situational Scene Prompt"
            aria-label="View Situational Scene Prompt"
          >
            <Info size={12} />
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="p-1 rounded-md bg-black/60 hover:bg-black/80 backdrop-blur-md text-white/80 hover:text-white transition cursor-pointer"
            title="Expand contemplative visual"
            aria-label="Expand contemplative visual"
          >
            <Maximize2 size={12} />
          </button>
        </div>

        {/* Prompt Tooltip */}
        {showPromptTooltip && (
          <div
            className="absolute inset-x-2 bottom-2 p-2 rounded-lg bg-stone-900/95 backdrop-blur-md text-[11px] text-stone-200 border border-stone-700/80 shadow-lg z-20"
            onClick={() => setShowPromptTooltip(false)}
          >
            <p className="font-semibold text-amber-300 text-[10px] mb-0.5 uppercase tracking-wider">
              Generated Situational Scene
            </p>
            <p className="line-clamp-3 leading-snug">{prompt}</p>
          </div>
        )}
      </div>

      {/* Expanded Contemplative Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0"
            onClick={() => setIsModalOpen(false)}
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-2xl bg-stone-900 text-stone-100 rounded-3xl overflow-hidden shadow-2xl border border-stone-800 flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-400" />
                <span className="font-medium text-sm text-stone-200">{title}</span>
                <span className="text-stone-500">·</span>
                <span className="text-xs text-amber-400/90 font-medium">{mood}</span>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* High-Resolution Scene */}
            <div className="w-full h-80 sm:h-96 overflow-hidden bg-black">
              {renderSvgContent(true)}
            </div>

            {/* Modal Footer Description */}
            <div className="p-6 space-y-2 bg-stone-950/80 border-t border-stone-800/80">
              <p className="text-xs uppercase tracking-wider font-semibold text-stone-400">
                Situational Visual Prompt
              </p>
              <p className="text-sm text-stone-300 leading-relaxed font-light">{prompt}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
