import * as React from "react";
import { LayoutBaseDePagina } from "../shared/layouts";
import { Paper, Typography, Card, Box, useMediaQuery, useTheme, TextField, IconButton, Tooltip } from "@mui/material";
import Grid from "@mui/material/Grid";
import { Clear } from '@mui/icons-material';
import { Api } from '../shared/services/api/axios-config';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Line } from 'recharts';
import { Group, Scale, WaterDrop, Science } from '@mui/icons-material';

// --- Interfaces ---
interface IProdutor { nome: string; }
interface IColeta {
    nome: string;
    data: string; // Certifique-se que sua API envia a data da coleta
    acidez: string;
    gordura: string;
    proteina: string;
}

const StatCardBase: React.FC<{ title: string, value: string | number, icon: React.ReactNode, isCompact: boolean }> = ({ title, value, icon, isCompact }) => (
    <Card sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 2, height: '100%', textAlign: 'center' }}>
        <Box sx={{ mb: 1, color: 'primary.main' }}>{icon}</Box>
        <Box>
            <Typography color="text.secondary" variant="body2">{title}</Typography>
            <Typography variant={isCompact ? 'h5' : 'h4'} component="p" fontWeight="bold">{value}</Typography>
        </Box>
    </Card>
);

const StatCard = React.memo(StatCardBase);

