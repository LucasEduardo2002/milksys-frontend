// src/context/SnackbarProvider.tsx
import  { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { Snackbar, Alert } from '@mui/material';

// 1. Defina o tipo de severidade
type SnackbarSeverity = 'success' | 'error' | 'warning' | 'info';

// 2. Crie o contexto
interface SnackbarContextType {
    showSnackbar: (message: string, severity?: SnackbarSeverity) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

// 3. Crie o provedor
interface SnackbarProviderProps {
    children: ReactNode;
}

export const SnackbarProvider = ({ children }: SnackbarProviderProps) => {
    const [snackbarState, setSnackbarState] = useState<{
        open: boolean;
        message: string;
        severity: SnackbarSeverity;
    }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const showSnackbar = (message: string, severity: SnackbarSeverity = 'success') => {
        setSnackbarState({ open: true, message, severity });
    };

    const handleClose = () => {
        setSnackbarState(prev => ({ ...prev, open: false }));
    };

    return (
        <SnackbarContext.Provider value={{ showSnackbar }}>
            {children}
            <Snackbar
                open={snackbarState.open}
                autoHideDuration={4000}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    severity={snackbarState.severity}
                    onClose={handleClose}
                    variant="filled"
                >
                    {snackbarState.message}
                </Alert>
            </Snackbar>
        </SnackbarContext.Provider>
    );
};

// 4. Crie o hook para consumir o contexto
export const useSnackbar = () => {
    const context = useContext(SnackbarContext);
    if (!context) {
        throw new Error('useSnackbar must be used within a SnackbarProvider');
    }
    return context;
};
