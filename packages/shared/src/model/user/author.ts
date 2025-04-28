import { genShortID } from "../util";

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
