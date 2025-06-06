import { css } from 'lit';
export default css`
  .input-box {
    display: flex;
    gap: var(--spacingSmall);
    flex-direction: vertical;
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
`;
