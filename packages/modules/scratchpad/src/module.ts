import { createModule, ModuleRegistry } from '@serranolabs.io/shared/module';
import { createTab } from '@serranolabs.io/shared/tab';
import { ScratchpadElement } from './scratchpad-element';

const scratchpadTab = createTab({
  title: 'Scratchpad',
  icon: 'file-text',
  position: 'left',
  isAppended: false,
});

export const scratchpadModule = createModule({
  title: 'Scratchpad',
  description: 'Quick notes and temporary text editor',
  version: '1.0.0',
  renderModes: ['renderInPanel', 'renderInSettings', 'renderInSidePanel'],
  tab: scratchpadTab,
});

ModuleRegistry.register(scratchpadModule, ScratchpadElement);

export { ScratchpadElement };
