// Countries list for Islamic calendar
// defaultOffset: typical offset from Saudi/calculated date
//   0 = usually same day as Saudi
//   1 = usually 1 day after Saudi
//   2 = usually 2 days after Saudi
// group: used for UI grouping

export interface Country {
  code:          string    // ISO 3166-1 alpha-2
  nameEn:        string
  nameAr:        string
  region:        string
  defaultOffset: number   // most common offset from calculated date
}

export const COUNTRIES: Country[] = [
  // ── Arabian Peninsula (typically follow Saudi official announcement)
  { code: 'SA', nameEn: 'Saudi Arabia',       nameAr: 'المملكة العربية السعودية', region: 'Arabian Peninsula', defaultOffset: 0 },
  { code: 'AE', nameEn: 'UAE',                nameAr: 'الإمارات العربية المتحدة',  region: 'Arabian Peninsula', defaultOffset: 0 },
  { code: 'KW', nameEn: 'Kuwait',             nameAr: 'الكويت',                    region: 'Arabian Peninsula', defaultOffset: 0 },
  { code: 'BH', nameEn: 'Bahrain',            nameAr: 'البحرين',                   region: 'Arabian Peninsula', defaultOffset: 0 },
  { code: 'QA', nameEn: 'Qatar',              nameAr: 'قطر',                       region: 'Arabian Peninsula', defaultOffset: 0 },
  { code: 'OM', nameEn: 'Oman',               nameAr: 'عُمان',                     region: 'Arabian Peninsula', defaultOffset: 0 },
  { code: 'YE', nameEn: 'Yemen',              nameAr: 'اليمن',                     region: 'Arabian Peninsula', defaultOffset: 0 },

  // ── Levant & Iraq
  { code: 'JO', nameEn: 'Jordan',             nameAr: 'الأردن',                    region: 'Levant',            defaultOffset: 0 },
  { code: 'SY', nameEn: 'Syria',              nameAr: 'سوريا',                     region: 'Levant',            defaultOffset: 0 },
  { code: 'LB', nameEn: 'Lebanon',            nameAr: 'لبنان',                     region: 'Levant',            defaultOffset: 0 },
  { code: 'PS', nameEn: 'Palestine',          nameAr: 'فلسطين',                    region: 'Levant',            defaultOffset: 0 },
  { code: 'IQ', nameEn: 'Iraq',               nameAr: 'العراق',                    region: 'Levant',            defaultOffset: 0 },

  // ── North Africa (often 1 day different from Saudi)
  { code: 'EG', nameEn: 'Egypt',              nameAr: 'مصر',                       region: 'North Africa',      defaultOffset: 0 },
  { code: 'LY', nameEn: 'Libya',              nameAr: 'ليبيا',                     region: 'North Africa',      defaultOffset: 0 },
  { code: 'TN', nameEn: 'Tunisia',            nameAr: 'تونس',                      region: 'North Africa',      defaultOffset: 1 },
  { code: 'DZ', nameEn: 'Algeria',            nameAr: 'الجزائر',                   region: 'North Africa',      defaultOffset: 1 },
  { code: 'MA', nameEn: 'Morocco',            nameAr: 'المغرب',                    region: 'North Africa',      defaultOffset: 1 },
  { code: 'MR', nameEn: 'Mauritania',         nameAr: 'موريتانيا',                 region: 'North Africa',      defaultOffset: 1 },
  { code: 'SD', nameEn: 'Sudan',              nameAr: 'السودان',                   region: 'North Africa',      defaultOffset: 0 },

  // ── Iran (uses different calendar — often 1–2 days different)
  { code: 'IR', nameEn: 'Iran',               nameAr: 'إيران',                     region: 'Persia',            defaultOffset: 1 },

  // ── Turkey
  { code: 'TR', nameEn: 'Turkey',             nameAr: 'تركيا',                     region: 'Turkey',            defaultOffset: 0 },

  // ── South Asia (often 1–2 days after Saudi)
  { code: 'PK', nameEn: 'Pakistan',           nameAr: 'باكستان',                   region: 'South Asia',        defaultOffset: 1 },
  { code: 'IN', nameEn: 'India',              nameAr: 'الهند',                     region: 'South Asia',        defaultOffset: 1 },
  { code: 'BD', nameEn: 'Bangladesh',         nameAr: 'بنغلاديش',                  region: 'South Asia',        defaultOffset: 1 },
  { code: 'AF', nameEn: 'Afghanistan',        nameAr: 'أفغانستان',                 region: 'South Asia',        defaultOffset: 1 },
  { code: 'NP', nameEn: 'Nepal',              nameAr: 'نيبال',                     region: 'South Asia',        defaultOffset: 1 },
  { code: 'LK', nameEn: 'Sri Lanka',          nameAr: 'سريلانكا',                  region: 'South Asia',        defaultOffset: 1 },
  { code: 'MV', nameEn: 'Maldives',           nameAr: 'المالديف',                  region: 'South Asia',        defaultOffset: 0 },

  // ── Southeast Asia
  { code: 'ID', nameEn: 'Indonesia',          nameAr: 'إندونيسيا',                 region: 'Southeast Asia',    defaultOffset: 1 },
  { code: 'MY', nameEn: 'Malaysia',           nameAr: 'ماليزيا',                   region: 'Southeast Asia',    defaultOffset: 1 },
  { code: 'BN', nameEn: 'Brunei',             nameAr: 'بروناي',                    region: 'Southeast Asia',    defaultOffset: 1 },
  { code: 'PH', nameEn: 'Philippines',        nameAr: 'الفلبين',                   region: 'Southeast Asia',    defaultOffset: 1 },
  { code: 'SG', nameEn: 'Singapore',          nameAr: 'سنغافورة',                  region: 'Southeast Asia',    defaultOffset: 1 },
  { code: 'TH', nameEn: 'Thailand',           nameAr: 'تايلاند',                   region: 'Southeast Asia',    defaultOffset: 1 },

  // ── Sub-Saharan Africa
  { code: 'NG', nameEn: 'Nigeria',            nameAr: 'نيجيريا',                   region: 'Sub-Saharan Africa', defaultOffset: 1 },
  { code: 'SO', nameEn: 'Somalia',            nameAr: 'الصومال',                   region: 'Sub-Saharan Africa', defaultOffset: 0 },
  { code: 'ET', nameEn: 'Ethiopia',           nameAr: 'إثيوبيا',                   region: 'Sub-Saharan Africa', defaultOffset: 1 },
  { code: 'SN', nameEn: 'Senegal',            nameAr: 'السنغال',                   region: 'Sub-Saharan Africa', defaultOffset: 1 },
  { code: 'ML', nameEn: 'Mali',               nameAr: 'مالي',                      region: 'Sub-Saharan Africa', defaultOffset: 1 },
  { code: 'GN', nameEn: 'Guinea',             nameAr: 'غينيا',                     region: 'Sub-Saharan Africa', defaultOffset: 1 },
  { code: 'GH', nameEn: 'Ghana',              nameAr: 'غانا',                      region: 'Sub-Saharan Africa', defaultOffset: 1 },
  { code: 'KE', nameEn: 'Kenya',              nameAr: 'كينيا',                     region: 'Sub-Saharan Africa', defaultOffset: 1 },
  { code: 'TZ', nameEn: 'Tanzania',           nameAr: 'تنزانيا',                   region: 'Sub-Saharan Africa', defaultOffset: 1 },
  { code: 'UG', nameEn: 'Uganda',             nameAr: 'أوغندا',                    region: 'Sub-Saharan Africa', defaultOffset: 1 },

  // ── Central Asia
  { code: 'KZ', nameEn: 'Kazakhstan',         nameAr: 'كازاخستان',                 region: 'Central Asia',      defaultOffset: 0 },
  { code: 'UZ', nameEn: 'Uzbekistan',         nameAr: 'أوزبكستان',                 region: 'Central Asia',      defaultOffset: 0 },
  { code: 'TM', nameEn: 'Turkmenistan',       nameAr: 'تركمانستان',                region: 'Central Asia',      defaultOffset: 0 },
  { code: 'TJ', nameEn: 'Tajikistan',         nameAr: 'طاجيكستان',                 region: 'Central Asia',      defaultOffset: 0 },
  { code: 'KG', nameEn: 'Kyrgyzstan',         nameAr: 'قيرغيزستان',               region: 'Central Asia',      defaultOffset: 0 },
  { code: 'AZ', nameEn: 'Azerbaijan',         nameAr: 'أذربيجان',                  region: 'Central Asia',      defaultOffset: 0 },

  // ── Western Muslim minorities (follow local Islamic councils, often differ)
  { code: 'GB', nameEn: 'United Kingdom',     nameAr: 'المملكة المتحدة',           region: 'Western', defaultOffset: 1 },
  { code: 'US', nameEn: 'United States',      nameAr: 'الولايات المتحدة',          region: 'Western', defaultOffset: 1 },
  { code: 'CA', nameEn: 'Canada',             nameAr: 'كندا',                      region: 'Western', defaultOffset: 1 },
  { code: 'AU', nameEn: 'Australia',          nameAr: 'أستراليا',                  region: 'Western', defaultOffset: 1 },
  { code: 'NZ', nameEn: 'New Zealand',        nameAr: 'نيوزيلندا',                 region: 'Western', defaultOffset: 1 },
  { code: 'FR', nameEn: 'France',             nameAr: 'فرنسا',                     region: 'Western', defaultOffset: 1 },
  { code: 'DE', nameEn: 'Germany',            nameAr: 'ألمانيا',                   region: 'Western', defaultOffset: 1 },
  { code: 'BE', nameEn: 'Belgium',            nameAr: 'بلجيكا',                    region: 'Western', defaultOffset: 1 },
  { code: 'NL', nameEn: 'Netherlands',        nameAr: 'هولندا',                    region: 'Western', defaultOffset: 1 },
  { code: 'SE', nameEn: 'Sweden',             nameAr: 'السويد',                    region: 'Western', defaultOffset: 1 },
  { code: 'NO', nameEn: 'Norway',             nameAr: 'النرويج',                   region: 'Western', defaultOffset: 1 },
  { code: 'DK', nameEn: 'Denmark',            nameAr: 'الدنمارك',                  region: 'Western', defaultOffset: 1 },
  { code: 'IT', nameEn: 'Italy',              nameAr: 'إيطاليا',                   region: 'Western', defaultOffset: 1 },
  { code: 'ES', nameEn: 'Spain',              nameAr: 'إسبانيا',                   region: 'Western', defaultOffset: 1 },
  { code: 'RU', nameEn: 'Russia',             nameAr: 'روسيا',                     region: 'Western', defaultOffset: 0 },
]

// Helper — look up a country by code
export function getCountry(code: string): Country | undefined {
  return COUNTRIES.find(c => c.code === code)
}

// Helper — get all countries grouped by region
export function getCountriesByRegion(): Record<string, Country[]> {
  return COUNTRIES.reduce((acc, c) => {
    if (!acc[c.region]) acc[c.region] = []
    acc[c.region].push(c)
    return acc
  }, {} as Record<string, Country[]>)
}

// Regions in display order
export const REGION_ORDER = [
  'Arabian Peninsula',
  'Levant',
  'North Africa',
  'Persia',
  'Turkey',
  'South Asia',
  'Southeast Asia',
  'Sub-Saharan Africa',
  'Central Asia',
  'Western',
]
