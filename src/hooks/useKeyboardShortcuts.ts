import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';

interface UseKeyboardShortcutsProps {
  onToggleShortcuts?: (show: boolean) => void;
  onAddNewRow?: () => void;
  showShortcuts?: boolean;
}

export const useKeyboardShortcuts = ({
  onToggleShortcuts,
  onAddNewRow,
  showShortcuts = false
}: UseKeyboardShortcutsProps = {}) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  // Use refs to avoid stale closures
  const navigateRef = useRef(navigate);
  const logoutRef = useRef(logout);
  const onToggleShortcutsRef = useRef(onToggleShortcuts);
  const onAddNewRowRef = useRef(onAddNewRow);
  const showShortcutsRef = useRef(showShortcuts);

  // Keep refs updated
  useEffect(() => {
    navigateRef.current = navigate;
    logoutRef.current = logout;
    onToggleShortcutsRef.current = onToggleShortcuts;
    onAddNewRowRef.current = onAddNewRow;
    showShortcutsRef.current = showShortcuts;
  }, [navigate, logout, onToggleShortcuts, onAddNewRow, showShortcuts]);

  const handleLogout = useCallback(() => {
    logoutRef.current();
    navigateRef.current('/login');
  }, []);

  const handleKeyboardShortcut = useCallback((e: KeyboardEvent) => {
    // Prevent shortcuts from firing when typing in input fields
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' || 
      target.tagName === 'SELECT' || 
      target.tagName === 'TEXTAREA' || 
      target.tagName === 'BUTTON' ||
      (target as HTMLInputElement).isContentEditable
    ) {
      return;
    }

    // Toggle shortcuts panel
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      onToggleShortcutsRef.current?.(!showShortcutsRef.current);
      return;
    }

    // Toggle shortcuts panel with ?
    if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      onToggleShortcutsRef.current?.(!showShortcutsRef.current);
      return;
    }

    // Close panels/blur focus
    if (e.key === 'Escape') {
      e.preventDefault();
      // Close shortcuts panel if open
      if (showShortcutsRef.current) {
        onToggleShortcutsRef.current?.(false);
      }
      // Blur current input focus
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      return;
    }

    // Add new row shortcut (Ctrl/Cmd + N)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      onAddNewRowRef.current?.();
      return;
    }

    // Navigation shortcuts (Alt + key)
    if (e.altKey) {
      e.preventDefault();
      switch (e.key.toLowerCase()) {
        case 'd':
          navigateRef.current('/');
          break;
        case 'i':
          navigateRef.current('/inventory');
          break;
        case 'p':
          navigateRef.current('/products');
          break;
        case 'l':
          handleLogout();
          break;
        default:
          // Don't prevent default for other alt combinations
          e.preventDefault = () => {};
      }
      return;
    }
  }, [handleLogout]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyboardShortcut);
    return () => window.removeEventListener('keydown', handleKeyboardShortcut);
  }, [handleKeyboardShortcut]);
};