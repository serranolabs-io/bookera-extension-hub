// Clean themes module - OBLITERATED ALL THE BULLSHIT 🔥
import { createModule, ModuleRegistry } from '@serranolabs.io/shared/module';
import { createTab } from '@serranolabs.io/shared/tab';
import { ThemesElement } from './theme-switcher-element';

const description =
  'Customize the look and feel of your Bookera application with themes. There are two types of themes: System and Custom. System themes are simple, while Custom themes allow you to create your own unique look.';

// Create clean tab - NO CLASS BULLSHIT
const themesTab = createTab({
  title: 'Themes',
  icon: 'palette',
  position: 'left',
  isAppended: false, // Start unappended
});

// Create module with clean system - SIMPLE AS FUCK
export const themeSwitcherModule = createModule({
  title: 'Themes',
  description,
  version: '1.0.0',
  renderModes: ['renderInDaemon', 'renderInPanel', 'renderInSettings', 'renderInSidePanel'],
  tab: themesTab,
});

// Register - DONE
ModuleRegistry.register(themeSwitcherModule, ThemesElement);

export { ThemesElement };