import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
//import Main from './routes/Main';
import reportWebVitals from './reportWebVitals';
import ErrorPage from './error-page';
import Runs from './routes/Runs';
import { Layout } from './components';
import { BlankPage } from './routes/BlankPage';
//import ProtectedRoute from './routes/ProtectedRoute';
import { App } from './routes/App';

const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        errorElement: <ErrorPage />,
    },
    {
        path: 'runs',
        element: (
            <Layout title="Run stats">
                <Runs />
            </Layout>
        ),
    },
    {
        path: 'features',
        element: (
            <Layout title="Features">
                <BlankPage />
            </Layout>
        ),
    },

    {
        path: 'pricing',
        element: (
            <Layout title="Pricing">
                <BlankPage />
            </Layout>
        ),
    },

    {
        path: 'faq',
        element: (
            <Layout title="FAQ's">
                <BlankPage />
            </Layout>
        ),
    },

    {
        path: 'about',
        element: (
            <Layout title="About Us">
                <BlankPage />
            </Layout>
        ),
    },
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
