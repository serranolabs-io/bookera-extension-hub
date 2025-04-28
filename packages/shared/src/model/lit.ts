import { SlAlert } from '@shoelace-style/shoelace';

export const escapeHtml = (html: string) => {
  const div = document.createElement('div');
  const p = document.createElement('p');
  p.textContent = html;
  div.appendChild(p);
  // this is cool, this actually renders the element onto an element
  // render(this.timerTemplateResult, div)

  return div.innerHTML;
};
// Custom function to emit toast notifications
export const notify = (
  message: string,
  variant: 'primary' | 'success' | 'neutral' | 'warning' | 'danger' = 'primary',
  icon: string | null,
  duration = 6000
) => {
  if (!icon) {
    switch (variant) {
      case 'primary':
        icon = 'book';
        break;
      case 'success':
        icon = 'check2-all';
        break;
      case 'neutral':
        icon = 'info-lg';
        break;
      case 'warning':
        icon = 'exclamation-lg';
        break;
      case 'danger':
        icon = 'radioactive';
        break;
    }
  }

  const alert: SlAlert = Object.assign(document.createElement('sl-alert'), {
    variant,
    closable: true,
    duration: duration,
    innerHTML: `
				<sl-icon name="${icon}" slot="icon"></sl-icon>
				${escapeHtml(message)}
			`,
  });

  document.body.append(alert);

  return alert.toast();
};
