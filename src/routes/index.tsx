import * as React from 'react';
import { Routes, Route, Navigate } from "react-router-dom"; 
import { Box, CircularProgress, Typography } from '@mui/material';
import { useDrawerContext } from "../shared/contexts/DrawerContext";

const PaginaInicial = React.lazy(() =>
    import('../pages/pagina_inicial/PaginaInicial').then(module => ({ default: module.PaginaInicial }))
);

const CadastrarProdutor = React.lazy(() =>
    import('../pages/CadastrarProdutor').then(module => ({ default: module.CadastrarProdutor }))
);

const Dashboard = React.lazy(() =>
    import('../pages/Dashboard').then(module => ({ default: module.Dashboard }))
);

const PainelRecepcao = React.lazy(() =>
    import('../pages/PainelRecepcao').then(module => ({ default: module.PainelRecepcao }))
);

const LoadingFallback = () => (
    <Box sx={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={32} />
        <Typography variant="body2" color="text.secondary">
            Carregando tela...
        </Typography>
    </Box>
);

export const AppRoutes = () => {
    const { setDrawerOptions } = useDrawerContext();

    // Este hook é responsável por criar os itens do menu lateral.
    React.useEffect(() => {
        setDrawerOptions([
            { 
                icon: 'home', 
                path: '/pagina-inicial', 
                label: 'Página inicial' 
            },
            
            { 
                icon: 'group', 
                path: '/produtores', 
                label: 'Produtores' 
            },
            { 
                icon: 'leaderboard', 
                path: '/dashboard', 
                label: 'Dashboard' 
            },
            // GARANTA QUE ESTE ITEM ESTEJA AQUI
            { 
                icon: 'monitor', 
                path: '/painel-recepcao', 
                label: 'Painel Recepção' 
            },
        ]);
    }, [setDrawerOptions]);

    return (
        // Este componente define qual página carregar com base na URL.
        <React.Suspense fallback={<LoadingFallback />}>
            <Routes>
                <Route path="/pagina-inicial" element={<PaginaInicial />} />

                <Route path="/produtores" element={<CadastrarProdutor />} />
                <Route path="/dashboard" element={<Dashboard />} />

                {/* GARANTA QUE ESTA ROTA ESTEJA AQUI */}
                <Route path="/painel-recepcao" element={<PainelRecepcao />} />

                <Route path="*" element={<Navigate to={"/pagina-inicial"} />} />
            </Routes>
        </React.Suspense>
    )
}

export default AppRoutes;