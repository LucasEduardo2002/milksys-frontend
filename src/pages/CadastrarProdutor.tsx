import React, { useState, useEffect, useMemo } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Button, Grid, TextField, Box, Typography, IconButton, Dialog, DialogActions,
    DialogContent, DialogContentText, DialogTitle, Tooltip, Card, Stack, useMediaQuery, useTheme, TablePagination
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { LayoutBaseDePagina } from '../shared/layouts';
import { Api } from '../shared/services/api/axios-config';
import { useSnackbar } from '../shared/contexts/SnackbarProvider';
import { SearchField } from '../shared/components/SearchField';

export interface ProdutorData {
    id: number;
    nome: string;
    cpfCnpj: string;
    telefone: string;
    localidade: string;
    tipo: string;
    status: string;
}

const createEmptyProdutor = (): Omit<ProdutorData, 'id'> => ({
    nome: '', cpfCnpj: '', telefone: '', localidade: '', tipo: 'Pessoa Física', status: 'Ativo'
});

export const CadastrarProdutor: React.FC = () => {
    const theme = useTheme();
    const isCompact = useMediaQuery(theme.breakpoints.down('md'));
    const [produtores, setProdutores] = useState<ProdutorData[]>([]);
    const [busca, setBusca] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentProdutor, setCurrentProdutor] = useState<Omit<ProdutorData, 'id'> & { id?: number }>(createEmptyProdutor());
    const [openDialog, setOpenDialog] = useState(false);
    const [produtorToDelete, setProdutorToDelete] = useState<number | null>(null);
    const [page, setPage] = useState(0);
    const rowsPerPage = isCompact ? 6 : 10;
    const { showSnackbar } = useSnackbar();

    const fetchProdutores = () => {
        Api.get('/produtores').then(response => {
            setProdutores(response.data);
        }).catch(() => showSnackbar('Erro ao buscar produtores.', 'error'));
    };

    useEffect(() => {
        fetchProdutores();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentProdutor(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = () => {
        if (!currentProdutor.nome || !currentProdutor.cpfCnpj) {
            showSnackbar('Nome e CPF/CNPJ são obrigatórios.', 'warning');
            return;
        }
        const method = isEditMode ? 'put' : 'post';
        const url = isEditMode ? `/produtores/${currentProdutor.id}` : '/produtores';

        Api[method](url, currentProdutor).then(() => {
            showSnackbar(`Produtor ${isEditMode ? 'atualizado' : 'cadastrado'}!`, 'success');
            fetchProdutores();
            handleCancel();
        }).catch(() => showSnackbar('Erro ao salvar produtor.', 'error'));
    };

    const handleEdit = (produtor: ProdutorData) => {
        setIsEditMode(true);
        setCurrentProdutor(produtor);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    const handleDeleteClick = (id: number) => {
        setProdutorToDelete(id);
        setOpenDialog(true);
    };

    const handleDeleteConfirm = () => {
        if (produtorToDelete === null) return;
        Api.delete(`/produtores/${produtorToDelete}`).then(() => {
            showSnackbar('Produtor excluído.', 'info');
            fetchProdutores();
        }).catch(() => showSnackbar('Erro ao excluir produtor.', 'error'));
        setOpenDialog(false);
        setProdutorToDelete(null);
    };

    const handleCancel = () => {
        setIsEditMode(false);
        setCurrentProdutor(createEmptyProdutor());
    };

    const produtoresFiltrados = useMemo(() => {
        return produtores.filter(p =>
            p.nome.toLowerCase().includes(busca.toLowerCase()) ||
            p.cpfCnpj.toLowerCase().includes(busca.toLowerCase())
        );
    }, [produtores, busca]);

    const produtoresPaginados = useMemo(() => {
        const start = page * rowsPerPage;
        return produtoresFiltrados.slice(start, start + rowsPerPage);
    }, [page, rowsPerPage, produtoresFiltrados]);

    useEffect(() => {
        setPage(0);
    }, [busca, isCompact]);

    useEffect(() => {
        if (page > 0 && page * rowsPerPage >= produtoresFiltrados.length) {
            setPage(Math.max(0, Math.ceil(produtoresFiltrados.length / rowsPerPage) - 1));
        }
    }, [page, rowsPerPage, produtoresFiltrados.length]);

    return (
        <LayoutBaseDePagina titulo="Cadastro de Produtores">
            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
                <Typography variant="h6" mb={2}>{isEditMode ? 'Editar Produtor' : 'Novo Produtor'}</Typography>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={3}><TextField name="nome" label="Nome Completo" value={currentProdutor.nome} onChange={handleInputChange} fullWidth size="small" /></Grid>
                    <Grid item xs={12} sm={6} md={3}><TextField name="cpfCnpj" label="CPF/CNPJ" value={currentProdutor.cpfCnpj} onChange={handleInputChange} fullWidth size="small" /></Grid>
                    <Grid item xs={12} sm={6} md={3}><TextField name="telefone" label="Telefone" value={currentProdutor.telefone} onChange={handleInputChange} fullWidth size="small" /></Grid>
                    <Grid item xs={12} sm={6} md={3}><TextField name="localidade" label="Localidade" value={currentProdutor.localidade} onChange={handleInputChange} fullWidth size="small" /></Grid>
                    <Grid item xs={12} container justifyContent={{ xs: 'stretch', sm: 'flex-end' }} spacing={1} sx={{ mt: 1 }}>
                        {isEditMode && (
                            <Grid item xs={12} sm="auto">
                                <Button variant="outlined" onClick={handleCancel} fullWidth>
                                    Cancelar
                                </Button>
                            </Grid>
                        )}
                        <Grid item xs={12} sm="auto">
                            <Button variant="contained" onClick={handleSave} fullWidth>
                                {isEditMode ? 'Salvar Alterações' : 'Cadastrar'}
                            </Button>
                        </Grid>
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: { xs: 2, sm: 3 } }}>
                <Box
                    display="flex"
                    justifyContent="space-between"
                    flexDirection={{ xs: 'column', sm: 'row' }}
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                    gap={1.5}
                    mb={2}
                >
                    <Typography variant="h6">Produtores Cadastrados</Typography>
                    <SearchField
                        onSearchChange={setBusca}
                        placeholder="Buscar por nome ou CPF..."
                        size="small"
                        fullWidth={isCompact}
                        sx={{ maxWidth: { sm: 320 } }}
                    />
                </Box>
                {isCompact ? (
                    <Stack spacing={1.5}>
                        {produtoresPaginados.map((produtor) => (
                            <Card key={produtor.id} variant="outlined" sx={{ p: 1.5 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography fontWeight={600} noWrap>{produtor.nome}</Typography>
                                        <Typography variant="body2" color="text.secondary">CPF/CNPJ: {produtor.cpfCnpj}</Typography>
                                        <Typography variant="body2" color="text.secondary">Telefone: {produtor.telefone || '—'}</Typography>
                                        <Typography variant="body2" color="text.secondary">Localidade: {produtor.localidade || '—'}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', flexShrink: 0 }}>
                                        <Tooltip title="Editar"><IconButton size="small" onClick={() => handleEdit(produtor)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                                        <Tooltip title="Apagar"><IconButton size="small" onClick={() => handleDeleteClick(produtor.id)}><DeleteIcon fontSize="small" color="error" /></IconButton></Tooltip>
                                    </Box>
                                </Box>
                            </Card>
                        ))}
                    </Stack>
                ) : (
                    <TableContainer>
                        <Table size="small" sx={{ tableLayout: 'fixed' }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell align="center" sx={{ width: '10%' }}>Ações</TableCell>
                                    <TableCell align="center" sx={{ width: '35%' }}>Nome</TableCell>
                                    <TableCell align="center" sx={{ width: '20%' }}>CPF/CNPJ</TableCell>
                                    <TableCell align="center" sx={{ width: '15%' }}>Telefone</TableCell>
                                    <TableCell align="center" sx={{ width: '20%' }}>Localidade</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {produtoresPaginados.map((produtor) => (
                                    <TableRow key={produtor.id} hover>
                                        <TableCell align="center">
                                            <Tooltip title="Editar"><IconButton size="small" onClick={() => handleEdit(produtor)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                                            <Tooltip title="Apagar"><IconButton size="small" onClick={() => handleDeleteClick(produtor.id)}><DeleteIcon fontSize="small" color="error" /></IconButton></Tooltip>
                                        </TableCell>
                                        <TableCell align="center" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{produtor.nome}</TableCell>
                                        <TableCell align="center">{produtor.cpfCnpj}</TableCell>
                                        <TableCell align="center">{produtor.telefone}</TableCell>
                                        <TableCell align="center">{produtor.localidade}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
                <TablePagination
                    component="div"
                    count={produtoresFiltrados.length}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={[rowsPerPage]}
                    labelRowsPerPage="Itens por página"
                    sx={{ mt: 1 }}
                />
            </Paper>

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogContent><DialogContentText>Tem certeza que deseja excluir este produtor? A ação não pode ser desfeita.</DialogContentText></DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">Excluir</Button>
                </DialogActions>
            </Dialog>
        </LayoutBaseDePagina>
    );
};