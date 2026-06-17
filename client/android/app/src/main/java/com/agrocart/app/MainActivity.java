package com.agrocart.app;

import android.content.Intent;
import android.net.Uri;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Override WebView to handle external URLs (UPI, bank pages, intents)
        this.bridge.getWebView().setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                // Handle UPI intent URLs — open in external UPI app (GPay, PhonePe, etc.)
                if (url.startsWith("upi://") || url.startsWith("intent://")) {
                    try {
                        Intent intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME);
                        if (intent.resolveActivity(getPackageManager()) != null) {
                            startActivity(intent);
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                    return true;
                }

                // Handle tel: and mailto: links
                if (url.startsWith("tel:") || url.startsWith("mailto:")) {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    startActivity(intent);
                    return true;
                }

                // Let all http/https URLs load inside the WebView so Razorpay bank iframes work correctly
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    return false;
                }

                return false;
            }
        });
    }
}
