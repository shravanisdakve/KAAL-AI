import React from 'react';

interface UserMessageProps {
  question: string;
  timestamp?: string;
}

export const UserMessage: React.FC<UserMessageProps> = ({
  question,
  timestamp = '10:42 AM',
}) => {
  return (
    <div className="w-full flex flex-col items-end mb-8 max-w-4xl mx-auto">
      {/* Header Info */}
      <div className="flex items-center gap-2 mb-2 text-xs text-gray-500 font-medium select-none">
        <span>{timestamp}</span>
        <span className="text-gray-900 font-semibold">You</span>
        <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
          U
        </div>
      </div>

      {/* Message Card */}
      <div className="bg-[#f4f5f6] text-gray-900 rounded-2xl rounded-tr-xs p-5 max-w-2xl text-[15px] leading-relaxed shadow-2xs border border-gray-100">
        {question}
      </div>
    </div>
  );
};
