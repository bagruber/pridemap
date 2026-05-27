export const COUNTRY_NAMES = {
  AL:'Albania', AD:'Andorra', AT:'Austria', BE:'Belgium', BA:'Bosnia & Herz.',
  BG:'Bulgaria', HR:'Croatia', CY:'Cyprus', CZ:'Czechia', DK:'Denmark',
  EE:'Estonia', FI:'Finland', FR:'France', DE:'Germany', GR:'Greece',
  HU:'Hungary', IS:'Iceland', IE:'Ireland', IT:'Italy', XK:'Kosovo',
  LV:'Latvia', LI:'Liechtenstein', LT:'Lithuania', LU:'Luxembourg',
  MT:'Malta', MD:'Moldova', MC:'Monaco', ME:'Montenegro', NL:'Netherlands',
  MK:'North Macedonia', NO:'Norway', PL:'Poland', PT:'Portugal', RO:'Romania',
  RU:'Russia', SM:'San Marino', RS:'Serbia', SK:'Slovakia', SI:'Slovenia',
  ES:'Spain', SE:'Sweden', CH:'Switzerland', TR:'Turkey', UA:'Ukraine',
  GB:'United Kingdom', GE:'Georgia', AM:'Armenia', AZ:'Azerbaijan', BY:'Belarus',
  GG:'Guernsey',
}

// Returns flag-icons CSS class — use as <span className={flag(code)} />
export const flag = code => `fi fi-${code.toLowerCase()}`
