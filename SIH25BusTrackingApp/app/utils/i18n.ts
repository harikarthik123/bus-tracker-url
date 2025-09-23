import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export type AdminLangCode = 'en' | 'hi' | 'pa' | 'ta';

type Dictionary = { [key: string]: string };
type Translations = { [lang in AdminLangCode]: Dictionary };

const translations: Translations = {
  en: {
    'admin.welcome': 'Welcome to Admin',
    'admin.logout': 'Logout',
    'nav.back': '← Back',
    'cards.live.title': 'Live Track',
    'cards.live.sub': 'Track buses in real-time',
    'cards.route.title': 'Route Planner',
    'cards.route.sub': 'Plan your journey',
    'cards.driver.title': 'Driver Management',
    'cards.bus.title': 'Bus Management',
    'cards.ann.title': 'Announcements',
    'cards.reports.title': 'Reports',
    'screen.live.title': 'Live Monitoring',
    'screen.route.title': 'Route Management',
    'screen.driver.title': 'Driver Management',
    'screen.bus.title': 'Bus Management',
    'screen.alerts.title': 'Announcements',
    'common.refresh': 'Refresh',
    'common.allRoutes': 'All Routes',
    'driver.add': 'Add Driver',
    'driver.update': 'Update Driver',
    'driver.form.name': 'Driver Name',
    'driver.form.email': 'Email',
    'driver.form.password': 'Password',
    'driver.form.driverId': 'Driver ID (from transport office)',
    'driver.form.busId': 'Assigned Bus ID or Number (optional)',
    'driver.list.title': 'Existing Drivers',
    'driver.list.empty': 'No drivers added yet.',
    'bus.add': 'Add Bus',
    'bus.update': 'Update Bus',
    'bus.form.busNumber': 'Bus Number',
    'bus.form.regNo': 'Reg. No',
    'bus.form.capacity': 'Capacity',
    'alerts.send': 'Send Alert',
    'alerts.recent': 'Recent Alerts',
    'alerts.bulk': 'Bulk Delete Options',
  },
  hi: {
    'admin.welcome': 'प्रशासन में आपका स्वागत है',
    'admin.logout': 'लॉगआउट',
    'nav.back': '← वापस',
    'cards.live.title': 'लाइव ट्रैक',
    'cards.live.sub': 'बसों को रीयल-टाइम में ट्रैक करें',
    'cards.route.title': 'रूट प्लानर',
    'cards.route.sub': 'अपनी यात्रा योजना बनाएं',
    'cards.driver.title': 'ड्राइवर प्रबंधन',
    'cards.bus.title': 'बस प्रबंधन',
    'cards.ann.title': 'घोषणाएँ',
    'cards.reports.title': 'रिपोर्ट्स',
    'screen.live.title': 'लाइव मॉनिटरिंग',
    'screen.route.title': 'रूट प्रबंधन',
    'screen.driver.title': 'ड्राइवर प्रबंधन',
    'screen.bus.title': 'बस प्रबंधन',
    'screen.alerts.title': 'घोषणाएँ',
    'common.refresh': 'रीफ्रेश',
    'common.allRoutes': 'सभी रूट',
    'driver.add': 'ड्राइवर जोड़ें',
    'driver.update': 'ड्राइवर अपडेट करें',
    'driver.form.name': 'ड्राइवर का नाम',
    'driver.form.email': 'ईमेल',
    'driver.form.password': 'पासवर्ड',
    'driver.form.driverId': 'ड्राइवर आईडी (परिवहन कार्यालय से)',
    'driver.form.busId': 'आवंटित बस आईडी/नंबर (वैकल्पिक)',
    'driver.list.title': 'मौजूदा ड्राइवर',
    'driver.list.empty': 'अभी कोई ड्राइवर नहीं जोड़ा गया।',
    'bus.add': 'बस जोड़ें',
    'bus.update': 'बस अपडेट करें',
    'bus.form.busNumber': 'बस नंबर',
    'bus.form.regNo': 'रजिस्ट्रेशन नंबर',
    'bus.form.capacity': 'क्षमता',
    'alerts.send': 'अलर्ट भेजें',
    'alerts.recent': 'हाल के अलर्ट',
    'alerts.bulk': 'बल्क डिलीट विकल्प',
  },
  pa: {
    'admin.welcome': 'ਐਡਮਿਨ ਵਿੱਚ ਸੁਆਗਤ ਹੈ',
    'admin.logout': 'ਲਾੱਗ ਆਉਟ',
    'nav.back': '← ਵਾਪਸ',
    'cards.live.title': 'ਲਾਈਵ ਟ੍ਰੈਕ',
    'cards.live.sub': 'ਬੱਸਾਂ ਨੂੰ ਰੀਅਲ-ਟਾਈਮ ਵਿੱਚ ਟ੍ਰੈਕ ਕਰੋ',
    'cards.route.title': 'ਰੂਟ ਪਲਾਨਰ',
    'cards.route.sub': 'ਆਪਣੀ ਯਾਤਰਾ ਦੀ ਯੋਜਨਾ ਬਣਾਓ',
    'cards.driver.title': 'ਡਰਾਈਵਰ ਪ੍ਰਬੰਧਨ',
    'cards.bus.title': 'ਬੱਸ ਪ੍ਰਬੰਧਨ',
    'cards.ann.title': 'ਘੋਸ਼ਣਾਵਾਂ',
    'cards.reports.title': 'ਰਿਪੋਰਟਾਂ',
    'screen.live.title': 'ਲਾਈਵ ਮਾਨੀਟਰਿੰਗ',
    'screen.route.title': 'ਰੂਟ ਪ੍ਰਬੰਧਨ',
    'screen.driver.title': 'ਡਰਾਈਵਰ ਪ੍ਰਬੰਧਨ',
    'screen.bus.title': 'ਬੱਸ ਪ੍ਰਬੰਧਨ',
    'screen.alerts.title': 'ਘੋਸ਼ਣਾਵਾਂ',
    'common.refresh': 'ਰੀਫਰੈਸ਼',
    'common.allRoutes': 'ਸਾਰੇ ਰੂਟ',
    'driver.add': 'ਡਰਾਈਵਰ ਸ਼ਾਮਲ ਕਰੋ',
    'driver.update': 'ਡਰਾਈਵਰ ਅੱਪਡੇਟ ਕਰੋ',
    'driver.form.name': 'ਡਰਾਈਵਰ ਦਾ ਨਾਮ',
    'driver.form.email': 'ਈਮੇਲ',
    'driver.form.password': 'ਪਾਸਵਰਡ',
    'driver.form.driverId': 'ਡਰਾਈਵਰ ਆਈ.ਡੀ. (ਪਰਿਵਹਨ ਦਫ਼ਤਰ ਤੋਂ)',
    'driver.form.busId': 'ਨਿਰਧਾਰਿਤ ਬੱਸ ਆਈ.ਡੀ./ਨੰਬਰ (ਵਿਕਲਪਿਕ)',
    'driver.list.title': 'ਮੌਜੂਦਾ ਡਰਾਈਵਰ',
    'driver.list.empty': 'ਹਾਲੇ ਕੋਈ ਡਰਾਈਵਰ ਨਹੀਂ ਜੋੜਿਆ ਗਿਆ।',
    'bus.add': 'ਬੱਸ ਸ਼ਾਮਲ ਕਰੋ',
    'bus.update': 'ਬੱਸ ਅੱਪਡੇਟ ਕਰੋ',
    'bus.form.busNumber': 'ਬੱਸ ਨੰਬਰ',
    'bus.form.regNo': 'ਰਜਿ. ਨੰਬਰ',
    'bus.form.capacity': 'ਸਮਰੱਥਾ',
    'alerts.send': 'ਅਲਰਟ ਭੇਜੋ',
    'alerts.recent': 'ਤਾਜ਼ਾ ਅਲਰਟ',
    'alerts.bulk': 'ਬਲਕ ਮਿਟਾਉ ਵਿਕਲਪ',
  },
  ta: {
    'admin.welcome': 'நிர்வாகத்திற்கு வரவேற்பு',
    'admin.logout': 'வெளியேறு',
    'nav.back': '← பின்',
    'cards.live.title': 'நேரடி கண்காணிப்பு',
    'cards.live.sub': 'பஸ்களை நேரடியாக கண்காணிக்க',
    'cards.route.title': 'பாதை திட்டமிடுதல்',
    'cards.route.sub': 'உங்கள் பயணத்தை திட்டமிடுங்கள்',
    'cards.driver.title': 'டிரைவர் மேலாண்மை',
    'cards.bus.title': 'பஸ் மேலாண்மை',
    'cards.ann.title': 'அறிவிப்புகள்',
    'cards.reports.title': 'அறிக்கைகள்',
    'screen.live.title': 'நேரடி கண்காணிப்பு',
    'screen.route.title': 'பாதை மேலாண்மை',
    'screen.driver.title': 'டிரைவர் மேலாண்மை',
    'screen.bus.title': 'பஸ் மேலாண்மை',
    'screen.alerts.title': 'அறிவிப்புகள்',
    'common.refresh': 'புதுப்பி',
    'common.allRoutes': 'அனைத்து பாதைகள்',
    'driver.add': 'டிரைவரை சேர்',
    'driver.update': 'டிரைவரை புதுப்பி',
    'driver.form.name': 'டிரைவர் பெயர்',
    'driver.form.email': 'மின்னஞ்சல்',
    'driver.form.password': 'கடவுச்சொல்',
    'driver.form.driverId': 'டிரைவர் ஐடி (போக்குவரத்து அலுவலகம்)',
    'driver.form.busId': 'ஒதுக்கப்பட்ட பஸ் ஐடி/எண் (விருப்பம்)',
    'driver.list.title': 'இருக்கும் டிரைவர்கள்',
    'driver.list.empty': 'இன்னும் டிரைவர்கள் சேர்க்கப்படவில்லை.',
    'bus.add': 'பஸை சேர்',
    'bus.update': 'பஸை புதுப்பி',
    'bus.form.busNumber': 'பஸ் எண்',
    'bus.form.regNo': 'பதிவு எண்',
    'bus.form.capacity': 'திறன்',
    'alerts.send': 'அறிவிப்பை அனுப்பு',
    'alerts.recent': 'சமீபத்திய அறிவிப்புகள்',
    'alerts.bulk': 'மொத்தமாக நீக்கும் விருப்பங்கள்',
  },
};

