import React, { useState, useEffect } from 'react'; // VVV CORREÇÃO: 'useCallback' e 'useMemo' removidos
import {
    Paper, Typography, Box, Grid, Card, CardContent, Chip, Divider, keyframes, TextField, IconButton, Tooltip
} from '@mui/material';
import { Api } from '../shared/services/api/axios-config';
import type { RowData } from './pagina_inicial/PaginaInicial';
// VVV CORREÇÃO: Importação de 'ProdutorData' removida
import { HourglassTop, CheckCircle, Science, ArrowBackIos, ArrowForwardIos, Cast, Cancel } from '@mui/icons-material';
import { usePresentationMode } from '../shared/hooks/usePresentationMode';
import { useSnackbar } from '../shared/contexts/SnackbarProvider';

const fadeIn = keyframes`from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); }`;

const AnaliseCard: React.FC<{ coleta: RowData }> = ({ coleta }) => {
    const isRecruzada = Number(coleta.acidez) > 19;
    const isAnaliseCompleta = coleta.gordura && coleta.gordura !== '-';

    const statusChip =
        isRecruzada ?
            <Chip icon={<Cancel />} label="Coleta Recusada" color="error" /> :
            isAnaliseCompleta ?
                <Chip icon={<CheckCircle />} label="Análise Concluída" color="success" /> :
                <Chip icon={<HourglassTop />} label="Aguardando Análise" color="warning" />;

    const renderMetric = (label: string, value: string, unit: string = '') => (
        <Grid item xs={4} textAlign="center">
            <Typography color="text.secondary" variant="body2">{label}</Typography>
            <Typography variant="h6" component="p">{value && value !== '-' ? `${value}${unit}` : '-'}</Typography>
        </Grid>
    );

    return (
        <Grid item xs={12} md={4}>
            <Card sx={{
                minHeight: 280, // Define uma altura mínima fixa para todos
                height: '100%',
                animation: `${fadeIn} 0.5s ease-out`,
                display: 'flex',
                flexDirection: 'column'
            }} variant="outlined">
                <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                            <Typography variant="h5" component="div" fontWeight="bold">{coleta.nome}</Typography>
                            {coleta.tanque && coleta.tanque !== '-' && <Typography color="text.secondary">Tanque: {coleta.tanque}</Typography>}
                        </Box>
                        {statusChip}
                    </Box>
                    <Divider sx={{ my: 1.5 }} />
                    <Box
                        sx={{
                            p: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            mb: 2,
                            display: 'flex',           // transforma em flex container
                            justifyContent: 'space-around', // espaço entre os elementos
                            alignItems: 'center',      // centraliza verticalmente
                            gap: 2                      // opcional, espaço fixo entre os elementos
                        }}
                    >
                        <Typography variant="h6">
                            Acidez: <strong>{coleta.acidez}°D</strong>
                        </Typography>
                        <Typography variant="h6">
                            Quantidade: <strong>{coleta.leite_bom_qnt}L</strong>
                        </Typography>
                    </Box>
                    <Grid container spacing={1} sx={{ opacity: isAnaliseCompleta ? 1 : 0.5 }}>
                        {renderMetric("Gordura", coleta.gordura, '%')}
                        {renderMetric("Proteína", coleta.proteina, '%')}
                        {renderMetric("Densidade", coleta.densidade)}
                        {renderMetric("ESD", coleta.ESD, '%')}
                        {renderMetric("Crioscopia", coleta.crioscopia, '%')}
                        {renderMetric("Lactose", coleta.lactose, '%')}
                    </Grid>
                </CardContent>
            </Card>
        </Grid>
    );
};

