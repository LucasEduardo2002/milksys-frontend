'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Button, Box, Collapse, IconButton, Autocomplete, Grid, Tooltip, Alert
} from '@mui/material';
import {
  KeyboardArrowDown, KeyboardArrowUp, PictureAsPdf, AddCircleOutline, Clear, Today
} from '@mui/icons-material';
import { LayoutBaseDePagina } from '../shared/layouts';
import { Api } from '../shared/services/api/axios-config';
import { useSnackbar } from '../shared/contexts/SnackbarProvider';
import type { ProdutorData } from './CadastrarProdutor';
import { gerarPDF } from '../shared/contexts/utils/gerarPDF';
import mqtt from 'mqtt';

// Interface para registros do histórico
interface BoletimSalvo {
  id: number;
  data: string;
  produtor_cpf: string;
  produtor_nome: string;
  leite_bom_qnt: number;
  leite_acido_qnt: number;
}

// Componente da linha do histórico (Expansível)
const HistoricoRow: React.FC<{ data: string; registros: BoletimSalvo[] }> = ({ data, registros }) => {
  const [open, setOpen] = useState(false);
  const totalBom = registros.reduce((acc, r) => acc + Number(r.leite_bom_qnt), 0);
  const totalAcido = registros.reduce((acc, r) => acc + Number(r.leite_acido_qnt), 0);
  const dataFormatada = new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');

  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' }, backgroundColor: open ? 'action.hover' : 'transparent' }}>
        <TableCell align="center">
          <Tooltip title={open ? "Recolher" : "Ver detalhes"}>
            <IconButton size="small" onClick={() => setOpen(!open)}>
              {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            </IconButton>
          </Tooltip>
        </TableCell>
        <TableCell align="center" component="th" scope="row">{dataFormatada}</TableCell>
        <TableCell align="center">{totalBom.toFixed(2)} L</TableCell>
        <TableCell align="center">{totalAcido.toFixed(2)} L</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1, padding: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Lançamentos de {dataFormatada}
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell align="center">CPF</TableCell>
                    <TableCell align="center">Produtor</TableCell>
                    <TableCell align="center">Leite Bom (L)</TableCell>
                    <TableCell align="center">Leite Ácido (L)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {registros.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell align="center">{r.produtor_cpf}</TableCell>
                      <TableCell align="center">{r.produtor_nome}</TableCell>
                      <TableCell align="center">{Number(r.leite_bom_qnt).toFixed(2)}</TableCell>
                      <TableCell align="center">{Number(r.leite_acido_qnt).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

export const BoletimLeite: React.FC = () => {
  // --- Estados do Formulário e Dados ---
  const [listaProdutores, setListaProdutores] = useState<ProdutorData[]>([]);
  const [selectedProdutor, setSelectedProdutor] = useState<ProdutorData | null>(null);
  const [leiteBom, setLeiteBom] = useState('');
  const [leiteAcido, setLeiteAcido] = useState('');
  const [dataBoletim, setDataBoletim] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [historico, setHistorico] = useState<Record<string, BoletimSalvo[]>>({});
  const { showSnackbar } = useSnackbar();

  // --- Estados de Filtro ---
  const [filtroProdutor, setFiltroProdutor] = useState<ProdutorData | null>(null);
  const [filtroData, setFiltroData] = useState('');

  // --- Estados MQTT ---
  // const [mqttStatus, setMqttStatus] = useState<'Conectado' | 'Desconectado'>('Desconectado');
  // const [metrics, setMetrics] = useState({ leite: '' });
  // 1. Novo estado para a fila
  const [filaEspera, setFilaEspera] = useState<ProdutorData[]>([]);

  // 2. Referência do cliente MQTT para usar fora do useEffect
  const mqttClientRef = useRef<mqtt.MqttClient | null>(null);

  // 3. Função para enviar o próximo da fila para a BitDogLab
  const enviarProximoDaFila = (listaAtualizada: ProdutorData[]) => {
    if (listaAtualizada.length > 0 && mqttClientRef.current?.connected) {
      const proximo = listaAtualizada[0];
      const mensagem = JSON.stringify({
        comando: "AGUARDANDO_PESO",
        nome: proximo.nome,
        id: proximo.id
      });

      // Publica em um tópico que a BitDogLab está inscrita
      const client = mqtt.connect('ws://10.1.1.33:8082/mqtt');

      client.on('connect', () => {
        console.log('✅ WS conectado');
        client.publish('sertao_serido/fila', mensagem, { retain: true });
      });
      showSnackbar(`BitDogLab avisada: Aguardando ${proximo.nome}`, 'info');
    }
  };

  // 4. Função para adicionar produtor à fila (chame isso ao clicar em um botão na sua lista)
  const adicionarAFila = (produtor: ProdutorData) => {
    setFilaEspera(prev => {
      const novaFila = [...prev, produtor];
      // Se a fila estava vazia, já envia para a placa imediatamente
      if (prev.length === 0) enviarProximoDaFila(novaFila);
      return novaFila;
    });
  };

  // --- Referência para o MQTT acessar a lista de produtores atualizada ---
  const listaRef = useRef<ProdutorData[]>([]);

  useEffect(() => {
    listaRef.current = listaProdutores;
  }, [listaProdutores]);

  // --- Funções de Busca (API) ---
  const fetchProdutores = useCallback(() => {
    setIsLoading(true);
    Api.get<ProdutorData[]>('/produtores')
      .then(response => setListaProdutores(response.data.filter(p => p.status === 'Ativo')))
      .catch(() => showSnackbar('Erro ao buscar produtores.', 'error'))
      .finally(() => setIsLoading(false));
  }, [showSnackbar]);

  const fetchHistorico = useCallback(() => {
    Api.get<Record<string, BoletimSalvo[]>>('/boletim')
      .then(response => setHistorico(response.data))
      .catch(() => showSnackbar('Erro ao buscar histórico.', 'error'));
  }, [showSnackbar]);

  // --- Efeito de Inicialização ---
  useEffect(() => {
    fetchProdutores();
    fetchHistorico();
  }, [fetchProdutores, fetchHistorico]);



  // --- Efeito MQTT (Conexão com BitDogLab) ---
  useEffect(() => {
    const client = mqtt.connect('ws://10.1.1.33:8082', {
      reconnectPeriod: 5000,
    });
    mqttClientRef.current = client; // Guarda a referência

    client.on('connect', () => {
      console.log('✅ MQTT conectado');
      setMqttStatus('Conectado');
      client.subscribe('sertao_serido/leite');
    });

    client.on('message', (topic, message) => {
      if (topic === 'sertao_serido/leite') {
        const rawPayload = message.toString().trim();
        console.log('Recebido:', rawPayload);

        try {
          let cleanPayload = rawPayload.replace(/`/g, "").replace(/'/g, '"');

          if (!cleanPayload.includes('"')) {
            cleanPayload = cleanPayload
              .replace(/(\w+)\s*:/g, '"$1":')
              .replace(/:\s*([a-zA-ZáàâãéèêíïóôõöúçÑ]+)/g, ': "$1"');
          }

          const dados = JSON.parse(cleanPayload);

          const peso = Number(String(dados.peso).replace(',', '.'));
          if (isNaN(peso)) return;

          const nomeMqtt = String(dados.nome).toUpperCase().trim();
          const produtor = listaRef.current.find(p =>
            p.nome.toUpperCase().trim() === nomeMqtt ||
            p.nome.toUpperCase().includes(nomeMqtt)
          );

          if (produtor) {
            salvarAutomatico(produtor, peso);
          } else {
            showSnackbar(`Produtor não encontrado: ${dados.nome}`, 'warning');
          }

        } catch {
          const valorSimples = rawPayload.replace(',', '.');
          const peso = Number(valorSimples);
          if (!isNaN(peso) && filaEspera.length > 0) {
            // Se vier só peso, usa o primeiro da fila
            salvarAutomatico(filaEspera[0], peso);
          }
        }
      }
    });

    client.on('error', () => setMqttStatus('Desconectado'));

    return () => {
      if (client) client.end(true);

    };
  }, [showSnackbar]);


  const salvarAutomatico = async (produtor: ProdutorData, peso: number) => {
    const registro = {
      id: produtor.id,
      cpfCnpj: produtor.cpfCnpj,
      nome: produtor.nome,
      leite_bom_qnt: peso,
      leite_acido_qnt: 0,
    };

    try {
      await Api.post('/boletim', {
        data: dataBoletim,
        registros: [registro]
      });

      showSnackbar(`Salvo automaticamente: ${produtor.nome} - ${peso} L`, 'success');
      mqttClientRef.current?.publish(
      'sertao_serido/fila',
      '',
      { retain: true }
    );
      fetchHistorico();

      setFilaEspera(prev => {
        const novaFila = prev.slice(1);
        enviarProximoDaFila(novaFila);
        return novaFila;
      });

    } catch {
      showSnackbar('Erro ao salvar automático.', 'error');
    }
  };
  // --- Handlers de Ação ---
  const handleSalvarLancamento = async () => {
    if (!selectedProdutor || (!leiteBom && !leiteAcido)) return;

    const registro = {
      id: selectedProdutor.id,
      cpfCnpj: selectedProdutor.cpfCnpj,
      nome: selectedProdutor.nome,
      leite_bom_qnt: Number(leiteBom) || 0,
      leite_acido_qnt: Number(leiteAcido) || 0,
    };



    try {
      await Api.post('/boletim', { data: dataBoletim, registros: [registro] });
      showSnackbar('Lançamento salvo com sucesso!', 'success');

      setFilaEspera(prev => {
        const novaFila = prev.slice(1);
        enviarProximoDaFila(novaFila); // Avisa a BitDogLab quem é o próximo
        if (novaFila.length > 0) {
          setSelectedProdutor(novaFila[0]);
        } else {
          setSelectedProdutor(null);
        }
        return novaFila;
      });

      fetchHistorico();
      setSelectedProdutor(null);
      setLeiteBom('');
      setLeiteAcido('');
    } catch (error) {
      showSnackbar('Erro ao salvar o lançamento.', 'error');
    }
  };

  const historicoFiltrado = useMemo(() => {
    let todosOsRegistros: BoletimSalvo[] = Object.values(historico).flat();
    if (filtroProdutor) todosOsRegistros = todosOsRegistros.filter(r => r.produtor_cpf === filtroProdutor.cpfCnpj);
    if (filtroData) {
      const dataFormatada = new Date(filtroData + 'T00:00:00').toISOString().split('T')[0];
      todosOsRegistros = todosOsRegistros.filter(r => new Date(r.data).toISOString().split('T')[0] === dataFormatada);
    }
    return todosOsRegistros.reduce((acc, record) => {
      const date = new Date(record.data).toISOString().split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(record);
      return acc;
    }, {} as Record<string, BoletimSalvo[]>);
  }, [historico, filtroProdutor, filtroData]);

  const handleLimparFiltros = () => {
    setFiltroProdutor(null);
    setFiltroData('');
    showSnackbar('Filtros limpos.', 'info');
  };

  const handleGerarPDF = () => {
    const registrosParaPDF = Object.values(historicoFiltrado).flat();
    if (registrosParaPDF.length > 0) gerarPDF(registrosParaPDF);
    else showSnackbar('Nenhum dado encontrado para o filtro aplicado.', 'warning');
  };

  const isSalvarButtonDisabled = !selectedProdutor || (!leiteBom && !leiteAcido);

  return (
    <LayoutBaseDePagina titulo="Boletim de Recepção do Leite" subtitulo="Faça o lançamento individual por produtor.">

      {/* CARD DE NOVO LANÇAMENTO */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <AddCircleOutline color="primary" />
          <Typography variant="h6">
            Novo Lançamento
          </Typography>
          <Box sx={{
            width: 10, height: 10, borderRadius: '50%',
            bgcolor: mqttStatus === 'Conectado' ? 'success.main' : 'error.main',
            ml: 2
          }} />
        </Box>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <Autocomplete
              fullWidth
              options={listaProdutores}
              getOptionLabel={(option) => option.nome}
              value={selectedProdutor}
              onChange={(_, newValue) => setSelectedProdutor(newValue)}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              loading={isLoading}
              renderInput={(params) => <TextField {...params} label="Pesquisar Produtor" variant="outlined" size="small" />}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              startIcon={<AddCircleOutline />}
              onClick={() => selectedProdutor && adicionarAFila(selectedProdutor)}
              disabled={!selectedProdutor}
            >
              Pôr na Fila
            </Button>
          </Grid>
          <Grid item xs={12} sm={2}><TextField fullWidth label="Leite Bom (L)" type="number" size="small" value={leiteBom} onChange={(e) => setLeiteBom(e.target.value)} inputProps={{ min: 0, step: "0.01" }} /></Grid>
          <Grid item xs={12} sm={2}><TextField fullWidth label="Leite Ácido (L)" type="number" size="small" value={leiteAcido} onChange={(e) => setLeiteAcido(e.target.value)} inputProps={{ min: 0, step: "0.01" }} /></Grid>
          <Grid item xs={12} sm={2}><TextField fullWidth type="date" size="small" value={dataBoletim} onChange={(e) => setDataBoletim(e.target.value)} InputProps={{ startAdornment: (<Tooltip title="Data do Lançamento"><Today sx={{ mr: 1, color: 'action.active' }} /></Tooltip>) }} /></Grid>
          <Grid item xs={12} sm={2}>
            <Tooltip title={isSalvarButtonDisabled ? "Preencha os dados" : "Salvar lançamento"}>
              <Box component="span" sx={{ display: 'block' }}>
                <Button fullWidth variant="contained" onClick={handleSalvarLancamento} disabled={isSalvarButtonDisabled}>
                  Salvar
                </Button>
              </Box>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>
      {/* PAINEL DE FILA ATIVA */}
      {filaEspera.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#f0f7ff', borderLeft: '6px solid #1976d2' }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Fila de Espera BitDogLab ({filaEspera.length})
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {filaEspera.map((p, index) => (
              <Alert
                key={p.id + index}
                severity={index === 0 ? "success" : "info"}
                sx={{ py: 0 }}
                onClose={() => setFilaEspera(prev => prev.filter((_, i) => i !== index))}
              >
                {index === 0 ? <strong>Vez de: {p.nome}</strong> : p.nome}
              </Alert>
            ))}
          </Box>
        </Paper>
      )}
      {/* CARD DE HISTÓRICO E FILTROS */}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6">Histórico de Boletins</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Autocomplete
              options={listaProdutores}
              getOptionLabel={(option) => option.nome}
              value={filtroProdutor}
              onChange={(_, newValue) => setFiltroProdutor(newValue)}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              loading={isLoading}
              renderInput={(params) => <TextField {...params} label="Filtrar por Produtor" variant="outlined" size="small" sx={{ width: 250 }} />}
            />
            <TextField label="Filtrar por Data" type="date" size="small" value={filtroData} onChange={(e) => setFiltroData(e.target.value)} InputLabelProps={{ shrink: true }} />
            <Tooltip title="Limpar filtros"><IconButton onClick={handleLimparFiltros}><Clear /></IconButton></Tooltip>
            <Button variant="contained" onClick={handleGerarPDF} startIcon={<PictureAsPdf />} sx={{ height: '40px' }}>PDF</Button>
          </Box>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center" style={{ width: 60 }} />
                <TableCell align="center">Data</TableCell>
                <TableCell align="center">Total Leite Bom</TableCell>
                <TableCell align="center">Total Leite Ácido</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.keys(historicoFiltrado).length > 0 ? (
                Object.keys(historicoFiltrado).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map((data) => (
                  <HistoricoRow key={data} data={data} registros={historicoFiltrado[data]} />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Alert severity="info" sx={{ justifyContent: 'center' }}>Nenhum registro encontrado.</Alert>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </LayoutBaseDePagina>
  );
};