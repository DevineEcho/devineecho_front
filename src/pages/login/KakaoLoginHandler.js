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
            console.log(" 카카오 로그인 코드 없음. useEffect 종료");
            return;
        }
        window.history.replaceState({}, document.title, window.location.pathname);

        if (localStorage.getItem("token")) {
            console.log(" 이미 로그인됨, 로그인 요청 중단");
            return;
        }

        console.log(" 카카오 로그인 코드 감지:", code);

        fetch(`http://192.168.0.39:8080/api/auth/kakao/callback?code=${code}`)
            .then(response => {
                console.log(" fetch 요청 완료, 응답 상태:", response.status);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("🔍 응답 데이터:", data);
                
                if (data.token) {
                    console.log(" 카카오 로그인 성공, 토큰 저장");
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("username", data.username);
                    localStorage.setItem("phoneNumber", data.phoneNumber);
                    console.log(" localStorage 저장 완료");

                    alert(`카카오 로그인 성공! \n유저네임: ${data.username} \n전화번호: ${data.phoneNumber}`);


                    setTimeout(() => {
                        console.log(" setIsLoading(false) 실행됨!"); 
                        setIsLoading(false);
                        if (onLoginSuccess) {
                            console.log(" onLoginSuccess 실행됨!");
                            onLoginSuccess();
                        } else {
                            console.error(" onLoginSuccess가 정의되지 않음!");
                        }
                        console.log(" navigate('/') 실행됨!");
                        navigate("/");
                    }, 3000);
                } else {
                    alert(" 카카오 로그인 실패 - 응답에 토큰 없음");
                }
            })
            .catch(error => {
                console.error(" 카카오 로그인 오류:", error);
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
                            onEnded={() => {
                                console.log("로딩 비디오 끝남! isLoading(false) 적용");
                                setIsLoading(false);
                            }}
                        />
                    </div>
                ) : (
                    <div> 로그인 중... (게임 화면으로 이동 준비 완료)</div>
                )}
            </div>
        </div>
    );
}

export default KakaoLoginHandler;
