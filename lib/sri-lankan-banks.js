/** Sri Lankan commercial banks — shared across modules */
export const SRI_LANKAN_BANKS = [
  {
    id: "boc",
    name: "Bank of Ceylon (BOC)",
    short: "BOC",
    logoUrl: "https://www.newswire.lk/wp-content/uploads/2025/11/BOC-copy.jpg",
  },
  {
    id: "commercial",
    name: "Commercial Bank",
    short: "COM",
    logoUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQmSH0yKy2YHtmgvHnd2hyVHVb3oJlv9KqtVA&s",
  },
  {
    id: "dfcc",
    name: "DFCC Bank",
    short: "DFCC",
    logoUrl: "https://lankabizz.net/wp-content/uploads/2024/11/images-2.jpeg",
  },
  {
    id: "hnb",
    name: "Hatton National Bank (HNB)",
    short: "HNB",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/7/76/HNB_New_Logo.png",
  },
  {
    id: "ndb",
    name: "National Development Bank (NDB)",
    short: "NDB",
    logoUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQg9iENSlomqP_-r_VfJ0DCccwv1Nxz_x6owg&s",
  },
  {
    id: "ntb",
    name: "Nations Trust Bank (NTB)",
    short: "NTB",
    logoUrl:
      "https://governmentjob.lk/wp-content/uploads/2026/05/Nations-Trust-Bank-PLC-NTB-Bank.png",
  },
  {
    id: "panasia",
    name: "Pan Asia Bank",
    short: "PAN",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/1/1e/PAN_ASIA_BANK_LOGO_-_The_Truly_Sri_Lankan_ank.jpg",
  },
  {
    id: "peoples",
    name: "People's Bank",
    short: "PB",
    logoUrl:
      "https://s3.amazonaws.com/bizenglish/wp-content/uploads/2021/01/15142548/Peoples-bank-logo.jpg",
  },
  {
    id: "sampath",
    name: "Sampath Bank",
    short: "SAM",
    logoUrl:
      "https://s3.amazonaws.com/bizenglish/wp-content/uploads/2019/02/22154708/Sampath-Bank-Logo-30.1.191.jpg",
  },
  {
    id: "sdb",
    name: "Sanasa Development Bank (SDB)",
    short: "SDB",
    logoUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQBhuaCaA4iC_sb78imYNiRwegPaARAP8iWDQ&s",
  },
  {
    id: "seylan",
    name: "Seylan Bank",
    short: "SEY",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Seylan_Transparent.png/1280px-Seylan_Transparent.png",
  },
];

export const CASH_IN_HAND_BANK = {
  id: "cash_in_hand",
  name: "Cash in Hand",
  short: "CASH",
  logoUrl: null,
  isCash: true,
};

const DAY_CASH_BANK_IDS = ["boc", "peoples", "commercial", "hnb", "sampath"];

export const DAY_CASH_BANK_OPTIONS = [
  ...SRI_LANKAN_BANKS.filter((b) => DAY_CASH_BANK_IDS.includes(b.id)),
  CASH_IN_HAND_BANK,
];

const BANK_ALIASES = {
  boc: "Bank of Ceylon (BOC)",
  "bank of ceylon (boc)": "Bank of Ceylon (BOC)",
  "peoples bank": "People's Bank",
  "people's bank": "People's Bank",
  "commercial bank": "Commercial Bank",
  commercial: "Commercial Bank",
  "sampath bank": "Sampath Bank",
  sampath: "Sampath Bank",
  hnb: "Hatton National Bank (HNB)",
  "hatton national bank (hnb)": "Hatton National Bank (HNB)",
  "cash in hand": "Cash in Hand",
};

/**
 * @param {string} name
 * @param {Array<{ id: string, name: string, short: string, logoUrl?: string | null, isCash?: boolean }>} [banks]
 */
export function findBank(name, banks = SRI_LANKAN_BANKS) {
  const n = String(name ?? "").trim().toLowerCase();
  if (!n) return null;

  const all = [...banks, CASH_IN_HAND_BANK];
  const alias = BANK_ALIASES[n];
  if (alias) {
    return all.find((b) => b.name === alias) ?? null;
  }

  return (
    all.find((b) => b.name.toLowerCase() === n) ||
    all.find((b) => n.includes(b.id) || b.name.toLowerCase().includes(n)) ||
    null
  );
}

/** @param {string} name */
export function normalizeBankName(name) {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) return "";
  return findBank(trimmed, DAY_CASH_BANK_OPTIONS)?.name ?? findBank(trimmed)?.name ?? trimmed;
}
