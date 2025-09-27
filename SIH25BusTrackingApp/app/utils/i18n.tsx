import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, createContext, useContext } from 'react';

export type LangCode = 'en' | 'hi' | 'pa' | 'ta';
export type AdminLangCode = LangCode;
export type DriverLangCode = LangCode;
export type PassengerLangCode = LangCode;

type Dictionary = { [key: string]: string };
type Translations = { [lang in LangCode]: Dictionary };

const translations: Translations = {
  en: {
    // Common strings
    'common.refresh': 'Refresh',
    'common.allRoutes': 'All Routes',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.add': 'Add',
    'common.update': 'Update',
    'common.search': 'Search',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.online': 'Online',
    'common.offline': 'Offline',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.ok': 'OK',
    'common.back': '← Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.close': 'Close',
    'common.menu': 'Menu',
    'common.settings': 'Settings',
    'common.profile': 'Profile',
    'common.logout': 'Logout',
    'common.login': 'Login',
    'common.signup': 'Sign Up',
    'common.email': 'Email',
    'common.password': 'Password',
    'common.name': 'Name',
    'common.phone': 'Phone Number',
    'common.role': 'Role',
    'common.admin': 'Admin',
    'common.driver': 'Driver',
    'common.passenger': 'Passenger',

    // Navigation
    'nav.back': '← Back',
    'nav.home': 'Home',
    'nav.explore': 'Explore',

    // Login Screen
    'login.welcome': 'Welcome back',
    'login.subtitle': 'Sign in to continue',
    'login.loginAs': 'Login as {role}',
    'login.emailPlaceholder': 'Email',
    'login.passwordPlaceholder': 'Password',
    'login.phonePlaceholder': 'Phone Number',
    'login.loginButton': 'Login',
    'login.signupPrompt': "Don't have an account? ",
    'login.signupLink': 'Sign Up',
    'login.loginFailed': 'Login Failed',
    'login.invalidCredentials': 'Invalid credentials',
    'login.invalidPhone': 'Invalid phone number',

    // Passenger Signup
    'signup.title': 'Passenger Sign Up',
    'signup.namePlaceholder': 'Name',
    'signup.phonePlaceholder': 'Phone Number',
    'signup.signupButton': 'Sign Up',
    'signup.loginPrompt': 'Already have an account? Login',
    'signup.success': 'Signup Successful',
    'signup.successMessage': 'You can now login with your phone number.',
    'signup.failed': 'Signup Failed',
    'signup.errorMessage': 'An error occurred during signup.',

    // Passenger Dashboard
    'passenger.title': 'Passenger Dashboard',
    'passenger.searchBus': 'Search your bus (by bus number)...',
    'passenger.selectedRoute': 'Selected Route',
    'passenger.start': 'Start',
    'passenger.end': 'End',
    'passenger.totalStops': 'Total stops',
    'passenger.filterBus': 'Filter Bus Locations',
    'passenger.lastKnown': 'Last Known',
    'passenger.alert': 'Alert',
    'passenger.all': 'All',
    'passenger.liveBusLocations': 'Live Bus Locations',
    'passenger.busETA': 'Bus {busNumber} ETA: {eta} min',
    'passenger.callIVR': 'Call IVR for ETA',
    'passenger.alerts': 'Alerts',
    'passenger.noActiveAlerts': 'No active alerts',
    'passenger.routes': 'Routes',
    'passenger.noRoutesAvailable': 'No routes available',
    'passenger.nearbyStops': 'Nearby Stops',
    'passenger.turnOnLocation': 'Turn on location to see nearby stops',
    'passenger.stopsTimeline': 'Stops Timeline',
    'passenger.menu': 'Menu',
    'passenger.useMyLocation': 'Use My Location',
    'passenger.showTraffic': 'Show Traffic',
    'passenger.hideTraffic': 'Hide Traffic',
    'passenger.emergencySOS': 'Emergency SOS',
    'passenger.sosTitle': 'Emergency SOS',
    'passenger.sosMessage': 'This will call emergency services (100). Are you sure you want to proceed?',
    'passenger.sosCall': 'Call Emergency',
    'passenger.active': 'Active',
    'passenger.refresh': 'Refresh',
    'passenger.refreshing': 'Refreshing...',
    'passenger.bus': 'Bus',
    'passenger.eta': 'ETA',
    'passenger.logout': 'Logout',

    // Chatbot
    'chatbot.title': 'Assistant',
    'chatbot.back': '← Back',
    'chatbot.welcomeAdmin': 'Welcome, Admin 👋',
    'chatbot.welcomePassenger': 'Welcome aboard 👋',
    'chatbot.subtitleAdmin': 'Guide to manage routes, buses, drivers, and reports.',
    'chatbot.subtitlePassenger': 'Guide to live tracking, ETA, search, and alerts.',
    'chatbot.howCanIHelp': 'How can I help?',
    'chatbot.showTutorial': 'Show Tutorial',
    'chatbot.clear': 'Clear',
    'chatbot.typing': 'Typing...',
    
    // Chatbot Topics - Admin
    'chatbot.admin.routes': 'Manage Routes & Stops',
    'chatbot.admin.buses': 'Assign Buses & Drivers',
    'chatbot.admin.live': 'Driver Live Locations',
    'chatbot.admin.reports': 'Reports & Analytics',
    'chatbot.admin.offline': 'Offline & Sync',
    'chatbot.admin.faq': 'FAQs',
    
    // Chatbot Topics - Passenger
    'chatbot.passenger.live': 'Live Bus Location',
    'chatbot.passenger.eta': 'Check ETA',
    'chatbot.passenger.search': 'Search Routes & Stops',
    'chatbot.passenger.notify': 'Notifications & Alerts',
    'chatbot.passenger.offline': 'Offline Mode',
    'chatbot.passenger.faq': 'FAQs',
    
    // Chatbot Responses - Admin
    'chatbot.responses.admin.routes.1': 'Add a route: Admin > Route Management > enter name, duration, draw route on map, add stops > Add Route.',
    'chatbot.responses.admin.routes.2': 'Edit/delete: open a route card > Edit or Delete.',
    'chatbot.responses.admin.routes.3': 'Bulk/file upload: use File Upload to import stops per route. Accepted: CSV/XLSX.',
    'chatbot.responses.admin.routes.4': 'Add a new stop quickly: switch to Add Stops mode on the map and tap to place.',
    'chatbot.responses.admin.buses.1': 'Add bus: Admin > Bus Management > bus number, reg. no, capacity > Add Bus.',
    'chatbot.responses.admin.buses.2': 'Assign driver/route: pick from dropdowns while adding/editing a bus.',
    'chatbot.responses.admin.buses.3': 'File upload: CSV/XLSX with busNumber, reg_no, capacity, optional route_id/route_name, driverId.',
    'chatbot.responses.admin.live.1': 'Live monitoring: Admin > Live Monitoring shows driver locations updated from the driver app.',
    'chatbot.responses.admin.live.2': 'Troubleshooting: ensure driver is online with GPS enabled. Last known location may display when offline.',
    'chatbot.responses.admin.reports.1': 'Reports include route usage, occupancy, and driver performance (if enabled).',
    'chatbot.responses.admin.reports.2': 'Export options depend on your deployment. Ask for enablement if missing.',
    'chatbot.responses.admin.offline.1': 'Offline mode uses an Outbox. Your actions queue locally and sync when online.',
    'chatbot.responses.admin.offline.2': 'You can add/update entities offline; they will be sent automatically later.',
    'chatbot.responses.admin.faq.1': 'Why is a bus not moving? The driver may be offline or has GPS disabled; map shows last update.',
    'chatbot.responses.admin.faq.2': 'How to add a stop? Route Management > Add Stops mode > tap map > Save.',
    'chatbot.responses.admin.faq.3': 'How to test offline on mobile? Disable network; perform actions; reconnect to see them sync.',
    
    // Chatbot Responses - Passenger
    'chatbot.responses.passenger.eta.1': 'ETA combines planned route timing with recent driver location updates.',
    'chatbot.responses.passenger.eta.2': 'If the driver is offline, ETA uses last known position and schedule as fallback.',
    'chatbot.responses.passenger.search.1': 'Search by route name or stop: open the search bar and type; results filter as you type.',
    'chatbot.responses.passenger.notify.1': 'Enable notifications to get arrival/delay alerts for selected routes and stops.',
    
    // Floating Assistant
    'assistant.admin': 'Admin',
    'assistant.you': 'You',

    // Passenger Profile
    'profile.title': 'My Profile',
    'profile.tapAvatar': 'Tap avatar to change',
    'profile.account': 'Account',
    'profile.nameLabel': 'Name',
    'profile.namePlaceholder': 'Your name',
    'profile.phoneLabel': 'Phone',
    'profile.phonePlaceholder': 'Your phone',
    'profile.saveChanges': 'Save Changes',
    'profile.security': 'Security',
    'profile.securityMessage': 'Passwordless login by phone. OTP to be added later.',
    'profile.saved': 'Saved',
    'profile.updated': 'Profile updated',
    'profile.failed': 'Failed to load profile',
    'profile.saveError': 'Failed to save profile',
    'profile.permission': 'Permission',
    'profile.mediaPermission': 'Media permission is required',

    // Admin Dashboard
    'admin.welcome': 'Welcome to Admin',
    'admin.logout': 'Logout',
    'admin.title': 'Admin Dashboard',
    'admin.menu': 'Admin Menu',
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
    'admin.liveMonitoring': 'Admin Dashboard • Live Monitoring',
    'admin.busStatusLegend': 'Bus Status Legend',
    'admin.debugInfo': 'Debug: {total} buses total ({active} active, {lastKnown} last known) | User: {userStatus}',
    'admin.located': 'Located',
    'admin.notLocated': 'Not located',

    // Driver Management
    'driver.add': 'Add Driver',
    'driver.update': 'Update Driver',
    'driver.form.name': 'Driver Name',
    'driver.form.email': 'Email',
    'driver.form.password': 'Password',
    'driver.form.driverId': 'Driver ID (from transport office)',
    'driver.form.busId': 'Assigned Bus ID or Number (optional)',
    'driver.list.title': 'Existing Drivers',
    'driver.list.empty': 'No drivers added yet.',
    'driver.searchPlaceholder': 'Search by name, email or driverId',
    'driver.viewAll': 'View All',
    'driver.searchHint': 'Start typing to search drivers or tap View All.',
    'driver.driverName': 'Driver Name',
    'driver.driverId': 'Driver ID',
    'driver.email': 'Email',
    'driver.fileUpload': 'File Upload (CSV/XLSX)',
    'driver.uploadHint': 'Required: driverId, name, email, password. Optional: busId/busNumber/regNo',
    'driver.uploadCSV': 'Upload CSV',
    'driver.addDriver': 'Add Driver',
    'driver.viewDrivers': 'View Drivers',
    'driver.uploadFile': 'Upload File',
    'driver.createdSuccess': 'Driver created successfully!',
    'driver.uploadSuccess': 'Drivers uploaded.',
    'driver.uploadFailed': 'Upload failed. Ensure required columns are present.',
    'driver.deleteTitle': 'Delete Driver',
    'driver.deleteMessage': 'Are you sure you want to delete this driver?',
    'driver.deleteConfirm': 'Delete',
    'driver.fillAllFields': 'Please fill in all fields (Name, Email, Password, Driver ID).',
    'driver.fillAllFieldsUpdate': 'Please fill in all fields (Name, Email) and select a driver to update.',
    'driver.createError': 'Failed to create driver. Stored offline if applicable.',
    'driver.updateError': 'Failed to update driver. Stored offline if applicable.',
    'driver.deleteError': 'Failed to delete driver. Stored offline if applicable.',
    'driver.syncError': 'Failed to sync driver {name}.',

    // Driver Dashboard
    'driver.header.title': 'Driver Dashboard',
    'driver.header.sub': 'Fleet Management',
    'driver.assigned.title': 'Assigned Vehicle',
    'driver.labels.busNumber': 'Bus Number:',
    'driver.labels.registration': 'Registration:',
    'driver.labels.route': 'Route:',
    'driver.live.title': 'Live Tracking',
    'driver.live.toggle': 'GPS Location Tracking',
    'driver.live.on': 'Your location is being tracked',
    'driver.live.off': 'Location tracking is disabled',
    'driver.status.active': 'Active',
    'driver.alerts.title': 'Active Alerts',
    'driver.alerts.none.title': 'No active alerts',
    'driver.alerts.none.sub': 'All systems operating normally',
    'driver.permissionDenied': 'Permission Denied',
    'driver.locationPermission': 'Location access is needed to enable tracking.',
    'driver.fetchError': 'Failed to fetch driver data.',
    'driver.brand': 'BusBee',

    // Bus Management
    'bus.add': 'Add Bus',
    'bus.update': 'Update Bus',
    'bus.form.busNumber': 'Bus Number',
    'bus.form.regNo': 'Reg. No',
    'bus.form.capacity': 'Capacity',

    // Alerts
    'alerts.send': 'Send Alert',
    'alerts.recent': 'Recent Alerts',
    'alerts.bulk': 'Bulk Delete Options',
    'alerts.title': 'Alerts',
    'alerts.noActive': 'No active alerts',

    // Language Options
    'lang.english': 'English',
    'lang.hindi': 'हिन्दी',
    'lang.punjabi': 'ਪੰਜਾਬੀ',
    'lang.tamil': 'தமிழ்',
  },
  hi: {
    // Common strings
    'common.refresh': 'रीफ्रेश',
    'common.allRoutes': 'सभी रूट',
    'common.cancel': 'रद्द करें',
    'common.save': 'सहेजें',
    'common.edit': 'संपादित करें',
    'common.delete': 'हटाएं',
    'common.add': 'जोड़ें',
    'common.update': 'अपडेट करें',
    'common.search': 'खोजें',
    'common.loading': 'लोड हो रहा है...',
    'common.error': 'त्रुटि',
    'common.success': 'सफलता',
    'common.online': 'ऑनलाइन',
    'common.offline': 'ऑफलाइन',
    'common.active': 'सक्रिय',
    'common.inactive': 'निष्क्रिय',
    'common.yes': 'हाँ',
    'common.no': 'नहीं',
    'common.ok': 'ठीक है',
    'common.back': '← वापस',
    'common.next': 'अगला',
    'common.previous': 'पिछला',
    'common.close': 'बंद करें',
    'common.menu': 'मेनू',
    'common.settings': 'सेटिंग्स',
    'common.profile': 'प्रोफाइल',
    'common.logout': 'लॉगआउट',
    'common.login': 'लॉगिन',
    'common.signup': 'साइन अप',
    'common.email': 'ईमेल',
    'common.password': 'पासवर्ड',
    'common.name': 'नाम',
    'common.phone': 'फोन नंबर',
    'common.role': 'भूमिका',
    'common.admin': 'एडमिन',
    'common.driver': 'ड्राइवर',
    'common.passenger': 'यात्री',

    // Navigation
    'nav.back': '← वापस',
    'nav.home': 'होम',
    'nav.explore': 'एक्सप्लोर',

    // Login Screen
    'login.welcome': 'वापस स्वागत है',
    'login.subtitle': 'जारी रखने के लिए साइन इन करें',
    'login.loginAs': '{role} के रूप में लॉगिन करें',
    'login.emailPlaceholder': 'ईमेल',
    'login.passwordPlaceholder': 'पासवर्ड',
    'login.phonePlaceholder': 'फोन नंबर',
    'login.loginButton': 'लॉगिन',
    'login.signupPrompt': 'खाता नहीं है? ',
    'login.signupLink': 'साइन अप',
    'login.loginFailed': 'लॉगिन असफल',
    'login.invalidCredentials': 'अमान्य क्रेडेंशियल्स',
    'login.invalidPhone': 'अमान्य फोन नंबर',

    // Passenger Signup
    'signup.title': 'यात्री साइन अप',
    'signup.namePlaceholder': 'नाम',
    'signup.phonePlaceholder': 'फोन नंबर',
    'signup.signupButton': 'साइन अप',
    'signup.loginPrompt': 'पहले से खाता है? लॉगिन',
    'signup.success': 'साइन अप सफल',
    'signup.successMessage': 'अब आप अपने फोन नंबर से लॉगिन कर सकते हैं।',
    'signup.failed': 'साइन अप असफल',
    'signup.errorMessage': 'साइन अप के दौरान त्रुटि हुई।',

    // Passenger Dashboard
    'passenger.title': 'यात्री डैशबोर्ड',
    'passenger.searchBus': 'अपनी बस खोजें (बस नंबर से)...',
    'passenger.selectedRoute': 'चयनित रूट',
    'passenger.start': 'शुरुआत',
    'passenger.end': 'अंत',
    'passenger.totalStops': 'कुल स्टॉप',
    'passenger.filterBus': 'बस लोकेशन फिल्टर करें',
    'passenger.lastKnown': 'अंतिम ज्ञात',
    'passenger.alert': 'अलर्ट',
    'passenger.all': 'सभी',
    'passenger.liveBusLocations': 'लाइव बस लोकेशन',
    'passenger.busETA': 'बस {busNumber} ETA: {eta} मिनट',
    'passenger.callIVR': 'ETA के लिए IVR कॉल करें',
    'passenger.alerts': 'अलर्ट',
    'passenger.noActiveAlerts': 'कोई सक्रिय अलर्ट नहीं',
    'passenger.routes': 'रूट',
    'passenger.noRoutesAvailable': 'कोई रूट उपलब्ध नहीं',
    'passenger.nearbyStops': 'पास के स्टॉप',
    'passenger.turnOnLocation': 'पास के स्टॉप देखने के लिए लोकेशन चालू करें',
    'passenger.stopsTimeline': 'स्टॉप टाइमलाइन',
    'passenger.menu': 'मेनू',
    'passenger.useMyLocation': 'मेरा लोकेशन उपयोग करें',
    'passenger.showTraffic': 'ट्रैफिक दिखाएं',
    'passenger.hideTraffic': 'ट्रैफिक छुपाएं',
    'passenger.emergencySOS': 'इमरजेंसी SOS',
    'passenger.sosTitle': 'इमरजेंसी SOS',
    'passenger.sosMessage': 'यह इमरजेंसी सेवाओं (100) को कॉल करेगा। क्या आप आगे बढ़ना चाहते हैं?',
    'passenger.sosCall': 'इमरजेंसी कॉल करें',
    'passenger.active': 'सक्रिय',
    'passenger.refresh': 'रीफ्रेश',
    'passenger.refreshing': 'रीफ्रेश हो रहा है...',
    'passenger.bus': 'बस',
    'passenger.eta': 'ETA',
    'passenger.logout': 'लॉगआउट',

    // Chatbot
    'chatbot.title': 'सहायक',
    'chatbot.back': '← वापस',
    'chatbot.welcomeAdmin': 'स्वागत है, एडमिन 👋',
    'chatbot.welcomePassenger': 'आपका स्वागत है 👋',
    'chatbot.subtitleAdmin': 'रूट, बस, ड्राइवर और रिपोर्ट प्रबंधन के लिए गाइड।',
    'chatbot.subtitlePassenger': 'लाइव ट्रैकिंग, ETA, खोज और अलर्ट के लिए गाइड।',
    'chatbot.howCanIHelp': 'मैं कैसे मदद कर सकता हूं?',
    'chatbot.showTutorial': 'ट्यूटोरियल दिखाएं',
    'chatbot.clear': 'साफ करें',
    'chatbot.typing': 'टाइप कर रहे हैं...',
    
    // Chatbot Topics - Admin
    'chatbot.admin.routes': 'रूट और स्टॉप प्रबंधन',
    'chatbot.admin.buses': 'बस और ड्राइवर असाइन करें',
    'chatbot.admin.live': 'ड्राइवर लाइव लोकेशन',
    'chatbot.admin.reports': 'रिपोर्ट और एनालिटिक्स',
    'chatbot.admin.offline': 'ऑफलाइन और सिंक',
    'chatbot.admin.faq': 'सामान्य प्रश्न',
    
    // Chatbot Topics - Passenger
    'chatbot.passenger.live': 'लाइव बस लोकेशन',
    'chatbot.passenger.eta': 'ETA जांचें',
    'chatbot.passenger.search': 'रूट और स्टॉप खोजें',
    'chatbot.passenger.notify': 'नोटिफिकेशन और अलर्ट',
    'chatbot.passenger.offline': 'ऑफलाइन मोड',
    'chatbot.passenger.faq': 'सामान्य प्रश्न',
    
    // Chatbot Responses - Admin
    'chatbot.responses.admin.routes.1': 'रूट जोड़ें: एडमिन > रूट प्रबंधन > नाम, अवधि दर्ज करें, मैप पर रूट बनाएं, स्टॉप जोड़ें > रूट जोड़ें।',
    'chatbot.responses.admin.routes.2': 'संपादित/हटाएं: रूट कार्ड खोलें > संपादित करें या हटाएं।',
    'chatbot.responses.admin.routes.3': 'बल्क/फाइल अपलोड: प्रति रूट स्टॉप आयात करने के लिए फाइल अपलोड का उपयोग करें। स्वीकृत: CSV/XLSX।',
    'chatbot.responses.admin.routes.4': 'नया स्टॉप जल्दी जोड़ें: मैप पर स्टॉप जोड़ें मोड पर स्विच करें और टैप करें > सेव करें।',
    'chatbot.responses.admin.buses.1': 'बस जोड़ें: एडमिन > बस प्रबंधन > बस नंबर, रजिस्ट्रेशन नंबर, क्षमता > बस जोड़ें।',
    'chatbot.responses.admin.buses.2': 'ड्राइवर/रूट असाइन करें: बस जोड़ते/संपादित करते समय ड्रॉपडाउन से चुनें।',
    'chatbot.responses.admin.buses.3': 'फाइल अपलोड: busNumber, reg_no, capacity, वैकल्पिक route_id/route_name, driverId के साथ CSV/XLSX।',
    'chatbot.responses.admin.live.1': 'लाइव मॉनिटरिंग: एडमिन > लाइव मॉनिटरिंग ड्राइवर ऐप से अपडेट किए गए ड्राइवर लोकेशन दिखाता है।',
    'chatbot.responses.admin.live.2': 'समस्या निवारण: सुनिश्चित करें कि ड्राइवर GPS सक्षम के साथ ऑनलाइन है। ऑफलाइन होने पर अंतिम ज्ञात लोकेशन दिखाई दे सकता है।',
    'chatbot.responses.admin.reports.1': 'रिपोर्ट में रूट उपयोग, अधिभोग और ड्राइवर प्रदर्शन शामिल है (यदि सक्षम है)।',
    'chatbot.responses.admin.reports.2': 'निर्यात विकल्प आपके डेप्लॉयमेंट पर निर्भर करते हैं। यदि गायब है तो सक्षम करने के लिए पूछें।',
    'chatbot.responses.admin.offline.1': 'ऑफलाइन मोड एक आउटबॉक्स का उपयोग करता है। आपकी क्रियाएं स्थानीय रूप से कतारबद्ध होती हैं और ऑनलाइन होने पर सिंक होती हैं।',
    'chatbot.responses.admin.offline.2': 'आप ऑफलाइन इकाइयों को जोड़/अपडेट कर सकते हैं; वे बाद में स्वचालित रूप से भेजी जाएंगी।',
    'chatbot.responses.admin.faq.1': 'बस क्यों नहीं चल रही? ड्राइवर ऑफलाइन हो सकता है या GPS अक्षम है; मैप अंतिम अपडेट दिखाता है।',
    'chatbot.responses.admin.faq.2': 'स्टॉप कैसे जोड़ें? रूट प्रबंधन > स्टॉप जोड़ें मोड > मैप टैप करें > सेव करें।',
    'chatbot.responses.admin.faq.3': 'मोबाइल पर ऑफलाइन कैसे टेस्ट करें? नेटवर्क अक्षम करें; क्रियाएं करें; उन्हें सिंक होते देखने के लिए पुन: कनेक्ट करें।',
    
    // Chatbot Responses - Passenger
    'chatbot.responses.passenger.eta.1': 'ETA नियोजित रूट टाइमिंग को हाल के ड्राइवर लोकेशन अपडेट के साथ जोड़ता है।',
    'chatbot.responses.passenger.eta.2': 'यदि ड्राइवर ऑफलाइन है, तो ETA फॉलबैक के रूप में अंतिम ज्ञात स्थिति और शेड्यूल का उपयोग करता है।',
    'chatbot.responses.passenger.search.1': 'रूट नाम या स्टॉप से खोजें: खोज बार खोलें और टाइप करें; आप टाइप करते समय परिणाम फिल्टर होते हैं।',
    'chatbot.responses.passenger.notify.1': 'चयनित रूट और स्टॉप के लिए आगमन/देरी अलर्ट प्राप्त करने के लिए नोटिफिकेशन सक्षम करें।',
    
    // Floating Assistant
    'assistant.admin': 'एडमिन',
    'assistant.you': 'आप',

    // Passenger Profile
    'profile.title': 'मेरा प्रोफाइल',
    'profile.tapAvatar': 'बदलने के लिए अवतार टैप करें',
    'profile.account': 'खाता',
    'profile.nameLabel': 'नाम',
    'profile.namePlaceholder': 'आपका नाम',
    'profile.phoneLabel': 'फोन',
    'profile.phonePlaceholder': 'आपका फोन',
    'profile.saveChanges': 'परिवर्तन सहेजें',
    'profile.security': 'सुरक्षा',
    'profile.securityMessage': 'फोन से पासवर्ड रहित लॉगिन। OTP बाद में जोड़ा जाएगा।',
    'profile.saved': 'सहेजा गया',
    'profile.updated': 'प्रोफाइल अपडेट',
    'profile.failed': 'प्रोफाइल लोड करने में असफल',
    'profile.saveError': 'प्रोफाइल सहेजने में असफल',
    'profile.permission': 'अनुमति',
    'profile.mediaPermission': 'मीडिया अनुमति आवश्यक है',

    // Admin Dashboard
    'admin.welcome': 'प्रशासन में आपका स्वागत है',
    'admin.logout': 'लॉगआउट',
    'admin.title': 'एडमिन डैशबोर्ड',
    'admin.menu': 'एडमिन मेनू',
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
    'admin.liveMonitoring': 'एडमिन डैशबोर्ड • लाइव मॉनिटरिंग',
    'admin.busStatusLegend': 'बस स्टेटस लेजेंड',
    'admin.debugInfo': 'डिबग: {total} बसें कुल ({active} सक्रिय, {lastKnown} अंतिम ज्ञात) | यूजर: {userStatus}',
    'admin.located': 'लोकेटेड',
    'admin.notLocated': 'लोकेटेड नहीं',

    // Driver Management
    'driver.add': 'ड्राइवर जोड़ें',
    'driver.update': 'ड्राइवर अपडेट करें',
    'driver.form.name': 'ड्राइवर का नाम',
    'driver.form.email': 'ईमेल',
    'driver.form.password': 'पासवर्ड',
    'driver.form.driverId': 'ड्राइवर आईडी (परिवहन कार्यालय से)',
    'driver.form.busId': 'आवंटित बस आईडी/नंबर (वैकल्पिक)',
    'driver.list.title': 'मौजूदा ड्राइवर',
    'driver.list.empty': 'अभी कोई ड्राइवर नहीं जोड़ा गया।',
    'driver.searchPlaceholder': 'नाम, ईमेल या driverId से खोजें',
    'driver.viewAll': 'सभी देखें',
    'driver.searchHint': 'ड्राइवर खोजने के लिए टाइप करना शुरू करें या सभी देखें टैप करें।',
    'driver.driverName': 'ड्राइवर का नाम',
    'driver.driverId': 'ड्राइवर आईडी',
    'driver.email': 'ईमेल',
    'driver.fileUpload': 'फाइल अपलोड (CSV/XLSX)',
    'driver.uploadHint': 'आवश्यक: driverId, name, email, password। वैकल्पिक: busId/busNumber/regNo',
    'driver.uploadCSV': 'CSV अपलोड करें',
    'driver.addDriver': 'ड्राइवर जोड़ें',
    'driver.viewDrivers': 'ड्राइवर देखें',
    'driver.uploadFile': 'फाइल अपलोड करें',
    'driver.createdSuccess': 'ड्राइवर सफलतापूर्वक बनाया गया!',
    'driver.uploadSuccess': 'ड्राइवर अपलोड किए गए।',
    'driver.uploadFailed': 'अपलोड असफल। सुनिश्चित करें कि आवश्यक कॉलम मौजूद हैं।',
    'driver.deleteTitle': 'ड्राइवर हटाएं',
    'driver.deleteMessage': 'क्या आप वाकई इस ड्राइवर को हटाना चाहते हैं?',
    'driver.deleteConfirm': 'हटाएं',
    'driver.fillAllFields': 'कृपया सभी फील्ड भरें (नाम, ईमेल, पासवर्ड, ड्राइवर आईडी)।',
    'driver.fillAllFieldsUpdate': 'कृपया सभी फील्ड भरें (नाम, ईमेल) और अपडेट करने के लिए ड्राइवर चुनें।',
    'driver.createError': 'ड्राइवर बनाने में असफल। यदि लागू हो तो ऑफलाइन स्टोर किया गया।',
    'driver.updateError': 'ड्राइवर अपडेट करने में असफल। यदि लागू हो तो ऑफलाइन स्टोर किया गया।',
    'driver.deleteError': 'ड्राइवर हटाने में असफल। यदि लागू हो तो ऑफलाइन स्टोर किया गया।',
    'driver.syncError': 'ड्राइवर {name} सिंक करने में असफल।',

    // Driver Dashboard
    'driver.header.title': 'ड्राइवर डैशबोर्ड',
    'driver.header.sub': 'फ्लीट प्रबंधन',
    'driver.assigned.title': 'आवंटित वाहन',
    'driver.labels.busNumber': 'बस नंबर:',
    'driver.labels.registration': 'पंजीकरण:',
    'driver.labels.route': 'रूट:',
    'driver.live.title': 'लाइव ट्रैकिंग',
    'driver.live.toggle': 'जीपीएस लोकेशन ट्रैकिंग',
    'driver.live.on': 'आपका लोकेशन ट्रैक किया जा रहा है',
    'driver.live.off': 'लोकेशन ट्रैकिंग बंद है',
    'driver.status.active': 'सक्रिय',
    'driver.alerts.title': 'सक्रिय अलर्ट',
    'driver.alerts.none.title': 'कोई सक्रिय अलर्ट नहीं',
    'driver.alerts.none.sub': 'सभी सिस्टम सामान्य रूप से चल रहे हैं',
    'driver.permissionDenied': 'अनुमति अस्वीकृत',
    'driver.locationPermission': 'ट्रैकिंग सक्षम करने के लिए लोकेशन एक्सेस आवश्यक है।',
    'driver.fetchError': 'ड्राइवर डेटा प्राप्त करने में असफल।',
    'driver.brand': 'BusBee',

    // Bus Management
    'bus.add': 'बस जोड़ें',
    'bus.update': 'बस अपडेट करें',
    'bus.form.busNumber': 'बस नंबर',
    'bus.form.regNo': 'रजिस्ट्रेशन नंबर',
    'bus.form.capacity': 'क्षमता',

    // Alerts
    'alerts.send': 'अलर्ट भेजें',
    'alerts.recent': 'हाल के अलर्ट',
    'alerts.bulk': 'बल्क डिलीट विकल्प',
    'alerts.title': 'अलर्ट',
    'alerts.noActive': 'कोई सक्रिय अलर्ट नहीं',

    // Language Options
    'lang.english': 'English',
    'lang.hindi': 'हिन्दी',
    'lang.punjabi': 'ਪੰਜਾਬੀ',
    'lang.tamil': 'தமிழ்',
  },
  pa: {
    // Common strings
    'common.refresh': 'ਰੀਫਰੈਸ਼',
    'common.allRoutes': 'ਸਾਰੇ ਰੂਟ',
    'common.cancel': 'ਰੱਦ ਕਰੋ',
    'common.save': 'ਸੇਵ ਕਰੋ',
    'common.edit': 'ਸੰਪਾਦਨ ਕਰੋ',
    'common.delete': 'ਮਿਟਾਓ',
    'common.add': 'ਸ਼ਾਮਲ ਕਰੋ',
    'common.update': 'ਅੱਪਡੇਟ ਕਰੋ',
    'common.search': 'ਖੋਜੋ',
    'common.loading': 'ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...',
    'common.error': 'ਗਲਤੀ',
    'common.success': 'ਸਫਲਤਾ',
    'common.online': 'ਔਨਲਾਈਨ',
    'common.offline': 'ਔਫਲਾਈਨ',
    'common.active': 'ਸਕ੍ਰਿਯ',
    'common.inactive': 'ਨਿਸਕ੍ਰਿਯ',
    'common.yes': 'ਹਾਂ',
    'common.no': 'ਨਹੀਂ',
    'common.ok': 'ਠੀਕ ਹੈ',
    'common.back': '← ਵਾਪਸ',
    'common.next': 'ਅਗਲਾ',
    'common.previous': 'ਪਿਛਲਾ',
    'common.close': 'ਬੰਦ ਕਰੋ',
    'common.menu': 'ਮੇਨੂ',
    'common.settings': 'ਸੈਟਿੰਗਾਂ',
    'common.profile': 'ਪ੍ਰੋਫਾਈਲ',
    'common.logout': 'ਲਾੱਗ ਆਉਟ',
    'common.login': 'ਲਾਗਿਨ',
    'common.signup': 'ਸਾਈਨ ਅੱਪ',
    'common.email': 'ਈਮੇਲ',
    'common.password': 'ਪਾਸਵਰਡ',
    'common.name': 'ਨਾਮ',
    'common.phone': 'ਫੋਨ ਨੰਬਰ',
    'common.role': 'ਭੂਮਿਕਾ',
    'common.admin': 'ਐਡਮਿਨ',
    'common.driver': 'ਡਰਾਈਵਰ',
    'common.passenger': 'ਯਾਤਰੀ',

    // Navigation
    'nav.back': '← ਵਾਪਸ',
    'nav.home': 'ਹੋਮ',
    'nav.explore': 'ਐਕਸਪਲੋਰ',

    // Login Screen
    'login.welcome': 'ਵਾਪਸ ਸਵਾਗਤ ਹੈ',
    'login.subtitle': 'ਜਾਰੀ ਰੱਖਣ ਲਈ ਸਾਈਨ ਇਨ ਕਰੋ',
    'login.loginAs': '{role} ਵਜੋਂ ਲਾਗਿਨ ਕਰੋ',
    'login.emailPlaceholder': 'ਈਮੇਲ',
    'login.passwordPlaceholder': 'ਪਾਸਵਰਡ',
    'login.phonePlaceholder': 'ਫੋਨ ਨੰਬਰ',
    'login.loginButton': 'ਲਾਗਿਨ',
    'login.signupPrompt': 'ਖਾਤਾ ਨਹੀਂ ਹੈ? ',
    'login.signupLink': 'ਸਾਈਨ ਅੱਪ',
    'login.loginFailed': 'ਲਾਗਿਨ ਅਸਫਲ',
    'login.invalidCredentials': 'ਗਲਤ ਕ੍ਰੈਡੈਂਸ਼ੀਅਲ',
    'login.invalidPhone': 'ਗਲਤ ਫੋਨ ਨੰਬਰ',

    // Passenger Signup
    'signup.title': 'ਯਾਤਰੀ ਸਾਈਨ ਅੱਪ',
    'signup.namePlaceholder': 'ਨਾਮ',
    'signup.phonePlaceholder': 'ਫੋਨ ਨੰਬਰ',
    'signup.signupButton': 'ਸਾਈਨ ਅੱਪ',
    'signup.loginPrompt': 'ਪਹਿਲਾਂ ਤੋਂ ਖਾਤਾ ਹੈ? ਲਾਗਿਨ',
    'signup.success': 'ਸਾਈਨ ਅੱਪ ਸਫਲ',
    'signup.successMessage': 'ਹੁਣ ਤੁਸੀਂ ਆਪਣੇ ਫੋਨ ਨੰਬਰ ਨਾਲ ਲਾਗਿਨ ਕਰ ਸਕਦੇ ਹੋ।',
    'signup.failed': 'ਸਾਈਨ ਅੱਪ ਅਸਫਲ',
    'signup.errorMessage': 'ਸਾਈਨ ਅੱਪ ਦੌਰਾਨ ਗਲਤੀ ਹੋਈ।',

    // Passenger Dashboard
    'passenger.title': 'ਯਾਤਰੀ ਡੈਸ਼ਬੋਰਡ',
    'passenger.searchBus': 'ਆਪਣੀ ਬੱਸ ਖੋਜੋ (ਬੱਸ ਨੰਬਰ ਨਾਲ)...',
    'passenger.selectedRoute': 'ਚੁਣਿਆ ਗਿਆ ਰੂਟ',
    'passenger.start': 'ਸ਼ੁਰੂ',
    'passenger.end': 'ਅੰਤ',
    'passenger.totalStops': 'ਕੁੱਲ ਸਟਾਪ',
    'passenger.filterBus': 'ਬੱਸ ਟਿਕਾਣੇ ਫਿਲਟਰ ਕਰੋ',
    'passenger.lastKnown': 'ਆਖਰੀ ਜਾਣਿਆ ਗਿਆ',
    'passenger.alert': 'ਅਲਰਟ',
    'passenger.all': 'ਸਾਰੇ',
    'passenger.liveBusLocations': 'ਲਾਈਵ ਬੱਸ ਟਿਕਾਣੇ',
    'passenger.busETA': 'ਬੱਸ {busNumber} ETA: {eta} ਮਿੰਟ',
    'passenger.callIVR': 'ETA ਲਈ IVR ਕਾਲ ਕਰੋ',
    'passenger.alerts': 'ਅਲਰਟ',
    'passenger.noActiveAlerts': 'ਕੋਈ ਸਕ੍ਰਿਯ ਅਲਰਟ ਨਹੀਂ',
    'passenger.routes': 'ਰੂਟ',
    'passenger.noRoutesAvailable': 'ਕੋਈ ਰੂਟ ਉਪਲਬਧ ਨਹੀਂ',
    'passenger.nearbyStops': 'ਨੇੜਲੇ ਸਟਾਪ',
    'passenger.turnOnLocation': 'ਨੇੜਲੇ ਸਟਾਪ ਦੇਖਣ ਲਈ ਟਿਕਾਣਾ ਚਾਲੂ ਕਰੋ',
    'passenger.stopsTimeline': 'ਸਟਾਪ ਟਾਈਮਲਾਈਨ',
    'passenger.menu': 'ਮੇਨੂ',
    'passenger.useMyLocation': 'ਮੇਰਾ ਟਿਕਾਣਾ ਵਰਤੋ',
    'passenger.showTraffic': 'ਟ੍ਰੈਫਿਕ ਦਿਖਾਓ',
    'passenger.hideTraffic': 'ਟ੍ਰੈਫਿਕ ਛੁਪਾਓ',
    'passenger.emergencySOS': 'ਐਮਰਜੈਂਸੀ SOS',
    'passenger.sosTitle': 'ਐਮਰਜੈਂਸੀ SOS',
    'passenger.sosMessage': 'ਇਹ ਐਮਰਜੈਂਸੀ ਸੇਵਾਵਾਂ (100) ਨੂੰ ਕਾਲ ਕਰੇਗਾ। ਕੀ ਤੁਸੀਂ ਅੱਗੇ ਵਧਣਾ ਚਾਹੁੰਦੇ ਹੋ?',
    'passenger.sosCall': 'ਐਮਰਜੈਂਸੀ ਕਾਲ ਕਰੋ',
    'passenger.active': 'ਸਕ੍ਰਿਯ',
    'passenger.refresh': 'ਰੀਫਰੈਸ਼',
    'passenger.refreshing': 'ਰੀਫਰੈਸ਼ ਹੋ ਰਿਹਾ ਹੈ...',
    'passenger.bus': 'ਬੱਸ',
    'passenger.eta': 'ETA',
    'passenger.logout': 'ਲਾੱਗ ਆਉਟ',

    // Chatbot
    'chatbot.title': 'ਸਹਾਇਕ',
    'chatbot.back': '← ਵਾਪਸ',
    'chatbot.welcomeAdmin': 'ਸਵਾਗਤ ਹੈ, ਐਡਮਿਨ 👋',
    'chatbot.welcomePassenger': 'ਆਪਣਾ ਸਵਾਗਤ ਹੈ 👋',
    'chatbot.subtitleAdmin': 'ਰੂਟ, ਬੱਸ, ਡਰਾਈਵਰ ਅਤੇ ਰਿਪੋਰਟ ਪ੍ਰਬੰਧਨ ਲਈ ਗਾਈਡ।',
    'chatbot.subtitlePassenger': 'ਲਾਈਵ ਟ੍ਰੈਕਿੰਗ, ETA, ਖੋਜ ਅਤੇ ਅਲਰਟ ਲਈ ਗਾਈਡ।',
    'chatbot.howCanIHelp': 'ਮੈਂ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?',
    'chatbot.showTutorial': 'ਟਿਊਟੋਰਿਯਲ ਦਿਖਾਓ',
    'chatbot.clear': 'ਸਾਫ਼ ਕਰੋ',
    'chatbot.typing': 'ਟਾਈਪ ਕਰ ਰਹੇ ਹਨ...',
    
    // Chatbot Topics - Admin
    'chatbot.admin.routes': 'ਰੂਟ ਅਤੇ ਸਟਾਪ ਪ੍ਰਬੰਧਨ',
    'chatbot.admin.buses': 'ਬੱਸ ਅਤੇ ਡਰਾਈਵਰ ਅਸਾਈਨ ਕਰੋ',
    'chatbot.admin.live': 'ਡਰਾਈਵਰ ਲਾਈਵ ਟਿਕਾਣੇ',
    'chatbot.admin.reports': 'ਰਿਪੋਰਟ ਅਤੇ ਵਿਸ਼ਲੇਸ਼ਣ',
    'chatbot.admin.offline': 'ਔਫਲਾਈਨ ਅਤੇ ਸਿੰਕ',
    'chatbot.admin.faq': 'ਅਕਸਰ ਪੁੱਛੇ ਜਾਣ ਵਾਲੇ ਸਵਾਲ',
    
    // Chatbot Topics - Passenger
    'chatbot.passenger.live': 'ਲਾਈਵ ਬੱਸ ਟਿਕਾਣਾ',
    'chatbot.passenger.eta': 'ETA ਜਾਂਚੋ',
    'chatbot.passenger.search': 'ਰੂਟ ਅਤੇ ਸਟਾਪ ਖੋਜੋ',
    'chatbot.passenger.notify': 'ਨੋਟੀਫਿਕੇਸ਼ਨ ਅਤੇ ਅਲਰਟ',
    'chatbot.passenger.offline': 'ਔਫਲਾਈਨ ਮੋਡ',
    'chatbot.passenger.faq': 'ਅਕਸਰ ਪੁੱਛੇ ਜਾਣ ਵਾਲੇ ਸਵਾਲ',
    
    // Floating Assistant
    'assistant.admin': 'ਐਡਮਿਨ',
    'assistant.you': 'ਤੁਸੀਂ',

    // Passenger Profile
    'profile.title': 'ਮੇਰਾ ਪ੍ਰੋਫਾਈਲ',
    'profile.tapAvatar': 'ਬਦਲਣ ਲਈ ਅਵਤਾਰ ਟੈਪ ਕਰੋ',
    'profile.account': 'ਖਾਤਾ',
    'profile.nameLabel': 'ਨਾਮ',
    'profile.namePlaceholder': 'ਤੁਹਾਡਾ ਨਾਮ',
    'profile.phoneLabel': 'ਫੋਨ',
    'profile.phonePlaceholder': 'ਤੁਹਾਡਾ ਫੋਨ',
    'profile.saveChanges': 'ਬਦਲਾਅ ਸੇਵ ਕਰੋ',
    'profile.security': 'ਸੁਰੱਖਿਆ',
    'profile.securityMessage': 'ਫੋਨ ਨਾਲ ਪਾਸਵਰਡ ਰਹਿਤ ਲਾਗਿਨ। OTP ਬਾਅਦ ਵਿੱਚ ਜੋੜਿਆ ਜਾਵੇਗਾ।',
    'profile.saved': 'ਸੇਵ ਕੀਤਾ ਗਿਆ',
    'profile.updated': 'ਪ੍ਰੋਫਾਈਲ ਅੱਪਡੇਟ',
    'profile.failed': 'ਪ੍ਰੋਫਾਈਲ ਲੋਡ ਕਰਨ ਵਿੱਚ ਅਸਫਲ',
    'profile.saveError': 'ਪ੍ਰੋਫਾਈਲ ਸੇਵ ਕਰਨ ਵਿੱਚ ਅਸਫਲ',
    'profile.permission': 'ਇਜਾਜ਼ਤ',
    'profile.mediaPermission': 'ਮੀਡੀਆ ਇਜਾਜ਼ਤ ਲੋੜੀਂਦੀ ਹੈ',

    // Admin Dashboard
    'admin.welcome': 'ਐਡਮਿਨ ਵਿੱਚ ਸੁਆਗਤ ਹੈ',
    'admin.logout': 'ਲਾੱਗ ਆਉਟ',
    'admin.title': 'ਐਡਮਿਨ ਡੈਸ਼ਬੋਰਡ',
    'admin.menu': 'ਐਡਮਿਨ ਮੇਨੂ',
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
    'admin.liveMonitoring': 'ਐਡਮਿਨ ਡੈਸ਼ਬੋਰਡ • ਲਾਈਵ ਮਾਨੀਟਰਿੰਗ',
    'admin.busStatusLegend': 'ਬੱਸ ਸਟੇਟਸ ਲੈਜੈਂਡ',
    'admin.debugInfo': 'ਡੀਬੱਗ: {total} ਬੱਸਾਂ ਕੁੱਲ ({active} ਸਕ੍ਰਿਯ, {lastKnown} ਆਖਰੀ ਜਾਣਿਆ ਗਿਆ) | ਯੂਜ਼ਰ: {userStatus}',
    'admin.located': 'ਲੋਕੇਟਡ',
    'admin.notLocated': 'ਲੋਕੇਟਡ ਨਹੀਂ',

    // Driver Management
    'driver.add': 'ਡਰਾਈਵਰ ਸ਼ਾਮਲ ਕਰੋ',
    'driver.update': 'ਡਰਾਈਵਰ ਅੱਪਡੇਟ ਕਰੋ',
    'driver.form.name': 'ਡਰਾਈਵਰ ਦਾ ਨਾਮ',
    'driver.form.email': 'ਈਮੇਲ',
    'driver.form.password': 'ਪਾਸਵਰਡ',
    'driver.form.driverId': 'ਡਰਾਈਵਰ ਆਈ.ਡੀ. (ਪਰਿਵਹਨ ਦਫ਼ਤਰ ਤੋਂ)',
    'driver.form.busId': 'ਨਿਰਧਾਰਿਤ ਬੱਸ ਆਈ.ਡੀ./ਨੰਬਰ (ਵਿਕਲਪਿਕ)',
    'driver.list.title': 'ਮੌਜੂਦਾ ਡਰਾਈਵਰ',
    'driver.list.empty': 'ਹਾਲੇ ਕੋਈ ਡਰਾਈਵਰ ਨਹੀਂ ਜੋੜਿਆ ਗਿਆ।',
    'driver.searchPlaceholder': 'ਨਾਮ, ਈਮੇਲ ਜਾਂ driverId ਨਾਲ ਖੋਜੋ',
    'driver.viewAll': 'ਸਾਰੇ ਦੇਖੋ',
    'driver.searchHint': 'ਡਰਾਈਵਰ ਖੋਜਣ ਲਈ ਟਾਈਪ ਕਰਨਾ ਸ਼ੁਰੂ ਕਰੋ ਜਾਂ ਸਾਰੇ ਦੇਖੋ ਟੈਪ ਕਰੋ।',
    'driver.driverName': 'ਡਰਾਈਵਰ ਦਾ ਨਾਮ',
    'driver.driverId': 'ਡਰਾਈਵਰ ਆਈ.ਡੀ.',
    'driver.email': 'ਈਮੇਲ',
    'driver.fileUpload': 'ਫਾਈਲ ਅੱਪਲੋਡ (CSV/XLSX)',
    'driver.uploadHint': 'ਲੋੜੀਂਦਾ: driverId, name, email, password। ਵਿਕਲਪਿਕ: busId/busNumber/regNo',
    'driver.uploadCSV': 'CSV ਅੱਪਲੋਡ ਕਰੋ',
    'driver.addDriver': 'ਡਰਾਈਵਰ ਸ਼ਾਮਲ ਕਰੋ',
    'driver.viewDrivers': 'ਡਰਾਈਵਰ ਦੇਖੋ',
    'driver.uploadFile': 'ਫਾਈਲ ਅੱਪਲੋਡ ਕਰੋ',
    'driver.createdSuccess': 'ਡਰਾਈਵਰ ਸਫਲਤਾਪੂਰਵਕ ਬਣਾਇਆ ਗਿਆ!',
    'driver.uploadSuccess': 'ਡਰਾਈਵਰ ਅੱਪਲੋਡ ਕੀਤੇ ਗਏ।',
    'driver.uploadFailed': 'ਅੱਪਲੋਡ ਅਸਫਲ। ਯਕੀਨੀ ਬਣਾਓ ਕਿ ਲੋੜੀਂਦੇ ਕਾਲਮ ਮੌਜੂਦ ਹਨ।',
    'driver.deleteTitle': 'ਡਰਾਈਵਰ ਮਿਟਾਓ',
    'driver.deleteMessage': 'ਕੀ ਤੁਸੀਂ ਸੱਚਮੁੱਚ ਇਸ ਡਰਾਈਵਰ ਨੂੰ ਮਿਟਾਉਣਾ ਚਾਹੁੰਦੇ ਹੋ?',
    'driver.deleteConfirm': 'ਮਿਟਾਓ',
    'driver.fillAllFields': 'ਕਿਰਪਾ ਕਰਕੇ ਸਾਰੇ ਖੇਤਰ ਭਰੋ (ਨਾਮ, ਈਮੇਲ, ਪਾਸਵਰਡ, ਡਰਾਈਵਰ ਆਈ.ਡੀ.)।',
    'driver.fillAllFieldsUpdate': 'ਕਿਰਪਾ ਕਰਕੇ ਸਾਰੇ ਖੇਤਰ ਭਰੋ (ਨਾਮ, ਈਮੇਲ) ਅਤੇ ਅੱਪਡੇਟ ਕਰਨ ਲਈ ਡਰਾਈਵਰ ਚੁਣੋ।',
    'driver.createError': 'ਡਰਾਈਵਰ ਬਣਾਉਣ ਵਿੱਚ ਅਸਫਲ। ਜੇ ਲਾਗੂ ਹੋਵੇ ਤਾਂ ਔਫਲਾਈਨ ਸਟੋਰ ਕੀਤਾ ਗਿਆ।',
    'driver.updateError': 'ਡਰਾਈਵਰ ਅੱਪਡੇਟ ਕਰਨ ਵਿੱਚ ਅਸਫਲ। ਜੇ ਲਾਗੂ ਹੋਵੇ ਤਾਂ ਔਫਲਾਈਨ ਸਟੋਰ ਕੀਤਾ ਗਿਆ।',
    'driver.deleteError': 'ਡਰਾਈਵਰ ਮਿਟਾਉਣ ਵਿੱਚ ਅਸਫਲ। ਜੇ ਲਾਗੂ ਹੋਵੇ ਤਾਂ ਔਫਲਾਈਨ ਸਟੋਰ ਕੀਤਾ ਗਿਆ।',
    'driver.syncError': 'ਡਰਾਈਵਰ {name} ਸਿੰਕ ਕਰਨ ਵਿੱਚ ਅਸਫਲ।',

    // Driver Dashboard
    'driver.header.title': 'ਡਰਾਈਵਰ ਡੈਸ਼ਬੋਰਡ',
    'driver.header.sub': 'ਫਲੀਟ ਪ੍ਰਬੰਧਨ',
    'driver.assigned.title': 'ਨਿਰਧਾਰਤ ਵਾਹਨ',
    'driver.labels.busNumber': 'ਬੱਸ ਨੰਬਰ:',
    'driver.labels.registration': 'ਰਜਿਸਟ੍ਰੇਸ਼ਨ:',
    'driver.labels.route': 'ਰੂਟ:',
    'driver.live.title': 'ਲਾਈਵ ਟ੍ਰੈਕਿੰਗ',
    'driver.live.toggle': 'GPS ਟਿਕਾਣਾ ਟ੍ਰੈਕਿੰਗ',
    'driver.live.on': 'ਤੁਹਾਡਾ ਟਿਕਾਣਾ ਟ੍ਰੈਕ ਕੀਤਾ ਜਾ ਰਿਹਾ ਹੈ',
    'driver.live.off': 'ਟਿਕਾਣਾ ਟ੍ਰੈਕਿੰਗ ਬੰਦ ਹੈ',
    'driver.status.active': 'ਸਕ੍ਰਿਯ',
    'driver.alerts.title': 'ਸਕ੍ਰਿਯ ਅਲਰਟ',
    'driver.alerts.none.title': 'ਕੋਈ ਸਕ੍ਰਿਯ ਅਲਰਟ ਨਹੀਂ',
    'driver.alerts.none.sub': 'ਸਾਰੇ ਸਿਸਟਮ ਆਮ ਤੌਰ ਤੇ ਚੱਲ ਰਹੇ ਹਨ',
    'driver.permissionDenied': 'ਇਜਾਜ਼ਤ ਅਸਵੀਕਾਰ',
    'driver.locationPermission': 'ਟ੍ਰੈਕਿੰਗ ਸਮਰੱਥ ਕਰਨ ਲਈ ਟਿਕਾਣਾ ਪਹੁੰਚ ਲੋੜੀਂਦੀ ਹੈ।',
    'driver.fetchError': 'ਡਰਾਈਵਰ ਡੇਟਾ ਪ੍ਰਾਪਤ ਕਰਨ ਵਿੱਚ ਅਸਫਲ।',
    'driver.brand': 'BusBee',

    // Bus Management
    'bus.add': 'ਬੱਸ ਸ਼ਾਮਲ ਕਰੋ',
    'bus.update': 'ਬੱਸ ਅੱਪਡੇਟ ਕਰੋ',
    'bus.form.busNumber': 'ਬੱਸ ਨੰਬਰ',
    'bus.form.regNo': 'ਰਜਿ. ਨੰਬਰ',
    'bus.form.capacity': 'ਸਮਰੱਥਾ',

    // Alerts
    'alerts.send': 'ਅਲਰਟ ਭੇਜੋ',
    'alerts.recent': 'ਤਾਜ਼ਾ ਅਲਰਟ',
    'alerts.bulk': 'ਬਲਕ ਮਿਟਾਉ ਵਿਕਲਪ',
    'alerts.title': 'ਅਲਰਟ',
    'alerts.noActive': 'ਕੋਈ ਸਕ੍ਰਿਯ ਅਲਰਟ ਨਹੀਂ',

    // Language Options
    'lang.english': 'English',
    'lang.hindi': 'हिन्दी',
    'lang.punjabi': 'ਪੰਜਾਬੀ',
    'lang.tamil': 'தமிழ்',
  },
  ta: {
    // Common strings
    'common.refresh': 'புதுப்பி',
    'common.allRoutes': 'அனைத்து பாதைகள்',
    'common.cancel': 'ரத்து செய்',
    'common.save': 'சேமி',
    'common.edit': 'திருத்து',
    'common.delete': 'நீக்கு',
    'common.add': 'சேர்',
    'common.update': 'புதுப்பி',
    'common.search': 'தேடு',
    'common.loading': 'ஏற்றுகிறது...',
    'common.error': 'பிழை',
    'common.success': 'வெற்றி',
    'common.online': 'ஆன்லைன்',
    'common.offline': 'ஆஃப்லைன்',
    'common.active': 'செயலில்',
    'common.inactive': 'செயலற்ற',
    'common.yes': 'ஆம்',
    'common.no': 'இல்லை',
    'common.ok': 'சரி',
    'common.back': '← பின்',
    'common.next': 'அடுத்து',
    'common.previous': 'முந்தைய',
    'common.close': 'மூடு',
    'common.menu': 'மெனு',
    'common.settings': 'அமைப்புகள்',
    'common.profile': 'சுயவிவரம்',
    'common.logout': 'வெளியேறு',
    'common.login': 'உள்நுழை',
    'common.signup': 'பதிவு செய்',
    'common.email': 'மின்னஞ்சல்',
    'common.password': 'கடவுச்சொல்',
    'common.name': 'பெயர்',
    'common.phone': 'தொலைபேசி எண்',
    'common.role': 'பங்கு',
    'common.admin': 'நிர்வாகி',
    'common.driver': 'டிரைவர்',
    'common.passenger': 'பயணி',

    // Navigation
    'nav.back': '← பின்',
    'nav.home': 'முகப்பு',
    'nav.explore': 'ஆராய்',

    // Login Screen
    'login.welcome': 'மீண்டும் வரவேற்கிறோம்',
    'login.subtitle': 'தொடர உள்நுழையுங்கள்',
    'login.loginAs': '{role} ஆக உள்நுழையுங்கள்',
    'login.emailPlaceholder': 'மின்னஞ்சல்',
    'login.passwordPlaceholder': 'கடவுச்சொல்',
    'login.phonePlaceholder': 'தொலைபேசி எண்',
    'login.loginButton': 'உள்நுழை',
    'login.signupPrompt': 'கணக்கு இல்லையா? ',
    'login.signupLink': 'பதிவு செய்',
    'login.loginFailed': 'உள்நுழைவு தோல்வி',
    'login.invalidCredentials': 'தவறான அங்கீகாரங்கள்',
    'login.invalidPhone': 'தவறான தொலைபேசி எண்',

    // Passenger Signup
    'signup.title': 'பயணி பதிவு',
    'signup.namePlaceholder': 'பெயர்',
    'signup.phonePlaceholder': 'தொலைபேசி எண்',
    'signup.signupButton': 'பதிவு செய்',
    'signup.loginPrompt': 'ஏற்கனவே கணக்கு உள்ளதா? உள்நுழை',
    'signup.success': 'பதிவு வெற்றி',
    'signup.successMessage': 'இப்போது உங்கள் தொலைபேசி எண்ணுடன் உள்நுழையலாம்.',
    'signup.failed': 'பதிவு தோல்வி',
    'signup.errorMessage': 'பதிவு செய்யும்போது பிழை ஏற்பட்டது.',

    // Passenger Dashboard
    'passenger.title': 'பயணி டாஷ்போர்ட்',
    'passenger.searchBus': 'உங்கள் பஸைத் தேடுங்கள் (பஸ் எண்ணால்)...',
    'passenger.selectedRoute': 'தேர்ந்தெடுக்கப்பட்ட பாதை',
    'passenger.start': 'தொடக்கம்',
    'passenger.end': 'முடிவு',
    'passenger.totalStops': 'மொத்த நிறுத்தங்கள்',
    'passenger.filterBus': 'பஸ் இருப்பிடங்களை வடிகட்டு',
    'passenger.lastKnown': 'கடைசியாக அறியப்பட்டது',
    'passenger.alert': 'எச்சரிக்கை',
    'passenger.all': 'அனைத்தும்',
    'passenger.liveBusLocations': 'நேரடி பஸ் இருப்பிடங்கள்',
    'passenger.busETA': 'பஸ் {busNumber} ETA: {eta} நிமிடங்கள்',
    'passenger.callIVR': 'ETA க்கு IVR அழைப்பு',
    'passenger.alerts': 'எச்சரிக்கைகள்',
    'passenger.noActiveAlerts': 'செயலில் உள்ள எச்சரிக்கைகள் இல்லை',
    'passenger.routes': 'பாதைகள்',
    'passenger.noRoutesAvailable': 'பாதைகள் கிடைக்கவில்லை',
    'passenger.nearbyStops': 'அருகிலுள்ள நிறுத்தங்கள்',
    'passenger.turnOnLocation': 'அருகிலுள்ள நிறுத்தங்களைப் பார்க்க இருப்பிடத்தை இயக்கவும்',
    'passenger.stopsTimeline': 'நிறுத்தங்கள் காலவரிசை',
    'passenger.menu': 'மெனு',
    'passenger.useMyLocation': 'எனது இருப்பிடத்தைப் பயன்படுத்து',
    'passenger.showTraffic': 'போக்குவரத்தைக் காட்டு',
    'passenger.hideTraffic': 'போக்குவரத்தை மறை',
    'passenger.emergencySOS': 'அவசர SOS',
    'passenger.sosTitle': 'அவசர SOS',
    'passenger.sosMessage': 'இது அவசர சேவைகளை (100) அழைக்கும். நீங்கள் தொடர விரும்புகிறீர்களா?',
    'passenger.sosCall': 'அவசர அழைப்பு',
    'passenger.active': 'செயலில்',
    'passenger.refresh': 'புதுப்பி',
    'passenger.refreshing': 'புதுப்பிக்கிறது...',
    'passenger.bus': 'பஸ்',
    'passenger.eta': 'ETA',
    'passenger.logout': 'வெளியேறு',

    // Chatbot
    'chatbot.title': 'உதவியாளர்',
    'chatbot.back': '← பின்',
    'chatbot.welcomeAdmin': 'வரவேற்கிறோம், நிர்வாகி 👋',
    'chatbot.welcomePassenger': 'வரவேற்கிறோம் 👋',
    'chatbot.subtitleAdmin': 'பாதைகள், பஸ்கள், டிரைவர்கள் மற்றும் அறிக்கைகளை நிர்வகிப்பதற்கான வழிகாட்டி.',
    'chatbot.subtitlePassenger': 'நேரடி கண்காணிப்பு, ETA, தேடல் மற்றும் எச்சரிக்கைகளுக்கான வழிகாட்டி.',
    'chatbot.howCanIHelp': 'நான் எவ்வாறு உதவ முடியும்?',
    'chatbot.showTutorial': 'பயிற்சி காட்டு',
    'chatbot.clear': 'அழி',
    'chatbot.typing': 'தட்டச்சு செய்கிறது...',
    
    // Chatbot Topics - Admin
    'chatbot.admin.routes': 'பாதைகள் மற்றும் நிறுத்தங்களை நிர்வகி',
    'chatbot.admin.buses': 'பஸ்கள் மற்றும் டிரைவர்களை ஒதுக்கு',
    'chatbot.admin.live': 'டிரைவர் நேரடி இருப்பிடங்கள்',
    'chatbot.admin.reports': 'அறிக்கைகள் மற்றும் பகுப்பாய்வு',
    'chatbot.admin.offline': 'ஆஃப்லைன் மற்றும் ஒத்திசைவு',
    'chatbot.admin.faq': 'அடிக்கடி கேட்கப்படும் கேள்விகள்',
    
    // Chatbot Topics - Passenger
    'chatbot.passenger.live': 'நேரடி பஸ் இருப்பிடம்',
    'chatbot.passenger.eta': 'ETA சரிபார்',
    'chatbot.passenger.search': 'பாதைகள் மற்றும் நிறுத்தங்களைத் தேடு',
    'chatbot.passenger.notify': 'அறிவிப்புகள் மற்றும் எச்சரிக்கைகள்',
    'chatbot.passenger.offline': 'ஆஃப்லைன் முறை',
    'chatbot.passenger.faq': 'அடிக்கடி கேட்கப்படும் கேள்விகள்',
    
    // Floating Assistant
    'assistant.admin': 'நிர்வாகி',
    'assistant.you': 'நீங்கள்',

    // Passenger Profile
    'profile.title': 'எனது சுயவிவரம்',
    'profile.tapAvatar': 'மாற்றுவதற்கு அவதாரத்தைத் தொடவும்',
    'profile.account': 'கணக்கு',
    'profile.nameLabel': 'பெயர்',
    'profile.namePlaceholder': 'உங்கள் பெயர்',
    'profile.phoneLabel': 'தொலைபேசி',
    'profile.phonePlaceholder': 'உங்கள் தொலைபேசி',
    'profile.saveChanges': 'மாற்றங்களைச் சேமி',
    'profile.security': 'பாதுகாப்பு',
    'profile.securityMessage': 'தொலைபேசியால் கடவுச்சொல் இல்லாத உள்நுழைவு. OTP பின்னர் சேர்க்கப்படும்.',
    'profile.saved': 'சேமிக்கப்பட்டது',
    'profile.updated': 'சுயவிவரம் புதுப்பிக்கப்பட்டது',
    'profile.failed': 'சுயவிவரத்தை ஏற்ற முடியவில்லை',
    'profile.saveError': 'சுயவிவரத்தை சேமிக்க முடியவில்லை',
    'profile.permission': 'அனுமதி',
    'profile.mediaPermission': 'மீடியா அனுமதி தேவை',

    // Admin Dashboard
    'admin.welcome': 'நிர்வாகத்திற்கு வரவேற்பு',
    'admin.logout': 'வெளியேறு',
    'admin.title': 'நிர்வாகி டாஷ்போர்ட்',
    'admin.menu': 'நிர்வாகி மெனு',
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
    'admin.liveMonitoring': 'நிர்வாகி டாஷ்போர்ட் • நேரடி கண்காணிப்பு',
    'admin.busStatusLegend': 'பஸ் நிலை குறியீடு',
    'admin.debugInfo': 'டிபக்: {total} பஸ்கள் மொத்தம் ({active} செயலில், {lastKnown} கடைசியாக அறியப்பட்டது) | பயனர்: {userStatus}',
    'admin.located': 'இருப்பிடம் கண்டறியப்பட்டது',
    'admin.notLocated': 'இருப்பிடம் கண்டறியப்படவில்லை',

    // Driver Management
    'driver.add': 'டிரைவரை சேர்',
    'driver.update': 'டிரைவரை புதுப்பி',
    'driver.form.name': 'டிரைவர் பெயர்',
    'driver.form.email': 'மின்னஞ்சல்',
    'driver.form.password': 'கடவுச்சொல்',
    'driver.form.driverId': 'டிரைவர் ஐடி (போக்குவரத்து அலுவலகம்)',
    'driver.form.busId': 'ஒதுக்கப்பட்ட பஸ் ஐடி/எண் (விருப்பம்)',
    'driver.list.title': 'இருக்கும் டிரைவர்கள்',
    'driver.list.empty': 'இன்னும் டிரைவர்கள் சேர்க்கப்படவில்லை.',
    'driver.searchPlaceholder': 'பெயர், மின்னஞ்சல் அல்லது driverId மூலம் தேடு',
    'driver.viewAll': 'அனைத்தையும் பார்',
    'driver.searchHint': 'டிரைவர்களைத் தேடத் தொடங்குங்கள் அல்லது அனைத்தையும் பார்க்கத் தொடவும்.',
    'driver.driverName': 'டிரைவர் பெயர்',
    'driver.driverId': 'டிரைவர் ஐடி',
    'driver.email': 'மின்னஞ்சல்',
    'driver.fileUpload': 'கோப்பு பதிவேற்றம் (CSV/XLSX)',
    'driver.uploadHint': 'தேவை: driverId, name, email, password. விருப்பம்: busId/busNumber/regNo',
    'driver.uploadCSV': 'CSV பதிவேற்று',
    'driver.addDriver': 'டிரைவரை சேர்',
    'driver.viewDrivers': 'டிரைவர்களைப் பார்',
    'driver.uploadFile': 'கோப்பு பதிவேற்று',
    'driver.createdSuccess': 'டிரைவர் வெற்றிகரமாக உருவாக்கப்பட்டார்!',
    'driver.uploadSuccess': 'டிரைவர்கள் பதிவேற்றப்பட்டனர்.',
    'driver.uploadFailed': 'பதிவேற்றம் தோல்வி. தேவையான நெடுவரிசைகள் உள்ளன என்பதை உறுதிப்படுத்தவும்.',
    'driver.deleteTitle': 'டிரைவரை நீக்கு',
    'driver.deleteMessage': 'இந்த டிரைவரை நீக்க விரும்புகிறீர்களா?',
    'driver.deleteConfirm': 'நீக்கு',
    'driver.fillAllFields': 'தயவுசெய்து அனைத்து புலங்களையும் நிரப்பவும் (பெயர், மின்னஞ்சல், கடவுச்சொல், டிரைவர் ஐடி).',
    'driver.fillAllFieldsUpdate': 'தயவுசெய்து அனைத்து புலங்களையும் நிரப்பவும் (பெயர், மின்னஞ்சல்) மற்றும் புதுப்பிக்க டிரைவரைத் தேர்ந்தெடுக்கவும்.',
    'driver.createError': 'டிரைவரை உருவாக்க முடியவில்லை. பொருந்துமானால் ஆஃப்லைனில் சேமிக்கப்பட்டது.',
    'driver.updateError': 'டிரைவரை புதுப்பிக்க முடியவில்லை. பொருந்துமானால் ஆஃப்லைனில் சேமிக்கப்பட்டது.',
    'driver.deleteError': 'டிரைவரை நீக்க முடியவில்லை. பொருந்துமானால் ஆஃப்லைனில் சேமிக்கப்பட்டது.',
    'driver.syncError': 'டிரைவர் {name} ஒத்திசைக்க முடியவில்லை.',

    // Driver Dashboard
    'driver.header.title': 'டிரைவர் டாஷ்போர்ட்',
    'driver.header.sub': 'வாகன படை மேலாண்மை',
    'driver.assigned.title': 'ஒதுக்கப்பட்ட வாகனம்',
    'driver.labels.busNumber': 'பஸ் எண்:',
    'driver.labels.registration': 'பதிவு:',
    'driver.labels.route': 'பாதை:',
    'driver.live.title': 'நேரடி கண்காணிப்பு',
    'driver.live.toggle': 'GPS இருப்பிடம் கண்காணிப்பு',
    'driver.live.on': 'உங்கள் இருப்பிடம் கண்காணிக்கப்படுகிறது',
    'driver.live.off': 'இருப்பிடம் கண்காணிப்பு முடக்கப்பட்டுள்ளது',
    'driver.status.active': 'செயலில்',
    'driver.alerts.title': 'செயலில் உள்ள எச்சரிக்கைகள்',
    'driver.alerts.none.title': 'எந்த செயலில் உள்ள எச்சரிக்கையும் இல்லை',
    'driver.alerts.none.sub': 'அனைத்து அமைப்புகளும் சாதாரணமாக இயங்குகின்றன',
    'driver.permissionDenied': 'அனுமதி மறுக்கப்பட்டது',
    'driver.locationPermission': 'கண்காணிப்பை இயக்குவதற்கு இருப்பிட அணுகல் தேவை.',
    'driver.fetchError': 'டிரைவர் தரவைப் பெற முடியவில்லை.',
    'driver.brand': 'BusBee',

    // Bus Management
    'bus.add': 'பஸை சேர்',
    'bus.update': 'பஸை புதுப்பி',
    'bus.form.busNumber': 'பஸ் எண்',
    'bus.form.regNo': 'பதிவு எண்',
    'bus.form.capacity': 'திறன்',

    // Alerts
    'alerts.send': 'அறிவிப்பை அனுப்பு',
    'alerts.recent': 'சமீபத்திய அறிவிப்புகள்',
    'alerts.bulk': 'மொத்தமாக நீக்கும் விருப்பங்கள்',
    'alerts.title': 'அறிவிப்புகள்',
    'alerts.noActive': 'செயலில் உள்ள எச்சரிக்கைகள் இல்லை',

    // Language Options
    'lang.english': 'English',
    'lang.hindi': 'हिन्दी',
    'lang.punjabi': 'ਪੰਜਾਬੀ',
    'lang.tamil': 'தமிழ்',
  },
};

