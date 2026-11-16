import { COLLECTION_ADDRESS, COLLECTION_HOURS } from "@/data/catalog";

type PageHit = { title: string; text: string; to: "/track" | "/checkout" | "/size-guide" | "/score" | "/bulk" | "/news" };
type LinkHit = { title: string; text: string; href: string };
export type ContactHit = PageHit | LinkHit;

const FACTS: ContactHit[] = [
  {
    title: "Collection",
    text: `${COLLECTION_ADDRESS}. ${COLLECTION_HOURS} Collection is free.`,
    to: "/track",
  },
  {
    title: "WhatsApp",
    text: "071 107 3723. Orders, questions and payment confirmation.",
    href: "https://wa.me/27711073723",
  },
  {
    title: "Courier Guy and Aramex",
    text: "R110 outside Bloemfontein. Free delivery only in Bloemfontein. Another courier is charged to you.",
    to: "/checkout",
  },
  {
    title: "Size guide",
    text: "Shirt, rugby, polo and jacket sizes.",
    to: "/size-guide",
  },
  {
    title: "Correct score",
    text: "R100 draw. Open in the first week and the last week of every month. This card is the Betway Premiership weekend of 27–29 November.",
    to: "/score",
  },
  {
    title: "Bulk orders",
    text: "Teams can send a list of shirts.",
    to: "/bulk",
  },
  {
    title: "Daily news",
    text: "Sport headlines and results.",
    to: "/news",
  },
];

export function contactHits(query: string) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return FACTS.filter((fact) => `${fact.title} ${fact.text}`.toLowerCase().includes(q)).slice(0, 4);
}
