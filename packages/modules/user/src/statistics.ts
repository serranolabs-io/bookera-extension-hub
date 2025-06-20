export interface Statistic {
  name: string;
  value: string;
  icon: string;
}

export interface StatisticalCategory {
  name: string;
  statistics: Statistic[];
}

export const statsCategories: StatisticalCategory[] = [
  {
    name: 'Author',
    statistics: [
      {
        name: 'readers',
        icon: '📖',
        value: '3029',
      },
      {
        name: 'likes',
        value: '8068',
        icon: '👍',
      },
      {
        name: 'books',
        icon: '📚',
        value: '1',
      },
      {
        name: 'prints',
        icon: '📚',
        value: '0',
      },
    ],
  },
  {
    name: 'Writer',
    statistics: [
      {
        name: 'manuscripts',
        value: '5',
        icon: '✍️',
      },
      {
        name: 'writing minutes',
        value: '300',
        icon: '⏱️',
      },
    ],
  },
];
