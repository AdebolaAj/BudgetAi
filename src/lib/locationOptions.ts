import { City, Country, State } from 'country-state-city';

type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';

type IndexedLocation = {
  value: string;
  searchText: string;
};

const countryCodesByCurrency: Record<CurrencyCode, string[]> = {
  USD: ['US'],
  EUR: ['DE', 'FR', 'ES', 'IT', 'NL', 'IE', 'BE', 'AT', 'PT'],
  GBP: ['GB'],
  CAD: ['CA'],
  AUD: ['AU'],
};

const locationCache = new Map<CurrencyCode, IndexedLocation[]>();

function getCountryNameMap(countryCodes: string[]) {
  const countries = countryCodes
    .map((countryCode) => Country.getCountryByCode(countryCode))
    .filter((country): country is NonNullable<typeof country> => Boolean(country));

  return new Map(countries.map((country) => [country.isoCode, country.name]));
}

function buildLocations(currency: CurrencyCode): IndexedLocation[] {
  const countryCodes = countryCodesByCurrency[currency] ?? countryCodesByCurrency.USD;
  const countryNameMap = getCountryNameMap(countryCodes);
  const options = new Map<string, IndexedLocation>();

  for (const countryCode of countryCodes) {
    const states = State.getStatesOfCountry(countryCode);
    const stateNameMap = new Map(states.map((state) => [state.isoCode, state.name]));
    const countryName = countryNameMap.get(countryCode) ?? countryCode;

    for (const city of City.getCitiesOfCountry(countryCode)) {
      const stateName = stateNameMap.get(city.stateCode);
      const suffix =
        currency === 'EUR'
          ? countryName
          : stateName
            ? stateName
            : countryName;
      const value = `${city.name}, ${suffix}`;
      const searchText = `${city.name} ${stateName ?? ''} ${countryName}`.toLowerCase();

      if (!options.has(value)) {
        options.set(value, { value, searchText });
      }
    }
  }

  return Array.from(options.values()).sort((left, right) => left.value.localeCompare(right.value));
}

function getIndexedLocations(currency: string) {
  const normalizedCurrency = (currency in countryCodesByCurrency ? currency : 'USD') as CurrencyCode;

  if (!locationCache.has(normalizedCurrency)) {
    locationCache.set(normalizedCurrency, buildLocations(normalizedCurrency));
  }

  return locationCache.get(normalizedCurrency) ?? [];
}

export function searchLocationOptions(currency: string, query: string, includeRemote = false) {
  const normalizedQuery = query.trim().toLowerCase();
  const indexedLocations = getIndexedLocations(currency);

  const matches = normalizedQuery
    ? indexedLocations.filter((location) => location.searchText.includes(normalizedQuery))
    : indexedLocations;

  const options = matches.slice(0, 8).map((location) => location.value);

  if (includeRemote) {
    const remoteOption = 'Remote';
    if (normalizedQuery.length === 0 || remoteOption.toLowerCase().includes(normalizedQuery)) {
      options.unshift(remoteOption);
    }
  }

  return options.slice(0, 8);
}
