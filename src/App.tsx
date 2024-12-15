import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Gallery } from './pages/Gallery';
import { SuccessPage } from './components/SuccessPage';
import { AuthProvider } from './components/AuthProvider';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Gallery />} />
        <Route path="/success" element={<SuccessPage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;