import * as React from 'react';
import { Routes, Route, Navigate } from "react-router-dom"; 
import { useDrawerContext } from "../shared/contexts/DrawerContext";

// Importações de todas as suas páginas
import { PaginaInicial } from '../pages/pagina_inicial/PaginaInicial';
import { CadastrarProdutor } from '../pages/CadastrarProdutor';
import { Dashboard } from '../pages/Dashboard';

import { PainelRecepcao } from '../pages/PainelRecepcao';

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
        <Routes>
            <Route path="/pagina-inicial" element={<PaginaInicial />} />
            
            <Route path="/produtores" element={<CadastrarProdutor />} />
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* GARANTA QUE ESTA ROTA ESTEJA AQUI */}
            <Route path="/painel-recepcao" element={<PainelRecepcao />} />
            
            <Route path="*" element={<Navigate to={"/pagina-inicial"} />} />
        </Routes>
    )
}

export default AppRoutes;