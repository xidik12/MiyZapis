/**
 * Programmatic SEO city definitions.
 * Each entry enables /services/<serviceSlug>/<citySlug> landing pages.
 * Add entries here — the ServiceLandingPage component picks them up automatically.
 */

import type { SeoCity } from './seo.types';

export const CITIES: SeoCity[] = [
  {
    slug: 'kyiv',
    name: { uk: 'Київ', ru: 'Киев', en: 'Kyiv' },
    locative: { uk: 'у Києві', ru: 'в Киеве', en: 'in Kyiv' },
    region: { uk: 'Київська область', ru: 'Киевская область', en: 'Kyiv Oblast' },
  },
  {
    slug: 'kharkiv',
    name: { uk: 'Харків', ru: 'Харьков', en: 'Kharkiv' },
    locative: { uk: 'у Харкові', ru: 'в Харькове', en: 'in Kharkiv' },
    region: { uk: 'Харківська область', ru: 'Харьковская область', en: 'Kharkiv Oblast' },
  },
  {
    slug: 'odesa',
    name: { uk: 'Одеса', ru: 'Одесса', en: 'Odesa' },
    locative: { uk: 'в Одесі', ru: 'в Одессе', en: 'in Odesa' },
    region: { uk: 'Одеська область', ru: 'Одесская область', en: 'Odesa Oblast' },
  },
  {
    slug: 'dnipro',
    name: { uk: 'Дніпро', ru: 'Днепр', en: 'Dnipro' },
    locative: { uk: 'у Дніпрі', ru: 'в Днепре', en: 'in Dnipro' },
    region: { uk: 'Дніпропетровська область', ru: 'Днепропетровская область', en: 'Dnipropetrovsk Oblast' },
  },
  {
    slug: 'lviv',
    name: { uk: 'Львів', ru: 'Львов', en: 'Lviv' },
    locative: { uk: 'у Львові', ru: 'во Львове', en: 'in Lviv' },
    region: { uk: 'Львівська область', ru: 'Львовская область', en: 'Lviv Oblast' },
  },
  {
    slug: 'zaporizhzhia',
    name: { uk: 'Запоріжжя', ru: 'Запорожье', en: 'Zaporizhzhia' },
    locative: { uk: 'у Запоріжжі', ru: 'в Запорожье', en: 'in Zaporizhzhia' },
    region: { uk: 'Запорізька область', ru: 'Запорожская область', en: 'Zaporizhzhia Oblast' },
  },
  {
    slug: 'vinnytsia',
    name: { uk: 'Вінниця', ru: 'Винница', en: 'Vinnytsia' },
    locative: { uk: 'у Вінниці', ru: 'в Виннице', en: 'in Vinnytsia' },
    region: { uk: 'Вінницька область', ru: 'Винницкая область', en: 'Vinnytsia Oblast' },
  },
  {
    slug: 'poltava',
    name: { uk: 'Полтава', ru: 'Полтава', en: 'Poltava' },
    locative: { uk: 'у Полтаві', ru: 'в Полтаве', en: 'in Poltava' },
    region: { uk: 'Полтавська область', ru: 'Полтавская область', en: 'Poltava Oblast' },
  },
  {
    slug: 'chernihiv',
    name: { uk: 'Чернігів', ru: 'Чернигов', en: 'Chernihiv' },
    locative: { uk: 'у Чернігові', ru: 'в Чернигове', en: 'in Chernihiv' },
    region: { uk: 'Чернігівська область', ru: 'Черниговская область', en: 'Chernihiv Oblast' },
  },
  {
    slug: 'cherkasy',
    name: { uk: 'Черкаси', ru: 'Черкассы', en: 'Cherkasy' },
    locative: { uk: 'у Черкасах', ru: 'в Черкассах', en: 'in Cherkasy' },
    region: { uk: 'Черкаська область', ru: 'Черкасская область', en: 'Cherkasy Oblast' },
  },
  {
    slug: 'ivano-frankivsk',
    name: { uk: "Івано-Франківськ", ru: "Ивано-Франковск", en: 'Ivano-Frankivsk' },
    locative: { uk: "в Івано-Франківську", ru: "в Ивано-Франковске", en: 'in Ivano-Frankivsk' },
    region: { uk: "Івано-Франківська область", ru: "Ивано-Франковская область", en: 'Ivano-Frankivsk Oblast' },
  },
  {
    slug: 'ternopil',
    name: { uk: 'Тернопіль', ru: 'Тернополь', en: 'Ternopil' },
    locative: { uk: 'у Тернополі', ru: 'в Тернополе', en: 'in Ternopil' },
    region: { uk: 'Тернопільська область', ru: 'Тернопольская область', en: 'Ternopil Oblast' },
  },
  {
    slug: 'chernivtsi',
    name: { uk: 'Чернівці', ru: 'Черновцы', en: 'Chernivtsi' },
    locative: { uk: 'у Чернівцях', ru: 'в Черновцах', en: 'in Chernivtsi' },
    region: { uk: 'Чернівецька область', ru: 'Черновицкая область', en: 'Chernivtsi Oblast' },
  },
  {
    slug: 'uzhhorod',
    name: { uk: 'Ужгород', ru: 'Ужгород', en: 'Uzhhorod' },
    locative: { uk: 'в Ужгороді', ru: 'в Ужгороде', en: 'in Uzhhorod' },
    region: { uk: 'Закарпатська область', ru: 'Закарпатская область', en: 'Zakarpattia Oblast' },
  },
];

export default CITIES;
