import baseCss from '@serranolabs.io/shared/base';
import { moduleElementStyles } from '@serranolabs.io/shared/module-element';
import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import loginElementStyles from './login-element.styles';
import { TanStackFormController } from '@tanstack/lit-form';
import { repeat } from 'lit/directives/repeat.js';
import { BookeraModuleConfig } from '@serranolabs.io/shared/module';
import { notify } from '@serranolabs.io/shared/lit';

interface LoginForm {
  email: string;
  password: string;
}

@customElement('login-element')
export class LoginElement extends LitElement {
  static styles = [baseCss, moduleElementStyles, loginElementStyles];

  #form = new TanStackFormController(this, {
    defaultValues: {
      loginForm: {
        email: '',
        password: '',
      } as LoginForm,
    },
  });
  private _config: BookeraModuleConfig;

  constructor(config: BookeraModuleConfig) {
    super();
    this._config = config;

    this._handleSupabase();
  }

  private async _handleSupabase() {
    const user = await this._config.supabase?.auth.getUser();

    if (user?.error) {
      return;
    }

    // User is logged in
  }

  @state()
  private _isSubmitting = false;

  private async _handleSignInUp() {
    const email = this.#form.api.getFieldValue('loginForm.email');
    const password = this.#form.api.getFieldValue('loginForm.password');
    const signUp = await this._config.supabase?.auth.signUp({
      email: email,
      password: password,
    });

    if (signUp?.error) {
      notify('cannot sign up ' + signUp.error, 'warning', 'exclamation-lg');

      return;
    }

    const signIn = await this._config.supabase?.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (signIn?.error?.code === 'email_not_confirmed') {
      notify('Please confirm your email!', 'primary');
      return;
    }

    this._handleSupabase();
    notify('Logged in! 📚', 'success', 'book');
  }

  private _renderLoginForm() {
    return html`
      <form
        @submit=${async (e: SubmitEvent) => {
          e.preventDefault();
          const errors = await this.#form.api.validateAllFields('submit');
          console.log(errors);
          // if (errors.length > 0) {
          //   return;
          // }

          this._isSubmitting = true;
          console.log('call', this._isSubmitting);
          await this._handleSignInUp();
          this._isSubmitting = false;
        }}
      >
        ${this.#form.field(
          {
            name: 'loginForm.email',
            validators: {
              onSubmit: ({ value }) => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                  return 'Must be of format <email>@<provider>.<domain>';
                }
                console.log('email is valid');
                return undefined;
              },
            },
          },
          emailField => {
            let inputField = html``;

            if (!emailField.state.meta.isValid) {
              inputField = html`${repeat(
                emailField.state.meta.errors,
                (__, idx) => idx,
                error => {
                  return html`<div class="red-error">${error}</div>`;
                }
              )}`;
            }

            return html`
              <div>
                <sl-input
                  placeholder="Email"
                  value=${emailField.state.value}
                  @input=${(e: Event) => {
                    const target = e.target as HTMLInputElement;
                    emailField.handleChange(target.value);
                  }}
                ></sl-input>
                ${inputField}
              </div>
            `;
          }
        )}
        ${this.#form.field(
          {
            name: 'loginForm.password',
            validators: {
              onSubmit: ({ value }) => {
                const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
                if (value.length <= 3) {
                  return 'Password must be longer than 3 characters';
                }
                if (!hasSpecialChar) {
                  return 'Password must contain at least one special character';
                }
                return undefined;
              },
            },
          },
          passwordField => {
            let errors = html``;

            if (!passwordField.state.meta.isValid) {
              errors = html`${repeat(
                passwordField.state.meta.errors,
                (__, idx) => idx,
                error => {
                  return html`<div class="red-error">${error}</div>`;
                }
              )}`;
            }

            return html`
              <sl-input
                placeholder="Password"
                type="password"
                password-toggle
                value=${passwordField.state.value}
                @input=${(e: Event) => {
                  const target = e.target as HTMLInputElement;
                  passwordField.handleChange(target.value);
                }}
              ></sl-input>
              ${errors}
            `;
          }
        )}
        <sl-button type="submit" class="full" variant="primary">Start Writing 🪶 </sl-button>
        ${this._isSubmitting ? html`<div class="loader"></div>` : ''}
      </form>
    `;
  }

  render() {
    return this._renderLoginForm();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'login-element': LoginElement;
  }
}
