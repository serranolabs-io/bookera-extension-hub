import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
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
import { schemas, schemaSendActions } from './config-schemas';
import { DefaultApi } from './backend/apis/DefaultApi';
import { renderConfigs } from './render-logic';
import configSchemasStyles from './config-schemas.styles';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { PUBLISH_CONFIG_CONSTRUCTED_EVENT } from './publish-config-element';
import { renderImageBox } from './utils';
import { Extension } from './backend';

const randomConfigs: Config[] = [
  new Config({ name: 'Themes', link: 'https://' }, {}, 'name', '1'),
];

const mockData: ExtensionConfig & Extension = {
  version: '0.0.0',
  title: 'Title of your config',
  description: 'LOLOLOLO',
  configs: randomConfigs as Config[],
  isPublished: false,
  icon: null,
  hasIcon: false,
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

  @state()
  private _isSubmitting: boolean = false;

  form = new TanStackFormController(this, {
    defaultValues: {
      extensionConfig: structuredClone(defaultExtensionConfig),
    },

    onSubmit: async ({ value, meta }) => {
      const handlePublish = async (isPublished: boolean) => {
        value.extensionConfig.isPublished = isPublished;
        const { configs, icon, ...packageJson } = value.extensionConfig;

        let insertedRow, err;
        // making new one
        if (this._config.instanceType === 'render-config') {
          const { data, error } = await this._config.supabase
            .from(TABLES.Extension)
            .insert([
              {
                userId: getUserId(this._user),
                name: getPackageJsonName(value.extensionConfig).name,
                isPublished: packageJson.isPublished,
              },
            ])
            .select();
          insertedRow = data;
          err = error;
          // from draft state
        } else {
          const { error } = await this._config.supabase
            .from(TABLES.Extension)
            .update([
              {
                isPublished: packageJson.isPublished,
              },
            ])
            .eq('id', value.extensionConfig.id);

          err = error;
        }

        let data,
          backendError = null;
        try {
          data = await this._backendApi.createExtension({
            extension: {
              ...getPackageJsonName(value.extensionConfig),
              config: JSON.stringify(configs),
              userId: getUserId(this._user),
              userName: getUsername(this._user),
              packageJson: createPackageJsonJson(
                value.extensionConfig,
                this._user
              ),
            },
          });
        } catch (e) {
          backendError = e;

          // for some reason it does not properly work in a try block
          // ! wtf is 'it'
          try {
            await this._config.supabase
              ?.from(TABLES.Extension)
              .delete()
              .eq('id', insertedRow[0]?.id);
          } catch (e) {
            console.log(e);
          }
        }

        if (err || backendError) {
          notify(
            `Error in creating extension ${backendError ? 'error in backend, please report this to help me debug your issue <3' : err?.message}`,
            'warning',
            'exclamation-lg'
          );
          return;
        } else {
          notify(`Success`, 'success', 'check-all');
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
            configId: insertedRow[0]?.id,
            file: iconBlob,
          });
        } catch (e) {
          imageErr = e;
        }
        if (imageErr) {
          notify('error in updating image');
          console.error(imageErr);
        }
      };

      this._isSubmitting = true;
      switch (meta as SubmitType) {
        case 'publish':
          await handlePublish(true);

          if (this._config.instanceType === 'render-config') {
            this._config.instanceType = 'published-config';
          }
          break;
        case 'save-as-draft':
          await handlePublish(false);
      }
      this._isSubmitting = false;
    },
  });

  private _manageConfigBag: Bag<ExtensionConfig>;

  private _hasIcon: boolean = false;

  private _saveSyncedLocalForage: any;

  private _bagManager: BagManager;

  @state()
  private _isDownloading: boolean = false;

  private _selectedConfig: Config | null = null;

  private _user: SupabaseUser;

  protected firstUpdated(_changedProperties: PropertyValues): void {
    sendEvent(this, MANAGE_CONFIG_CONSTRUCTED_EVENT);
  }

  constructor(
    config: BookeraModuleConfig<ExtensionMarketplaceModuleInstanceType>,
    manageConfigBag: Bag<ExtensionConfig>,
    bagManager: BagManager,
    runLocalFlow: (
      defaultsFunction: () => void,
      key: string
    ) => Promise<Bag<ExtensionConfig>>,
    saveSyncedLocalForage: any,
    user: SupabaseUser
  ) {
    super();

    this._user = user;
    this._bagManager = bagManager;
    this._config = config;
    this._manageConfigBag = manageConfigBag;
    this._manageConfigBag.onAllChanges(this._setupExtensionConfig.bind(this));
    this._manageConfigBag.onPopulated(this._onPopulated.bind(this));
    this._saveSyncedLocalForage = saveSyncedLocalForage;
    this._setupState(runLocalFlow);

    this.form.api.reset();
  }

  private _onPopulated() {
    this._setupExtensionConfig(MANAGE_CONFIG_BAG_KEY);
  }

  private _setupExtensionConfig(id: string) {
    const ec = this._manageConfigBag.get(id);

    if (!ec) {
      return;
    }

    this._hasIcon = ec.hasIcon;

    this.form.api.setFieldValue('extensionConfig', ec);
    this.requestUpdate();
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
    this._removeEventListeners();
    this.form.api.reset();
  }

  private _removeEventListeners() {
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
  }

  async _setupState(
    runLocalFlow: (
      defaultsFunction: () => void
    ) => Promise<Bag<ExtensionConfig>>
  ) {
    await runLocalFlow(this._setupDefaults.bind(this));
  }

  _setupDefaults() {
    if (this._getViewState() || this._config.instanceType === 'render-config')
      return;

    this._manageConfigBag.set(MANAGE_CONFIG_BAG_KEY, defaultExtensionConfig);

    this._saveNewExtensionConfig();
  }

  // ^ I am assuming that if there is an array being sent in, you must append it to
  // ^ the config that already exists
  private _addToPreviousConfig(configs: Config[], newValue: any[]): boolean {
    return configs.find((config: Config) => {
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

  private _startViewFlow(
    config: (ExtensionConfig & Extension) | Config
  ): boolean {
    if (!('configs' in config)) {
      return false;
    }

    if (!Array.isArray(config.configs)) {
      config.configs = JSON.parse(config.configs);
    }

    this.form.api.setFieldValue('extensionConfig', config);

    this.requestUpdate();
    this._saveNewExtensionConfig();
    return true;
  }

  private _startEditFlow(config: ExtensionConfig & Extension) {
    let configs = this.form.api.getFieldValue('extensionConfig.configs');
    if (
      configs
        .flatMap((config: Config) => config.values.map((value) => value.id))
        .includes(config.id)
    ) {
      notify(
        'Hey 👋! You already have this config as part of your extension!',
        'neutral',
        'send-exclamation'
      );
      return;
    }

    if (!this._addToPreviousConfig(configs, config.values)) {
      configs.push(config);
    }

    this.form.api.setFieldValue('extensionConfig.configs', configs);

    this._saveNewExtensionConfig();

    this.requestUpdate();
  }

  // to determine what is the config that came in, I need to create zod interfaces...
  private _listenToConfigEvents(e: CustomEvent<SEND_CONFIG_EVENT_TYPE<any>>) {
    console.log(e.detail.config);
    const isDownloadedFlow = this._startViewFlow(e.detail.config);

    if (isDownloadedFlow) {
      return;
    }

    this._startEditFlow(e.detail.config);
  }

  private _saveNewExtensionConfig() {
    const newEc = this.form.api.getFieldValue('extensionConfig');
    this._saveSyncedLocalForage(MANAGE_CONFIG_BAG_KEY, newEc);
  }

  removeConfig(e: CustomEvent) {
    const target = e.target as HTMLElement;

    if (!target) {
      return;
    }

    const configs = this.form.api.getFieldValue('extensionConfig.configs');

    if (configs.length === 1) {
      const newConfigs = configs[0].values.filter((oldConfig) => {
        return oldConfig.id !== target.id;
      });

      configs[0].values = newConfigs;

      this.form.api.setFieldValue('extensionConfig.configs', configs);

      this._saveNewExtensionConfig();
      return;
    }

    this._areYouSureDialog.show();

    const config = configs.find((config: Config) => {
      return config.id === (target as HTMLElement).id;
    })!;

    if (!config) {
      return;
    }

    this._selectedConfig = config;
    this.requestUpdate();

    e.preventDefault();
  }

  private _renderVersionField() {
    return html`${this.form.field(
      { name: 'extensionConfig.version' },
      (titleField) => {
        return html`
          <span class="version-field"
            >${titleField.state.value === '' ? '0.0.0' : ''}</span
          >
        `;
      }
    )}`;
  }

  _getViewState() {
    if (this._config.instanceType !== 'render-config') {
      return true;
    }
    return false;
  }

  _getExtensionFromSidePanelState() {
    if (this._config.instanceType !== 'render-config') {
      return true;
    }
    return false;
  }

  _renderIconBox() {
    if (
      this._config.instanceType === 'my-extension' ||
      (this._hasIcon && this._config.instanceType === 'render-config')
    ) {
      return html`
        <sl-tooltip content="Can't edit :(. im a one man team">
          ${renderImageBox(
            this.form.api.getFieldValue('extensionConfig'),
            '96',
            this._hasIcon
          )}
          <sl-tooltip> </sl-tooltip
        ></sl-tooltip>
      `;
    }

    return html`
      <div class="icon-box">
        ${this.form.field({ name: 'extensionConfig.icon' }, (iconField) => {
          if (this._getViewState()) {
            return html`
              ${renderImageBox(
                this.form.api.getFieldValue('extensionConfig'),
                '96',
                this._hasIcon
              )}
            `;
          }

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
              <div class="input-box">${inputBox}</div>
            </div>
          `;
        })}
      </div>
    `;
  }

  private _renderForm() {
    return html`
      <form
        @submit=${(e: SubmitEvent) => {
          e.preventDefault();
        }}
      >
        <div class="header">
          ${this._renderIconBox()}
          <div class="description-box">
            ${this.form.field(
              {
                name: 'extensionConfig.title',
                validators: {
                  onSubmit: ({ value }) => {
                    return value.length === 0 ? 'Not long enough' : undefined;
                  },
                },
              },
              (titleField) => {
                if (this._getViewState()) {
                  return html`
                    <div class="title-version">
                      <h4>${titleField.state.value}</h4>
                      ${this._renderVersionField()}
                    </div>
                  `;
                }

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

                const ec = this.form.api.getFieldValue('extensionConfig');
                // the saved ec has a number for an id
                let isSaved = false;
                if (!isNaN(Number(ec.id))) {
                  isSaved = true;
                }

                return html`
                  <div class="input-box">
                    <sl-tooltip content="Cannot change title after saving" 
                      ?disabled=${!isSaved}
                    >
                      <sl-input
                      value=${titleField.state.value}
                      ?disabled=${isSaved}
                      placeholder="fun-extension"
                      @input=${(e: Event) => {
                        const target = e.target as HTMLInputElement;
                        titleField.handleChange(target.value);
                        this._saveNewExtensionConfig();
                      }}
                    ></sl-input>
                    <sl-tooltip>
                    ${inputField}
                  </div>
                `;
              }
            )}
            ${this.form.field(
              {
                name: 'extensionConfig.description',
                validators: {
                  onSubmit: ({ value }) => {
                    return value.length === 0 ? 'Not long enough' : undefined;
                  },
                },
              },
              (titleField) => {
                if (this._getViewState()) {
                  return html`<div><p>${titleField.state.value}</p></div>`;
                }

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
                    <sl-textarea
                      value=${titleField.state.value}
                      placeholder="Provide a short description for your configuration"
                      @input=${(e: Event) => {
                        const target = e.target as HTMLInputElement;
                        titleField.handleChange(target.value);
                        this._saveNewExtensionConfig();
                      }}
                      >${titleField.state.value}</sl-textarea
                    >
                  </div>
                  ${inputField}
                `;
              }
            )}
          </div>
        </div>
        ${this.form.field(
          { name: 'extensionConfig.configs' },
          (configsField) => {
            const getConfigsState = () => {
              if (this._getViewState()) {
                return 'publish';
              }

              return 'manage';
            };
            return renderConfigs.bind(this)(
              configsField.state.value,
              getConfigsState()
            );
          }
        )}
        <i class="red">TODO: make markdown editor after you make WYSIWYG</i>

        ${this.form.field(
          { name: 'extensionConfig.isPublished' },
          (isPublishedField) => {
            if (this._getViewState()) {
              if (this._config.instanceType === 'my-extension') {
                return html`<i>No actions available yet</i>`;
                // return html`
                //   <sl-button
                //     size="small"
                //     variant="primary"
                //     class="install-button"
                //     @click=${this._downloadExtension.bind(this)}
                //     >Edit</sl-button
                //   >
                // `;
              }

              return html`
                <sl-button
                  size="small"
                  variant="primary"
                  class="install-button"
                  ?loading=${this._isDownloading}
                  @click=${this._downloadExtension.bind(this)}
                  >download</sl-button
                >
              `;
            }

            if (this._user) {
              return html`
                <div class="horizontal">
                  <sl-tooltip
                    content="Add a config to publish!"
                    ?disabled=${!this._disablePublishButton()}
                  >
                    <sl-button
                      variant="primary"
                      type="submit"
                      ?loading=${this._isSubmitting}
                      ?disabled=${this._disablePublishButton()}
                      @click=${() => {
                        isPublishedField.form.handleSubmit(
                          'publish' as SubmitType
                        );
                      }}
                      >Publish</sl-button
                    >
                  </sl-tooltip>
                  <sl-button
                    type="submit"
                    ?loading=${this._isSubmitting}
                    @click=${() => {
                      isPublishedField.form.handleSubmit(
                        'save-as-draft' as SubmitType
                      );
                    }}
                    >Save</sl-button
                  >
                </div>
              `;
            }

            return html` <p>Must be signed in to create an extension!</p> `;
          }
        )}
      </form>
    `;
  }

  private _disablePublishButton = (): boolean => {
    const configs = this.form.api.getFieldValue('extensionConfig.configs');

    return configs.length === 0 ? true : false;
  };
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
              const configs = this.form.api.getFieldValue(
                'extensionConfig.configs'
              );

              const newConfigs = configs.filter((oldConfig) => {
                return oldConfig.id !== this._selectedConfig?.id;
              });

              this.form.api.setFieldValue(
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

  async _downloadExtension() {
    this._isDownloading = true;
    const extension = this.form.api.getFieldValue('extensionConfig');

    const { error } = await this._config.supabase
      .from(TABLES.DownloadedExtension)
      .insert([{ extensionId: extension.id }]);

    extension.configs.forEach((config: Config) => {
      const sendAction = schemaSendActions.find((sa) => {
        const { success } = sa.schema.safeParse(config.values[0]);
        return success;
      });

      if (!sendAction) {
        notify('could not download extension :(', 'warning');
        return;
      }

      if (error) {
        notify(':( Failed to download extension', 'warning');
        return;
      }

      sendAction.action(config);
      this._isDownloading = false;
      notify('downloaded!', 'success', 'check-all');

      extension.isDownloaded = true;
      this._saveNewExtensionConfig();
    });
  }

  render() {
    switch (
      this._config.instanceType as ExtensionMarketplaceModuleInstanceType
    ) {
      case 'render-config':
      case 'published-config':
      case 'my-extension':
      case 'render-config':
        return html` ${this._renderDialog()} ${this._renderForm()} `;
        return;
      default:
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'manage-config-element': ManageConfigElement;
  }
}
