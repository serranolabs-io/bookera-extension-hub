import { css } from 'lit';
export default css`
  .colors-box {
    overflow: hidden;
    height: 40rem;
    width: 100%;
    position: relative;
  }

  .dark-mode-padding {
    padding: var(--spacingSmall) 0;
  }

  .button-container {
    gap: var(--spacingXSmall);
  }

  .colors {
    gap: var(--spacingLarge);
    margin-bottom: var(--spacingSmall);

    display: none !important;
  }

  .show {
    display: flex !important;
  }

  .shade-group {
    gap: var(--spacingLarge);
  }

  .color-palette-name {
    margin: var(--spacingMedium) 0 var(--spacingSmall) 0;
  }
  .color-palette-name p {
    margin-top: var(--spacingSmall);
  }

  .color-palettes {
    flex-direction: column;
    justify-content: stretch;
    gap: var(--spacingXSmall);
    max-height: 10rem;
    overflow-y: scroll;
  }

  .color-palette-item {
    background-color: var(--slate-100);
  }

  .selected-color-palette::part(base) {
    background-color: var(--primary);
  }

  .name-color-palette {
    margin-top: var(--spacingSmall);
    margin-bottom: var(--spacingSmall);
  }
`;
