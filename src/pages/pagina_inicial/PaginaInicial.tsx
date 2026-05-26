import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, TextField, Button, Box, Typography, Autocomplete, IconButton,
    Tooltip, Grid, Dialog, DialogTitle, DialogContent, DialogActions, TablePagination
} from '@mui/material';
import type { MqttClient } from 'mqtt';
import * as React from 'react';
import Clear from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdf from '@mui/icons-material/PictureAsPdf';
import { Api } from '../../shared/services/api/axios-config';
import { gerarPDF } from "../../shared/contexts/utils/gerarPDF";
import { LayoutBaseDePagina } from '../../shared/layouts';
import { useSnackbar } from '../../shared/contexts/SnackbarProvider';
import { Environment } from '../../shared/environment';


export interface RowData {
    id: number;
    nome: string; tanque: string; data: string; acidez: string; leite_bom_qnt: string | number; densidade: string;
    gordura: string; ESD: string; EST: string; proteina: string; crioscopia: string;
    lactose: string; alizarol: string; amido: string; sacar: string; observacoes: string;
    analista: string;
}
interface IProdutor { id: string; nome: string; }

const FormCadastro = React.memo(function FormCadastro(props: {
    formState: Omit<RowData, 'id'>;
    mostrarOpcionais: boolean;
    onToggleOpcionais: () => void;
    onSubmit: () => void;
    onChange: (field: keyof Omit<RowData, 'id'>, value: string) => void;
    produtoresOptions: string[];
    analistas: string[];
    alizarol: string[];
}) {
    const { formState, mostrarOpcionais, onToggleOpcionais, onSubmit, onChange, produtoresOptions, analistas, alizarol } = props;

    return (
        <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Cadastrar Nova Coleta</Typography>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                    <Autocomplete
                        options={produtoresOptions}
                        value={formState.nome}
                        onChange={(_, nv) => onChange("nome", nv || '')}
                        renderInput={(params) => <TextField {...params} label="Nome do Produtor" />}
                        size="small" freeSolo
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <TextField label="Tanque" value={formState.tanque} onChange={(e) => onChange('tanque', e.target.value)} size="small" fullWidth />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <TextField label="Data" type="date" value={formState.data} onChange={(e) => onChange('data', e.target.value)} size="small" fullWidth InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <TextField label="Acidez" value={formState.acidez} onChange={(e) => onChange('acidez', e.target.value)} size="small" fullWidth />
                </Grid>
            </Grid>

            {mostrarOpcionais && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6} sm={4} md={2}><TextField label="Quantidade de Leite Bom" value={formState.leite_bom_qnt} onChange={(e) => onChange('leite_bom_qnt', e.target.value)} size="small" fullWidth /></Grid>
                    <Grid item xs={6} sm={4} md={2}><TextField label="Densidade" value={formState.densidade} onChange={(e) => onChange('densidade', e.target.value)} size="small" fullWidth /></Grid>
                    <Grid item xs={6} sm={4} md={2}><TextField label="Gordura" value={formState.gordura} onChange={(e) => onChange('gordura', e.target.value)} size="small" fullWidth /></Grid>
                    <Grid item xs={6} sm={4} md={2}><TextField label="ESD" value={formState.ESD} onChange={(e) => onChange('ESD', e.target.value)} size="small" fullWidth /></Grid>
                    <Grid item xs={6} sm={4} md={2}><TextField label="EST" value={formState.EST} onChange={(e) => onChange('EST', e.target.value)} size="small" fullWidth /></Grid>
                    <Grid item xs={6} sm={4} md={2}><TextField label="Proteína" value={formState.proteina} onChange={(e) => onChange('proteina', e.target.value)} size="small" fullWidth /></Grid>
                    <Grid item xs={6} sm={4} md={2}><TextField label="Crioscopia" value={formState.crioscopia} onChange={(e) => onChange('crioscopia', e.target.value)} size="small" fullWidth /></Grid>
                    <Grid item xs={6} sm={4} md={2}><TextField label="Lactose" value={formState.lactose} onChange={(e) => onChange('lactose', e.target.value)} size="small" fullWidth /></Grid>
                    <Grid item xs={6} sm={4} md={2}>
                        <Autocomplete
                            options={alizarol}
                            value={formState.alizarol}
                            onChange={(_, nv) => onChange('alizarol', nv || '')}
                            renderInput={(params) => (
                                <TextField {...params} label="Alizarol  " />
                            )}
                            size="small"
                            freeSolo
                        />
                    </Grid>
                    <Grid item xs={6} sm={4} md={2}><TextField label="Observações" value={formState.observacoes} onChange={(e) => onChange('observacoes', e.target.value)} size="small" fullWidth /></Grid>
                    <Grid item xs={6} sm={4} md={2}>
                        <Autocomplete
                            options={analistas}
                            value={formState.analista}
                            onChange={(_, nv) => onChange('analista', nv || '')}
                            renderInput={(params) => (
                                <TextField {...params} label="Analista" />
                            )}
                            size="small"
                            freeSolo
                        />
                    </Grid>
                </Grid>
            )}

            <Box display="flex" justifyContent="space-between" alignItems="center" mt={3}>
                <Button variant="outlined" onClick={onToggleOpcionais} startIcon={mostrarOpcionais ? <RemoveIcon /> : <AddIcon />}>Mais Campos</Button>
                <Button variant="contained" onClick={onSubmit}>Cadastrar</Button>
            </Box>
        </Paper>
    );
});

