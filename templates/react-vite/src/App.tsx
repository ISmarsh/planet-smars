import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { CreditsPage } from './pages/CreditsPage';

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/credits" element={<CreditsPage />} />
        </Route>
      </Routes>
      <Toaster position="bottom-center" />
    </>
  );
}
