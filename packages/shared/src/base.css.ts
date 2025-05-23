import { css } from 'lit';

export default css`
 .focused {
    outline: 2px solid var(--slate-800);
    outline-offset: -2px;
  }

  *::-webkit-scrollbar {
    width: 6px;
  }

  /* Track */
  *::-webkit-scrollbar-track {
    background: transparent;
  }

  /* Handle */
  *::-webkit-scrollbar-thumb {
    background: var(--primary);
    border-radius: 20px;
  }
  :host {
    padding: 0;
    margin: 0;
  }
  * {
    box-sizing: border-box;
    padding: 0;
    margin: 0;
    transition: color 0.2s;
    transition: background-color 0.2s;
  }

  h2 {
    scroll-margin: 5rem;
    border-bottom-width: 1px;
    padding-bottom: 0.5rem;
    font-size: 1.875rem;
    line-height: 2.25rem;
    font-weight: 600;
    letter-spacing: -0.025em;
    text-align: center;
  }

  h3 {
    /* text-2xl */
    font-size: 1.5rem; /* 24px */
    line-height: 2; /* 48px */

    /* font-semibold */
    font-weight: 600;

    /* tracking-tight */
    letter-spacing: -0.025em;
  }

  h4 {
    font-size: 1.25rem; /* 20px */
    line-height: 1.75; /* 35px */
    color: var(--slate-700);

    font-weight: 600;

    letter-spacing: -0.025em;
  }

  h5 {
    font-size: 1rem; /* 20px */
    line-height: 1.75; /* 35px */
    color: var(--slate-600);

    font-weight: 600;

    letter-spacing: -0.025em;
  }

  h6 {
    font-size: .rem; 20px
    line-height: 1.75; /* 35px */
    color: var(--slate-500);

    font-weight: 600;

    letter-spacing: -0.025em;
  }

  .lead {
    /* text-xl */
    font-size: 1.25rem; /* 20px */
    line-height: 1.75; /* 35px */

    /* text-muted-foreground */
    color: #6b7280;
  }

  .muted {
    font-size: 0.875rem; /* 14px */
    line-height: 1.25; /* 17.5px */

    color: #6b7280;
  }

  .hovered-element {
    /* opacity: 0.75; */
    filter: brightness(1.05);
  }

  label {
    color: var(--slate-700);
  }

  p {
    line-height: 1.75rem;
    color: var(--slate-700);
  }

  .blockquote {
    /* mt-6 border-l-2 pl-6 italic */
    font-style: italic;
    border-left: 2px solid var(--slate-200);
    padding-left: calc(var(--spacingSmall) + var(--spacingXSmall));
    opacity: 0.6;
  }

  .center {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .space-between {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .flex {
    display: flex;
  }

.w-full {
  width: 100%;
}

  .vertical,
  .column {
    flex-direction: column;
  }

  .button-hundred {
    width: 100%;
  }
  .button-hundred::part(base) {
    width: 100%;
  }

  form {
    margin: 0;
  }
`;
