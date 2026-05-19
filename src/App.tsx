import { BrowserRouter } from "react-router-dom";
import { AppThemeProvider, DrawerProvider } from './shared/contexts';
import { MenuLateral } from './shared/components';
import { AppRoutes } from './routes';
import { SnackbarProvider } from "./shared/contexts/SnackbarProvider";

export const App = () => {
  return (
    <AppThemeProvider>
      <SnackbarProvider>
        <DrawerProvider>
          <BrowserRouter>
            <MenuLateral>
              <AppRoutes />
            </MenuLateral>
          </BrowserRouter>
        </DrawerProvider>
      </SnackbarProvider>
    </AppThemeProvider>
  );
};

export default App;