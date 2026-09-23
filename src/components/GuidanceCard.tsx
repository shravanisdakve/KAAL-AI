import React, { useState } from 'react';
import {
  Check,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  MousePointerClick,
  Square,
} from 'lucide-react';
import { StructuredGuidanceResponse, TacticalStep } from '../types/guidance.ts';
import { KaalAvatar } from './KaalAvatar.tsx';

interface GuidanceCardProps {
  response: StructuredGuidanceResponse;
  category?: string;
  timestamp?: string;
}

export const GuidanceCard: React.FC<GuidanceCardProps> = ({
  response,
  timestamp = '10:43 AM',
}) => {
  // Normalize steps to TacticalStep array
  const initialSteps: TacticalStep[] =
    response.frameworkSteps && response.frameworkSteps.length > 0
      ? response.frameworkSteps
      : (response.steps || []).map((stepText, idx) => ({
          id: idx + 1,
          title: stepText,
          description: stepText,
          status: idx === 0 ? ('Active Focus' as const) : ('Pending' as const),
          checklist: [
            `Implement initial review for step ${idx + 1}`,
            'Verify outcomes against target milestones',
          ],
        }));

  const [steps, setSteps] = useState<TacticalStep[]>(initialSteps);
  const [expandedStepId, setExpandedStepId] = useState<number | null>(
    initialSteps.length > 0 ? initialSteps[0].id : null
  );
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    '1-0': true, // Seed first checklist item as checked like screenshot
  });

  const toggleStepAccordion = (stepId: number) => {
    setExpandedStepId((prev) => (prev === stepId ? null : stepId));
  };

  const toggleChecklistItem = (stepId: number, itemIdx: number) => {
    const key = `${stepId}-${itemIdx}`;
    setCheckedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleStepCompletion = (stepId: number) => {
    setSteps((prev) =>
      prev.map((step) => {
        if (step.id === stepId) {
          const isNowCompleted = step.status !== 'Completed';
          return {
            ...step,
            status: isNowCompleted ? 'Completed' : 'Active Focus',
          };
        }
        return step;
      })
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-10">
      {/* Response Header */}
      <div className="flex items-center gap-2.5 mb-3 select-none">
        <KaalAvatar size="sm" />
        <span className="font-semibold text-gray-900 text-sm tracking-tight">
          KAAL AI
        </span>
        <span className="bg-[#d7f1e4] text-[#134e38] text-xs font-medium px-2.5 py-0.5 rounded-full border border-[#c1e8d3]/60">
          Rule-based Guidance
        </span>
        <span className="text-xs text-gray-400 ml-1">{timestamp}</span>
      </div>

      {/* Main Guidance Card */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-6 md:p-7 shadow-xs">
        {/* Core Insight Callout with Green Vertical Bar */}
        <div className="flex items-start mb-7 pl-1">
          <div className="w-1 bg-[#10b981] self-stretch rounded-full mr-3.5 shrink-0" />
          <div className="flex-1">
            <span className="block text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-1.5 select-none">
              CORE INSIGHT
            </span>
            <p className="text-lg md:text-[19px] font-medium text-gray-900 leading-snug">
              {response.summary || response.title}
            </p>
          </div>
        </div>

        {/* Recommended Framework Header */}
        <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-gray-100 select-none">
          <span className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">
            RECOMMENDED FRAMEWORK
          </span>
          <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
            <MousePointerClick size={13} className="text-gray-400" />
            <span>Click any step to inspect & track</span>
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-3">
          {steps.map((step) => {
            const isExpanded = expandedStepId === step.id;
            const isCompleted = step.status === 'Completed';

            return (
              <div
                key={step.id}
                className={`border rounded-xl transition-all overflow-hidden ${
                  isExpanded
                    ? 'border-gray-300/80 bg-white shadow-xs'
                    : 'border-gray-200/80 bg-[#fbfcfb] hover:border-gray-300'
                }`}
              >
                {/* Step Accordion Header */}
                <button
                  onClick={() => toggleStepAccordion(step.id)}
                  className="w-full flex items-center justify-between p-4 text-left transition select-none cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Step Number Badge */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#1e3a34] text-white'
                      }`}
                    >
                      {isCompleted ? <Check size={13} strokeWidth={2.5} /> : step.id}
                    </div>

                    {/* Step Title */}
                    <span
                      className={`text-sm md:text-base font-semibold transition-colors ${
                        isCompleted
                          ? 'text-gray-500 line-through'
                          : 'text-gray-900'
                      }`}
                    >
                      {step.title}
                    </span>

                    {/* Status Pill */}
                    {step.status === 'Active Focus' && !isCompleted && (
                      <span className="inline-flex items-center gap-1 bg-[#e6f7ef] text-[#114936] text-[11px] font-medium px-2 py-0.5 rounded-full border border-[#c6edd9]/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        Active Focus
                      </span>
                    )}

                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-[11px] font-medium px-2 py-0.5 rounded-full">
                        Completed
                      </span>
                    )}
                  </div>

                  <div className="text-gray-400 p-1">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-gray-100/80">
                    <p className="text-sm text-gray-700 leading-relaxed mb-4">
                      {step.description}
                    </p>

                    {/* Tactical Checklist Box */}
                    {step.checklist && step.checklist.length > 0 && (
                      <div className="bg-[#f8faf9] border border-gray-200/70 rounded-xl p-3.5 mb-4">
                        <span className="block text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-2 select-none">
                          TACTICAL CHECKLIST
                        </span>
                        <div className="space-y-2">
                          {step.checklist.map((item, idx) => {
                            const itemKey = `${step.id}-${idx}`;
                            const isChecked = Boolean(checkedItems[itemKey]);
                            return (
                              <button
                                key={idx}
                                onClick={() => toggleChecklistItem(step.id, idx)}
                                className="flex items-start gap-2.5 text-left w-full group cursor-pointer"
                              >
                                <span className="mt-0.5 text-[#1e3a34] group-hover:text-emerald-700 transition-colors">
                                  {isChecked ? (
                                    <CheckSquare size={16} className="text-emerald-700" />
                                  ) : (
                                    <Square size={16} className="text-gray-400" />
                                  )}
                                </span>
                                <span
                                  className={`text-xs md:text-sm leading-snug transition-colors ${
                                    isChecked
                                      ? 'text-gray-500 line-through'
                                      : 'text-gray-800'
                                  }`}
                                >
                                  {item}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Step Progress & Action Footer */}
                    <div className="flex items-center justify-between pt-2 select-none">
                      <span className="text-xs text-gray-500 font-medium">
                        Status:{' '}
                        {isCompleted ? 'Milestone Achieved' : 'Milestone Progress'}
                      </span>

                      <button
                        onClick={() => toggleStepCompletion(step.id)}
                        className={`text-xs font-medium px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isCompleted
                            ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            : 'bg-[#1e3a34] hover:bg-[#152a25] text-white shadow-2xs'
                        }`}
                      >
                        <Check size={14} />
                        <span>{isCompleted ? 'Mark Incomplete' : 'Mark Complete'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