// Unified Language Context
type LanguageContextType = {
  lang: LangCode;
  t: (key: string, params?: Record<string, string | number>) => string;
  setLang: (lang: LangCode) => Promise<void>;
  availableLanguages: Array<{ code: LangCode; label: string; nativeLabel: string }>;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Global language state
type Listener = (lang: LangCode) => void;
const listeners = new Set<Listener>();
let currentLang: LangCode = 'en';

// Unified language functions
export const initLanguage = async () => {
  const saved = await AsyncStorage.getItem('app_lang');
  if (saved === 'en' || saved === 'hi' || saved === 'pa' || saved === 'ta') {
    currentLang = saved;
  }
};

export const getLanguage = (): LangCode => currentLang;

export const setLanguage = async (lang: LangCode) => {
  currentLang = lang;
  await AsyncStorage.setItem('app_lang', lang);
  listeners.forEach((l) => l(lang));
};

export const subscribeLanguage = (listener: Listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const t = (key: string, lang?: LangCode, params?: Record<string, string | number>): string => {
  const useLang = lang || currentLang;
  let text = translations[useLang][key] ?? translations['en'][key] ?? key;
  
  // Replace parameters in the text
  if (params) {
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      text = text.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue));
    });
  }
  
  return text;
};

// Available languages
export const availableLanguages = [
  { code: 'en' as LangCode, label: 'English', nativeLabel: 'English' },
  { code: 'hi' as LangCode, label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'pa' as LangCode, label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ' },
  { code: 'ta' as LangCode, label: 'Tamil', nativeLabel: 'தமிழ்' },
];

// Unified hook
export const useI18n = () => {
  const [lang, setLangState] = useState<LangCode>(currentLang);

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      if (!currentLang) {
        await initLanguage();
      }
      setLangState(currentLang);
      unsub = subscribeLanguage((l) => setLangState(l));
    })();
    return () => unsub();
  }, []);

  return {
    lang,
    t: (key: string, params?: Record<string, string | number>) => t(key, lang, params),
    setLang: (l: LangCode) => setLanguage(l),
    availableLanguages,
  };
};