type Listener = (lang: AdminLangCode) => void;
const listeners = new Set<Listener>();
let currentLang: AdminLangCode = 'en';

export const initAdminLanguage = async () => {
  const saved = await AsyncStorage.getItem('admin_lang');
  if (saved === 'en' || saved === 'hi' || saved === 'pa' || saved === 'ta') {
    currentLang = saved;
  }
};

export const getAdminLanguage = (): AdminLangCode => currentLang;

export const setAdminLanguage = async (lang: AdminLangCode) => {
  currentLang = lang;
  await AsyncStorage.setItem('admin_lang', lang);
  listeners.forEach((l) => l(lang));
};

export const subscribeAdminLanguage = (listener: Listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const tAdmin = (key: string, lang?: AdminLangCode): string => {
  const useLang = lang || currentLang;
  return translations[useLang][key] ?? translations['en'][key] ?? key;
};

export const useAdminI18n = () => {
  const [lang, setLangState] = useState<AdminLangCode>(currentLang);

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      if (!currentLang) {
        await initAdminLanguage();
      }
      setLangState(currentLang);
      unsub = subscribeAdminLanguage((l) => setLangState(l));
    })();
    return () => unsub();
  }, []);

  return {
    lang,
    t: (key: string) => tAdmin(key, lang),
    setLang: (l: AdminLangCode) => setAdminLanguage(l),
  };
};


