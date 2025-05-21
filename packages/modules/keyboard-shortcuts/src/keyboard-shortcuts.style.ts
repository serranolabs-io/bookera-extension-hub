import { css } from 'lit';

export default css`
  th,
  td {
    overflow: hidden;
    resize: horizontal;
    text-align: center;
    position: relative;
    height: 100%;
  }

  .command-title {
    align-items: center;
    justify-content: space-between;
  }
  .command-title label {
    color: var(--slate-500);
  }

  .command-title small {
    color: var(--slate-400);
  }

  sl-icon-button[name='command'] {
    transition: transform 1s ease-in-out;
    transform-origin: center;
  }
  sl-icon-button[name='command']:hover {
    transform: rotate(360deg);
  }

  /* th::after,
  td::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    right: -2px;
    width: 4px;
    cursor: ew-resize;
    background: red;
  }
  th::before,
  td::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: -2px;
    width: 4px;
    cursor: ew-resize;
    background: green;
  } */

  table {
    width: 100%;
  }
  tbody {
  }

  th {
    padding: var(--spacingXSmall) var(--spacingSmall);
    background-color: var(--slate-300);
  }

  td {
    padding: var(--spacingXXSmall) var(--spacingSmall);
  }

  tbody td:hover {
  }

  tbody tr:hover td {
    background-color: var(--slate-600) !important;
    color: var(--slate-100) !important;
  }
  tbody tr:hover .keybinding {
    background-color: var(--slate-100) !important;
    color: var(--slate-800) !important;
  }

  tr {
    position: relative;
    color: var(--slate-500);
  }
  .center-v {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .keybinding {
    background-color: var(--slate-100);
    padding: var(--spacingXXSmall);
    border-radius: var(--borderRadius);
    display: flex;
  }

  .keybindings {
    display: flex;
    gap: var(--spacingXXSmall);
    align-items: center;
  }
  .keybindings p {
    margin: 0;
  }
  span {
    display: flex;
    align-items: center;
  }

  tbody tr:nth-child(odd) {
    background-color: var(--slate-200);
  }
  tbody tr {
    background-color: var(--slate-100);
  }

  tbody tr:hover {
    cursor: pointer;
  }

  th::-webkit-resizer,
  td::-webkit-resizer {
    visibility: visible;
  }

  .title-command label {
    display: block;
  }

  .daemon {
    display: flex;
    gap: var(--spacingXXSmall);
    font-size: var(--text-sm);
  }
  .daemon .keys {
    font-size: var(--text-xs);
    padding: 0;
    margin: 0;
  }

  .context {
    gap: var(--spacingXXSmall);
  }

  .label {
    color: var(--slate-400);
  }

  .context-keys {
  }

  .command-palette-menu {
    max-height: 20rem;
  }
`;
