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
import { ProtectedRoute } from "./components/routing";
import { AppLayout } from "./components/layout";
import {
  LoginPage,
  AuthCallbackPage,
  HomePage,
  ProjectsPage,
  ProjectDetailPage,
  ProjectCreatePage,
  ProjectMapPage,
  CampaignPage,
  DocsPage,
} from "./pages";
import { DocsLayout } from "./components/docs";
import { ROUTES } from "./config/constants";

function App() {
  return (
    <AuthProvider>
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
              <Route path=":id/map" element={<ProjectMapPage />} />
              <Route path=":id" element={<ProjectDetailPage />} />
            </Route>
            <Route path="campaign" element={<CampaignPage />} />
          </Route>
          <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
