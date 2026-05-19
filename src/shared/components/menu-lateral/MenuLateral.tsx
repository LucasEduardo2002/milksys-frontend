import React from 'react';
import { Box, Drawer, Icon, List, ListItemButton, ListItemIcon, ListItemText, useMediaQuery, useTheme, Toolbar } from "@mui/material";
import { useDrawerContext } from "../../contexts/DrawerContext";
import { Link, useMatch, useNavigate, useResolvedPath } from "react-router-dom";

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

    const _handleClick = () => {
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
    const drawerWidth = 220;

    return (
        <Box sx={{ display: 'flex' }}>
            <Drawer
                variant={mdDown ? 'temporary' : 'permanent'}
                open={isDrawerOpen}
                onClose={toggleDrawerOpen}
                sx={{
                    width: mdDown ? undefined : drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                        borderRight: 'none',
                    },
                }}
            >
                <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, height: '96px' }}>
                    <img src="/logo3.png" alt="Sertão Seridó" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                </Toolbar>

                <Box sx={{ overflow: 'auto' }}>
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
            </Drawer>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 2, // <<< ALTERAÇÃO AQUI: Padding reduzido para dar mais espaço ao conteúdo
                    height: '100vh',
                    overflow: 'auto',
                    backgroundColor: theme.palette.background.default,
                }}
            >
                {children}
            </Box>
        </Box>
    );
};