// Language Provider Component
export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const i18n = useI18n();
  
  return (
    <LanguageContext.Provider value={i18n}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook to use language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Legacy admin functions (for backward compatibility)
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

// Driver-specific i18n (legacy - for backward compatibility)
const driverListeners = new Set<(lang: DriverLangCode) => void>();
let currentDriverLang: DriverLangCode = 'en';

export const initDriverLanguage = async () => {
  const saved = await AsyncStorage.getItem('driver_lang');
  if (saved === 'en' || saved === 'hi' || saved === 'pa' || saved === 'ta') {
    currentDriverLang = saved as DriverLangCode;
  }
};

export const getDriverLanguage = (): DriverLangCode => currentDriverLang;

export const setDriverLanguage = async (lang: DriverLangCode) => {
  currentDriverLang = lang;
  await AsyncStorage.setItem('driver_lang', lang);
  driverListeners.forEach((l) => l(lang));
};

export const subscribeDriverLanguage = (listener: (lang: DriverLangCode) => void) => {
  driverListeners.add(listener);
  return () => driverListeners.delete(listener);
};

export const tDriver = (key: string, lang?: DriverLangCode): string => {
  const useLang = lang || currentDriverLang;
  return translations[useLang][key] ?? translations['en'][key] ?? key;
};

export const useDriverI18n = () => {
  const [lang, setLangState] = useState<DriverLangCode>(currentDriverLang);

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      if (!currentDriverLang) {
        await initDriverLanguage();
      }
      setLangState(currentDriverLang);
      unsub = subscribeDriverLanguage((l) => setLangState(l));
    })();
    return () => unsub();
  }, []);

  return {
    lang,
    t: (key: string) => tDriver(key, lang),
    setLang: (l: DriverLangCode) => setDriverLanguage(l),
  };
};

