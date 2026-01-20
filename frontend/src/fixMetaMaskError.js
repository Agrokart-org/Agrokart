
// This file suppresses the "Failed to connect to MetaMask" error from the React Error Overlay
// This error is caused by the MetaMask browser extension and is not related to the application code.

const suppressMetaMaskErrors = () => {
    // Suppress unhandled promise rejections related to MetaMask
    window.addEventListener('unhandledrejection', (event) => {
        if (event.reason && (
            event.reason.message?.includes('MetaMask') ||
            event.reason.stack?.includes('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn')
        )) {
            event.preventDefault();
            console.warn('Suppressed MetaMask connection error:', event.reason);
        }
    });

    // Suppress general errors related to MetaMask
    window.addEventListener('error', (event) => {
        if (event.message?.includes('MetaMask') ||
            event.filename?.includes('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn')) {
            event.preventDefault();
            console.warn('Suppressed MetaMask connection error:', event.message);
        }
    });

    // Patch console.error to avoid spamming the console with this specific error
    const originalConsoleError = console.error;
    console.error = (...args) => {
        if (args.length > 0 &&
            (typeof args[0] === 'string' && args[0].includes('MetaMask') ||
                (args[0]?.message && args[0].message.includes('MetaMask')))
        ) {
            // filters out the specific error
            return;
        }
        originalConsoleError(...args);
    };
};

export default suppressMetaMaskErrors;
