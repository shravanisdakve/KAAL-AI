import React, { useState } from 'react';

interface KaalAvatarProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isThinking?: boolean;
  className?: string;
}

export const KaalAvatar: React.FC<KaalAvatarProps> = ({
  size = 'md',
  isThinking = false,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeMap = {
    xs: 'w-6 h-6',
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full bg-[#081A2E] text-white shrink-0 select-none overflow-hidden border border-[#D9A441]/50 shadow-xs ${sizeMap[size]} ${className}`}
      title="KAAL AI"
    >
      {!imageError ? (
        <img
          src="/icon.png"
          alt="KAAL AI Logo"
          onError={() => setImageError(true)}
          className={`w-full h-full object-cover transition-transform duration-700 ${
            isThinking ? 'animate-spin' : ''
          }`}
        />
      ) : (
        <div className="w-full h-full rounded-full border border-[#D9A441]/70 flex items-center justify-center bg-gradient-to-br from-[#D9A441]/20 to-transparent">
          <span className="font-serif text-xs font-bold text-[#F2C766]">ॐ</span>
        </div>
      )}

      {/* Subtle thinking halo if active */}
      {isThinking && (
        <span className="absolute -inset-1 rounded-full border border-[#D9A441]/60 animate-ping pointer-events-none" />
      )}
    </div>
  );
};