// Passenger-specific i18n (legacy - for backward compatibility)
const passengerListeners = new Set<(lang: PassengerLangCode) => void>();
let currentPassengerLang: PassengerLangCode = 'en';

export const initPassengerLanguage = async () => {
  const saved = await AsyncStorage.getItem('passenger_lang');
  if (saved === 'en' || saved === 'hi' || saved === 'pa' || saved === 'ta') {
    currentPassengerLang = saved as PassengerLangCode;
  }
};

export const getPassengerLanguage = (): PassengerLangCode => currentPassengerLang;

export const setPassengerLanguage = async (lang: PassengerLangCode) => {
  currentPassengerLang = lang;
  await AsyncStorage.setItem('passenger_lang', lang);
  passengerListeners.forEach((l) => l(lang));
};

export const subscribePassengerLanguage = (listener: (lang: PassengerLangCode) => void) => {
  passengerListeners.add(listener);
  return () => passengerListeners.delete(listener);
};

export const tPassenger = (key: string, lang?: PassengerLangCode): string => {
  const useLang = lang || currentPassengerLang;
  return translations[useLang][key] ?? translations['en'][key] ?? key;
};

export const usePassengerI18n = () => {
  const [lang, setLangState] = useState<PassengerLangCode>(currentPassengerLang);

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      if (!currentPassengerLang) {
        await initPassengerLanguage();
      }
      setLangState(currentPassengerLang);
      unsub = subscribePassengerLanguage((l) => setLangState(l));
    })();
    return () => unsub();
  }, []);

  return {
    lang,
    t: (key: string) => tPassenger(key, lang),
    setLang: (l: PassengerLangCode) => setPassengerLanguage(l),
  };
};


