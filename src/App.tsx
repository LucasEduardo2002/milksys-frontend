import { BrowserRouter } from "react-router-dom";
import { AppThemeProvider, AuthProvider, DrawerProvider, MqttProvider } from './shared/contexts';
import { AppRoutes } from './routes';
import { SnackbarProvider } from "./shared/contexts/SnackbarProvider";

export const App = () => {
  return (
    <AuthProvider>
      <AppThemeProvider>
        <SnackbarProvider>
          <DrawerProvider>
            <MqttProvider>
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </MqttProvider>
          </DrawerProvider>
        </SnackbarProvider>
      </AppThemeProvider>
    </AuthProvider>
  );
};

export default App;