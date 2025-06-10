import { genShortID } from '../util';

export class User {
  name: string;
  email: string;
  links: string[];
  id: string;
  constructor(name: string, email: string, links: string[], id?: string) {
    this.name = name;
    this.email = email;
    this.links = links;

    if (id) {
      this.id = id;
    } else {
      this.id = genShortID(6);
    }
  }
}

export const getUsername = (user: User): string => {
  return user.name === '' ? 'test_user' : user.name;
};

export const getUserId = (user: User) => {
  return '52307a0e-5c7f-452a-a58f-e233e626c83d';
};