const HistoricoColetas = React.memo(function HistoricoColetas(props: {
    produtores: IProdutor[];
    registrosFiltrados: RowData[];
    registrosExibidos: RowData[];
    totalLeiteBom: number;
    totalRegistros: number;
    page: number;
    rowsPerPage: number;
    filtroProdutor: IProdutor | null;
    setFiltroProdutor: React.Dispatch<React.SetStateAction<IProdutor | null>>;
    filtroDataInicio: string;
    setFiltroDataInicio: React.Dispatch<React.SetStateAction<string>>;
    filtroDataFim: string;
    setFiltroDataFim: React.Dispatch<React.SetStateAction<string>>;
    onClearFilters: () => void;
    onEdit: (registro: RowData) => void;
    onDelete: (id: number) => void;
    onPageChange: (newPage: number) => void;
}) {
    const { produtores, registrosFiltrados, registrosExibidos, totalLeiteBom, totalRegistros, page, rowsPerPage, filtroProdutor, setFiltroProdutor, filtroDataInicio, setFiltroDataInicio, filtroDataFim, setFiltroDataFim, onClearFilters, onEdit, onDelete, onPageChange } = props;

    return (
        <Paper variant="outlined" sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h6">Histórico de coletas</Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Autocomplete
                        options={produtores}
                        getOptionLabel={(option) => option.nome}
                        value={filtroProdutor}
                        onChange={(_, newValue) => setFiltroProdutor(newValue)}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        renderInput={(params) => <TextField {...params} label="Filtrar por Produtor" variant="outlined" size="small" sx={{ width: 250 }} />}
                    />
                    <TextField
                        label="Data inicial"
                        type="date"
                        size="small"
                        value={filtroDataInicio}
                        onChange={(e) => setFiltroDataInicio(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />

                    <TextField
                        label="Data final"
                        type="date"
                        size="small"
                        value={filtroDataFim}
                        onChange={(e) => setFiltroDataFim(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                    <Tooltip title="Limpar filtros"><IconButton onClick={onClearFilters}><Clear /></IconButton></Tooltip>
                    <Button variant="contained" onClick={() => gerarPDF(registrosFiltrados)} startIcon={<PictureAsPdf />} sx={{ height: '40px' }}>PDF</Button>
                </Box>
            </Box>
            <TableContainer sx={{ maxHeight: 440, overflowX: 'auto' }}>
                <Table stickyHeader size="small" sx={{ minWidth: 1500 }}>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ width: 90, position: 'sticky', left: 0, zIndex: 3, backgroundColor: 'background.paper' }}>Ações</TableCell>
                            <TableCell align="center">NOME</TableCell>
                            <TableCell align="center">TANQUE</TableCell>
                            <TableCell align="center">DATA</TableCell>
                            <TableCell align="center">ACIDEZ</TableCell>
                            <TableCell align="center">LEITE BOM (QNT)</TableCell>
                            <TableCell align="center">DENSIDADE</TableCell>
                            <TableCell align="center">GORDURA</TableCell>
                            <TableCell align="center">ESD</TableCell>
                            <TableCell align="center">EST</TableCell>
                            <TableCell align="center">PROTEINA</TableCell>
                            <TableCell align="center">CRIOSCOPIA</TableCell>
                            <TableCell align="center">LACTOSE</TableCell>
                            <TableCell align="center">ALIZAROL</TableCell>
                            <TableCell align="center">OBSERVAÇÕES</TableCell>
                            <TableCell align="center">ANALISTA</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {registrosExibidos.map((registro) => {
                            const dataColeta = new Date(registro.data);
                            const hoje = new Date();

                            const diffDias =
                                (hoje.getTime() - dataColeta.getTime()) / (1000 * 60 * 60 * 24);

                            const podeEditar = diffDias <= 8;

                            return (
                                <TableRow key={registro.id} hover>
                                    <TableCell align="center">
                                        <Box display="flex" justifyContent="center">
                                            {podeEditar && (
                                                <>
                                                    <Tooltip title="Editar">
                                                        <IconButton size="small" onClick={() => onEdit(registro)}>
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Apagar">
                                                        <IconButton size="small" onClick={() => onDelete(registro.id)}>
                                                            <DeleteIcon fontSize="small" color="error" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            )}
                                        </Box>
                                    </TableCell>

                                    <TableCell align="center">{registro.nome}</TableCell>
                                    <TableCell align="center">{registro.tanque}</TableCell>
                                    <TableCell align="center">{new Date(registro.data).toLocaleDateString()}</TableCell>
                                    <TableCell align="center">{registro.acidez}</TableCell>
                                    <TableCell align="center">{registro.leite_bom_qnt}</TableCell>
                                    <TableCell align="center">{registro.densidade}</TableCell>
                                    <TableCell align="center">{registro.gordura}</TableCell>
                                    <TableCell align="center">{registro.ESD}</TableCell>
                                    <TableCell align="center">{registro.EST}</TableCell>
                                    <TableCell align="center">{registro.proteina}</TableCell>
                                    <TableCell align="center">{registro.crioscopia}</TableCell>
                                    <TableCell align="center">{registro.lactose}</TableCell>
                                    <TableCell align="center">{registro.alizarol}</TableCell>
                                    <TableCell align="center" sx={{ width: 150 }}>{registro.observacoes}</TableCell>
                                    <TableCell align="center">{registro.analista}</TableCell>
                                </TableRow>
                            );
                        })}
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell colSpan={5}></TableCell>
                            <TableCell align="center">
                                <strong>Total {totalLeiteBom.toFixed(2)}</strong>
                            </TableCell>
                            <TableCell colSpan={9}></TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                component="div"
                count={totalRegistros}
                page={page}
                onPageChange={(_, newPage) => onPageChange(newPage)}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[rowsPerPage]}
                labelRowsPerPage="Itens por página"
                labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
            />
        </Paper>
    );
});

const EditarColetaDialog = React.memo(function EditarColetaDialog(props: {
    openModal: boolean;
    setOpenModal: React.Dispatch<React.SetStateAction<boolean>>;
    formEdicao: Omit<RowData, 'id'>;
    onChange: (field: keyof Omit<RowData, 'id'>, value: any) => void;
    onSave: () => void;
}) {
    const { openModal, setOpenModal, formEdicao, onChange, onSave } = props;

    if (!openModal) {
        return null;
    }

    return (
        <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
            <DialogTitle>Editar Coleta</DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}>
                        <TextField label="Nome" value={formEdicao.nome} onChange={(e) => onChange('nome', e.target.value)} fullWidth size="small" />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField label="Tanque" value={formEdicao.tanque} onChange={(e) => onChange('tanque', e.target.value)} fullWidth size="small" />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField label="Data" type="date" value={formEdicao.data} onChange={(e) => onChange('data', e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField label="Acidez" value={formEdicao.acidez} onChange={(e) => onChange('acidez', e.target.value)} fullWidth size="small" />
                    </Grid>
                    <Grid item xs={12} sm={8} md={4}><TextField label="Quantidade de Leite Bom" value={formEdicao.leite_bom_qnt} onChange={(e) => onChange('leite_bom_qnt', e.target.value)} size="small" fullWidth /></Grid>
                    <Grid item xs={6} sm={4} md={2}><TextField label="Densidade" value={formEdicao.densidade} onChange={(e) => onChange('densidade', e.target.value)} size="small" fullWidth /></Grid>
                    <Grid item xs={6} sm={4} md={2}><TextField label="Gordura" value={formEdicao.gordura} onChange={(e) => onChange('gordura', e.target.value)} size="small" fullWidth /></Grid>
                    <Grid item xs={6} sm={4} md={2}><TextField label="ESD" value={formEdicao.ESD} onChange={(e) => onChange('ESD', e.target.value)} size="small" fullWidth /></Grid>
                    <Grid item xs={6} sm={4} md={2}><TextField label="EST" value={formEdicao.EST} onChange={(e) => onChange('EST', e.target.value)} size="small" fullWidth /></Grid>
                    <Grid item xs={6} sm={4} md={2}><TextField label="Proteína" value={formEdicao.proteina} onChange={(e) => onChange('proteina', e.target.value)} size="small" fullWidth /></Grid>
                    <Grid item xs={6} sm={4} md={2}><TextField label="Crioscopia" value={formEdicao.crioscopia} onChange={(e) => onChange('crioscopia', e.target.value)} size="small" fullWidth /></Grid>
                    <Grid item xs={6} sm={4} md={2}><TextField label="Lactose" value={formEdicao.lactose} onChange={(e) => onChange('lactose', e.target.value)} size="small" fullWidth /></Grid>
                    <Grid item xs={6} sm={4} md={2}><TextField label="Alizarol" value={formEdicao.alizarol} onChange={(e) => onChange('alizarol', e.target.value)} size="small" fullWidth /></Grid>
                    <Grid item xs={12} sm={8} md={4}><TextField label="Observações" value={formEdicao.observacoes} onChange={(e) => onChange('observacoes', e.target.value)} size="small" fullWidth /></Grid>
                    <Grid item xs={12} sm={8} md={4}><TextField label="Analista" value={formEdicao.analista} onChange={(e) => onChange('analista', e.target.value)} size="small" fullWidth /></Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setOpenModal(false)}>Cancelar</Button>
                <Button variant="contained" onClick={onSave}>Salvar Alterações</Button>
            </DialogActions>
        </Dialog>
    );
});

const createEmptyRow = (): Omit<RowData, 'id'> => ({
    nome: '', tanque: '', data: new Date().toLocaleDateString('sv-SE'), acidez: '', leite_bom_qnt: 0,
    densidade: '', gordura: '', ESD: '', EST: '', proteina: '', crioscopia: '', lactose: '',
    alizarol: '', amido: '', sacar: '', observacoes: '', analista: '',
});

export const PaginaInicial: React.FC = () => {

    const [openModal, setOpenModal] = React.useState(false);
    const [editId, setEditId] = React.useState<number | null>(null);
    const [mostrarOpcionais, setMostrarOpcionais] = React.useState(false);
    const [formState, setFormState] = React.useState<Omit<RowData, 'id'>>(createEmptyRow());
    const [formEdicao, setFormEdicao] = React.useState<Omit<RowData, 'id'>>(createEmptyRow());
    const [registrosSalvos, setRegistrosSalvos] = React.useState<RowData[]>([]);
    const registrosSalvosRef = React.useRef<RowData[]>([]);
    const [produtores, setProdutores] = React.useState<IProdutor[]>([]);
    const { showSnackbar } = useSnackbar();
    const [busca] = React.useState('');
    const mqttClientRef = React.useRef<MqttClient | null>(null);
    // const [mqttStatus, setMqttStatus] = React.useState<'Conectado' | 'Desconectado'>('Desconectado');
    const formStateRef = React.useRef(formState);
    const [filtroProdutor, setFiltroProdutor] = React.useState<IProdutor | null>(null);
    const filaRef = React.useRef<{ id: number; nome: string }[]>([]);
    const [filaEspera, setFilaEspera] = React.useState<{ id: number; nome: string }[]>([]);
    const processandoRef = React.useRef(false);
    const [filtroDataInicio, setFiltroDataInicio] = React.useState('');
    const [filtroDataFim, setFiltroDataFim] = React.useState('');
    const [pageHistorico, setPageHistorico] = React.useState(0);
    const rowsPerPageHistorico = 10;
    const analistas = ['Janaina', 'Alderalicy', 'Rejanilza'];
    const alizarol = ['Normal', 'Coagulou'];

    const produtoresOrdenados = React.useMemo(
        () => [...produtores].sort((a, b) => a.nome.localeCompare(b.nome)),
        [produtores]
    );
    const produtoresOptions = React.useMemo(
        () => produtoresOrdenados.map(produtor => produtor.nome),
        [produtoresOrdenados]
    );

    const handleToggleOpcionais = React.useCallback(() => {
        setMostrarOpcionais(prev => !prev);
    }, []);

    React.useEffect(() => {
        formStateRef.current = formState;
    }, [formState]);

    React.useEffect(() => {
        Api.get('/coletas').then(res => {
            const registrosOrdenados = res.data.sort((a: RowData, b: RowData) => new Date(b.data).getTime() - new Date(a.data).getTime());
            setRegistrosSalvos(registrosOrdenados);
            registrosSalvosRef.current = registrosOrdenados;
        }).catch(console.error);
        Api.get('/produtores').then(res => setProdutores(res.data)).catch(console.error);
    }, []);

    const handleChange = React.useCallback((field: keyof Omit<RowData, 'id'>, value: string) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    }, []);

    const processarFila = React.useCallback(() => {
        if (!mqttClientRef.current) return;

        if (processandoRef.current) return;
        const proximo = filaRef.current[0];

        if (!proximo) return;
        processandoRef.current = true;
        mqttClientRef.current.publish(
            'sertao_serido/fila',
            JSON.stringify({
                comando: "AGUARDANDO_PESO",
                nome: proximo.nome,
                id: proximo.id
            }),
            { retain: true }
        );

        console.log("📤 Enviado para balança:", proximo.nome);
    }, []);

    const handleSalvar = React.useCallback(async () => {
        if (!formState.nome || !formState.tanque || !formState.acidez) {
            showSnackbar("Nome, tanque e Acidez são obrigatórios!", "warning");
            return;
        }

        try {
            // 1️⃣ Salva no banco
            await Api.post('/coletas', formState);
            showSnackbar("Registro salvo!", "success");

            // 2️⃣ Atualiza lista
            const res = await Api.get('/coletas');
            const registrosOrdenados = res.data.sort(
                (a: RowData, b: RowData) =>
                    new Date(b.data).getTime() - new Date(a.data).getTime()
            );

            setRegistrosSalvos(registrosOrdenados);

            // 3️⃣ Encontra o registro recém criado
            const registroNovo = registrosOrdenados.find(
                (r: RowData) =>
                    r.nome === formState.nome &&
                    new Date(r.data).toISOString().split('T')[0] === formState.data
            );

            const acidez = Number(formState.acidez);

            // 4️⃣ Se acidez < 20 adiciona na fila
            if (acidez < 20 && registroNovo) {

                filaRef.current.push({
                    id: registroNovo.id,
                    nome: registroNovo.nome
                });
                setFilaEspera([...filaRef.current]);

                console.log("📥 Adicionado na fila:", registroNovo.nome);

                processarFila(); // tenta enviar se não estiver processando

            } else {
                console.log("Coleta não enviada para balança. Acidez >= 20");
            }

            // 5️⃣ Limpa formulário
            setFormState(createEmptyRow());

        } catch (error) {
            showSnackbar("Erro ao salvar.", "error");
            console.error(error);
        }
    }, [formState, processarFila, showSnackbar]);

    const handleSalvarEdicao = React.useCallback(async () => {
        if (!editId) return;

        try {
            await Api.put(`/coletas/${editId}`, formEdicao);
            showSnackbar("Registro atualizado!", "success");
            const res = await Api.get('/coletas');
            setRegistrosSalvos(
                res.data.sort((a: RowData, b: RowData) =>
                    new Date(b.data).getTime() - new Date(a.data).getTime()
                )
            );

            setOpenModal(false);
            setEditId(null);
            setFormEdicao(createEmptyRow());

        } catch {
            showSnackbar("Erro ao atualizar.", "error");
        }
    }, [editId, formEdicao, showSnackbar]);
    React.useEffect(() => {
        if (filaEspera.length === 0 || mqttClientRef.current) {
            return;
        }

        let isMounted = true;
        let client: MqttClient | null = null;

        const setupMqtt = async () => {
            if (mqttClientRef.current) return;

            const { default: mqtt } = await import('mqtt');
            if (!isMounted) return;

            client = mqtt.connect(`${Environment.MQTT_WS_URL}/mqtt`, {
                reconnectPeriod: 5000,
            });

            mqttClientRef.current = client;

            client.on('connect', () => {
                console.log('✅ MQTT conectado');
                client?.subscribe('sertao_serido/leite');
            });

            client.on("message", async (_topic, message) => {
                const dados = JSON.parse(message.toString());
                console.log("📥 Recebido da balança:", dados);

                try {
                    await Api.patch(`/coletas/${dados.id}/${dados.peso}`, {
                        leite_bom_qnt: dados.peso
                    });

                    console.log("✅ Peso atualizado para ID", dados.id);
                    filaRef.current.shift();
                    setFilaEspera([...filaRef.current]);

                    processandoRef.current = false;
                    setTimeout(() => {
                        processarFila();
                    }, 2000);

                    const res = await Api.get('/coletas');
                    setRegistrosSalvos(
                        res.data.sort((a: RowData, b: RowData) =>
                            new Date(b.data).getTime() - new Date(a.data).getTime()
                        )
                    );

                } catch (error: any) {
                    console.log("Erro ao atualizar peso:", error.response?.data);
                }
            });

            client.on('error', (err) => {
                console.error("Erro MQTT:", err);
            });
        };

        setupMqtt();

        return () => {
            isMounted = false;
            client?.end(true);
            if (mqttClientRef.current === client) {
                mqttClientRef.current = null;
            }
        };
    }, [filaEspera.length, processarFila]);


    const handleEdit = React.useCallback((registro: RowData) => {
        setEditId(registro.id);

        const { id, ...dadosSemId } = registro;

        setFormEdicao({
            ...dadosSemId,
            leite_bom_qnt: registro.leite_bom_qnt 
            ? registro.leite_bom_qnt.toString().replace('.', ',') 
            : '0',
            data: registro.data
                ? new Date(registro.data).toISOString().split("T")[0]
                : ''
        });

        setOpenModal(true);
    }, []);

    const handleChangeEdicao = React.useCallback((field: keyof Omit<RowData, 'id'>, value: any) => {
        setFormEdicao(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleDelete = React.useCallback(async (id: number) => {
        if (window.confirm('Tem certeza que deseja apagar este registro?')) {
            try {
                await Api.delete(`/coletas/${id}`);
                showSnackbar('Registro apagado.', 'info');
                setRegistrosSalvos(prev => prev.filter(r => r.id !== id));
            } catch (error) {
                showSnackbar('Erro ao apagar registro.', 'error');
            }
        }
    }, [showSnackbar]);

    const registrosFiltrados = React.useMemo(() => {
        let dados = [...registrosSalvos];

        // Busca por texto
        if (busca) {
            dados = dados.filter(r =>
                (r.nome || '').toLowerCase().includes(busca.toLowerCase())
            );
        }

        // Filtro por produtor
        if (filtroProdutor) {
            dados = dados.filter(r => r.nome === filtroProdutor.nome);
        }

        // Filtro por data
        if (filtroDataInicio && filtroDataFim) {
            const inicio = new Date(filtroDataInicio + 'T00:00:00');
            const fim = new Date(filtroDataFim + 'T23:59:59');

            dados = dados.filter(r => {
                const dataRegistro = new Date(r.data);
                return dataRegistro >= inicio && dataRegistro <= fim;
            });
        }

        return dados;
    }, [registrosSalvos, busca, filtroProdutor, filtroDataInicio, filtroDataFim]);

    const totalLeiteBom = React.useMemo(() => {
        return registrosFiltrados.reduce((total, registro) => {
            return total + Number(registro.leite_bom_qnt || 0);
        }, 0);
    }, [registrosFiltrados]);

    const registrosExibidos = React.useMemo(() => {
        const inicio = pageHistorico * rowsPerPageHistorico;
        return registrosFiltrados.slice(inicio, inicio + rowsPerPageHistorico);
    }, [pageHistorico, registrosFiltrados]);

    React.useEffect(() => {
        setPageHistorico(0);
    }, [filtroProdutor, filtroDataInicio, filtroDataFim]);

    React.useEffect(() => {
        const maxPage = Math.max(0, Math.ceil(registrosFiltrados.length / rowsPerPageHistorico) - 1);
        if (pageHistorico > maxPage) {
            setPageHistorico(maxPage);
        }
    }, [pageHistorico, registrosFiltrados.length]);

    const handleLimparFiltros = React.useCallback(() => {
        setFiltroProdutor(null);
        setFiltroDataInicio('');
        setFiltroDataFim('');
        showSnackbar('Filtros limpos.', 'info');
    }, [showSnackbar]);
    return (
        <LayoutBaseDePagina titulo="Controle de Qualidade" subtitulo="Registro de análises do leite">
            <FormCadastro
                formState={formState}
                mostrarOpcionais={mostrarOpcionais}
                onToggleOpcionais={handleToggleOpcionais}
                onSubmit={handleSalvar}
                onChange={handleChange}
                produtoresOptions={produtoresOptions}
                analistas={analistas}
                alizarol={alizarol}
            />

            <Paper
                variant="outlined"
                sx={{
                    p: 1,
                    mt: 2,
                    mb: 3,
                    bgcolor: '#f0f7ff',
                    borderLeft: '6px solid #1976d2'
                }}
            >
                <Box
                    display="flex"
                    alignItems="center"
                    gap={2}
                    flexWrap="wrap"
                >
                    <Typography variant="subtitle1" fontWeight="bold">
                        Fila da Balança ({filaEspera.length}):
                    </Typography>

                    {filaEspera.map((p, index) => (
                        <Box
                            key={p.id}
                            sx={{
                                px: 2,
                                py: 0.5,
                                borderRadius: 2,
                                bgcolor: index === 0 ? 'success.main' : 'info.main',
                                color: 'white',
                                fontWeight: index === 0 ? 'bold' : 'normal'
                            }}
                        >
                            {index === 0 ? `Pesando: ${p.nome}` : p.nome}
                        </Box>
                    ))}
                </Box>
            </Paper>

            <HistoricoColetas
                produtores={produtores}
                registrosFiltrados={registrosFiltrados}
                registrosExibidos={registrosExibidos}
                totalLeiteBom={totalLeiteBom}
                totalRegistros={registrosFiltrados.length}
                page={pageHistorico}
                rowsPerPage={rowsPerPageHistorico}
                filtroProdutor={filtroProdutor}
                setFiltroProdutor={setFiltroProdutor}
                filtroDataInicio={filtroDataInicio}
                setFiltroDataInicio={setFiltroDataInicio}
                filtroDataFim={filtroDataFim}
                setFiltroDataFim={setFiltroDataFim}
                onClearFilters={handleLimparFiltros}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onPageChange={setPageHistorico}
            />

            <EditarColetaDialog
                openModal={openModal}
                setOpenModal={setOpenModal}
                formEdicao={formEdicao}
                onChange={handleChangeEdicao}
                onSave={handleSalvarEdicao}
            />
        </LayoutBaseDePagina>
    );
};