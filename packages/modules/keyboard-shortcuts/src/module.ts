// Clean keyboard shortcuts - NO OOP BULLSHIT 🔥
import { createModule, ModuleRegistry } from '@serranolabs.io/shared/module';
import { createTab } from '@serranolabs.io/shared/tab';
import { elementName, KeyboardShortcutsElement } from './keyboard-shortcuts';

const description = 'Manage all the keyboard shortcuts';
const title = 'Keyboard Shortcuts';

// Clean tab creation - SIMPLE OBJECT
const shortcutsTab = createTab({
  title,
  icon: 'command',
  position: 'left',
});

// Clean module - NO COMPLEXITY
export const keyboardShortcutsModule = createModule({
  title,
  description,
  version: '1.0.0',
  renderModes: ['renderInSettings', 'renderInDaemon', 'renderInPanel'],
  tab: shortcutsTab,
});

// Register - ONE LINE
ModuleRegistry.register(keyboardShortcutsModule, KeyboardShortcutsElement);

export { KeyboardShortcutsElement };