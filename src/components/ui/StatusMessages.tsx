import React from 'react';
import { AlertCircle, Check, X } from 'lucide-react';

interface StatusMessageProps {
  type: 'error' | 'success';
  message: string;
  onClose?: () => void;
}

export const StatusMessage: React.FC<StatusMessageProps> = ({ type, message, onClose }) => {
  const bgColor = type === 'error' ? 'bg-red-50' : 'bg-green-50';
  const borderColor = type === 'error' ? 'border-red-200' : 'border-green-200';
  const textColor = type === 'error' ? 'text-red-700' : 'text-green-700';
  const iconColor = type === 'error' ? 'text-red-500' : 'text-green-500';
  const icon = type === 'error' ? <AlertCircle className="w-5 h-5 flex-shrink-0" /> : <Check className="w-5 h-5 flex-shrink-0" />;

  return (
    <div className={`flex items-center gap-2 p-4 ${bgColor} border ${borderColor} rounded-lg ${textColor}`}>
      {icon}
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="ml-auto">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'medium' }) => {
  const sizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-12 w-12',
    large: 'h-16 w-16'
  };
  
  const borderWidth = size === 'small' ? 'border-b-2' : 'border-b-4';

  return (
    <div className="flex items-center justify-center">
      <div className={`animate-spin rounded-full ${sizeClasses[size]} ${borderWidth} border-blue-600`}></div>
    </div>
  );
};