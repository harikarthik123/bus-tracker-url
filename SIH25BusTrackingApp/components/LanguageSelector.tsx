import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { useLanguage, availableLanguages, LangCode } from '../app/utils/i18n';

interface LanguageSelectorProps {
  style?: any;
  textStyle?: any;
  showNativeLabel?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  style, 
  textStyle, 
  showNativeLabel = true 
}) => {
  const { lang, setLang, t } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);

  const currentLanguage = availableLanguages.find(l => l.code === lang);

  const handleLanguageSelect = async (languageCode: LangCode) => {
    await setLang(languageCode);
    setModalVisible(false);
  };

  const renderLanguageItem = ({ item }: { item: typeof availableLanguages[0] }) => (
    <TouchableOpacity
      style={[
        styles.languageItem,
        item.code === lang && styles.selectedLanguageItem
      ]}
      onPress={() => handleLanguageSelect(item.code)}
    >
      <Text style={[
        styles.languageText,
        item.code === lang && styles.selectedLanguageText
      ]}>
        {showNativeLabel ? item.nativeLabel : item.label}
      </Text>
      {item.code === lang && (
        <Text style={styles.checkmark}>✓</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity
        style={[styles.selector, style]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.selectorText, textStyle]}>
          {showNativeLabel ? currentLanguage?.nativeLabel : currentLanguage?.label} ▼
        </Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('common.settings')}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={availableLanguages}
              keyExtractor={(item) => item.code}
              renderItem={renderLanguageItem}
              style={styles.languageList}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  selector: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  selectorText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxHeight: '60%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '600',
  },
  languageList: {
    maxHeight: 300,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 2,
  },
  selectedLanguageItem: {
    backgroundColor: '#F59E0B',
  },
  languageText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  selectedLanguageText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default LanguageSelector;
