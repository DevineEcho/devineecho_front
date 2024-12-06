import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

// 여기서 mousedown 기본 동작을 막습니다.
document.addEventListener('mousedown', (event) => {
    event.preventDefault();
});