export const PainelRecepcao: React.FC = () => {
    const [coletas, setColetas] = useState<RowData[]>([]);
    const [dataFiltro, setDataFiltro] = useState(new Date().toISOString().split('T')[0]);
    const [paginaAtual, setPaginaAtual] = useState(0);
    const { showSnackbar } = useSnackbar();
    
    const { isPresentationActive, isSupported, startPresentation, updatePresentation, stopPresentation } = usePresentationMode(
        (errorMsg) => showSnackbar(errorMsg, 'error')
    );
    
    // Detecta se está em modo apresentação (parâmetro de query)
    const isPresentationMode = new URLSearchParams(window.location.search).get('presentationMode') === 'true';

    const ITENS_POR_PAGINA = 6;

    useEffect(() => {
        const fetchColetas = () => {
            Api.get(`/coletas/por-data?date=${dataFiltro}`)
                .then(response => setColetas(response.data))
                .catch(console.error);
        };
        fetchColetas();
        const intervalId = setInterval(fetchColetas, 20000); // Auto-atualiza a cada 20 segundos
        return () => clearInterval(intervalId);
    }, [dataFiltro]);

    const totalLeiteDoDia = coletas.reduce((acc, curr) => acc + Number(curr.leite_bom_qnt || 0), 0);

    // Listener para sincronizar dados quando em modo apresentação
    useEffect(() => {
        if (!isPresentationMode) return;

        const handleBroadcast = (event: MessageEvent) => {
            if (event.data.type === 'UPDATE_DATA') {
                const { coletas: novasColetas, dataFiltro: novoDataFiltro } = event.data.data;
                setColetas(novasColetas);
                setDataFiltro(novoDataFiltro);
                return;
            }

            if (event.data.type === 'STOP_PRESENTATION') {
                try {
                    document.body.innerHTML = '';
                    window.location.replace('about:blank');
                    window.close();
                } catch (error) {
                    console.warn('Não foi possível fechar a janela de apresentação:', error);
                    window.location.href = 'about:blank';
                }
            }
        };

        try {
            const channel = new BroadcastChannel('painel-recepcao');
            channel.addEventListener('message', handleBroadcast);

            return () => {
                channel.removeEventListener('message', handleBroadcast);
                channel.close();
            };
        } catch (error) {
            console.warn('BroadcastChannel não suportado:', error);
        }
    }, [isPresentationMode]);

    // Atualiza apresentação quando dados mudam na aba principal
    useEffect(() => {
        if (!isPresentationMode && isPresentationActive) {
            updatePresentation({
                coletas,
                dataFiltro,
                totalLeiteDoDia,
            });
        }
    }, [coletas, dataFiltro, totalLeiteDoDia, isPresentationActive, isPresentationMode, updatePresentation]);

    const handleCastClick = () => {
        console.log('[PainelRecepcao] Cast button clicked', { isSupported, isPresentationActive });
        
        if (isPresentationActive) {
            stopPresentation();
        } else {
            // Tenta iniciar mesmo que isSupported seja false
            // (a verificação real acontece dentro de startPresentation)
            startPresentation();
        }
    };

    // Em modo apresentação, mostra mais itens (até 12)
    const itensPerPageAtual = isPresentationMode ? 12 : ITENS_POR_PAGINA;
    const totalPaginas = Math.ceil(coletas.length / itensPerPageAtual);
    const coletasPaginadas = coletas.slice(paginaAtual * itensPerPageAtual, (paginaAtual + 1) * itensPerPageAtual);

    const irParaPaginaAnterior = () => setPaginaAtual(p => Math.max(0, p - 1));
    const irParaProximaPagina = () => setPaginaAtual(p => Math.min(totalPaginas - 1, p + 1));
    return (
        <Box sx={{ p: isPresentationMode ? 3 : { xs: 1, sm: 2, md: 3 }, backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
            {!isPresentationMode && (
                <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <img src="/logo3.png" alt="Sertão Seridó" style={{ height: 60 }} />
                        <Typography variant="h4" fontWeight="bold" color="primary">Painel de Recepção</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={2}>
                        <TextField
                            type="date"
                            label="Filtrar por data"
                            value={dataFiltro}
                            onChange={(e) => { setDataFiltro(e.target.value); setPaginaAtual(0); }}
                            InputLabelProps={{ shrink: true }}
                            size="small"
                        />
                        <Tooltip title={
                            !isSupported 
                                ? "Clique para tentar transmitir. Conecte um monitor HDMI ou dispositivo Cast (Chromecast)."
                                : isPresentationActive 
                                ? "Parar transmissão"
                                : "Transmitir para tela (HDMI)"
                        }>
                            <span>
                                <IconButton 
                                    onClick={handleCastClick}
                                    color={isPresentationActive ? 'error' : 'default'}
                                    sx={{ 
                                        color: isPresentationActive ? 'error.main' : 'inherit',
                                        backgroundColor: isPresentationActive ? 'rgba(211, 47, 47, 0.12)' : 'transparent',
                                        border: isPresentationActive ? '1px solid rgba(211, 47, 47, 0.55)' : '1px solid transparent',
                                        boxShadow: isPresentationActive ? '0 0 0 2px rgba(211, 47, 47, 0.12)' : 'none',
                                        '&:hover': {
                                            backgroundColor: isPresentationActive ? 'error.light' : 'action.hover'
                                        }
                                    }}
                                >
                                    <Cast />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Box>
                </Box>
            )}
            <Box sx={{ flexGrow: 1 }}>
                {coletas.length > 0 ? (
                    <>
                        <Grid container spacing={3}>
                            {coletasPaginadas.map((coleta: RowData) => <AnaliseCard key={coleta.id} coleta={coleta} />)}
                        </Grid>
                        {!isPresentationMode && totalPaginas > 1 && (
                            <Box display="flex" justifyContent="center" alignItems="center" mt={2}>
                                <IconButton onClick={irParaPaginaAnterior} disabled={paginaAtual === 0}><ArrowBackIos /></IconButton>
                                <Typography>Página {paginaAtual + 1} de {totalPaginas}</Typography>
                                <IconButton onClick={irParaProximaPagina} disabled={paginaAtual >= totalPaginas - 1}><ArrowForwardIos /></IconButton>
                            </Box>
                        )}
                       
                    </>
                    
                ) : (
                    <Paper sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mt: 4 }}>
                        <Science sx={{ fontSize: 60 }} color="disabled" />
                        <Typography variant="h6" color="text.secondary">Nenhuma coleta encontrada para a data selecionada.</Typography>
                    </Paper>
                )}
            </Box>
             {coletas.length > 0 && (
                <Box
                    sx={{
                        ...(isPresentationMode && { position: 'fixed', bottom: 20, right: 0, width: '100%' }),
                        display: 'flex',
                        justifyContent: 'center',
                        ...(isPresentationMode ? {} : { mt: 0 })
                    }}
                >
                    <Paper
                        
                        sx={{
                            p: 2,
                            px: 3,
                            backgroundColor: '#2135ce',
                            color: 'white',
                            borderRadius: 5, 
                            display: 'flex',
                            gap: 3,
                            alignItems: 'center', 
                            border: '2px solid white',
                            fontSize: isPresentationMode ? '2em' : 'inherit'
                            
                        }}
                    >
                        <Typography variant="h5" fontWeight="bold" color="white" sx={{ fontSize: isPresentationMode ? '2em' : 'inherit' }}>
                            Total do Dia:
                        </Typography>
                        <Typography variant="h5" fontWeight="bold" color="white" sx={{ fontSize: isPresentationMode ? '2em' : 'inherit' }}>
                            {totalLeiteDoDia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} L
                        </Typography>
                    </Paper>
                </Box>
            )}
            
        </Box>
    );
};