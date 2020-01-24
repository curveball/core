import LinkHeader from 'http-link-header';
import { HeadersInterface } from './headers';

export type Link = {
  href: string,
  rel: string,

  position?: 'body' | 'header',

  anchor?: string,
  type?: string,
  hreflang?: string,
  media?: string,
};

export class LinkManager {

  private headers: HeadersInterface;
  private links: Map<string, Link[]>;

  constructor(headers: HeadersInterface) {
    this.headers = headers;
    this.links = new Map();
    this.syncFromHeaders();
  }

  get(rel: string): Link|null {

    if (!this.links.has(rel)) {
      return null;
    }
    return this.links.get(rel)![0];

  }

  getMany(rel: string): Link[] {

    return this.links.get(rel) || [];

  }

  has(rel: string): boolean {

    return this.links.has(rel);

  }

  delete(rel: string): void {

    this.links.delete(rel);
    this.syncToHeaders();

  }

  getAll(): Link[] {

    const result: Link[] = [];
    // A little bit of magic to merge all link arrays together
    return result.concat(...this.links.values());

  }

  append(rel: string, href: string, attributes?: Partial<Link>): void;
  append(link: Link): void;
  append(arg1: string|Link, href?: string, attributes?: Partial<Link>): void {

    let link: Link;
    if (typeof arg1 === 'string') {
      link = {
        rel: arg1,
        href: href!,
        ...attributes
      };
    } else {
      link = arg1;
    }

    if (this.links.has(link.rel)) {
      this.links.get(link.rel)!.push(link);
    } else {
      this.links.set(link.rel, [link]);
    }

    if (link.position === 'header') {
      this.setLinkHeader(link);
    }

  }

  private syncToHeaders(): void {

    this.headers.delete('Link');
    for (const link of this.getAll()) {
      if (link.position === 'header') {
        this.setLinkHeader(link);
      }
    }

  }

  private syncFromHeaders(): void {

    const lh = new LinkHeader();
    const linkHeader = this.headers.get('Link');
    if (!linkHeader) { return; }
    lh.parse(linkHeader);

    for (const link of lh.refs) {

      const { uri, ...linkInfo} = link;
      const realLink: Link = {
        href: uri,
        position: 'header',
        ...linkInfo
      };

      if (this.links.has(link.rel)) {
        this.links.get(link.rel)!.push(realLink);
      } else {
        this.links.set(link.rel, [realLink]);
      }

    }

  }

  private setLinkHeader(link: Link): void {

    const lh = new LinkHeader();

    const {rel, href, ...linkInfo} = link;

    lh.set({
      uri: href,
      rel: rel,
      ...(linkInfo as any),
    });
    this.headers.append(
      'Link',
      lh.toString()
    );

  }

}
