const API_KEY = "dxEuToWnHB5W4e4lcqiFwu2RwKA64Ixi0BFR73kQ";

export const AutoCompleteApi = (searchQuery) => {
  return `
    https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(
      searchQuery
    )}& api_key=${API_KEY}
    `;
};

export const FetchPlaceApi = (placeId) => {
  return `https://api.olamaps.io/places/v1/details?place_id=${placeId}&api_key=${API_KEY}`;
};
