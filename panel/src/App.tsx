/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import Videos from './pages/Videos';
import { MockTests } from './pages/MockTests';
import { PracticeSets } from './pages/PracticeSets';
import { TestSeries } from './pages/TestSeries';
import { TestSeriesEditor } from './pages/TestSeriesEditor';
import Banners from './pages/Banners';
import AppUpdate from './pages/AppUpdate';
import { GenerateAI } from './pages/GenerateAI';
import { ActivityLog } from './pages/ActivityLog';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'videos', element: <Videos /> },
      { path: 'mock-tests', element: <MockTests /> },
      { path: 'practice-sets', element: <PracticeSets /> },
      { path: 'test-series', element: <TestSeries /> },
      { path: 'test-series/:id', element: <TestSeriesEditor /> },
      { path: 'banners', element: <Banners /> },
      { path: 'app-update', element: <AppUpdate /> },
      { path: 'generate', element: <GenerateAI /> },
      { path: 'activity-log', element: <ActivityLog /> },
    ],
  },
]);

export default function App() {
  return (
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  );
}
