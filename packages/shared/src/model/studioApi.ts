import { TemplateResult } from 'lit';

export const SHOW_BOTTOM_DRAWER_EVENT = 'show-bottom-drawer-event';
export interface ShowBottomDrawerType {
  type: string;
}

export const APPEND_HTML_TO_BOTTOM_DRAWER = 'append-html-drawer-event';
export interface AppendBottomDrawerType extends ShowBottomDrawerType {
  insertedHtml: TemplateResult;
}
