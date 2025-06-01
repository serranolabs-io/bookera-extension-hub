import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement } from 'lit/decorators.js';
import baseCss from '@serranolabs.io/shared/base';
import { TanStackFormController } from '@tanstack/lit-form';
import { User } from '@serranolabs.io/shared/user';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/tab-panel/tab-panel.js';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/tab-group/tab-group.js';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/tab/tab.js';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/input/input.js';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/textarea/textarea.js';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/button/button.js';
import manageConfigElementStyles from './manage-config-element.styles';
import { repeat } from 'lit/directives/repeat.js';
import {
  Config,
  ExtensionConfig,
  SEND_CONFIG_EVENT,
  SEND_CONFIG_EVENT_FROM_API,
  SEND_CONFIG_EVENT_TYPE,
} from '@serranolabs.io/shared/extension-marketplace';
import { BookeraModuleConfig } from '@serranolabs.io/shared/module';
import { TABLES } from '@serranolabs.io/shared/supabase';
import { ExtensionMarketplaceModuleInstanceType } from './api';
import { sendEvent } from '@serranolabs.io/shared/util';
import { notify } from '@serranolabs.io/shared/lit';
import { KeyboardShortcutConfigSchema } from '@serranolabs.io/shared/keyboard-shortcuts';

const lilChigga = {
  name: 'LilChigga',
  id: 'ZJQQTP',
  darkMode: {
    mode: 'Dark',
    primaryColors: [
      '#d3b880',
      '#d3b880',
      '#d3b880',
      '#d3b880',
      '#d3b880',
      '#d3b880',
      '#d3b880',
      '#d3b880',
      '#d3b880',
      '#d3b880',
      '#d3b880',
    ],
    baseColors: [
      '#242628',
      '#86a0ba',
      '#898e95',
      '#cbd5e1',
      '#94a3b8',
      '#485160',
      '#8793a3',
      '#c8ccd2',
      '#c4c9d2',
      '#000000',
      '#000000',
    ],
  },
  lightMode: {
    mode: 'Light',
    primaryColors: [
      '#d3b880',
      '#d3b880',
      '#d3b880',
      '#d3b880',
      '#d3b880',
      '#d3b880',
      '#d3b880',
      '#d3b880',
      '#d3b880',
      '#d3b880',
      '#d3b880',
    ],
    baseColors: [
      '#e3e9ef',
      '#f1f5f9',
      '#b4c0d0',
      '#cdd2d9',
      '#8593a8',
      '#3b4a60',
      '#475569',
      '#334155',
      '#1e293b',
      '#0f172a',
      '#020617',
    ],
  },
};

const randomConfigs: Config<any>[] = [
  new Config({ name: 'Themes', link: 'https://' }, lilChigga, 'name', '1'),
  // new Config(
  //   { name: 'Themes', link: 'https://' },
  //   { name: 'Catpuccin blue' },
  //   'name',
  //   '2'
  // ),
  // new Config(
  //   { name: 'Themes', link: 'https://' },
  //   { name: 'Catpuccin green' },
  //   'name',
  //   '3'
  // ),
  // new Config(
  //   { name: 'Themes', link: 'https://' },
  //   { name: 'Catpuccin orange' },
  //   'name',
  //   '4'
  // ),
  // new Config({ name: 'Keyboard Shortcuts', link: 'https://' }, {}, '', '5'),
];

// keyboard shortcuts dont have a label

const mockData: ExtensionConfig<any> = {
  version: '0.0.0',
  title: 'Title of your config',
  description: 'LOLOLOLO',
  configs: randomConfigs as Config<any>[],
  markdown: '',
  user: new User('me', 'user.text', []),
  isPublished: false,
};

const defaults: ExtensionConfig<any> = {
  version: '',
  title: '',
  description: '',
  configs: [] as Config<any>[],
  markdown: '',
  user: new User('', '', []),
  isPublished: false,
};

type SubmitType = 'publish' | 'save-as-draft';

export const SendConfig = 'send-config';

export const MANAGE_CONFIG_CONSTRUCTED_EVENT =
  'manage-config-constructed-event';

@customElement('manage-config-element')
export class ManageConfigElement extends LitElement {
  static styles = [manageConfigElementStyles, baseCss];

  private _config: BookeraModuleConfig<ExtensionMarketplaceModuleInstanceType>;

  private _listenToConfigEventListener!: Function;
  private _listenToConfigFromApiEventListener!: Function;

