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
    <div className="w-full flex flex-col items-end mb-6 sm:mb-8 max-w-4xl mx-auto min-w-0">
      {/* Header Info */}
      <div className="flex items-center gap-2 mb-2 text-xs text-gray-500 dark:text-[#94a3b8] font-medium select-none">
        <span>{timestamp}</span>
        <span className="text-gray-900 dark:text-white font-semibold">You</span>
        <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center text-[10px] font-bold">
          U
        </div>
      </div>

      {/* Message Card */}
      <div className="bg-[#f4f5f6] dark:bg-[#121824] text-gray-900 dark:text-white rounded-2xl rounded-tr-xs p-3.5 sm:p-5 max-w-full sm:max-w-2xl text-[14px] sm:text-[15px] leading-relaxed shadow-2xs border border-gray-100 dark:border-[#1a2230] break-words min-w-0">
        {question}
      </div>
    </div>
  );
};
