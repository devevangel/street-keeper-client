/**
 * App
 * Root component. Wraps the app in AuthProvider and React Router.
 * Public routes: /, /auth/callback. Protected routes use AppLayout and TabNav.
 * Login is handled by the landing page "Connect with Strava" button; /login redirects to /.
 */

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  Outlet,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { PreferencesProvider } from "./contexts/PreferencesContext";
import { AnalyticsProvider } from "./contexts/AnalyticsContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ProtectedRoute } from "./components/routing";
import { AppLayout } from "./components/layout";
import {
  AuthCallbackPage,
  HomePage,
  LandingPage,
  ProjectsPage,
  ProjectDetailPage,
  ProjectCreatePage,
  ProjectSuggestionsMapPage,
  CampaignPage,
  PreferencesPage,
  DocsPage,
} from "./pages";
import { DocsLayout } from "./components/docs";
import { ROUTES } from "./config/constants";

/** Redirects /login to landing, preserving query params (e.g. ?error=access_denied). */
function LoginRedirect() {
  const { search } = useLocation();
  return <Navigate to={`${ROUTES.LANDING}${search}`} replace />;
}

function App() {
  return (
    <AuthProvider>
      <PreferencesProvider>
      <ToastProvider>
      <AnalyticsProvider>
      <BrowserRouter>
        <Routes>
          <Route path={ROUTES.LANDING} element={<LandingPage />} />
          <Route path={ROUTES.LOGIN} element={<LoginRedirect />} />
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
            <Route path={ROUTES.HOME} element={<HomePage />} />
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
            <Route path="preferences" element={<PreferencesPage />} />
          </Route>
          <Route path="*" element={<Navigate to={ROUTES.LANDING} replace />} />
        </Routes>
      </BrowserRouter>
      </AnalyticsProvider>
      </ToastProvider>
      </PreferencesProvider>
    </AuthProvider>
  );
}

export default App;
