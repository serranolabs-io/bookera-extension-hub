import { Config } from '@serranolabs.io/shared/extension-marketplace';
import { ManageConfigElement } from './manage-config-element';
import { PublishConfigElement } from './publish-config-element';
import { html } from 'lit';

type RenderConfigsMode = 'publish' | 'manage';

function removeConfig(this: ManageConfigElement | PublishConfigElement) {}

// we can reuse the way we render extensions
export function renderConfigs(
  this: ManageConfigElement | PublishConfigElement,
  configs: Config<any>[],
  mode: RenderConfigsMode
) {
  if (configs.length === 0) {
    return html``;
  }

  let attachRemoveConfigEventListener =
    mode === 'publish' ? html`@sl-close=${removeConfig.bind(this)} ` : html``;

  if (configs.length <= 1) {
    const firstConfig = configs[0];
    //  ${this._renderConfig(config)}
    console.log(firstConfig, 'COFIG');
    return html`
      <sl-tab-group ${attachRemoveConfigEventListener}>
        ${firstConfig.values.map((config: any) => {
          return html`
            <sl-tab
              slot="nav"
              panel=${config.id}
              ?closable=${firstConfig.values.length > 1}
              id=${config.id}
              >${config[firstConfig.nameIndex]}</sl-tab
            >

            <sl-tab-panel name=${config.id}> </sl-tab-panel>
          `;
        })}
      </sl-tab-group>
    `;
  } else {
    return html` <div class="input-box">
      <label>Configs</label>
      <sl-tab-group ${attachRemoveConfigEventListener}>
        ${configs.map((config: Config<any>) => {
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
              closable=${true}
              >${config.source.name}</sl-tab
            >

            <sl-tab-panel name=${config.id}> panel </sl-tab-panel>
          `;
        })}
      </sl-tab-group>
    </div>`;
  }
}

// <!-- ${this._renderConfig(config.values)} -->
