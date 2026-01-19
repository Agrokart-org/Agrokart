import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <Container sx={{ mt: 5, textAlign: 'center' }}>
                    <Box sx={{ p: 4, border: '1px solid #f44336', borderRadius: 2, bgcolor: '#ffebee' }}>
                        <Typography variant="h4" color="error" gutterBottom>
                            Something went wrong
                        </Typography>
                        <Typography variant="body1" color="textSecondary" paragraph>
                            The application encountered an unexpected error.
                        </Typography>
                        <Box sx={{ mt: 2, mb: 2, p: 2, bgcolor: '#fff', overflow: 'auto', maxHeight: 200, textAlign: 'left' }}>
                            <pre style={{ color: '#d32f2f', fontSize: '12px' }}>
                                {this.state.error && this.state.error.toString()}
                                <br />
                                {this.state.errorInfo && this.state.errorInfo.componentStack}
                            </pre>
                        </Box>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => window.location.reload()}
                        >
                            Reload Page
                        </Button>
                    </Box>
                </Container>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
