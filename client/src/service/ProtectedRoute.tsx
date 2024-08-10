import React from 'react';
import { useRecoilValue } from 'recoil';
import { Navigate, Outlet, useSearchParams } from 'react-router-dom';
import { authState } from 'store';

interface ProtectedRouteProps {
  isRegisteredGuard?: boolean;
  redirectTo?: string;
  inverse?: boolean;
}

const UNPROTECTED_ROUTES = new Map<string, string>([
  ['home', '/'],
  ['searchPage', '/search'],
  ['register', '/registration-form'],
  ['resetPassword', '/reset-password'],
  ['waitlist', '/join-waitlist'],
]);

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  isRegisteredGuard = false,
  redirectTo,
  inverse = false,
}) => {
  const [searchParams] = useSearchParams();
  const auth = useRecoilValue(authState);

  if (!inverse && !auth.isLoggedIn) {
    const redirectParam = searchParams.get('redirect');
    if (redirectParam && UNPROTECTED_ROUTES.get(redirectParam)) {
      return <Navigate to={UNPROTECTED_ROUTES.get(redirectParam)!} />;
    }

    return <Navigate to={redirectTo ?? '/auth'} />;
  }

  if (isRegisteredGuard) {
    if (!auth.user?.signup_completed) {
      return <Navigate to="/registration-form" />;
    }

    return <Outlet />;
  }

  if (inverse) {
    if (auth.isLoggedIn) {
      return <Navigate to={redirectTo ?? '/'} />;
    }

    return <Outlet />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
