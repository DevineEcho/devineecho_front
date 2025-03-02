import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import loadingVideo from '../game/video/loading.mp4';
import GameboyImage from '../main/Gameboy.png';
import '../main/Main.css';

function KakaoLoginHandler({ onLoginSuccess }) {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        console.log("🔹 useEffect 실행됨 (카카오 로그인 체크)");

        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");

        if (!code) {
            console.log("❌ 카카오 로그인 코드 없음. useEffect 종료");
            return;
        }

        // ✅ URL에서 즉시 인증 코드 제거 (재사용 방지)
        window.history.replaceState({}, document.title, window.location.pathname);

        // ✅ 중복 요청 방지 (이미 로그인된 경우 요청 안 보냄)
        if (localStorage.getItem("token")) {
            console.log("✅ 이미 로그인됨, 로그인 요청 중단");
            return;
        }

        console.log("🔹 카카오 로그인 코드 감지:", code);

        fetch(`http://localhost:8080/api/auth/kakao/callback?code=${code}`)
            .then(response => {
                console.log("🔹 fetch 요청 완료, 응답 상태:", response.status);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.token) {
                    console.log("✅ 카카오 로그인 성공, 토큰 저장");
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("username", data.username);
                    localStorage.setItem("phoneNumber", data.phoneNumber);
                    console.log("✅ localStorage 저장 완료");

                    alert(`카카오 로그인 성공! \n유저네임: ${data.username} \n전화번호: ${data.phoneNumber}`);

                    // ✅ 로딩 화면을 표시하고 3초 후 게임 화면으로 이동
                    setTimeout(() => {
                        setIsLoading(false);
                        if (onLoginSuccess) onLoginSuccess();
                        navigate("/"); // ✅ 메인 화면으로 이동
                    }, 3000);
                } else {
                    alert("카카오 로그인 실패");
                }
            })
            .catch(error => {
                console.error("❌ 카카오 로그인 오류:", error);
                alert("카카오 로그인 중 오류 발생");
            });

    }, [navigate, onLoginSuccess]);

    return (
        <div className="gameboy-container">
            <img src={GameboyImage} alt="Game Boy" className="gameboy-image" />
            <div className="gameboy-screen">
                {isLoading ? (
                    <div className="loading-screen">
                        <video
                            src={loadingVideo}
                            autoPlay
                            muted
                            className="loading-video"
                            onEnded={() => setIsLoading(false)}
                        />
                    </div>
                ) : (
                    <div>로그인 중...</div>
                )}
            </div>
        </div>
    );
}

export default KakaoLoginHandler;
