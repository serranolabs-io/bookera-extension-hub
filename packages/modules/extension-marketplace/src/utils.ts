import { ExtensionConfig } from '@serranolabs.io/shared/extension-marketplace';
import { html, TemplateResult } from 'lit';
import { Extension } from './backend';

export const getExtensionIcon = (
  userId: string,
  configId: string,
  iconSize = '96x96.png'
) => {
  return `https://raw.githubusercontent.com/serranolabs-io/bookera-extension-hub/main/packages/extensions/configs/${userId}/${configId}/icons/${iconSize}`;
};

export function renderImageBox(
  extension: ExtensionConfig & Extension,
  size = '48',
  hasIcon: boolean
): TemplateResult {
  let content = html`<sl-icon name="puzzle"></sl-icon>`;
  if (extension.hasIcon || hasIcon) {
    content = html`
      <img
        width=${`${size}px`}
        height=${`${size}px`}
        src=${getExtensionIcon(extension.userId, extension.title)}
        alt="img"
      />
    `;
  }

  return html` <div class="image-box">${content}</div> `;
}
