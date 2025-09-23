// Clean user module - OOP BULLSHIT OBLITERATED 🔥
import { createModule, ModuleRegistry } from '@serranolabs.io/shared/module';
import { createTab } from '@serranolabs.io/shared/tab';
import { UserElement } from './user-element';

const description = 'Manage your account here!';

// Clean tab - PLAIN OBJECT
const userTab = createTab({
  title: 'User',
  icon: 'person',
  position: 'left',
});

// Clean module creation - FUCKING SIMPLE
export const userModule = createModule({
  title: 'User',
  description,
  version: '1.0.0',
  renderModes: [
    'renderInSidePanel',
    'renderInDaemon',
    'renderInPanel',
    'renderInSettings',
  ],
  tab: userTab,
});

// Register - DONE
ModuleRegistry.register(userModule, UserElement);

export { UserElement };
