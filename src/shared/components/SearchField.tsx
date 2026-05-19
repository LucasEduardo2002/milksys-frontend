// VVV CORREÇÃO 1: Adicionado "type" na importação VVV
import { type TextFieldProps, TextField } from '@mui/material'; 
import { useDebounce } from '../hooks';

type TSearchFieldProps = TextFieldProps & {
    onSearchChange: (newValue: string) => void;
};

export const SearchField: React.FC<TSearchFieldProps> = ({ onSearchChange, ...rest }) => {
    const { debounce } = useDebounce();

    return (
        <TextField
            {...rest}
            onChange={(e) => {
                debounce(() => {
                    onSearchChange(e.target.value);
                });
            }}
        />
    );
};