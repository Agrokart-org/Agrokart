import { registerPlugin } from '@capacitor/core';

// This registers the native plugin we created in FirebaseAuthPlugin.java
const FirebaseAuthNative = registerPlugin('FirebaseAuthNative');

/**
 * Initiates the phone number verification process using Native Android Firebase SDK.
 * @param {string} phoneNumber - The phone number to verify (e.g., '+1234567890')
 * @returns {Promise<{verificationId: string}>} - The verification ID to use when signing in
 */
export const verifyPhoneNumberNative = async (phoneNumber) => {
    try {
        const response = await FirebaseAuthNative.verifyPhoneNumber({ phoneNumber });
        return response;
    } catch (error) {
        console.error("Native verifyPhoneNumber error:", error);
        throw error;
    }
};

/**
 * Completes the sign-in process with the verification ID and the SMS code.
 * @param {string} verificationId - The ID returned from verifyPhoneNumberNative
 * @param {string} code - The 6-digit SMS code entered by the user
 * @returns {Promise<{uid: string, phoneNumber: string}>} - User info upon successful sign in
 */
export const signInWithCredentialNative = async (verificationId, code) => {
    try {
        const response = await FirebaseAuthNative.signInWithCredential({ verificationId, code });
        return response;
    } catch (error) {
        console.error("Native signInWithCredential error:", error);
        throw error;
    }
};

/**
 * Listens for automatic SMS retrieval or instant verification completion.
 * @param {Function} callback - Called when verification is automatically completed
 */
export const addVerificationListener = (callback) => {
    return FirebaseAuthNative.addListener('verificationCompleted', (info) => {
        callback(info);
    });
};

export default FirebaseAuthNative;
