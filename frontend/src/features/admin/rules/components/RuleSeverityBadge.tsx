import React from 'react';
import { RuleSeverity } from '../types/rule.types';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface Props {
  severity: RuleSeverity;
  size?: 'sm' | 'md';
}

export const RuleSeverityBadge: React.FC<Props> = ({ severity, size = 'md' }) => {
  const isSmall = size === 'sm';

  switch (severity) {
    case 'ERROR':
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-full border border-red-200 bg-red-50 text-red-700 ${
            isSmall ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <AlertCircle className={isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          ERROR
        </span>
      );
    case 'WARNING':
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-full border border-amber-200 bg-amber-50 text-amber-700 ${
            isSmall ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <AlertTriangle className={isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          WARNING
        </span>
      );
    case 'INFO':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-full border border-blue-200 bg-blue-50 text-blue-700 ${
            isSmall ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <Info className={isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          INFO
        </span>
      );
  }
};

export default RuleSeverityBadge;