  #form = new TanStackFormController(this, {
    defaultValues: {
      extensionConfig: structuredClone(defaults),
    },
    onSubmit: ({ value, meta }) => {
      // const extensionConfig: ExtensionConfig<any> =
      //   ExtensionConfig.FromInterface(value.extensionConfig).serialize();

      const handlePublish = async () => {
        const { user, ...configWithoutUser } = value.extensionConfig;

        configWithoutUser.configs = JSON.stringify(configWithoutUser.configs);

        const { data, error } = await this._config.supabase
          .from(TABLES.ExtensionConfig)
          .insert([configWithoutUser])
          .select();

        console.log(data, error);
      };

      switch (meta as SubmitType) {
        case 'publish':
          handlePublish();
          break;
        case 'save-as-draft':
      }
    },
  });

  constructor(
    config: BookeraModuleConfig<ExtensionMarketplaceModuleInstanceType>
  ) {
    super();

    this._config = config;
  }

  connectedCallback(): void {
    super.connectedCallback();

    this._listenToConfigEventListener = this._listenToConfigEvents.bind(this);

    this._listenToConfigFromApiEventListener =
      this._listenToConfigEvents.bind(this);

    // @ts-ignore
    document.addEventListener(
      SEND_CONFIG_EVENT_FROM_API,
      this._listenToConfigFromApiEventListener
    );

    // @ts-ignore
    document.addEventListener(
      SEND_CONFIG_EVENT,
      this._listenToConfigEventListener
    );
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    // @ts-ignore
    document.removeEventListener(
      SEND_CONFIG_EVENT_FROM_API,
      this._listenToConfigFromApiEventListener
    );
    // @ts-ignore
    document.removeEventListener(
      SEND_CONFIG_EVENT,
      this._listenToConfigEventListener
    );

    this.#form.api.reset();
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    sendEvent(this, MANAGE_CONFIG_CONSTRUCTED_EVENT);
  }

  // to determine what is the config that came in, I need to create zod interfaces...
  private _listenToConfigEvents(e: CustomEvent<SEND_CONFIG_EVENT_TYPE<any>>) {
    const configs = this.#form.api.getFieldValue('extensionConfig.configs');
    if (
      configs
        .map((config: Config<any>) => config.id)
        .includes(e.detail.config.id)
    ) {
      notify(
        'Hey 👋! You already have this config as part of your extension!',
        'neutral',
        'send-exclamation'
      );
      return;
    }

    configs.push(e.detail.config);
    this.#form.api.setFieldValue('extensionConfig.configs', configs);
    this.requestUpdate();
  }

  private _hideTab(e: CustomEvent) {
    const target = e.target;
  }

  private _renderConfig(config: Config<any>) {
    const result = KeyboardShortcutConfigSchema.parse(config);

    console.log(result);
  }

  private _renderForm() {
    return html`
      <form
        @submit=${(e: SubmitEvent) => {
          e.preventDefault();
          console.log('submti');
          // this.#form.api.handleSubmit = this._submitForm.bind(this);
        }}
      >
        ${this.#form.field(
          {
            name: 'extensionConfig.title',
            validators: {
              onSubmit: ({ value }) => {
                return value.length === 0 ? 'Not long enough' : undefined;
              },
            },
          },
          (titleField) => {
            let inputField = html``;

            if (!titleField.state.meta.isValid) {
              inputField = html`${repeat(
                titleField.state.meta.errors,
                (__, idx) => idx,
                (error) => {
                  return html`<div class="container red">${error}</div>`;
                }
              )}`;
            }

            return html`
              <div class="input-box">
                <label>Title</label>
                <sl-input
                  value=${titleField.state.value}
                  placeholder="Name your configuration"
                  @input=${(e: Event) => {
                    const target = e.target as HTMLInputElement;
                    titleField.handleChange(target.value);
                  }}
                ></sl-input>
                ${inputField}
              </div>
            `;
          }
        )}
        ${this.#form.field(
          {
            name: 'extensionConfig.description',
            validators: {
              onSubmit: ({ value }) => {
                return value.length === 0 ? 'Not long enough' : undefined;
              },
            },
          },
          (titleField) => {
            let inputField = html``;

            if (!titleField.state.meta.isValid) {
              inputField = html`${repeat(
                titleField.state.meta.errors,
                (__, idx) => idx,
                (error) => {
                  return html`<div class="container red">${error}</div>`;
                }
              )}`;
            }

            return html`
              <div class="input-box">
                <label>Short Description</label>
                <sl-textarea
                  value=${titleField.state.value}
                  placeholder="Provide a short description for your configuration"
                  @input=${(e: Event) => {
                    const target = e.target as HTMLInputElement;
                    titleField.handleChange(target.value);
                  }}
                  >${titleField.state.value}</sl-textarea
                >
              </div>
              ${inputField}
            `;
          }
        )}
        ${this.#form.field(
          { name: 'extensionConfig.version' },
          (titleField) => {
            return html`
              <div class="input-box">
                <label>Version</label>
                <p>${titleField.state.value}</p>
              </div>
            `;
          }
        )}
        ${this.#form.field(
          { name: 'extensionConfig.configs' },
          (configsField) => {
            return html`
              <div class="input-box">
                <label>Configs</label>
                <sl-tab-group @sl-close=${this._hideTab.bind(this)}>
                  ${configsField.state.value.map((config: Config<any>) => {
                    config = new Config(
                      config.source,
                      config.value,
                      config.nameIndex,
                      config.id
                    );

                    return html`
                      <sl-tab
                        slot="nav"
                        panel=${config.id}
                        ?closable=${configsField.state.value.length > 1}
                        >${config.getConfigName()}</sl-tab
                      >

                      <sl-tab-panel name=${config.id}>
                        ${this._renderConfig(config.value)}
                      </sl-tab-panel>
                    `;
                  })}
                </sl-tab-group>
              </div>
            `;
          }
        )}
        <i>TODO: make markdown editor after you make WYSIWYG</i>

        ${this.#form.field(
          { name: 'extensionConfig.isPublished' },
          (isPublishedField) => {
            if (!isPublishedField.state.value) {
              return html`
                <div class="horizontal">
                  <sl-button
                    variant="primary"
                    type="submit"
                    @click=${() => {
                      isPublishedField.form.handleSubmit(
                        'publish' as SubmitType
                      );
                    }}
                    >Publish</sl-button
                  >
                  <sl-button
                    type="submit"
                    @click=${() => {
                      isPublishedField.form.handleSubmit(
                        'save-as-draft' as SubmitType
                      );
                    }}
                    >Save as draft</sl-button
                  >
                </div>
              `;
            }
            //  else if (isPublishedField.state.value) {

            //   return html`
            //     <div class="horizontal">
            //       <sl-button variant="primary">Save Changes</sl-button>
            //     </div>
            //   `;
            // }
          }
        )}
      </form>
    `;
  }

  render() {
    return html` ${this._renderForm()} `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'manage-config-element': ManageConfigElement;
  }
}
