import React, { Suspense, useEffect } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { Link, Route, Routes } from 'react-router-dom';
import Landing from 'pages/Landing';
import AuthPage from 'pages/Auth';
import UserPage from 'pages/UserPage';
import SearchPage from 'pages/SearchPage';
import Dashboard from 'pages/Dashboard';
import EmailVerification from './EmailVerification';
import Loader from 'components/Loader';
import usePageTracking from 'utils/hooks/use-page-tracking';
import Signup from 'pages/Auth/Signup';
import useHttp from 'hooks/useHttp';
import { SERVER_URL } from 'config.keys';
import { useSetRecoilState } from 'recoil';
import { authState } from 'store';
import { toast, ToastContainer } from 'react-toastify';
import axios from 'axios';
import ProtectedRoute from 'service/ProtectedRoute';

const App = () => {
  const { loading, sendRequest } = useHttp();
  const setAuthState = useSetRecoilState(authState);
  usePageTracking();

  useEffect(() => {
    sendRequest(
      async () => {
        const { data } = await axios.get(`${SERVER_URL}/api/auth`, {
          withCredentials: true,
        });
        return data;
      },
      (data: any) => {
        setAuthState(data);
        console.log(data);
        if (data.isLoggedIn && !data.user.signup_completed) {
          toast.info(
            () => (
              <div>
                <p>
                  Please complete your{' '}
                  <Link to="/registration-form">Signup</Link>
                </p>
              </div>
            ),
            {
              autoClose: false,
            },
          );
        }
      },
    );
  }, []);

  if (loading) return <Loader />;

  return (
    <Suspense fallback={<Loader />}>
      <ToastContainer position="bottom-left" />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route element={<ProtectedRoute redirectTo="/dashboard" inverse />}>
          <Route path="/auth" element={<AuthPage />} />
        </Route>
        <Route path="/search/" element={<SearchPage />} />
        <Route path="/user/:id" element={<UserPage />} />
        <Route element={<ProtectedRoute redirectTo="/auth" />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
        <Route path="/registration-form" element={<Signup />} />
        <Route path="/email-verification" element={<EmailVerification />} />
      </Routes>
    </Suspense>
  );
};

export default App;
