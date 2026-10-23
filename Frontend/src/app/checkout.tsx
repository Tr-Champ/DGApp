import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Input from '../components/Input';
import Button from '../components/Button';
import { Colors } from '../constants/Colors';
import { processPayment, PaymentMethod } from '../services/paymentService';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const DISTRICTS = [
    'Gasabo', 'Kicukiro', 'Nyarugenge', 'Musanze', 'Rubavu', 'Huye', 'Rwamagana', 'Bugesera', 'Other'
];

export default function CheckoutScreen() {
    const { cartItems, totalPrice, clearCart } = useCart();
    const { user } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Step 1: Customer details; Step 2: Payment
    const [step, setStep] = useState<1 | 2>(1);

    // Customer form state
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [sameWhatsapp, setSameWhatsapp] = useState(true);
    const [district, setDistrict] = useState('Gasabo');
    const [addressDetails, setAddressDetails] = useState('');

    // Payment state
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('MTN_MOMO');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleContinueToPayment = () => {
        if (!fullName.trim()) {
            return Alert.alert('Required Field', 'Please enter your full name.');
        }
        if (!email.trim()) {
            return Alert.alert('Required Field', 'Please enter your email.');
        }
        if (!phone.trim()) {
            return Alert.alert('Required Field', 'Please enter your contact phone number.');
        }
        setStep(2);
    };

    const handleCompletePaymentAndOrder = async () => {
        if (cartItems.length === 0) return;

        try {
            setIsProcessing(true);

            // Clean short friendly order reference
            const cleanRef = `ORD-${Date.now().toString(36).slice(-5).toUpperCase()}`;

            // 1. Process simulated payment
            const payRes = await processPayment({
                amount: totalPrice,
                method: selectedMethod,
                customerName: fullName.trim(),
                customerEmail: email.trim(),
                phoneNumber: phone.trim(),
                referenceId: cleanRef,
            });

            if (!payRes.success) {
                Alert.alert('Payment Failed', payRes.message);
                setIsProcessing(false);
                return;
            }

            // 2. Build order payload with customer delivery information
            const finalWhatsapp = sameWhatsapp ? phone.trim() : (whatsapp.trim() || phone.trim());
            const customerMeta = {
                is_customer_info: true,
                customer: {
                    name: fullName.trim(),
                    email: email.trim(),
                    phone: phone.trim(),
                    whatsapp: finalWhatsapp,
                    district: district,
                    address: addressDetails.trim() || 'Standard Delivery',
                    payment_method: selectedMethod,
                    order_ref: cleanRef,
                },
            };

            const fullOrderItems = [...cartItems, customerMeta];

            await api.post('/orders/', {
                id: cleanRef,
                items: fullOrderItems,
                total_price: totalPrice,
            });

            await clearCart();

            Alert.alert(
                '🎉 Order Placed Successfully!',
                `Thank you, ${fullName.trim()}!\nOrder Ref: #${cleanRef}\nPayment of $${totalPrice.toFixed(2)} received via ${selectedMethod.replace('_', ' ')}.`,
                [{ text: 'View My Orders', onPress: () => router.replace('/(tabs)/tab4') }]
            );
        } catch (e: any) {
            Alert.alert('Checkout Error', e.response?.data?.detail || 'Could not complete your order. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right', 'bottom']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => (step === 2 ? setStep(1) : router.back())}
                    style={styles.backBtn}
                    activeOpacity={0.7}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {step === 1 ? 'Delivery Address' : 'Payment Method'}
                </Text>
                <Text style={styles.stepIndicator}>Step {step}/2</Text>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(30, insets.bottom + 20) }]}
                    keyboardShouldPersistTaps="handled"
                >
                    {step === 1 ? (
                        /* STEP 1: CUSTOMER DELIVERY DETAILS */
                        <View>
                            <View style={styles.card}>
                                <Text style={styles.cardHeader}>👤 Customer & Delivery Details</Text>
                                <Text style={styles.cardSub}>
                                    Please provide your contact details for order delivery and driver communication.
                                </Text>

                                <Text style={styles.fieldLabel}>Full Names *</Text>
                                <Input
                                    placeholder="e.g. John Doe"
                                    value={fullName}
                                    onChangeText={setFullName}
                                />

                                <Text style={styles.fieldLabel}>Email Address *</Text>
                                <Input
                                    placeholder="e.g. client@gmail.com"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />

                                <Text style={styles.fieldLabel}>Phone Number (Calls) *</Text>
                                <Input
                                    placeholder="e.g. +250 788 123 456"
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                />

                                <TouchableOpacity
                                    style={styles.checkboxRow}
                                    onPress={() => setSameWhatsapp(!sameWhatsapp)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name={sameWhatsapp ? 'checkbox' : 'square-outline'}
                                        size={20}
                                        color={Colors.primary}
                                    />
                                    <Text style={styles.checkboxText}>WhatsApp number is same as phone</Text>
                                </TouchableOpacity>

                                {!sameWhatsapp && (
                                    <>
                                        <Text style={styles.fieldLabel}>WhatsApp Number *</Text>
                                        <Input
                                            placeholder="e.g. +250 788 123 456"
                                            value={whatsapp}
                                            onChangeText={setWhatsapp}
                                            keyboardType="phone-pad"
                                        />
                                    </>
                                )}

                                <Text style={styles.fieldLabel}>District *</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.districtsScroll}>
                                    {DISTRICTS.map((dist) => (
                                        <TouchableOpacity
                                            key={dist}
                                            style={[styles.districtPill, district === dist && styles.districtPillActive]}
                                            onPress={() => setDistrict(dist)}
                                        >
                                            <Text style={[styles.districtPillText, district === dist && styles.districtPillTextActive]}>
                                                {dist}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                                <Text style={styles.fieldLabel}>Delivery Address / Landmark</Text>
                                <Input
                                    placeholder="e.g. House No. 24, Near Kimironko Market"
                                    value={addressDetails}
                                    onChangeText={setAddressDetails}
                                    multiline
                                    numberOfLines={2}
                                />
                            </View>

                            {/* Order Total Preview */}
                            <View style={styles.summaryBox}>
                                <Text style={styles.summaryLabel}>Total to Pay:</Text>
                                <Text style={styles.summaryAmount}>${totalPrice.toFixed(2)}</Text>
                            </View>

                            <Button
                                title="Proceed to Payment →"
                                onPress={handleContinueToPayment}
                                style={styles.primaryBtn}
                            />
                        </View>
                    ) : (
                        /* STEP 2: PAYMENT METHOD SELECTION */
                        <View>
                            <View style={styles.card}>
                                <Text style={styles.cardHeader}>💳 Select Payment Method</Text>
                                <Text style={styles.cardSub}>
                                    Select how you would like to complete your order payment.
                                </Text>

                                {/* MTN MoMo Option */}
                                <TouchableOpacity
                                    style={[styles.payOption, selectedMethod === 'MTN_MOMO' && styles.payOptionSelected]}
                                    onPress={() => setSelectedMethod('MTN_MOMO')}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.payIconBox}>
                                        <Text style={{ fontSize: 24 }}>🟡</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.payTitle}>MTN Mobile Money (MoMo)</Text>
                                        <Text style={styles.payDesc}>Instant mobile push prompt</Text>
                                    </View>
                                    <Ionicons
                                        name={selectedMethod === 'MTN_MOMO' ? 'radio-button-on' : 'radio-button-off'}
                                        size={22}
                                        color={selectedMethod === 'MTN_MOMO' ? Colors.primary : Colors.textMuted}
                                    />
                                </TouchableOpacity>

                                {/* Airtel Money Option */}
                                <TouchableOpacity
                                    style={[styles.payOption, selectedMethod === 'AIRTEL_MONEY' && styles.payOptionSelected]}
                                    onPress={() => setSelectedMethod('AIRTEL_MONEY')}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.payIconBox}>
                                        <Text style={{ fontSize: 24 }}>🔴</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.payTitle}>Airtel Money</Text>
                                        <Text style={styles.payDesc}>Airtel mobile wallet payment</Text>
                                    </View>
                                    <Ionicons
                                        name={selectedMethod === 'AIRTEL_MONEY' ? 'radio-button-on' : 'radio-button-off'}
                                        size={22}
                                        color={selectedMethod === 'AIRTEL_MONEY' ? Colors.primary : Colors.textMuted}
                                    />
                                </TouchableOpacity>

                                {/* Bank Account Option */}
                                <TouchableOpacity
                                    style={[styles.payOption, selectedMethod === 'BANK_TRANSFER' && styles.payOptionSelected]}
                                    onPress={() => setSelectedMethod('BANK_TRANSFER')}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.payIconBox}>
                                        <Text style={{ fontSize: 24 }}>🏦</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.payTitle}>Bank Transfer / Card</Text>
                                        <Text style={styles.payDesc}>Direct bank transfer & debit cards</Text>
                                    </View>
                                    <Ionicons
                                        name={selectedMethod === 'BANK_TRANSFER' ? 'radio-button-on' : 'radio-button-off'}
                                        size={22}
                                        color={selectedMethod === 'BANK_TRANSFER' ? Colors.primary : Colors.textMuted}
                                    />
                                </TouchableOpacity>

                                <View style={styles.simulationNotice}>
                                    <Ionicons name="information-circle-outline" size={18} color="#2563EB" style={{ marginRight: 6 }} />
                                    <Text style={styles.simulationText}>
                                        Sandbox Gateway: Payment will be approved and order dispatched automatically.
                                    </Text>
                                </View>
                            </View>

                            {/* Summary Card */}
                            <View style={styles.card}>
                                <Text style={styles.cardHeader}>📋 Delivery Summary</Text>
                                <Text style={styles.summaryLine}>
                                    Recipient: <Text style={{ fontWeight: '700', color: Colors.text }}>{fullName}</Text>
                                </Text>
                                <Text style={styles.summaryLine}>
                                    Phone / WhatsApp: <Text style={{ fontWeight: '700', color: Colors.text }}>{phone}</Text>
                                </Text>
                                <Text style={styles.summaryLine}>
                                    District: <Text style={{ fontWeight: '700', color: Colors.text }}>{district}</Text>
                                </Text>
                                <Text style={styles.summaryLine}>
                                    Total Amount: <Text style={{ fontWeight: '900', color: Colors.primary }}>${totalPrice.toFixed(2)}</Text>
                                </Text>
                            </View>

                            <Button
                                title={isProcessing ? "Processing Payment..." : `Confirm & Pay $${totalPrice.toFixed(2)}`}
                                onPress={handleCompletePaymentAndOrder}
                                loading={isProcessing}
                                style={styles.payBtn}
                            />
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeContainer: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
    stepIndicator: { fontSize: 12, fontWeight: '700', color: Colors.primary },
    scrollContent: { padding: 16 },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: Colors.border,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        marginBottom: 16,
    },
    cardHeader: { fontSize: 17, fontWeight: '800', color: Colors.text, marginBottom: 4 },
    cardSub: { fontSize: 12, color: Colors.textMuted, marginBottom: 14 },
    fieldLabel: { fontSize: 13, fontWeight: '700', color: Colors.text, marginTop: 8, marginBottom: 2 },
    checkboxRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
    checkboxText: { fontSize: 13, color: Colors.text, marginLeft: 8 },
    districtsScroll: { flexDirection: 'row', marginVertical: 6 },
    districtPill: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        marginRight: 8,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    districtPillActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    districtPillText: { fontSize: 13, fontWeight: '600', color: Colors.text },
    districtPillTextActive: { color: '#FFFFFF' },
    summaryBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 16,
    },
    summaryLabel: { fontSize: 16, fontWeight: '700', color: Colors.text },
    summaryAmount: { fontSize: 24, fontWeight: '900', color: Colors.primary },
    primaryBtn: { borderRadius: 12, paddingVertical: 14 },
    payOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: Colors.border,
        marginBottom: 10,
        backgroundColor: '#FAFAFA',
    },
    payOptionSelected: {
        borderColor: Colors.primary,
        backgroundColor: '#F0FDF4',
    },
    payIconBox: { width: 38, alignItems: 'center', marginRight: 10 },
    payTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
    payDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
    simulationNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        padding: 10,
        borderRadius: 8,
        marginTop: 6,
    },
    simulationText: { fontSize: 11, color: '#1E40AF', flex: 1 },
    summaryLine: { fontSize: 13, color: Colors.textMuted, marginVertical: 3 },
    payBtn: { backgroundColor: Colors.success, borderRadius: 12, paddingVertical: 14 },
});