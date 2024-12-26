import React, { useState, useEffect, useRef } from 'react';
import './Login.css';

function Login({ onLoginSuccess }) {
    const [isSignup, setIsSignup] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const usernameRef = useRef(null);

    useEffect(() => {
        if (usernameRef.current) {
            usernameRef.current.focus();
        }
    }, [isSignup]);

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

    const handleSignup = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password, phoneNumber }),
            });

            if (response.ok) {
                alert('회원가입 성공!');
                setIsSignup(false);
            } else if (response.status === 409) {
                alert('캐릭터명 또는 휴대폰 번호가 중복됩니다.');
            } else {
                alert('회원가입 실패');
            }
        } catch (error) {
            console.error('Error', error);
            alert('Error occurred');
        }
    };

    return (
        <form className="login-form" onSubmit={isSignup ? handleSignup : handleLogin}>
            {isSignup ? (
                <>
                    <input
                        ref={usernameRef}
                        type="text"
                        placeholder="신규 캐릭터명"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="비밀번호"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="비밀번호 재입력"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="휴대폰 번호"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                    <button className="signup-button" type="submit">
                        회원가입하기
                    </button>
                    <button className="back-button" type="button" onClick={() => setIsSignup(false)}>
                        뒤로 가기
                    </button>
                    <p className="info-text">
                        카카오톡 회원가입은 로그인 화면에서 카카오톡 로그인을 하면 자동 생성됩니다.
                    </p>
                </>
            ) : (
                <>
                    <input
                        ref={usernameRef}
                        type="text"
                        placeholder="캐릭터명"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="비밀번호"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button className="login-button" type="submit">
                        로그인
                    </button>
                    <button className="signup-button" type="button" onClick={() => setIsSignup(true)}>
                        회원가입
                    </button>
                    <button className="recovery-button" type="button">
                        아이디 / 비밀번호 찾기
                    </button>
                    <button className="kakao-login-button" type="button">
                        카카오 로그인
                    </button>
                </>
            )}
        </form>
    );
}

export default Login;
