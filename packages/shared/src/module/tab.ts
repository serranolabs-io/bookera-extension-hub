// Clean tab system - NO MORE OOP BULLSHIT 🔥

export const UPDATE_TAB_EVENT = 'update-tab-event';

export type TabType = 'Menu' | 'Action' | 'SidePanel' | 'Both';
export type TabPosition = 'left' | 'right';

// PLAIN FUCKING INTERFACE - NO CLASS BULLSHIT
export interface Tab {
  id?: string;
  title: string;
  icon: string;
  hotkey?: string;
  action?: string;
  position: TabPosition;
  isAppended: boolean;
  isToggledInDrawer: boolean;
  tabType: TabType;
  order?: number;
}

// Simple factory function instead of class constructor
export function createTab(config: {
  title: string;
  icon: string;
  action?: string;
  position?: TabPosition;
  hotkey?: string;
  order?: number;
  isAppended?: boolean;
  tabType?: TabType;
  isToggledInDrawer?: boolean;
}): Tab {
  return {
    id: Math.random().toString(36).substring(2, 8),
    title: config.title,
    icon: config.icon,
    hotkey: config.hotkey,
    action: config.action,
    position: config.position || 'left',
    isAppended: config.isAppended ?? false,
    isToggledInDrawer: config.isToggledInDrawer ?? false,
    tabType: config.tabType || 'SidePanel',
    order: config.order,
  };
}

// Utility functions instead of methods
export function appendTab(tab: Tab): Tab {
  return { ...tab, isAppended: true };
}

export function removeTab(tab: Tab): Tab {
  return { ...tab, isAppended: false };
}

export function toggleTabInDrawer(tab: Tab, newState?: boolean): Tab {
  const isToggledInDrawer =
    newState !== undefined ? newState : !tab.isToggledInDrawer;
  return { ...tab, isToggledInDrawer };
}

export function setTabPosition(tab: Tab, position: TabPosition): Tab {
  return { ...tab, position };
}

export function setTabType(tab: Tab, tabType: TabType): Tab {
  return { ...tab, tabType };
}

export function setTabOrder(tab: Tab, order: number): Tab {
  return { ...tab, order };
}
