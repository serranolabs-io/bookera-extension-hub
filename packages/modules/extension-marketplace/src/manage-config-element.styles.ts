import { css } from 'lit';
export default css`
  .input-box {
    display: flex;
    gap: var(--spacingSmall);
    flex-direction: vertical;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacingSmall);
  }

  form {
    padding: 0 var(--spacingLarge);
  }

  .horizontal {
    display: flex;
    gap: var(--spacingSmall);
  }
  .red {
    color: var(--sl-color-red-500);
  }

  sl-dialog .button-box {
    display: flex;
    gap: var(--spacingSmall);
    justify-content: space-around;
    align-items: center;
  }
  sl-dialog sl-button {
    width: 30%;
  }

  .success-box,
  .icon,
  .icon::part(base),
  .icon::part(input) {
    width: 96px;
    height: 96px;
    cursor: pointer;
  }

  .icon::part(form-control-help-text) {
    font-size: var(--text-xs);
    text-align: right;
  }

  .icon::part(input) {
    position: relative;
  }

  .success-box {
    border: 1px solid var(--slate-300);
    border-radius: var(--sl-input-border-radius-medium);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.25s ease-in forwards; /* Animate opacity to 1 */
    position: relative;
  }

  .success-box sl-icon {
    transition: all 0.5s;
    animation:
      fadeIn 0.6s ease-in forwards,
      jump 0.6s ease-in forwards; /* Animate opacity to 1 */
    opacity: 0;
  }

  .success-box .label {
    position: absolute;
    bottom: 2%;
    font-size: var(--text-xs);
    text-align: center;
  }

  @keyframes jump {
    from {
      transform: translateY(-50%);
    }
    to {
      transform: translateY(0%);
    }
  }
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .icon::part(input)::after {
    content: '+';
    position: absolute;
    left: 50%;
    color: var(--slate-300);
    font-size: var(--text-xl);
    /* background-color: blue; */
    /* width: 20px; */
    /* height: 20px; */
    top: 50%;
    transform: translate(-50%, -50%);
  }

  .icon::part(input)::file-selector-button {
    background: transparent;
    content: '';
    opacity: 0;
  }

  .header {
    display: flex;
    gap: var(--spacingMedium);
    justify-content: center;
    align-items: center;
  }

  .center-configs {
    display: flex;
    justify-content: center;
  }

  .description-box {
    margin-bottom: var(--spacingMedium);
  }

  .install-button {
    margin-top: var(--spacingSmall);
  }
`;
