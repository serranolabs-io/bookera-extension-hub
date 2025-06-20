import { css } from 'lit';
export default css`
  :host {
    display: block;
    height: inherit;
  }
  /* 
SIDE PANEL
*/
  .side-panel-content {
    padding: 0 var(--spacingSmall);
  }

  .side-panel,
  .side-panel-content {
    height: 100%;
  }

  .profile-card {
    display: flex;
    flex-direction: column;
  }

  .bottom-box {
    margin-top: auto;
    /* display: flex;
    align-items: end;
    flex-direction: column;
    justify-content: end; */
    position: absolute;
    bottom: 25px;
    left: 0;
    padding: var(--spacingSmall) var(--spacingMedium);
  }

  .description p {
    font-size: var(--text-sm);
    text-align: center;
    /* margin: 0; */
  }
  .description {
    max-height: 10rem;
    overflow-y: scroll;
    margin-bottom: var(--spacingSmall);
  }

  .bottom-box,
  .bottom-box sl-button,
  .bottom-box sl-button::part(button) {
    width: 100%;
  }

  .profile-card header {
    /* background-color: ; */
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    padding: var(--spacing) var(--spacingXXSmall);
    gap: var(--spacing);
  }

  .profile-card img {
    border-radius: 50%;
    background-color: var(--slate-500);
    --size: 75px;
    width: var(--size);
    height: var(--size);
  }

  /* .profile-card dt {
    display: inline;
    margin-right: auto;
  }
  .profile-card dd {
    display: inline;
    margin-left: auto;
  } */

  dl {
    display: flex;
    flex-direction: column;
    gap: var(--spacingXXSmall);
    padding: 0 var(--spacingSmall);
  }

  .tag-box {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacingXXSmall);
    justify-content: center;
    margin-bottom: var(--spacingMedium);
  }

  .stat-icon {
    margin-right: 6px;
  }

  dl div {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacingXSmall);
  }

  dl dt,
  dd {
    /* flex-basis: 50%; */
    display: inline;
  }

  dt {
    text-align: left;
    margin: 0;
    font-weight: bold;
  }

  dd {
    text-align: right;
    margin: 0; /* Removes default margin */
  }

  .side-panel-content {
  }

  /* 
END SIDE PANEL
*/
  /* 
PANEL
*/
  /* 
END PANEL
*/
  /* 
MODULE
*/
  /* 
END MODULE
*/
  /* 
DAEMON
*/
  /* 
END DAEMON
*/
`;
