import { Box, Paper, Typography } from '@mui/material';
import React from 'react';

interface ILayoutBaseDePaginaProps {
    titulo: React.ReactNode;
    subtitulo?: string;
    children: React.ReactNode;
}

export const LayoutBaseDePagina: React.FC<ILayoutBaseDePaginaProps> = ({ children, titulo, subtitulo }) => {
    return (
        <Box display="flex" flexDirection="column" gap={2}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h5" component="h1" color="text.primary">
                    {titulo}
                </Typography>
                {subtitulo && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {subtitulo}
                    </Typography>
                )}
            </Paper>

            {children}
        </Box>
    );
};