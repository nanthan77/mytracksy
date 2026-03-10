export interface CulturalEvent {
  name: string;
  nameEn: string;
  nameSi: string;
  nameTa: string;
  date: string;
  type: 'poya' | 'festival' | 'national' | 'religious';
  significance: string;
  expenseCategories: string[];
  duration?: number; // days
}

export const SriLankanCalendar2024: CulturalEvent[] = [
  // Poya Days 2024
  {
    name: "Duruthu Poya",
    nameEn: "Duruthu Poya",
    nameSi: "දුරුතු පෝය",
    nameTa: "துருது பௌர்ணமி",
    date: "2024-01-25",
    type: "poya",
    significance: "Commemorates Buddha's first visit to Sri Lanka",
    expenseCategories: ["Religious Activities", "Temple Donations", "Traditional Food"]
  },
  {
    name: "Navam Poya",
    nameEn: "Navam Poya",
    nameSi: "නවම් පෝය",
    nameTa: "நவம் பௌர்ணமி",
    date: "2024-02-24",
    type: "poya",
    significance: "Buddha's announcement of his passing away",
    expenseCategories: ["Religious Activities", "Dana Offerings", "Meditation Retreats"]
  },
  {
    name: "Medin Poya",
    nameEn: "Medin Poya",
    nameSi: "මැදින් පෝය",
    nameTa: "மெதின் பௌர்ணமி",
    date: "2024-03-25",
    type: "poya",
    significance: "Buddha's visit to his father",
    expenseCategories: ["Religious Activities", "Family Gatherings", "Traditional Meals"]
  },
  {
    name: "Bak Poya",
    nameEn: "Bak Poya",
    nameSi: "බක් පෝය",
    nameTa: "பக் பௌர்ணமி",
    date: "2024-04-23",
    type: "poya",
    significance: "Buddha's second visit to Sri Lanka",
    expenseCategories: ["Religious Activities", "Temple Visits", "Charity"]
  },
  {
    name: "Vesak Poya",
    nameEn: "Vesak Poya",
    nameSi: "වෙසක් පෝය",
    nameTa: "வேசாக் பௌர்ணமி",
    date: "2024-05-23",
    type: "poya",
    significance: "Birth, Enlightenment and Death of Buddha",
    expenseCategories: ["Vesak Lanterns", "Decorations", "Dana", "Religious Items", "Charity"],
    duration: 2
  },
  {
    name: "Poson Poya",
    nameEn: "Poson Poya",
    nameSi: "පොසොන් පෝය",
    nameTa: "போசன் பௌர்ணமி",
    date: "2024-06-21",
    type: "poya",
    significance: "Introduction of Buddhism to Sri Lanka",
    expenseCategories: ["Religious Activities", "Pilgrimage", "Traditional Food"]
  },
  {
    name: "Esala Poya",
    nameEn: "Esala Poya",
    nameSi: "ඇසළ පෝය",
    nameTa: "ஏசால பௌர்ணமி",
    date: "2024-07-20",
    type: "poya",
    significance: "Buddha's first sermon",
    expenseCategories: ["Religious Activities", "Kandy Perahera", "Traditional Clothing"]
  },
  {
    name: "Nikini Poya",
    nameEn: "Nikini Poya",
    nameSi: "නිකිණි පෝය",
    nameTa: "நிகிணி பௌர்ணமி",
    date: "2024-08-19",
    type: "poya",
    significance: "Buddha's ordination of his disciples",
    expenseCategories: ["Religious Activities", "Temple Donations", "Community Service"]
  },
  {
    name: "Binara Poya",
    nameEn: "Binara Poya",
    nameSi: "බිනර පෝය",
    nameTa: "பினர பௌர்ணமி",
    date: "2024-09-17",
    type: "poya",
    significance: "Buddha's journey to heaven",
    expenseCategories: ["Religious Activities", "Family Reunions", "Traditional Sweets"]
  },
  {
    name: "Vap Poya",
    nameEn: "Vap Poya",
    nameSi: "වප් පෝය",
    nameTa: "வப் பௌர்ணமி",
    date: "2024-10-17",
    type: "poya",
    significance: "End of Buddha's three-month retreat",
    expenseCategories: ["Religious Activities", "Katina Ceremony", "Robe Offerings"]
  },
  {
    name: "Ill Poya",
    nameEn: "Ill Poya",
    nameSi: "ඉල් පෝය",
    nameTa: "இல் பௌர்ணமி",
    date: "2024-11-15",
    type: "poya",
    significance: "Buddha's ordination of 60 disciples",
    expenseCategories: ["Religious Activities", "Temple Renovations", "Community Projects"]
  },
  {
    name: "Unduvap Poya",
    nameEn: "Unduvap Poya",
    nameSi: "උඳුවප් පෝය",
    nameTa: "உண்டுவப் பௌர்ணமி",
    date: "2024-12-14",
    type: "poya",
    significance: "Arrival of Sanghamitta Theri in Sri Lanka",
    expenseCategories: ["Religious Activities", "Sacred Bo Tree", "Year-end Donations"]
  },

  // Major Festivals
  {
    name: "Thai Pusam",
    nameEn: "Thai Pusam",
    nameSi: "තයි පුසම්",
    nameTa: "தைப்பூசம்",
    date: "2024-01-25",
    type: "festival",
    significance: "Tamil Hindu festival",
    expenseCategories: ["Religious Items", "Traditional Food", "Temple Offerings", "Kavadi"]
  },
  {
    name: "Maha Sivarathri",
    nameEn: "Maha Sivarathri",
    nameSi: "මහා ශිවරාත්‍රි",
    nameTa: "மகா சிவராத்திரி",
    date: "2024-03-08",
    type: "festival",
    significance: "Hindu festival dedicated to Lord Shiva",
    expenseCategories: ["Religious Items", "Fasting Food", "Temple Donations", "Flowers"]
  },
  {
    name: "Sinhala Tamil New Year",
    nameEn: "Sinhala Tamil New Year",
    nameSi: "සිංහල හින්දු අලුත් අවුරුද්ද",
    nameTa: "சிங்கள தமிழ் புத்தாண்டு",
    date: "2024-04-13",
    type: "festival",
    significance: "Traditional New Year celebration",
    expenseCategories: ["Traditional Food", "New Clothes", "Gifts", "House Cleaning", "Oil Lamp", "Games"],
    duration: 2
  },
  {
    name: "Good Friday",
    nameEn: "Good Friday",
    nameSi: "මහ සිකුරාදා",
    nameTa: "புனித வெள்ளிக்கிழமை",
    date: "2024-03-29",
    type: "religious",
    significance: "Christian commemoration of Jesus' crucifixion",
    expenseCategories: ["Church Donations", "Special Meals", "Religious Items"]
  },
  {
    name: "Easter Sunday",
    nameEn: "Easter Sunday",
    nameSi: "පාස්කු ඉරිදා",
    nameTa: "ஈஸ்டர் ஞாயிறு",
    date: "2024-03-31",
    type: "religious",
    significance: "Christian celebration of Jesus' resurrection",
    expenseCategories: ["Church Donations", "Family Gatherings", "Special Food", "Easter Eggs"]
  },

  // Islamic Festivals (dates vary)
  {
    name: "Eid al-Fitr",
    nameEn: "Eid al-Fitr",
    nameSi: "ඊද් අල් ෆිතර්",
    nameTa: "ஈத் அல் ஃபித்ர்",
    date: "2024-04-10", // Approximate - varies with moon sighting
    type: "festival",
    significance: "End of Ramadan",
    expenseCategories: ["New Clothes", "Special Food", "Zakat", "Gifts", "Family Visits"]
  },
  {
    name: "Eid al-Adha",
    nameEn: "Eid al-Adha",
    nameSi: "ඊද් අල් අද්හා",
    nameTa: "ஈத் அல் அத்ஹா",
    date: "2024-06-17", // Approximate
    type: "festival",
    significance: "Festival of Sacrifice",
    expenseCategories: ["Sacrificial Animals", "Charity", "Special Food", "Family Gatherings"]
  },

  // National Days
  {
    name: "Independence Day",
    nameEn: "Independence Day",
    nameSi: "නිදහස් දිනය",
    nameTa: "சுதந்திர தினம்",
    date: "2024-02-04",
    type: "national",
    significance: "Sri Lankan independence from British rule",
    expenseCategories: ["Patriotic Items", "Flag", "Special Events", "Family Outings"]
  },
  {
    name: "National Heroes Day",
    nameEn: "National Heroes Day",
    nameSi: "ජාතික වීරෝ දිනය",
    nameTa: "தேசிய வீரர்கள் தினம்",
    date: "2024-05-22",
    type: "national",
    significance: "Commemoration of war heroes",
    expenseCategories: ["Memorial Items", "Flowers", "Charity for Veterans"]
  }
];

export const getEventsForMonth = (year: number, month: number): CulturalEvent[] => {
  return SriLankanCalendar2024.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate.getFullYear() === year && eventDate.getMonth() === month - 1;
  });
};

export const getUpcomingEvents = (days: number = 30): CulturalEvent[] => {
  const today = new Date();
  const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
  
  return SriLankanCalendar2024.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= today && eventDate <= futureDate;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const getPoyaDays = (): CulturalEvent[] => {
  return SriLankanCalendar2024.filter(event => event.type === 'poya');
};

export const getEventByDate = (date: string): CulturalEvent | null => {
  return SriLankanCalendar2024.find(event => event.date === date) || null;
};

export const getCulturalCategories = (): string[] => {
  const categories = new Set<string>();
  SriLankanCalendar2024.forEach(event => {
    event.expenseCategories.forEach(category => categories.add(category));
  });
  return Array.from(categories).sort();
};

export const isSpecialDay = (date: Date): boolean => {
  const dateString = date.toISOString().split('T')[0];
  return SriLankanCalendar2024.some(event => event.date === dateString);
};

export const getSpecialDayInfo = (date: Date): CulturalEvent | null => {
  const dateString = date.toISOString().split('T')[0];
  return getEventByDate(dateString);
};