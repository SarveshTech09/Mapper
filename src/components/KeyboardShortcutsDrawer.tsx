import { X, Keyboard } from 'lucide-react';

interface Shortcut {
  key: string;
  description: string;
}

interface KeyboardShortcutsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: Shortcut[];
}

export const DEFAULT_SHORTCUTS = {
  general: [
    { key: 'Ctrl/Cmd + N', description: 'Add new item' },
    { key: 'Ctrl/Cmd + S', description: 'Save current item' },
    { key: 'Ctrl/Cmd + Enter', description: 'Submit all items' },
    { key: 'Ctrl/Cmd + K', description: 'Toggle shortcuts' },
    { key: '?', description: 'Toggle shortcuts' },
    { key: 'Ctrl/Cmd + D', description: 'Focus first input' },
    { key: 'Ctrl/Cmd + A', description: 'Select all in field' },
    { key: 'Esc', description: 'Close panels/blur focus' }
  ],
  navigation: [
    { key: '← → ↑ ↓', description: 'Navigate between cells' },
    { key: 'Tab', description: 'Move to next field' },
    { key: 'Shift + Tab', description: 'Move to previous field' },
  ],
  editing: [
    { key: 'Ctrl/Cmd + Z', description: 'Undo last action' },
    { key: 'Ctrl/Cmd + Y', description: 'Redo last action' },
    { key: 'Delete', description: 'Delete current item' },
    { key: 'Ctrl/Cmd + D', description: 'Duplicate current item' },
  ],
  inventory: [
    { key: 'Ctrl/Cmd + N', description: 'Add new row' },
    { key: 'Ctrl/Cmd + S', description: 'Save first unsaved row' },
    { key: 'Ctrl/Cmd + Enter', description: 'Submit all rows' },
    { key: 'Ctrl/Cmd + K', description: 'Toggle shortcuts' },
    { key: '?', description: 'Toggle shortcuts' },
    { key: 'Ctrl/Cmd + D', description: 'Focus first input' },
    { key: 'Ctrl/Cmd + A', description: 'Select all in field' },
    { key: 'Esc', description: 'Close panels/blur focus' }
  ],
  products: [
    { key: 'Ctrl/Cmd + N', description: 'Add new product' },
    { key: 'Ctrl/Cmd + Enter', description: 'Submit all products' },
    { key: 'Ctrl/Cmd + S', description: 'Save current row' },
    { key: 'Ctrl/Cmd + K', description: 'Toggle shortcuts' },
    { key: '?', description: 'Toggle shortcuts' },
    { key: 'Ctrl/Cmd + D', description: 'Focus first input' },
    { key: 'Ctrl/Cmd + A', description: 'Select all in field' },
    { key: 'Esc', description: 'Close panels/blur focus' }
  ]
};

export const getShortcutsByCategory = (categories: ('general' | 'navigation' | 'editing' | 'inventory' | 'products')[]): Shortcut[] => {
  const allShortcuts: Shortcut[] = [];
  categories.forEach(category => {
    allShortcuts.push(...DEFAULT_SHORTCUTS[category]);
  });
  return allShortcuts;
};

export const mergeShortcuts = (defaultShortcuts: Shortcut[], customShortcuts: Shortcut[]): Shortcut[] => {
  const defaultKeys = new Set(defaultShortcuts.map(sc => sc.key));
  const customOnly = customShortcuts.filter(sc => !defaultKeys.has(sc.key));
  return [...defaultShortcuts, ...customOnly];
};

export const useKeyboardShortcuts = (_callbacks: {
  addNewRow?: () => void;
  saveRow?: (row: any) => void;
  saveAllRows?: () => void;
  submitAllRows?: () => void;
  setShowShortcuts?: (show: boolean) => void;
  rows?: any[];
  showShortcuts?: boolean;
}) => {

};

export default function KeyboardShortcutsDrawer({ 
  isOpen, 
  onClose, 
  shortcuts 
}: KeyboardShortcutsDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="relative w-screen max-w-md">
          <div className="h-full flex flex-col bg-gradient-to-br from-blue-50/90 to-purple-50/70 border-l border-blue-200/50 shadow-2xl backdrop-blur-md">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-blue-200/30 bg-white/30 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
                  <Keyboard className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-blue-900 text-lg">Keyboard Shortcuts</h3>
              </div>
              <button 
                onClick={onClose}
                className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 p-2 rounded-lg transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {shortcuts.map((shortcut, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-4 bg-white/50 p-4 rounded-xl border border-blue-100/50 hover:bg-white/70 transition-all duration-200"
                  >
                    <kbd className="px-3 py-2 bg-white border border-blue-300 rounded-lg font-mono text-sm shadow-sm min-w-[100px] text-center">
                      {shortcut.key}
                    </kbd>
                    <span className="text-blue-800 font-medium flex-1">
                      {shortcut.description}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-blue-200/30">
                <p className="text-sm text-blue-600 text-center">
                  Press <kbd className="px-2 py-1 bg-white border border-blue-300 rounded font-mono text-xs">Esc</kbd> to close
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}