export function Dashboard() {
    const theme = useTheme();
    const isCompact = useMediaQuery(theme.breakpoints.down('md'));
    const [produtores, setProdutores] = React.useState<IProdutor[]>([]);
    const [coletas, setColetas] = React.useState<IColeta[]>([]);

    // --- ESTADOS DOS FILTROS ---
    const [dataInicio, setDataInicio] = React.useState('');
    const [dataFim, setDataFim] = React.useState('');

    React.useEffect(() => {
        Api.get("/produtores").then(res => setProdutores(res.data)).catch(console.error);
        Api.get("/coletas").then(res => setColetas(res.data)).catch(console.error);
    }, []);

    // --- LÓGICA DE FILTRAGEM ---
    const coletasFiltradas = React.useMemo(() => {
        return coletas.filter(coleta => {
            if (!dataInicio && !dataFim) return true;

            const dataColeta = new Date(coleta.data);
            const inicio = dataInicio ? new Date(dataInicio + 'T00:00:00') : null;
            const fim = dataFim ? new Date(dataFim + 'T23:59:59') : null;

            if (inicio && dataColeta < inicio) return false;
            if (fim && dataColeta > fim) return false;

            return true;
        });
    }, [coletas, dataInicio, dataFim]);

    // --- CÁLCULOS BASEADOS NAS COLETAS FILTRADAS ---
    const { totalProdutores, mediaAcidez, mediaGordura, mediaProteina } = React.useMemo(() => {
        const totalProdutores = produtores.length;

        if (coletasFiltradas.length === 0) {
            return { totalProdutores, mediaAcidez: "0.00", mediaGordura: "0.00%", mediaProteina: "0.00%" };
        }

        let somaAcidez = 0, countAcidez = 0, somaGordura = 0, countGordura = 0, somaProteina = 0, countProteina = 0;

        coletasFiltradas.forEach(c => {
            const acidezNum = parseFloat(c.acidez);
            if (!isNaN(acidezNum)) { somaAcidez += acidezNum; countAcidez++; }
            const gorduraNum = parseFloat(c.gordura);
            if (!isNaN(gorduraNum)) { somaGordura += gorduraNum; countGordura++; }
            const proteinaNum = parseFloat(c.proteina);
            if (!isNaN(proteinaNum)) { somaProteina += proteinaNum; countProteina++; }
        });

        return {
            totalProdutores,
            mediaAcidez: countAcidez > 0 ? (somaAcidez / countAcidez).toFixed(2) : "0.00",
            mediaGordura: countGordura > 0 ? (somaGordura / countGordura).toFixed(2) + "%" : "0.00%",
            mediaProteina: countProteina > 0 ? (somaProteina / countProteina).toFixed(2) + "%" : "0.00%",
        };
    }, [produtores, coletasFiltradas]);

    // --- DADOS DO GRÁFICO FILTRADOS ---
    const dataGrafico = React.useMemo(() => {
        if (produtores.length === 0 || coletasFiltradas.length === 0) return [];

        const getShortName = (fullName: string = "") => {
            const parts = fullName.split(' ');
            return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : fullName;
        };

        const dadosPorProdutor: { [key: string]: { coletas: number, somaAcidez: number } } = {};
        coletasFiltradas.forEach(coleta => {
            if (!coleta.nome) return;
            if (!dadosPorProdutor[coleta.nome]) {
                dadosPorProdutor[coleta.nome] = { coletas: 0, somaAcidez: 0 };
            }
            dadosPorProdutor[coleta.nome].coletas++;
            dadosPorProdutor[coleta.nome].somaAcidez += parseFloat(coleta.acidez || '0');
        });

        return produtores
            .map(produtor => {
                const dados = dadosPorProdutor[produtor.nome];
                return {
                    name: getShortName(produtor.nome),
                    "Nº de Coletas": dados?.coletas || 0,
                    "Acidez Média": dados?.coletas ? parseFloat((dados.somaAcidez / dados.coletas).toFixed(2)) : 0
                };
            })
            .filter(item => item["Nº de Coletas"] > 0)
            .sort((a, b) => b["Nº de Coletas"] - a["Nº de Coletas"]);
    }, [produtores, coletasFiltradas]);

    const chartHeight = isCompact ? 300 : 380;

    return (
        <LayoutBaseDePagina titulo="Dashboard" subtitulo="Visão geral e indicadores de qualidade do leite.">

            <Grid container spacing={{ xs: 1.5, sm: 3 }}>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Total de Produtores" value={totalProdutores} icon={<Group fontSize="large" />} isCompact={isCompact} /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Média de Acidez" value={mediaAcidez} icon={<Scale fontSize="large" />} isCompact={isCompact} /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Média de Gordura" value={mediaGordura} icon={<WaterDrop fontSize="large" />} isCompact={isCompact} /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Média de Proteína" value={mediaProteina} icon={<Science fontSize="large" />} isCompact={isCompact} /></Grid>

                <Grid item xs={12} marginTop={2}>
                    <Paper sx={{ p: { xs: 1.5, sm: 2, md: 3 } }} >
                        <Box
                            display="flex"
                            alignItems={{ xs: 'stretch', sm: 'center' }}
                            justifyContent="space-between"
                            flexDirection={{ xs: 'column', sm: 'row' }}
                            gap={{ xs: 1.5, sm: 2 }}
                            mb={2}
                        >
                            <Typography variant={isCompact ? 'subtitle1' : 'h6'}>
                                Análise de Coletas por Produtor (Período Selecionado)
                            </Typography>
                            {/* --- SEÇÃO DE FILTROS --- */}
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
                                
                                <TextField
                                    label="Data Inicial"
                                    type="date"
                                    size="small"
                                    sx={{ minWidth: { xs: '100%', sm: 150 } }}
                                    value={dataInicio}
                                    onChange={(e) => setDataInicio(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    label="Data Final"
                                    type="date"
                                    size="small"
                                    sx={{ minWidth: { xs: '100%', sm: 150 } }}
                                    value={dataFim}
                                    onChange={(e) => setDataFim(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                                {(dataInicio || dataFim) && (
                                    <Tooltip title="Limpar Filtros">
                                        <IconButton onClick={() => { setDataInicio(''); setDataFim(''); }}>
                                            <Clear />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Box>
                        </Box>
                        <Box sx={{ width: '100%', height: chartHeight }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={dataGrafico} margin={{ top: 20, right: 10, left: isCompact ? -20 : 20, bottom: isCompact ? 20 : 80 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="name"
                                    angle={isCompact ? 0 : -45}
                                    textAnchor={isCompact ? 'middle' : 'end'}
                                    interval={isCompact ? 'preserveStartEnd' : 0}
                                    tickMargin={8}
                                    tickFormatter={(value: string) => isCompact ? value.split(' ')[0] : value}
                                />
                                <YAxis yAxisId="left" orientation="left" stroke={theme.palette.info.main} />
                                <YAxis yAxisId="right" orientation="right" stroke={theme.palette.secondary.main} />
                                <RechartsTooltip />
                                {!isCompact && <Legend verticalAlign="top" />}
                                <Bar yAxisId="left" dataKey="Nº de Coletas" fill={theme.palette.info.light} isAnimationActive={false} />
                                <Line yAxisId="right" type="monotone" dataKey="Acidez Média" stroke={theme.palette.secondary.main} strokeWidth={2} isAnimationActive={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </LayoutBaseDePagina>
    );
}