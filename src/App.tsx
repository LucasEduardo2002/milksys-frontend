import { BrowserRouter } from "react-router-dom";
import { AppThemeProvider, AuthProvider, DrawerProvider } from './shared/contexts';
import { AppRoutes } from './routes';
import { SnackbarProvider } from "./shared/contexts/SnackbarProvider";

export const App = () => {
  return (
    <AuthProvider>
      <AppThemeProvider>
        <SnackbarProvider>
          <DrawerProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </DrawerProvider>
        </SnackbarProvider>
      </AppThemeProvider>
    </AuthProvider>
  );
};

export default App;