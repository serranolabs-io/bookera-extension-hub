import { styleMap } from 'lit/directives/style-map.js';

function convertNumberMonthToStringMonth(month: number) {
  switch (month) {
    case 1:
      return 'Jan';
    case 2:
      return 'Feb';
    case 3:
      return 'Mar';
    case 4:
      return 'Apr';
    case 5:
      return 'May';
    case 6:
      return 'Jun';
    case 7:
      return 'Jul';
    case 8:
      return 'Aug';
    case 9:
      return 'Sep';
    case 10:
      return 'Oct';
    case 11:
      return 'Nov';
    case 12:
      return 'Dec';
  }
}

export function formatDate(date: Date) {
  date = new Date(date) as Date;

  const month = date.getMonth() + 1,
    day = '' + date.getDate(),
    hour = '' + date.getHours(),
    minute = '' + date.getMinutes();

  return `${convertNumberMonthToStringMonth(month)} ${day} ${hour}:${minute}`;
}

/**
 * Reorders an array of objects based on a specified field and a new order array.
 *
 * @template T - The type of the objects in the array.
 * @param {T[]} changeArray - The array of objects to be reordered.
 * @param {number[]} newOrderArray - An array of values representing the new order.
 * @param {keyof T} fieldToLookFor - The key in the objects to match against the values in `newOrderArray`.
 * @returns {T[]} A new array of objects reordered based on the `newOrderArray`.
 *
 * @example
 * const items = [
 *   { id: 1, name: 'Item 1' },
 *   { id: 2, name: 'Item 2' },
 *   { id: 3, name: 'Item 3' }
 * ];
 * const newOrder = [3, 1, 2];
 * const reordered = changeArrayOrderBasedOnField(items, newOrder, 'id');
 * console.log(reordered);
 * // Output:
 * // [
 * //   { id: 3, name: 'Item 3' },
 * //   { id: 1, name: 'Item 1' },
 * //   { id: 2, name: 'Item 2' }
 * // ]
 */
export const changeArrayOrderBasedOnField = <T>(
  changeArray: T[],
  newOrderArray: number[],
  fieldToLookFor: keyof T
): T[] => {
  const newArray: T[] = [];

  newOrderArray.forEach((item) => {
    const el = changeArray.find((element) => {
      return element[fieldToLookFor] === item;
    });

    if (el) {
      newArray.push(el);
    }
  });

  return newArray;
};

export const changeArrayOrderBasedOnOrder = <T extends { index: number }>(
  changeArray: T[],
  orders: number[]
): T[] => {
  changeArray = changeArray.map((item, i) => {
    return {
      ...item,
      index: orders[i],
    };
  });

  changeArray.sort(function (a, b) {
    return a.index - b.index;
  });

  return changeArray;
};

export const acceptedImageTypes = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.webp',
];

export const dashedCase = (item: string): string => {
  return item.replaceAll(' ', '-').toLowerCase();
};

export const doesClickContainElement = <T = HTMLElement>(
  event: Event,
  config: {
    nodeName?: string;
    className?: string;
  }
): T | null => {
  if (config.className) {
    config.className =
      config.className[0] === '.' ? config.className : `.${config.className}`;
  }

  const target = event.target as HTMLElement;

  if (
    config.className &&
    (target?.classList.contains(config?.className) ||
      target?.nodeName === config?.nodeName)
  ) {
    return target as T;
  }

  if (config.nodeName && target.closest(config?.nodeName)) {
    return target.closest(config?.nodeName) as T;
  }

  if (config.className && target.closest(config?.className)) {
    return target.closest(config?.className) as T;
  }

  return null;
};

export function sendGlobalEvent<T>(eventName: string, detail?: T) {
  sendEvent(document, eventName, detail);
}

export function sendEvent<T>(
  element: Element | Document,
  eventName: string,
  detail?: T
) {
  element.dispatchEvent(
    new CustomEvent<T>(eventName, {
      composed: true,
      bubbles: true,
      detail: detail,
    })
  );
}

export const addStyles = (styles: Record<string, string>) => {
  return styleMap(styles);
};

export function genUUID(): string {
  let uuid: string = '',
    i: number,
    random: number;
  for (i = 0; i < 32; i++) {
    random = (Math.random() * 16) | 0;
    if (i === 8 || i === 12 || i === 16 || i === 20) {
      uuid += '-';
    }
    uuid += (i === 12 ? 4 : i === 16 ? (random & 3) | 8 : random).toString(16);
  }
  return uuid;
}

// taken from pb33f, a true hacker
export function genShortID(length: number): string {
  function randomString(length: number, chars: string) {
    let result = '';
    for (let i = length; i > 0; --i)
      result += chars[Math.floor(Math.random() * chars.length)];
    return result;
  }
  return randomString(
    length,
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  );
}

export const BOOKERA_STUDIO: string = 'Studio';
export const MANUSCRIPT: string =
  '/' + BOOKERA_STUDIO.toLocaleLowerCase() + '/manuscript';

export const BACK_TO_STUDIO: string = '<- Studio';

export const productItems: string[] = ['Catalog', BOOKERA_STUDIO];

export const StudioProductItems: string[] = [BACK_TO_STUDIO];

export const companyItems: string[] = [
  // "Docs",
  // "Company"
];

export const titleCase = (item: string | string[]): string => {
  if (typeof item === 'string') {
    return item.split(/(?=[A-Z])/).join(' ');
  }
  return item
    .map((char) => char.charAt(0).toUpperCase() + char.slice(1))
    .join(' ');
};

export const joinedTitleCase = (item: string) => {
  return item.split(' ').join('');
};

export const routes: string[] = [
  ...productItems.map((item) => dashedCase(item)),
  ...companyItems.map((item) => dashedCase(item)),
];

export const navSize: number = 85;

export function swapBasedOnKey<T extends Record<string, unknown>, V>(
  array: T[],
  property: string,
  value: V,
  value2: V
) {
  let pos1 = -1;
  let pos2 = -1;
  for (let i = 0; i < array.length; i++) {
    if (array[i]![property] === value) {
      pos1 = i;
    }

    if (array[i]![property] === value2) {
      pos2 = i;
    }
  }

  array[pos1], (array[pos2] = array[pos2]!), array[pos1];

  return array;
}

export const MANUSCRIPT_ELEMENT_SELECTOR = 'manuscript-element';
