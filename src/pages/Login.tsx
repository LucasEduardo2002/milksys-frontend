import { useState } from 'react';
import { Box, Button, Divider, Paper, TextField, Typography, Avatar, Stack } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/contexts/AuthContext';
import { useSnackbar } from '../shared/contexts/SnackbarProvider';

type LoginLocationState = {
  from?: {
    pathname?: string;
  };
};

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showSnackbar } = useSnackbar();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as LoginLocationState | null)?.from?.pathname ?? '/pagina-inicial';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await login(username, password);
      showSnackbar('Login realizado com sucesso!', 'success');
      navigate(from, { replace: true });
    } catch {
      showSnackbar('Usuário ou senha inválidos.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 4,
        background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 55%, #0f766e 100%)',
      }}
    >
      <Paper
        elevation={12}
        sx={{
          width: '100%',
          maxWidth: 440,
          p: { xs: 3, sm: 4 },
          borderRadius: 4,
          backdropFilter: 'blur(8px)',
        }}
      >
        <Stack spacing={2.5} alignItems="center">
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              width: 64,
              height: 64,
              boxShadow: 3,
            }}
          >
            <LockOutlinedIcon />
          </Avatar>

          <Box textAlign="center">
            <Typography variant="h4" component="h1" fontWeight={700}>
              Sertão Seridó
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Acesse o sistema com suas credenciais
            </Typography>
          </Box>

          <Divider flexItem />

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <Stack spacing={2}>
              <TextField
                label="Usuário"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                autoFocus
                fullWidth
                required
              />

              <TextField
                label="Senha"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete="current-password"
                fullWidth
                required
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isSubmitting}
                sx={{ py: 1.3, fontWeight: 700 }}
              >
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </Button>
            </Stack>
          </Box>

          <Typography variant="caption" color="text.secondary" textAlign="center">
            O sistema ficará acessível somente após autenticação.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
};

export default LoginPage;
