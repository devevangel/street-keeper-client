/**
 * App
 * Root component. Wraps the app in AuthProvider and React Router.
 * Public routes: /login, /auth/callback. Protected routes use AppLayout and TabNav.
 */

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  Outlet,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { PreferencesProvider } from "./contexts/PreferencesContext";
import { AnalyticsProvider } from "./contexts/AnalyticsContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ProtectedRoute } from "./components/routing";
import { AppLayout } from "./components/layout";
import {
  LoginPage,
  AuthCallbackPage,
  HomePage,
  ProjectsPage,
  ProjectDetailPage,
  ProjectCreatePage,
  ProjectSuggestionsMapPage,
  CampaignPage,
  MilestonesPage,
  PreferencesPage,
  DocsPage,
} from "./pages";
import { DocsLayout } from "./components/docs";
import { ROUTES } from "./config/constants";

function App() {
  return (
    <AuthProvider>
      <PreferencesProvider>
      <ToastProvider>
      <AnalyticsProvider>
      <BrowserRouter>
        <Routes>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.AUTH_CALLBACK} element={<AuthCallbackPage />} />
          <Route path={ROUTES.DOCS} element={<DocsLayout />}>
            <Route index element={<DocsPage />} />
            <Route path=":slug" element={<DocsPage />} />
          </Route>
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HomePage />} />
            <Route path="projects" element={<Outlet />}>
              <Route index element={<ProjectsPage />} />
              <Route path="new" element={<ProjectCreatePage />} />
              <Route
                path=":id/suggestions"
                element={<ProjectSuggestionsMapPage />}
              />
              <Route path=":id" element={<ProjectDetailPage />} />
            </Route>
            <Route path="campaign" element={<CampaignPage />} />
            <Route path="milestones" element={<MilestonesPage />} />
            <Route path="preferences" element={<PreferencesPage />} />
          </Route>
          <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
        </Routes>
      </BrowserRouter>
      </AnalyticsProvider>
      </ToastProvider>
      </PreferencesProvider>
    </AuthProvider>
  );
}

export default App;
