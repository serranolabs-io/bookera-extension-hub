import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import baseCss from '@serranolabs.io/shared/base';
import { TanStackFormController } from '@tanstack/lit-form';
import { getUserId, getUsername, User } from '@serranolabs.io/shared/user';
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
  createPackageJsonJson,
  getPackageJsonName,
} from '@serranolabs.io/shared/extension-marketplace';
import { BookeraModuleConfig } from '@serranolabs.io/shared/module';
import { TABLES } from '@serranolabs.io/shared/supabase';
import { apiConfig, ExtensionMarketplaceModuleInstanceType } from './api';
import { notify } from '@serranolabs.io/shared/lit';
import { Bag, BagManager } from '@pb33f/saddlebag';
import { defaultExtensionConfig } from './manage-config-stateful';
import { MANAGE_CONFIG_BAG_KEY } from './extension-marketplace-element';
import { SlDialog, SlInput } from '@shoelace-style/shoelace';
import { sendEvent } from '@serranolabs.io/shared/util';
import { renderConfig, schemas } from './config-schemas';
import { DefaultApi } from './backend/apis/DefaultApi';
import { Task } from '@lit/task';
import { renderConfigs } from './render-logic';
import configSchemasStyles from './config-schemas.styles';

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
  user: new User('me', 'user.text', []),
  isPublished: false,
  icon: null,
};

type SubmitType = 'publish' | 'save-as-draft';

export const SendConfig = 'send-config';

export const MANAGE_CONFIG_CONSTRUCTED_EVENT =
  'manage-config-constructed-event';

export const ARE_YOU_SURE_DIALOG = 'are-you-sure-dialog';

@customElement('manage-config-element')
export class ManageConfigElement extends LitElement {
  static styles = [manageConfigElementStyles, baseCss, configSchemasStyles];

  private _config: BookeraModuleConfig<ExtensionMarketplaceModuleInstanceType>;

  private _listenToConfigEventListener!: Function;
  private _listenToConfigFromApiEventListener!: Function;

  @query(`#${ARE_YOU_SURE_DIALOG}`)
  private _areYouSureDialog!: SlDialog;

  private _backendApi = new DefaultApi(apiConfig);

  #form = new TanStackFormController(this, {
    defaultValues: {
      extensionConfig: defaultExtensionConfig,
    },

