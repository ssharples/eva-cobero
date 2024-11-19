import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Gallery } from './pages/Gallery';
import { SuccessPage } from './components/SuccessPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Gallery />} />
      <Route path="/success" element={<SuccessPage />} />
    </Routes>
  );
}

export default App;