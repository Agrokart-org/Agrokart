import React, { useState } from 'react';
import {
    Card, CardContent, Typography, Button,
    Box, Chip, Collapse, IconButton
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
// import { useDispatch } from 'react-redux';
// import { addToCart } from '../../redux/slices/cartSlice';

const ExpandMore = styled((props) => {
    const { expand, ...other } = props;
    return <IconButton {...other} />;
})(({ theme, expand }) => ({
    transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
        duration: theme.transitions.duration.shortest,
    }),
}));

const RecommendationCard = ({ recommendation }) => {
    const { t } = useTranslation();
    // const dispatch = useDispatch();
    const [expanded, setExpanded] = useState(false);

    const handleExpandClick = () => {
        setExpanded(!expanded);
    };

    const handleAddToCart = () => {
        // To be implemented: Look up product ID in inventory
        console.log('Adding to cart:', recommendation.product);
        // dispatch(addToCart({ ...product, quantity: 1 }));
        alert(`Added ${recommendation.product} to cart! (Demo)`);
    };

    const isCorrection = recommendation.type === 'Correction';

    return (
        <Card variant="outlined" sx={{ mb: 2, borderColor: isCorrection ? 'secondary.main' : 'primary.main', borderWidth: 1 }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={1}>
                        {isCorrection ? <WarningIcon color="secondary" /> : <CheckCircleIcon color="success" />}
                        <Typography variant="h6" component="div">
                            {recommendation.product}
                        </Typography>
                    </Box>
                    <Chip
                        label={recommendation.type}
                        color={isCorrection ? "secondary" : "primary"}
                        size="small"
                    />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {recommendation.reason}
                </Typography>

                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="subtitle2" color="primary.dark">
                            {t('drAgro.dosage')}: {recommendation.dosage}
                        </Typography>
                        {recommendation.totalQuantity && (
                            <Typography variant="body2" color="success.main" fontWeight="bold" mt={0.5}>
                                Total Required: {recommendation.totalQuantity}
                            </Typography>
                        )}
                    </Box>

                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<ShoppingCartIcon />}
                        onClick={handleAddToCart}
                        disabled={recommendation.type === 'Advisory'}
                    >
                        {t('drAgro.addToCart')}
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
};

export default RecommendationCard;