    onSubmit: ({ value, meta }) => {
      const handlePublish = async () => {
        const { configs, icon, ...packageJson } = value.extensionConfig;

        const { data: insertedRow, error } = await this._config.supabase
          .from(TABLES.Extension)
          .insert([
            {
              userId: getUserId(packageJson.user),
              name: getPackageJsonName(value.extensionConfig).name,
            },
          ])
          .select();

        let data,
          backendError = null;
        try {
          console.log('trying to create extension');
          data = await this._backendApi.createExtension({
            extension: {
              ...getPackageJsonName(value.extensionConfig),
              config: JSON.stringify(configs),
              userId: getUserId(packageJson.user),
              userName: getUsername(packageJson.user),
              packageJson: createPackageJsonJson(value.extensionConfig),
            },
          });
        } catch (e) {
          backendError = e;

          // for some reason it does not properly work in a try block
          try {
            await this._config.supabase
              ?.from(TABLES.Extension)
              .delete()
              .eq('id', insertedRow[0]?.id);
          } catch (e) {
            console.log(e);
          }
        }

        if (error || backendError) {
          notify(
            `Error in creating extension ${backendError ? 'error in backend, please report this to help me debug your issue <3' : error?.message}`,
            'warning',
            'exclamation-lg'
          );
          return;
        }

        if (!icon) {
          return;
        }
        const iconBlob = new Blob([await icon.arrayBuffer()], {
          type: icon.type,
        });

        let image, imageErr;
        try {
          image = this._backendApi.updateUserExtensionImage({
            userId: getUserId(packageJson.user),
            configId: insertedRow[0]?.id,
            file: iconBlob,
          });
        } catch (e) {
          imageErr = e;
        }

        console.log(image, imageErr);

        notify(
          `Succesfully created ${packageJson.title}`,
          'success',
          'check-all'
        );
      };

      switch (meta as SubmitType) {
        case 'publish':
          handlePublish();
          break;
        case 'save-as-draft':
      }
    },
  });

  private _manageConfigBag: Bag<ExtensionConfig<any>>;

  private _saveSyncedLocalForage: any;

  private _bagManager: BagManager;

  private _selectedConfig: Config<any> | null = null;

  constructor(
    config: BookeraModuleConfig<ExtensionMarketplaceModuleInstanceType>,
    manageConfigBag: Bag<ExtensionConfig<any>>,
    bagManager: BagManager,
    runSyncedFlow: (
      defaultsFunction: () => void,
      key: string
    ) => Promise<Bag<ExtensionConfig<any>>>,
    saveSyncedLocalForage: any
  ) {
    super();

    this._bagManager = bagManager;
    this._config = config;
    this._manageConfigBag = manageConfigBag;
    this._manageConfigBag.onAllChanges(this._setupExtensionConfig.bind(this));
    this._setupExtensionConfig(MANAGE_CONFIG_BAG_KEY);

    this._saveSyncedLocalForage = saveSyncedLocalForage;

    this._setupState(runSyncedFlow);
  }

  private _setupExtensionConfig(id: string) {
    const ec = this._manageConfigBag.get(id);

    if (!ec) {
      return;
    }

    this.#form.api.setFieldValue('extensionConfig', ec);
    this.requestUpdate();
  }

  async _setupState(runSyncedFlow) {
    await runSyncedFlow(this._setupDefaults.bind(this), MANAGE_CONFIG_BAG_KEY);
  }

  _setupDefaults() {
    this._manageConfigBag.set(MANAGE_CONFIG_BAG_KEY, defaultExtensionConfig);

    this._saveNewExtensionConfig();
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

  //   1. When you have only ONE config source, spread them out
  // 2. When you have more than one config source, consolidate them

  // ^ I am assuming that if there is an array being sent in, you must append it to
  // ^ the config that already exists
  private _addToPreviousConfig(
    configs: Config<any>[],
    newValue: any[]
  ): boolean {
    return configs.find((config: Config<any>) => {
      // find schema
      const schema = schemas.find((schema) => {
        const { success } = schema.safeParse(config.values);
        return success;
      });

      if (!schema) {
        return false;
      }

      // does this schema match the value
      const { success } = schema?.safeParse(newValue);

      if (!success) {
        return false;
      }

      // if so, add to previous
      config.values.push(...newValue);

      return true;
    })
      ? true
      : false;
  }

  // to determine what is the config that came in, I need to create zod interfaces...
  private _listenToConfigEvents(e: CustomEvent<SEND_CONFIG_EVENT_TYPE<any>>) {
    let configs = this.#form.api.getFieldValue('extensionConfig.configs');
    if (
      configs
        .flatMap((config: Config<any>) =>
          config.values.map((value) => value.id)
        )
        .includes(e.detail.config.id)
    ) {
      notify(
        'Hey 👋! You already have this config as part of your extension!',
        'neutral',
        'send-exclamation'
      );
      return;
    }

    if (!this._addToPreviousConfig(configs, e.detail.config.values)) {
      configs.push(e.detail.config);
    }

    this.#form.api.setFieldValue('extensionConfig.configs', configs);

    this._saveNewExtensionConfig();

    this.requestUpdate();
  }

  private _saveNewExtensionConfig() {
    const newEc = this.#form.api.getFieldValue('extensionConfig');
    this._saveSyncedLocalForage(
      this._bagManager,
      MANAGE_CONFIG_BAG_KEY,
      MANAGE_CONFIG_BAG_KEY,
      newEc
    );
  }

  removeConfig(e: CustomEvent) {
    const target = e.target as HTMLElement;

    console.log('bounded ', e);

    if (!target) {
      return;
    }

    const configs = this.#form.api.getFieldValue('extensionConfig.configs');

    // when there is only "themes" | only "shortcuts"
    if (configs.length === 1) {
      const newConfigs = configs[0].values.filter((oldConfig) => {
        return oldConfig.id !== target.id;
      });

      configs[0].values = newConfigs;

      this.#form.api.setFieldValue('extensionConfig.configs', configs);

      this._saveNewExtensionConfig();
      return;
    }

    this._areYouSureDialog.show();

    const config = configs.find((config: Config<any>) => {
      return config.id === (target as HTMLElement).id;
    })!;

    if (!config) {
      return;
    }

    this._selectedConfig = config;
    this.requestUpdate();

    e.preventDefault();
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
                <p>${titleField.state.value === '' ? '0.0.0' : ''}</p>
              </div>
            `;
          }
        )}
        ${this.#form.field({ name: 'extensionConfig.icon' }, (iconField) => {
          let inputBox = html`<div class="success-box">
            <sl-icon name="check2-all"></sl-icon>
            <span class="label"
              >${iconField.state.value?.name.length > 8
                ? iconField.state.value?.name.slice(0, 8) + '...'
                : iconField.state.value?.name}</span
            >
          </div>`;
          if (!iconField.state.value) {
            inputBox = html` <sl-input
              help-text="96x96 only"
              type="file"
              class="icon"
              @sl-change=${(e: Event) => {
                const slInput = e.target as SlInput;

                const input = slInput.shadowRoot?.querySelector(
                  'input[type="file"]'
                ) as HTMLInputElement;

                const files = input.files;

                if (files && files.length > 0) {
                  iconField.setValue(files[0]);
                }
              }}
            ></sl-input>`;
          }

          return html`
            <div class="input-box">
              <label>Icon</label>
              <div class="input-box">${inputBox}</div>
            </div>
          `;
        })}
        ${this.#form.field(
          { name: 'extensionConfig.configs' },
          (configsField) => {
            return renderConfigs.bind(this)(configsField.state.value, 'manage');
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

  private _renderDialog() {
    return html`
      <sl-dialog id=${ARE_YOU_SURE_DIALOG}>
        <p style="text-align: center">
          Are you sure you want to remove all configs from
          ${this._selectedConfig?.source.name}?
        </p>
        <div class="button-box" slot="footer">
          <sl-button
            variant="danger"
            @click=${() => {
              const configs = this.#form.api.getFieldValue(
                'extensionConfig.configs'
              );

              const newConfigs = configs.filter((oldConfig) => {
                return oldConfig.id !== this._selectedConfig?.id;
              });

              this.#form.api.setFieldValue(
                'extensionConfig.configs',
                newConfigs
              );

              this._areYouSureDialog.hide();

              this._saveNewExtensionConfig();
            }}
            >Delete</sl-button
          >
          <sl-button
            variant=""
            @click=${() => {
              this._areYouSureDialog.hide();
            }}
            >No</sl-button
          >
        </div>
      </sl-dialog>
    `;
  }

  render() {
    return html` ${this._renderDialog()} ${this._renderForm()} `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'manage-config-element': ManageConfigElement;
  }
}
