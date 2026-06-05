/**
 * @typedef {{ si: string, en?: string }} BilingualString
 */

/** @type {Record<string, BilingualString>} */
export const LABELS = {
  brand: { si: "ශ්‍රී කෙත්" },
  brandModule: { si: "ගමන් වාර කළමනාකරණය" },

  tabHistory: { si: "සිදුකල ගමන් වාර" },
  tabLogTrip: { si: "අලුත් ගමන් වාරයක්" },

  badgeInward: { si: "🌾 ගබඩාවට බඩු ගේන්න" },
  badgeOutward: { si: "🚛 බඩු විකුණන්න" },

  tripType: { si: "ගමනේ වර්ගය" },
  tripInward: { si: "🌾 බඩු ගේන්න" },
  tripOutward: { si: "🚛 බඩු බාන්න" },

  paddyType: { si: "වී වර්ගය" },
  warehouse: { si: "ගබඩාව" },
  buyerName: { si: "මිලදී ගන්නා" },

  lorryNumber: { si: "ලොරි අංකය" },
  driverName: { si: "ඩ්‍රයිවර්" },
  helperNames: { si: "ගෝලයන්" },
  totalKg: { si: "මුළු කිලෝ ගණන" },
  totalKgCard: { si: "මුළු බර" },
  pricePerKg: { si: "කිලෝ එකක මිල" },
  priceLabel: { si: "මිල" },

  totalInvestment: { si: "මුළු ආයෝජනය" },
  totalRevenue: { si: "මුළු ආදායම" },
  totalTripCosts: { si: "වියදම් එකතුව" },
  netProfitClean: { si: "නියම ලාභය" },
  netLoss: { si: "නියම අලාභය" },

  startKm: { si: "පටන් ගත් KM" },
  endKm: { si: "ඉවර වුණු KM" },
  dieselLiters: { si: "ඩීසල් ලීටර්" },
  fuelCost: { si: "ඩීසල් වියදම" },
  driverWage: { si: "ඩ්‍රයිවර් පඩිය" },
  helperWage: { si: "ගෝල පඩිය" },
  roadExpenses: { si: "අමතර වියදම්" },

  saveTrip: { si: "ගමන සේව් කරන්න" },
  logTripTitle: { si: "අලුත් ගමනක්" },

  sectionLogistics: { si: "ගමන් වියදම්" },

  formBasicInfo: { si: "මූලික විස්තර" },
  formStockInfo: { si: "තොග විස්තර" },
  formTripExpenses: { si: "ගමන් වියදම්" },

  emptyTripsTitle: { si: "ගමන් වාර නෑ" },
};

/** @type {Record<import('./item-type').PaddyType, BilingualString>} */
export const PADDY_TYPE_LABELS = {
  "වී": { si: "වී" },
  "බඩඉරිඟු": { si: "බඩඉරිඟු" },
};
