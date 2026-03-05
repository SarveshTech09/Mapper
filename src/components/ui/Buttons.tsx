import React from 'react';
import { Save, X, Trash2, Plus } from 'lucide-react';

interface IconButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title: string;
  className?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({ 
  icon, 
  onClick, 
  disabled = false, 
  title, 
  className = "" 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-1.5 rounded-lg transition-all duration-200 disabled:opacity-50 hover:scale-110 ${className}`}
      title={title}
    >
      {icon}
    </button>
  );
};

interface SaveButtonProps {
  onClick: () => void;
  disabled: boolean;
  isSaving: boolean;
  itemId: string;
  savingId: string | null;
  title?: string;
}

export const SaveButton: React.FC<SaveButtonProps> = ({ 
  onClick, 
  disabled, 
  isSaving, 
  itemId, 
  savingId,
  title = "Save (Ctrl/Cmd + S)"
}) => {
  return (
    <IconButton
      icon={<Save className="w-4 h-4" />}
      onClick={onClick}
      disabled={disabled || isSaving || savingId === itemId}
      title={title}
      className="text-green-600 hover:bg-green-100"
    />
  );
};

interface CancelButtonProps {
  onClick: () => void;
  title?: string;
}

export const CancelButton: React.FC<CancelButtonProps> = ({ onClick, title = "Cancel" }) => {
  return (
    <IconButton
      icon={<X className="w-4 h-4" />}
      onClick={onClick}
      title={title}
      className="text-gray-600 hover:bg-gray-200"
    />
  );
};

interface DeleteButtonProps {
  onClick: () => void;
  title?: string;
}

export const DeleteButton: React.FC<DeleteButtonProps> = ({ onClick, title = "Delete" }) => {
  return (
    <IconButton
      icon={<Trash2 className="w-4 h-4" />}
      onClick={onClick}
      title={title}
      className="text-red-600 hover:bg-red-100"
    />
  );
};

interface AddButtonProps {
  onClick: () => void;
  title?: string;
}

export const AddButton: React.FC<AddButtonProps> = ({ onClick, title = "Add" }) => {
  return (
    <IconButton
      icon={<Plus className="w-4 h-4" />}
      onClick={onClick}
      title={title}
      className="text-blue-600 hover:bg-blue-100"
    />
  );
};