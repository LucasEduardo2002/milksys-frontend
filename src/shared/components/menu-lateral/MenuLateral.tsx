import React from 'react';
import { Box, Button, Divider, Drawer, Icon, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, useMediaQuery, useTheme } from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import LogoutIcon from '@mui/icons-material/Logout';
import { useDrawerContext } from "../../contexts/DrawerContext";
import { Link, useMatch, useNavigate, useResolvedPath } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

interface IListItemLinkProps {
    to: string;
    icon: string;
    label: string;
    onClick: (() => void) | undefined;
}

const ListItemLink: React.FC<IListItemLinkProps> = ({ to, icon, label, onClick }) => {
    const navigate = useNavigate();
    const resolvedPath = useResolvedPath(to);
    const match = useMatch({ path: resolvedPath.pathname, end: false });

    const handleClick = () => {
        navigate(to);
        onClick?.();
    };

    return (
        <ListItemButton
            component={Link}
            to={to}
            selected={!!match}
            onClick={onClick}
            sx={{
                borderRadius: 2,
                margin: '4px 0',
                transition: 'background-color 0.3s',
                '&.Mui-selected': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    },
                },
                '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
            }}
        >
            <ListItemIcon sx={{ minWidth: '40px' }}>
                <Icon sx={{ color: '#fff' }}>{icon}</Icon>
            </ListItemIcon>
            <ListItemText primary={label} sx={{ color: '#fff', '& .MuiTypography-root': { fontWeight: 500 } }} />
        </ListItemButton>
    );
};


interface IMenuLateralProps {
    children: React.ReactNode;
}

export const MenuLateral: React.FC<IMenuLateralProps> = ({ children }) => {
    const theme = useTheme();
    const mdDown = useMediaQuery(theme.breakpoints.down('md'));
    const { isDrawerOpen, drawerOptions, toggleDrawerOpen } = useDrawerContext();
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const drawerWidth = 220;
    const mobileDrawerWidth = 280;

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100dvh', width: '100%' }}>
            {mdDown && !isDrawerOpen && (
                <IconButton
                    aria-label="Abrir menu"
                    onClick={toggleDrawerOpen}
                    sx={{
                        position: 'fixed',
                        left: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: theme.zIndex.drawer + 2,
                        bgcolor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                        boxShadow: 3,
                        '&:hover': {
                            bgcolor: theme.palette.primary.dark,
                        },
                    }}
                >
                    <MenuIcon />
                </IconButton>
            )}
            {mdDown && isDrawerOpen && (
                <IconButton
                    aria-label="Fechar menu"
                    onClick={toggleDrawerOpen}
                    sx={{
                        position: 'fixed',
                        left: 8,
                        top: 8,
                        zIndex: theme.zIndex.drawer + 2,
                        bgcolor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                        boxShadow: 3,
                        '&:hover': {
                            bgcolor: theme.palette.primary.dark,
                        },
                    }}
                >
                    <CloseIcon />
                </IconButton>
            )}
            <Drawer
                variant={mdDown ? 'temporary' : 'permanent'}
                open={mdDown ? isDrawerOpen : true}
                onClose={toggleDrawerOpen}
                ModalProps={{ keepMounted: true }}
                sx={{
                    width: mdDown ? mobileDrawerWidth : drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: {
                        width: mdDown ? mobileDrawerWidth : drawerWidth,
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                        borderRight: 'none',
                    },
                }}
            >
                <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, height: '96px' }}>
                    <img src="/logo3.png" alt="Sertão Seridó" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                </Toolbar>

                <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                    <List component="nav" sx={{ p: 2 }}>
                        {drawerOptions.map(drawerOption => (
                            <ListItemLink
                                key={drawerOption.path}
                                to={drawerOption.path}
                                icon={drawerOption.icon}
                                label={drawerOption.label}
                                onClick={mdDown ? toggleDrawerOpen : undefined}
                            />
                        ))}
                    </List>
                </Box>

                <Box sx={{ mt: 'auto', p: 2 }}>
                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.18)', mb: 2 }} />
                    <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                        Logado como {user?.username ?? 'usuário'}
                    </Typography>
                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<LogoutIcon />}
                        onClick={handleLogout}
                        sx={{
                            color: '#fff',
                            borderColor: 'rgba(255,255,255,0.35)',
                            '&:hover': {
                                borderColor: '#fff',
                                backgroundColor: 'rgba(255,255,255,0.08)',
                            },
                        }}
                    >
                        Sair
                    </Button>
                </Box>
            </Drawer>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    minWidth: 0,
                    p: { xs: 1.5, sm: 2, md: 3 },
                    pt: mdDown ? 2 : 3,
                    minHeight: '100dvh',
                    overflow: 'auto',
                    backgroundColor: theme.palette.background.default,
                }}
            >
                {children}
            </Box>
        </Box>
    );
};