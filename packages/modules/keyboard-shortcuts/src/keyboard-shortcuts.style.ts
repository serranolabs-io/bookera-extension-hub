import { css } from 'lit';

export default css`
  th,
  td {
    overflow: hidden;
    resize: horizontal;
    text-align: center;
    position: relative;
  }

  th::after,
  td::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    right: -2px;
    width: 4px;
    cursor: ew-resize;
    background: transparent;
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
    background: transparent;
  }

  table {
    width: 100%;
  }
  tbody {
  }

  th {
    padding: var(--spacingXSmall) var(--spacingSmall);
    background-color: var(--slate-200);
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

  .edit-icon {
    position: absolute;
    left: 2%;
    top: 50%;
    transform: translateY(-50%);
  }

  tbody tr:nth-child(odd) {
    background-color: var(--slate-300);
  }
  tbody tr {
    background-color: var(--slate-200);
  }

  tbody tr:hover {
    cursor: pointer;
  }

  th::-webkit-resizer,
  td::-webkit-resizer {
    visibility: visible;
  }
`;
