import { createTheme } from '@mui/material';

export const LightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: { main: '#15227F' }, // Usando a cor exata da logo
        secondary: { main: '#4CAF50' },
        background: { default: '#F0F2F5', paper: '#FFFFFF' },
        text: { primary: '#344054', secondary: '#667085' }
    },
    typography: {
        fontFamily: 'Inter, sans-serif',
        h4: { fontWeight: 700 },
        h5: { fontWeight: 600, color: '#1D2939' },
        h6: { fontWeight: 600, color: '#1D2939' },
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    border: '1px solid #EAECF0',
                    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.04)',
                    borderRadius: 8, // Mantém as bordas arredondadas para os cards
                }
            }
        },
        // Adicionado para customizar apenas o menu lateral
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    borderRadius: 0, // Remove a borda arredondada do menu
                    borderRight: 'none', // Garante que não haja borda indesejada
                }
            }
        },
        MuiButton: {
            defaultProps: {
                disableElevation: true
            },
            styleOverrides: {
                root: {
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 'bold'
                },
                containedPrimary: {
                    '&:hover': {
                        backgroundColor: '#101A66' // Um tom ligeiramente mais escuro para o hover
                    }
                }
            }
        },
        MuiTextField: {
            defaultProps: {
                variant: 'outlined',
                size: 'small'
            },
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        backgroundColor: '#EAECF0',
                        borderRadius: '12px',
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'transparent'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#15227F' // Borda usa a nova cor primária
                        },
                    },
                }
            }
        },
        MuiFormHelperText: {
            styleOverrides: {
                root: {
                    fontSize: '0.65rem',
                    marginLeft: 2,
                }
            }
        },
        MuiSelect: {
            defaultProps: {
                size: 'small',
                variant: 'outlined'
            },
            styleOverrides: {
                root: {
                    backgroundColor: '#EAECF0',
                    borderRadius: '12px',
                }
            }
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    padding: '8px 10px',
                    borderColor: '#EAECF0',
                },
                head: {
                    fontWeight: 'bold',
                    color: '#667085',
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                }
            }
        }
    },
});