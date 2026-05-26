import { Box, Paper, Typography } from '@mui/material';
import React from 'react';

interface ILayoutBaseDePaginaProps {
    titulo: React.ReactNode;
    subtitulo?: string;
    children: React.ReactNode;
}

export const LayoutBaseDePagina: React.FC<ILayoutBaseDePaginaProps> = ({ children, titulo, subtitulo }) => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
            <Paper sx={{ p: { xs: 1.5, sm: 2 }, textAlign: 'center' }}>
                <Typography variant="h5" component="h1" color="text.primary" sx={{ fontSize: { xs: '1.15rem', sm: '1.5rem' } }}>
                    {titulo}
                </Typography>
                {subtitulo && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                        {subtitulo}
                    </Typography>
                )}
            </Paper>

            {children}
        </Box>
    );
};