import { css } from 'lit';

export default css`
  .col {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }

  .cols {
    display: flex;
    gap: var(--spacingSmall);
  }

  .palette {
    margin-bottom: var(--spacingSmall);
  }
`;
