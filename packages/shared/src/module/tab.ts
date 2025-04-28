import { genShortID } from '../model/util';

export const UPDATE_TAB_EVENT = 'update-tab-event';

export type TabType = 'Menu' | 'Action' | 'SidePanel' | 'Both';
// menu is for theme switcher
// side panel is for search
// action => opening the side panel

export type TabPosition = 'left' | 'right';
export class Tab {
  private _name?: string;
  // this is the icon
  private _value?: string;
  private _hotkey?: string;
  private _order?: number;
  // pressing this tab merely sends an event and does nothing more
  private _action?: string;
  // is this on the left bar or the right bar
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
    if (hotkey) {
      this._hotkey = hotkey;
    }

    if (this._action) {
      this._action = action;
    }

    if (position) {
      this._position = position;
    }

    if (id) {
      this.id = id;
    } else {
      this.id = genShortID(6);
    }

    if (order) {
      this._order = order;
    }

    if (isAppended) {
      this._isAppended = isAppended;
    } else {
      this._isAppended = true;
    }

    if (tabType) {
      this._tabType = tabType;
    } else {
      this._tabType = 'SidePanel';
    }

    if (isToggledInDrawer) {
      this._isToggledInDrawer = isToggledInDrawer;
    } else {
      this._isToggledInDrawer = false;
    }
  }

  toggleTabInDrawer(newState?: boolean) {
    if (newState !== undefined) {
      this._isToggledInDrawer = newState;
      return;
    }

    this._isToggledInDrawer = !this._isToggledInDrawer;
  }

  get isToggledInDrawer(): boolean | undefined {
    return this._isToggledInDrawer;
  }

  setPosition(value: TabPosition): Tab {
    this._position = value;

    return this;
  }

  setTabType(value: TabType): Tab {
    this._tabType = value;

    return this;
  }

  setOrder(value: number): Tab {
    this._order = value;

    return this;
  }

  get order(): number | undefined {
    return this._order;
  }

  getPosition(): TabPosition | undefined {
    return this._position;
  }

  get tabType(): TabType | undefined {
    return this._tabType;
  }

  set tabType(value: TabType) {
    this._tabType = value;
  }

  set position(value: TabPosition) {
    this._position = value;
  }

  get position(): TabPosition | undefined {
    return this._position;
  }

  get isAppended(): boolean | undefined {
    return this._isAppended!;
  }

  appendTab(): Tab {
    this._isAppended = true;
    return this;
  }

  removeTab(): Tab {
    this._isAppended = false;
    return this;
  }

  get name(): string | undefined {
    return this._name;
  }

  set name(value: string | undefined) {
    this._name = value;
  }

  get value(): string | undefined {
    return this._value;
  }

  set value(value: string | undefined) {
    this._value = value;
  }

  get hotkey(): string | undefined {
    return this._hotkey;
  }

  set hotkey(value: string | undefined) {
    this._hotkey = value;
  }

  get action(): string | undefined {
    return this._action;
  }

  set action(value: string | undefined) {
    this._action = value;
  }
}
