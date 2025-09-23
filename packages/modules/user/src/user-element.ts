import { customElement, state } from 'lit/decorators.js';
import userStyles from './user-element.styles';
import baseCss from '@serranolabs.io/shared/base';
import { BookeraModuleElement, moduleElementStyles } from '@serranolabs.io/shared/module-element';
import { ModuleConfig } from '@serranolabs.io/shared/module';
import { html, TemplateResult } from 'lit';
import './login-element';
import { LoginElement } from './login-element';
import { StatisticalCategory, statsCategories, Statistic } from './statistics';
import '@shoelace-style/shoelace/dist/components/tag/tag.js';

export const elementName = 'user-element';
@customElement(elementName)
export class UserElement extends BookeraModuleElement {
  static styles = [userStyles, baseCss, moduleElementStyles];

  constructor(config: ModuleConfig) {
    super(config);
  }

  @state()
  _isSigningOut: boolean = false;

  private async _signOut() {
    this._isSigningOut = true;
    const data = await this._supabase?.auth.signOut();

    if (!data?.error) {
      this._signedIn = false;
    }
    this._isSigningOut = false;
  }

  protected renderInSettings(): TemplateResult {
    return html`${this.renderTitleSection()} `;
  }

  private _renderProfileCard() {
    return html`
      <figure class="profile-card">
        <header>
          <img
            src="https://yqbpffomurjqialithlg.supabase.co/storage/v1/object/public/profile//96x96.png"
          />
          <figcaption>${this._user?.email}</figcaption>
        </header>
        <div class="description">
          <p>
            Hey everyone 👋! I am the author of The Ballad of Programata - a collection of coding
            poems.
          </p>
          <p>
            Being alive is a gift that I will never take for granted ❤️‍🔥. Thank you for coming along
            the journey with me 🥹.
          </p>
        </div>
        <div class="tag-box">
          <sl-tag variant="primary" size="small">horror</sl-tag>
          <sl-tag variant="success" size="small">fiction</sl-tag>
          <sl-tag variant="neutral" size="small">TODO</sl-tag>
          <sl-tag variant="warning" size="small">make</sl-tag>
          <sl-tag variant="danger" size="small">customizable</sl-tag>
        </div>
        <div>
          <dl>
            ${statsCategories.map((category: StatisticalCategory) => {
              return html`
                <div>
                  <h5>${category.name}</h5>
                </div>
                ${category.statistics.map((stat: Statistic) => {
                  return html`
                    <div>
                      <dt><span class="stat-icon">${stat.icon}</span>${stat.name}</dt>
                      <dd>${stat.value}</dd>
                    </div>
                  `;
                })}
              `;
            })}
          </dl>
        </div>
      </figure>
      <div class="bottom-box">
        <sl-button @click=${this._signOut.bind(this)} ?loading=${this._isSigningOut}>
          <sl-icon slot="prefix" name="box-arrow-left"> </sl-icon>

          Sign out</sl-button
        >
      </div>
    `;
  }

  private _renderUser() {
    console.log('WE ARE', this._signedIn ? 'SIGNED IN' : 'SIGNED OUT');
    if (!this._signedIn) {
      return new LoginElement({ 
        renderMode: this.renderMode, 
        module: this.module,
        supabase: this._supabase 
      });
    }

    return html`${this._renderProfileCard()}`;
  }

  protected renderInSidePanel(): TemplateResult {
    return html`${this.renderSidePanelTitleSection()}
      <div class="side-panel-content">${this._renderUser()}</div> `;
  }

  protected renderInPanel(): TemplateResult {
    return html``;
  }

  protected renderInModuleDaemon(): TemplateResult {
    return html``;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [elementName]: UserElement;
  }
}
