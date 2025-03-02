import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Main from './pages/main/Main';
import Login from './pages/login/Login';
import KakaoLoginHandler from './pages/login/KakaoLoginHandler';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Main />} />
                <Route path="/login" element={<Login />} />
                <Route path="/login/kakao" element={<KakaoLoginHandler />} />
            </Routes>
        </Router>
    );
}

export default App;
