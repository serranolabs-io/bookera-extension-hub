import { Config } from '@serranolabs.io/shared/extension-marketplace';
import { ManageConfigElement } from './manage-config-element';
import { PublishConfigElement } from './publish-config-element';
import { html } from 'lit';
import { renderConfig } from './config-schemas';

type RenderConfigsMode = 'publish' | 'manage';

// we can reuse the way we render extensions
export function renderConfigs(
  this: ManageConfigElement | PublishConfigElement,
  configs: Config[],
  mode: RenderConfigsMode
) {
  if (configs.length === 0) {
    return html``;
  }

  if (configs.length <= 1) {
    const firstConfig = configs[0];
    console.log(firstConfig);

    return html`
      <sl-tab-group
        @sl-close=${mode === 'manage'
          ? (this as ManageConfigElement).removeConfig.bind(this)
          : undefined}
      >
        ${firstConfig.values.map((config: any) => {
          return html`
            <sl-tab
              slot="nav"
              panel=${config.id}
              ?closable=${mode === 'manage'
                ? firstConfig.values.length > 1
                : false}
              id=${config.id}
              >${config[firstConfig.nameIndex]}</sl-tab
            >

            <sl-tab-panel name=${config.id}>
              ${renderConfig(config)}</sl-tab-panel
            >
          `;
        })}
      </sl-tab-group>
    `;
  } else {
    return html` <div class="input-box">
      <sl-tab-group
        @sl-close=${mode === 'manage'
          ? (this as ManageConfigElement).removeConfig.bind(this)
          : undefined}
      >
        ${configs.map((config: Config) => {
          config = new Config(
            config.source,
            config.values,
            config.nameIndex,
            config.id
          );

          return html`
            <sl-tab
              id=${config.id}
              slot="nav"
              panel=${config.id}
              ?closable=${mode === 'manage' ? true : false}
              >${config.source.name}</sl-tab
            >

            <sl-tab-panel name=${config.id}>
              ${config.values.map((value: any) => {
                return renderConfig(value);
              })}
            </sl-tab-panel>
          `;
        })}
      </sl-tab-group>
    </div>`;
  }
}

// <!-- ${this._renderConfig(config.values)} -->
