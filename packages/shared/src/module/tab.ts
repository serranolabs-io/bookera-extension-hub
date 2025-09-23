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
  const isToggledInDrawer = newState !== undefined ? newState : !tab.isToggledInDrawer;
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

// Legacy Tab class for backward compatibility - DEPRECATED
export class Tab_DEPRECATED {
  // Keep the old implementation for compatibility but mark as deprecated
  // All the private property bullshit stays here for legacy code
  private _name?: string;
  private _value?: string;
  private _hotkey?: string;
  private _order?: number;
  private _action?: string;
  private _position?: TabPosition;
  private _isAppended?: boolean;
  private _isToggledInDrawer?: boolean;
  private _tabType?: TabType;
  id?: string;

  constructor(
    name?: string,
    value?: string,
    hotkey?: string,
    action?: string,
    position?: 'left' | 'right',
    id?: string,
    order?: number,
    isAppended?: boolean,
    tabType?: TabType,
    isToggledInDrawer?: boolean
  ) {
    this._name = name;
    this._value = value;
    this._hotkey = hotkey;
    this._action = action;
    this._position = position;
    this.id = id || Math.random().toString(36).substring(2, 8);
    this._order = order;
    this._isAppended = isAppended ?? true;
    this._tabType = tabType || 'SidePanel';
    this._isToggledInDrawer = isToggledInDrawer ?? false;
  }

  // All the getter/setter bullshit for compatibility
  get name() { return this._name; }
  set name(value) { this._name = value; }
  get value() { return this._value; }
  set value(value) { this._value = value; }
  get hotkey() { return this._hotkey; }
  set hotkey(value) { this._hotkey = value; }
  get action() { return this._action; }
  set action(value) { this._action = value; }
  get position() { return this._position; }
  set position(value) { this._position = value; }
  get isAppended() { return this._isAppended!; }
  get order() { return this._order; }
  get tabType() { return this._tabType; }
  set tabType(value) { this._tabType = value; }
  get isToggledInDrawer() { return this._isToggledInDrawer; }

  toggleTabInDrawer(newState?: boolean) {
    this._isToggledInDrawer = newState !== undefined ? newState : !this._isToggledInDrawer;
  }

  appendTab(): Tab_DEPRECATED {
    this._isAppended = true;
    return this;
  }

  removeTab(): Tab_DEPRECATED {
    this._isAppended = false;
    return this;
  }

  setPosition(value: TabPosition): Tab_DEPRECATED {
    this._position = value;
    return this;
  }

  setTabType(value: TabType): Tab_DEPRECATED {
    this._tabType = value;
    return this;
  }

  setOrder(value: number): Tab_DEPRECATED {
    this._order = value;
    return this;
  }

  getPosition(): TabPosition | undefined {
    return this._position;
  }
}

// Export the legacy class as LegacyTab for backward compatibility
export { Tab_DEPRECATED as LegacyTab };

// Export the clean interface as the main Tab type
export type { Tab as TabInterface };

// For maximum compatibility, also export the deprecated class as Tab
// This allows existing code to work while new code uses the interface
export const Tab = Tab_DEPRECATED;