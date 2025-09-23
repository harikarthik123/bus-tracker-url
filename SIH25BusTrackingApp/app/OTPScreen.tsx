// import React, { useState } from 'react';
// import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
// import { router, useLocalSearchParams } from 'expo-router';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const API_URL = 'http://bus-tracker-rjir.onrender.com/api/auth'; // Replace with your backend URL

// const OTPScreen = () => {
//   const { phone } = useLocalSearchParams();
//   const [otp, setOtp] = useState('');

//   const handleVerifyOtp = async () => {
//     try {
//       const response = await axios.post(`${API_URL}/verify-otp`, { phone, otp });
//       const { token } = response.data;
//       await AsyncStorage.setItem('token', token);

//       const decodedToken = JSON.parse(atob(token.split('.')[1]));
//       const userRole = decodedToken.user.role;

//       if (userRole === 'passenger') {
//         router.replace('/PassengerDashboard');
//       } else {
//         Alert.alert('Error', 'Unexpected role after OTP verification.');
//       }
//     } catch (error) {
//       console.error(error);
//       Alert.alert('OTP Verification Failed', error.response?.data?.msg || 'An error occurred');
//     }
//   };

//   const handleResendOtp = async () => {
//     try {
//       const response = await axios.post(`${API_URL}/resend-otp`, { phoneNumber: route.params?.phoneNumber });
//       Alert.alert('Success', response.data.msg);
//     } catch (error: any) {
//       console.error('Resend OTP error', error);
//       Alert.alert('Error', error.response?.data?.msg || 'Failed to resend OTP.');
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Verify OTP</Text>
//       <Text style={styles.subtitle}>OTP sent to {phone}</Text>

//       <TextInput
//         style={styles.input}
//         placeholder="Enter OTP"
//         value={otp}
//         onChangeText={setOtp}
//         keyboardType="number-pad"
//         maxLength={6}
//       />

//       <TouchableOpacity style={styles.verifyButton} onPress={handleVerifyOtp}>
//         <Text style={styles.verifyButtonText}>Verify OTP</Text>
//       </TouchableOpacity>

//       <TouchableOpacity onPress={() => router.back()}>
//         <Text style={styles.resendLink}>Resend OTP</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f0f2f5',
//     padding: 20,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 10,
//     color: '#333',
//   },
//   subtitle: {
//     fontSize: 16,
//     color: '#555',
//     marginBottom: 30,
//   },
//   input: {
//     width: '100%',
//     backgroundColor: '#fff',
//     padding: 15,
//     borderRadius: 5,
//     marginBottom: 15,
//     fontSize: 16,
//     borderWidth: 1,
//     borderColor: '#ddd',
//     textAlign: 'center',
//   },
//   verifyButton: {
//     width: '100%',
//     backgroundColor: '#28a745',
//     padding: 15,
//     borderRadius: 5,
//     alignItems: 'center',
//     marginTop: 10,
//   },
//   verifyButtonText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   resendLink: {
//     marginTop: 20,
//     fontSize: 14,
//     color: '#3498db',
//     fontWeight: 'bold',
//   },
// });

// export default OTPScreen;
