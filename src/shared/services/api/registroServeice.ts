import { Api } from "./axios-config";
import type { RowData } from "../../../pages/pagina_inicial/PaginaInicial";

// O tipo FormErrors é definido para corresponder aos campos que podem ter erro.
type FormErrors = { [key in keyof Omit<RowData, 'id'>]?: boolean };

// A função de validação agora retorna um objeto com os campos que contêm erro.
const validateFields = (rows: RowData[]): FormErrors => {
    const newErrors: FormErrors = {};
    // A validação é feita por linha, mas o erro é genérico por campo.
    rows.forEach(row => {
        if (row.nome.trim() === '') newErrors.nome = true;
        if (row.tanque.trim() === '') newErrors.tanque = true;
        if (row.data.trim() === '') newErrors.data = true;
        if (row.acidez.trim() === '') newErrors.acidez = true;
    });
    return newErrors;
};

export const salvarregistros = async (
    rows: RowData[],
    showSnackbar: (msg: string, severity?: "success" | "error" | "warning" | "info") => void,
    setRegistrosSalvos: React.Dispatch<React.SetStateAction<RowData[]>>,
    setRows: React.Dispatch<React.SetStateAction<RowData[]>>,
    createEmptyRow: (id: number) => RowData,
    // A função agora recebe o setErrors para atualizar o estado na página.
    setErrors: React.Dispatch<React.SetStateAction<FormErrors>>
) => {
    const validationErrors = validateFields(rows);
    if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors); // Atualiza os erros na tela
        showSnackbar('Preencha os campos obrigatórios', 'error');
        return;
    }

     try {
        // Mapeia cada linha para uma promessa de postagem
        const postPromises = rows.map(row => {
            const { id, ...dataParaEnviar } = row;

            // Formata a data antes de enviar para o backend
            if (dataParaEnviar.data) {
                const dataObj = new Date(dataParaEnviar.data);
                // Converte para uma string no formato YYYY-MM-DD
                dataParaEnviar.data = dataObj.toISOString().split('T')[0];
            }

            return Api.post("/coletas", dataParaEnviar);
        });

        await Promise.all(postPromises);
        
        showSnackbar("Registro salvo com sucesso!", "success");
        const response = await Api.get("/coletas");
        setRegistrosSalvos(response.data);
        setRows([createEmptyRow(Date.now())]);
        setErrors({}); // Limpa os erros após o sucesso
    } catch (error) {
        showSnackbar("Erro ao salvar os dados. Tente novamente.", "error");
    }
};
export const updatecollection = async (
    registro: RowData,
    showSnackbar: (msg: string, severity?: "success" | "error" | "warning" | "info") => void,
    setRegistrosSalvos: React.Dispatch<React.SetStateAction<RowData[]>>
) => {
    try {
        const { id, ...dataParaEnviar } = registro;
        await Api.put(`/coletas/${id}`, dataParaEnviar);
        setRegistrosSalvos((prev) =>
            prev.map((item) => (item.id === id ? registro : item))
        );
        showSnackbar("Coleta atualizada com sucesso!", "success");
    } catch (error) {
        showSnackbar("Erro ao atualizar registro.", "error");
    }
};

export const deletarregistros = async (
    id: number,
    showSnackbar: (msg: string, severity?: "success" | "error" | "warning" | "info") => void,
    setRegistrosSalvos: React.Dispatch<React.SetStateAction<RowData[]>>
) => {
    try {
        await Api.delete(`/coletas/${id}`);
        setRegistrosSalvos((prev) => prev.filter((registro) => registro.id !== id));
        showSnackbar("Registro apagado com sucesso!", "success");
    } catch (error) {
        showSnackbar("Erro ao apagar registro.", "error");
    }
};