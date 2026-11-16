export type RugbySeed = {
  slug: string;
  name: string;
  team: string;
  blurb: string;
  season: string;
  images: string[];
};

export const RUGBY_SEEDS: RugbySeed[] = [
  { slug: "springboks-green", name: "Springboks jersey, green", team: "Springboks", blurb: "Green Springboks jersey. Forever green, forever gold, with the FNB mark.", season: "", images: ["springboks-green.jpg", "springboks-green-2.jpg"] },
  { slug: "springboks-white", name: "Springboks jersey, white", team: "Springboks", blurb: "White Springboks jersey with the FNB mark.", season: "", images: ["springboks-white.jpg", "springboks-white-2.jpg", "springboks-white-3.jpg"] },
  { slug: "all-blacks-ineos", name: "All Blacks jersey, INEOS", team: "All Blacks", blurb: "Black All Blacks jersey with the silver INEOS mark.", season: "", images: ["all-blacks-ineos.jpg"] },
  { slug: "all-blacks-altrad-polo", name: "All Blacks polo, Altrad", team: "All Blacks", blurb: "Black All Blacks polo with the Altrad mark.", season: "", images: ["all-blacks-altrad-polo.jpg"] },
  { slug: "all-blacks-2003", name: "All Blacks jersey, 2003–04", team: "All Blacks", blurb: "Black All Blacks jersey from 2003–04.", season: "03/04", images: ["all-blacks-2003.jpg"] },
  { slug: "all-blacks-aig", name: "All Blacks jersey, AIG", team: "All Blacks", blurb: "Black All Blacks jersey with orange shoulder stripes and the AIG mark.", season: "", images: ["all-blacks-aig.jpg"] },
  { slug: "all-blacks-sevens", name: "All Blacks Sevens jersey", team: "All Blacks Sevens", blurb: "All Blacks Sevens jersey with the AIG mark.", season: "", images: ["all-blacks-sevens.jpg"] },
  { slug: "aotearoa-polo", name: "Aotearoa New Zealand polo", team: "Aotearoa", blurb: "Black Aotearoa New Zealand polo with the silver fern.", season: "", images: ["aotearoa-polo.jpg"] },
  { slug: "new-zealand-maori", name: "New Zealand Maori jersey", team: "New Zealand Maori", blurb: "New Zealand Maori jersey, 100 years of Maori rugby.", season: "", images: ["new-zealand-maori.jpg"] },
  { slug: "maori-all-blacks-polo", name: "Maori All Blacks polo", team: "Maori All Blacks", blurb: "Black Maori All Blacks polo with the Altrad mark.", season: "", images: ["maori-all-blacks-polo.jpg"] },
  { slug: "wallabies-rwc-2023-white", name: "Wallabies jersey, Rugby World Cup 2023", team: "Wallabies", blurb: "White Wallabies jersey from Rugby World Cup 2023.", season: "23/24", images: ["wallabies-rwc-2023-white.jpg"] },
  { slug: "wallabies-cadbury", name: "Wallabies jersey, Cadbury", team: "Wallabies", blurb: "Gold Wallabies jersey with the Cadbury mark.", season: "", images: ["wallabies-cadbury.jpg"] },
  { slug: "wallabies-rwc-2023-gold", name: "Wallabies jersey, gold, Rugby World Cup 2023", team: "Wallabies", blurb: "Gold Wallabies jersey from Rugby World Cup 2023.", season: "23/24", images: ["wallabies-rwc-2023-gold.jpg"] },
  { slug: "france-rwc-2023-navy", name: "France polo, Rugby World Cup 2023", team: "France", blurb: "Navy France rugby polo from Rugby World Cup 2023.", season: "23/24", images: ["france-rwc-2023-navy.jpg"] },
  { slug: "france-altrad-white", name: "France jersey, white", team: "France", blurb: "White France jersey with the Altrad mark.", season: "", images: ["france-altrad-white.jpg"] },
  { slug: "france-rwc-2023-white", name: "France polo, white, Rugby World Cup 2023", team: "France", blurb: "White France rugby polo from Rugby World Cup 2023.", season: "23/24", images: ["france-rwc-2023-white.jpg"] },
  { slug: "france-altrad-blue", name: "France jersey, blue", team: "France", blurb: "Blue France jersey with the Altrad mark.", season: "", images: ["france-altrad-blue.jpg"] },
  { slug: "ireland-vodafone-green", name: "Ireland jersey, green", team: "Ireland", blurb: "Green Ireland jersey with the Vodafone mark.", season: "", images: ["ireland-vodafone-green.jpg"] },
  { slug: "ireland-rwc-2023-green", name: "Ireland jersey, Rugby World Cup 2023", team: "Ireland", blurb: "Green Ireland jersey from Rugby World Cup 2023.", season: "23/24", images: ["ireland-rwc-2023-green.jpg"] },
  { slug: "ireland-rwc-2023-white", name: "Ireland jersey, white, Rugby World Cup 2023", team: "Ireland", blurb: "White Ireland jersey from Rugby World Cup 2023.", season: "23/24", images: ["ireland-rwc-2023-white.jpg"] },
  { slug: "ireland-vodafone-away", name: "Ireland jersey, away", team: "Ireland", blurb: "White and teal Ireland jersey with the Vodafone mark.", season: "", images: ["ireland-vodafone-away.jpg"] },
  { slug: "springboks-england-2019", name: "Springboks jersey, 2019 final", team: "Springboks", blurb: "Springboks jersey for the 2019 Rugby World Cup final, 32–12.", season: "19/20", images: ["springboks-england-2019.jpg", "springboks-england-2019-2.jpg"] },
  { slug: "springboks-chevron", name: "Springboks tee, chevron", team: "Springboks", blurb: "White Springboks tee with the green chevron.", season: "", images: ["springboks-chevron.jpg", "springboks-chevron-2.jpg"] },
  { slug: "springboks-mtn-white", name: "Springboks jersey, white, MTN", team: "Springboks", blurb: "White Springboks jersey with teal cuffs and the MTN mark.", season: "", images: ["springboks-mtn-white.jpg"] },
  { slug: "springboks-aotearoa", name: "Springboks and Aotearoa jersey", team: "Springboks", blurb: "Split Springboks and Aotearoa jersey.", season: "", images: ["springboks-aotearoa.jpg", "springboks-aotearoa-2.jpg"] },
  { slug: "springboks-mtn-teal", name: "Springboks jersey, teal", team: "Springboks", blurb: "Teal Springboks jersey with the MTN mark.", season: "", images: ["springboks-mtn-teal.jpg"] },
  { slug: "springboks-champions", name: "Springboks champions jersey", team: "Springboks", blurb: "Springboks champions jersey, 1995, 2007, 2019 and 2023.", season: "", images: ["springboks-champions.jpg", "springboks-champions-2.jpg"] },
  { slug: "springboks-mtn-polo", name: "Springboks polo, MTN", team: "Springboks", blurb: "Green Springboks polo with the MTN mark.", season: "", images: ["springboks-mtn-polo.jpg"] },
  { slug: "wales-green", name: "Wales jersey, green", team: "Wales", blurb: "Green Wales jersey.", season: "", images: ["wales-green.jpg"] },
  { slug: "wales-vodafone", name: "Wales polo, Vodafone", team: "Wales", blurb: "Red Wales polo with the Vodafone mark.", season: "", images: ["wales-vodafone.jpg"] },
  { slug: "springboks-world-champions-tee", name: "Springboks world champions tee", team: "Springboks", blurb: "White Springboks world champions tee.", season: "", images: ["springboks-world-champions-tee.jpg"] },
];
