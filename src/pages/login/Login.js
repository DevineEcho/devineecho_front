import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import KakaoLoginHandler from "./KakaoLoginHandler";
import './Login.css';

function Login({ onLoginSuccess }) {
    const [isSignup, setIsSignup] = useState(false);
    const [isRecovery, setIsRecovery] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [securityAnswer, setSecurityAnswer] = useState('');
    const usernameRef = useRef(null);
    const navigate = useNavigate();

    if (!onLoginSuccess) {
        console.error("onLoginSuccess가 정의되지 않았음!");
    }

    useEffect(() => {
        setTimeout(() => {
            if (usernameRef.current) {
                usernameRef.current.focus();
            }
        }, 100);
    }, []);

        const handleLogin = async (e) => {
            e.preventDefault();
            try {
                const response = await fetch('http://localhost:8080/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password }),
                });
    
                if (response.ok) {
                    const token = await response.text();
                    localStorage.setItem('token', token);
                    console.log("일반 로그인 성공! 토큰 저장 완료");
    
                    if (onLoginSuccess) {
                        console.log("onLoginSuccess 실행됨!");
                        onLoginSuccess();
                    } else {
                        console.error("onLoginSuccess가 정의되지 않음!");
                    }
    
                    navigate('/');
                } else {
                    alert('로그인 실패');
                }
            } catch (error) {
                console.error('Error', error);
                alert('오류 발생');
            }
        };

        const handleKakaoLogin = () => {
            const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?client_id=e1f65fcac9d3f01633d3bc45f2b4e408&redirect_uri=http://localhost:3000/login/kakao&response_type=code&prompt=login`;
            window.location.href = KAKAO_AUTH_URL;
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    password,
                    phoneNumber,
                    securityAnswer,
                }),
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
            alert('오류 발생');
        }
    };

    const handlePasswordRecovery = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/auth/recover', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber, securityAnswer }),
            });

            if (response.ok) {
                const data = await response.json();
                alert(`캐릭터명: ${data.username}\n비밀번호: ${data.password}`);
                setIsRecovery(false);
            } else {
                alert('정보가 일치하지 않습니다.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('비밀번호 찾기 실패');
        }
    };

    return (
        <form className="login-form" onSubmit={isSignup ? handleSignup : handleLogin}>
            {isRecovery ? (
                <>
                    <input
                        type="text"
                        placeholder="휴대폰 번호"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="비밀번호 찾기 질문의 답"
                        value={securityAnswer}
                        onChange={(e) => setSecurityAnswer(e.target.value)}
                    />
                    <button className="recovery-button" type="button" onClick={handlePasswordRecovery}>
                        찾기
                    </button>
                    <button className="back-button" type="button" onClick={() => setIsRecovery(false)}>
                        뒤로 가기
                    </button>
                </>
            ) : isSignup ? (
                <>
                    <input
                        ref={usernameRef}
                        type="text"
                        placeholder="신규 캐릭터명"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onMouseDown={(e) => e.target.focus()}
                    />
                    <input
                        type="password"
                        placeholder="비밀번호"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onMouseDown={(e) => e.target.focus()}
                    />
                    <input
                        type="password"
                        placeholder="비밀번호 재입력"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onMouseDown={(e) => e.target.focus()}
                    />
                    <input
                        type="text"
                        placeholder="휴대폰 번호"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        onMouseDown={(e) => e.target.focus()}
                    />
                    <input
                        type="text"
                        placeholder="나의 보물 제 1호는?"
                        value={securityAnswer}
                        onChange={(e) => setSecurityAnswer(e.target.value)}
                        onMouseDown={(e) => e.target.focus()}
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
                        onMouseDown={(e) => e.target.focus()}
                    />
                    <input
                        type="password"
                        placeholder="비밀번호"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onMouseDown={(e) => e.target.focus()}
                    />
                    <button className="login-button" type="submit">
                        로그인
                    </button>
                    <button className="signup-button" type="button" onClick={() => setIsSignup(true)}>
                        회원가입
                    </button>
                    <button className="recovery-button" type="button" onClick={() => setIsRecovery(true)}>
                        캐릭터명 / 비밀번호 찾기
                    </button>
                    <button className="kakao-login-button" type="button" onClick={handleKakaoLogin}>
                카카오 로그인
            </button>
        
                </>
            )}
        </form>
    );
}

export default Login;
