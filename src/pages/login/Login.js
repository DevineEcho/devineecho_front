import React, { useState } from 'react';
import './Login.css';

function Login({ onLoginSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:8080/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                const token = await response.text();
                localStorage.setItem('token', token);
                alert('Login successful!');
                onLoginSuccess();
            } else {
                alert('Login failed');
            }
        } catch (error) {
            console.error('Error', error);
            alert('Error occurred');
        }
    };

    const handleSignup = async () => {};

    const handlePasswordRecovery = async () => {};

    return (
        <form className="login-form" onSubmit={handleLogin}>
            <input type="text" placeholder="캐릭터명" value={username} onChange={(e) => setUsername(e.target.value)} />
            <input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit">로그인</button>
            <div className="button-container">
                <button type="button" className="secondary-button" onClick={handleSignup}>
                    회원가입
                </button>
                <button type="button" className="secondary-button" onClick={handlePasswordRecovery}>
                    비밀번호 찾기
                </button>
            </div>
        </form>
    );
}

export default Login;
