import { useEffect, useState } from 'react';
import type { MenuInputSnapshot } from '../game/types';

export type MenuInputSubscriber = (cb: (input: MenuInputSnapshot) => void) => () => void;

interface UseMenuNavigationOptions {
  active: boolean;
  itemCount: number;
  initialIndex?: number;
  subscribeMenuInput: MenuInputSubscriber;
  onConfirm: (index: number) => void;
  onBack?: () => void;
  resetKey?: string | number;
}

export function useMenuNavigation({
  active,
  itemCount,
  initialIndex = 0,
  subscribeMenuInput,
  onConfirm,
  onBack,
  resetKey,
}: UseMenuNavigationOptions): [number, (idx: number) => void] {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  useEffect(() => {
    if (active) {
      setSelectedIndex(Math.max(0, Math.min(itemCount - 1, initialIndex)));
    }
  }, [active, initialIndex, itemCount, resetKey]);

  useEffect(() => {
    if (!active || itemCount <= 0) return;

    return subscribeMenuInput((m) => {
      if (m.up || m.left) {
        setSelectedIndex((prev) => (prev - 1 + itemCount) % itemCount);
        return;
      }
      if (m.down || m.right) {
        setSelectedIndex((prev) => (prev + 1) % itemCount);
        return;
      }
      if (m.confirm) {
        onConfirm(selectedIndex);
        return;
      }
      if (m.back && onBack) {
        onBack();
      }
    });
  }, [active, itemCount, subscribeMenuInput, selectedIndex, onConfirm, onBack]);

  return [selectedIndex, setSelectedIndex];
}
