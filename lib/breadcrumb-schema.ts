export interface BreadcrumbItem {
  name: string;
  url: string;
}

/** BreadcrumbList schema.org node — spread into a page's JSON-LD `@graph`.
 *  Helps Google render the Home → Town → Page trail in search results and
 *  reinforces the site's topical hierarchy to crawlers. */
export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
