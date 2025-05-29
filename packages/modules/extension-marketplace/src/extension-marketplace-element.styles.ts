import { css } from 'lit';
export default css`
  /* SIDE PANEL */

  .extensions-list {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    list-style: none;
  }

  .extensions-list li {
    display: flex;
    padding: var(--spacingXXSmall);
    justify-content: space-between;
    gap: var(--spacingSmall);
  }
  .image-box {
    font-size: var(--text-2xl);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .user-id,
  .description {
    display: block;
  }

  /* END SIDE PANEL */
`;
