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

  .extensions-list button {
    display: flex;
    padding: var(--spacingXXSmall) var(--spacing);
    justify-content: start;
    gap: var(--spacing);
    width: 100%;
    background-color: transparent;
    border: none;
  }

  .extensions-list li {
    width: 100%;
    position: relative;
  }

  .extensions-list button:hover {
    background-color: color-mix(in srgb, var(--slate-300), white 20%);
    cursor: pointer;
  }

  .extensions-list button:hover .view-hover {
    opacity: 1;
    transform: translate(25%, -50%);
  }

  .image-box {
    font-size: var(--text-2xl);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .view-hover {
    transition: all 0.2s;
    transform: translate(0, -50%);

    display: flex;
    align-items: center;
    position: absolute;
    right: 3%;
    top: 50%;
    background-color: color-mix(in srgb, var(--slate-300), white 10%);
    padding: var(--spacingXXSmall);
    border-radius: var(--borderRadius);
    color: var(--slate-500);
    opacity: 0;
  }

  .description-box {
    text-align: start;
  }

  .user-id,
  .description {
    display: block;
  }

  /* END SIDE PANEL */
`;
