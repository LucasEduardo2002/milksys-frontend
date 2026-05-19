import { Api } from "../api/axios-config";
import type { ProdutorData } from "../../../pages/CadastrarProdutor";
import { AxiosError } from "axios";

type ProdutorFormErrors = { [key in keyof Omit<ProdutorData, 'id' | 'tipo' | 'status'>]?: boolean };

// A lógica de validação é movida para cá.
const validate = (formRow: ProdutorData): ProdutorFormErrors => {
    const newErrors: ProdutorFormErrors = {};
    if (!formRow.nome.trim()) newErrors.nome = true;
    if (!formRow.cpfCnpj.trim()) newErrors.cpfCnpj = true;
    if (!formRow.telefone.trim()) newErrors.telefone = true;
    if (!formRow.localidade.trim()) newErrors.localidade = true;
    return newErrors;
};

export const salvarProdutores = async (
    formRow: ProdutorData,
    showSnackbar: (msg: string, severity?: "success" | "error" | "warning" | "info") => void,
    setRegistrosSalvos: React.Dispatch<React.SetStateAction<ProdutorData[]>>,
    setFormRow: React.Dispatch<React.SetStateAction<ProdutorData>>,
    createEmptyRow: (id: number) => ProdutorData,
    // Também recebe o setErrors para comunicar erros à UI.
    setErrors: React.Dispatch<React.SetStateAction<ProdutorFormErrors>>
) => {
    const validationErrors = validate(formRow);
    if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        showSnackbar("Preencha os campos obrigatórios", "error");
        return;
    }

    try {
        const { id, ...dataParaEnviar } = formRow;
        
        await Api.post("/produtores", dataParaEnviar);
        showSnackbar("Produtor salvo com sucesso!", "success");
        const response = await Api.get("/produtores");
        setRegistrosSalvos(response.data);
        setFormRow(createEmptyRow(Date.now()));
        setErrors({});
    } catch (error) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 409) {
            // Se o status for 409, exiba a mensagem de erro do back-end.
            showSnackbar("CPF/CNPJ já cadastrado.", "warning");
        } else {
            // Para qualquer outro erro, exiba uma mensagem genérica.
            showSnackbar("Erro ao salvar o produtor.", "error");
        }
        console.error("Erro ao salvar o produtor:", axiosError);
    }
};

export const deletarProdutor = async (
    id: number,
    showSnackbar: (msg: string, severity?: "success" | "error" | "warning" | "info") => void,
    setRegistrosSalvos: React.Dispatch<React.SetStateAction<ProdutorData[]>>
) => {
    try {
        await Api.delete(`/produtores/${id}`);
        setRegistrosSalvos((prev) => prev.filter((registro) => registro.id !== id));
        showSnackbar("Registro apagado com sucesso!", "success");
    } catch (error) {
        showSnackbar("Erro ao apagar registro.", "error");
    }
};

export const atualizarRegistro = async (
    registro: ProdutorData,
    showSnackbar: (msg: string, severity?: "success" | "error" | "warning" | "info") => void,
    setRegistrosSalvos: React.Dispatch<React.SetStateAction<ProdutorData[]>>
) => {
    try {
        const { id, ...dataParaEnviar } = registro;
        await Api.put(`/produtores/${id}`, dataParaEnviar);
        setRegistrosSalvos((prev) =>
            prev.map((item) => (item.id === id ? registro : item))
        );
        showSnackbar("Registro atualizado com sucesso!", "success");
    } catch (error) {
        showSnackbar("Erro ao atualizar registro.", "error");
    }
};