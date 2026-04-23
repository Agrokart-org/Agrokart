package com.agrokart.app;

import android.util.Log;
import androidx.annotation.NonNull;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.FirebaseException;
import com.google.firebase.auth.AuthResult;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthInvalidCredentialsException;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.auth.PhoneAuthCredential;
import com.google.firebase.auth.PhoneAuthOptions;
import com.google.firebase.auth.PhoneAuthProvider;

import java.util.concurrent.TimeUnit;

@CapacitorPlugin(name = "FirebaseAuthNative")
public class FirebaseAuthPlugin extends Plugin {

    private static final String TAG = "FirebaseAuthNative";
    private FirebaseAuth mAuth;
    private String mVerificationId;
    private PhoneAuthProvider.ForceResendingToken mResendToken;

    @Override
    public void load() {
        super.load();
        mAuth = FirebaseAuth.getInstance();
    }

    @PluginMethod
    public void verifyPhoneNumber(PluginCall call) {
        String phoneNumber = call.getString("phoneNumber");

        if (phoneNumber == null || phoneNumber.isEmpty()) {
            call.reject("Phone number is required");
            return;
        }

        PhoneAuthOptions options = PhoneAuthOptions.newBuilder(mAuth)
                .setPhoneNumber(phoneNumber)       // Phone number to verify
                .setTimeout(60L, TimeUnit.SECONDS) // Timeout and unit
                .setActivity(getActivity())                 // Activity for callback binding
                .setCallbacks(new PhoneAuthProvider.OnVerificationStateChangedCallbacks() {
                    @Override
                    public void onVerificationCompleted(@NonNull PhoneAuthCredential credential) {
                        Log.d(TAG, "onVerificationCompleted:" + credential);
                        
                        // Automatically sign in if instant verification or auto-retrieval succeeds
                        mAuth.signInWithCredential(credential)
                                .addOnCompleteListener(getActivity(), new OnCompleteListener<AuthResult>() {
                                    @Override
                                    public void onComplete(@NonNull Task<AuthResult> task) {
                                        if (task.isSuccessful()) {
                                            FirebaseUser user = task.getResult().getUser();
                                            JSObject ret = new JSObject();
                                            ret.put("status", "completed");
                                            ret.put("uid", user.getUid());
                                            notifyListeners("verificationCompleted", ret);
                                            // Optional: Resolve the original call if it's still pending
                                        } else {
                                            JSObject ret = new JSObject();
                                            ret.put("status", "error");
                                            ret.put("error", task.getException().getMessage());
                                            notifyListeners("verificationError", ret);
                                        }
                                    }
                                });
                    }

                    @Override
                    public void onVerificationFailed(@NonNull FirebaseException e) {
                        Log.w(TAG, "onVerificationFailed", e);
                        call.reject("Verification failed: " + e.getMessage());
                    }

                    @Override
                    public void onCodeSent(@NonNull String verificationId,
                                           @NonNull PhoneAuthProvider.ForceResendingToken token) {
                        Log.d(TAG, "onCodeSent:" + verificationId);
                        mVerificationId = verificationId;
                        mResendToken = token;
                        
                        JSObject ret = new JSObject();
                        ret.put("verificationId", verificationId);
                        call.resolve(ret);
                    }
                })
                .build();

        PhoneAuthProvider.verifyPhoneNumber(options);
    }

    @PluginMethod
    public void signInWithCredential(PluginCall call) {
        String verificationId = call.getString("verificationId");
        String code = call.getString("code");

        if (verificationId == null || code == null) {
            call.reject("verificationId and code are required");
            return;
        }

        PhoneAuthCredential credential = PhoneAuthProvider.getCredential(verificationId, code);

        mAuth.signInWithCredential(credential)
                .addOnCompleteListener(getActivity(), new OnCompleteListener<AuthResult>() {
                    @Override
                    public void onComplete(@NonNull Task<AuthResult> task) {
                        if (task.isSuccessful()) {
                            FirebaseUser user = task.getResult().getUser();
                            JSObject ret = new JSObject();
                            ret.put("uid", user.getUid());
                            ret.put("phoneNumber", user.getPhoneNumber());
                            call.resolve(ret);
                        } else {
                            if (task.getException() instanceof FirebaseAuthInvalidCredentialsException) {
                                call.reject("The verification code entered was invalid");
                            } else {
                                call.reject("Sign in failed", task.getException());
                            }
                        }
                    }
                });
    }
}
