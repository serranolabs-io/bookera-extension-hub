// Clean extension marketplace - TAB BULLSHIT ANNIHILATED 🔥
import { createModule, ModuleRegistry } from '@serranolabs.io/shared/module';
import { createTab } from '@serranolabs.io/shared/tab';
import { ExtensionMarketplaceElement, elementName } from './extension-marketplace-element';

const description = `The Bookera Marketplace is your go-to hub for discovering, installing, and managing extensions that enhance your reading and writing experience. Whether you're looking for tools to improve productivity, customize your reading environment, or integrate with your favorite apps and platforms, the Extension Marketplace offers a wide variety of extensions built by the community.`;

// Clean tab - NO CLASS NONSENSE
const marketplaceTab = createTab({
  title: 'Extension Marketplace',
  icon: 'puzzle',
  position: 'left',
});

// Clean module - SIMPLE AND WORKS
export const extensionMarketplaceModule = createModule({
  title: 'Extension Marketplace',
  description,
  version: '1.0.0',
  renderModes: ['renderInSidePanel', 'renderInDaemon', 'renderInSettings', 'renderInPanel'],
  tab: marketplaceTab,
});

// Register and DONE
ModuleRegistry.register(extensionMarketplaceModule, ExtensionMarketplaceElement);

export { ExtensionMarketplaceElement };