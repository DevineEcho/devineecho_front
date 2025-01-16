import React, { useState, useEffect, useRef } from 'react';
import GameboyImage from './Gameboy.png';
import Login from '../login/Login';
import DivineEchoGameUI from '../game/DivineEchoGameUI';
import Store from '../store/Store';
import loadingVideo from '../game/video/loading.mp4';
import './Main.css';

function Main() {
    const [isLoggedIn, setIsLoggedIn] = useState(false); // 로그인 상태
    const [isLoading, setIsLoading] = useState(false); // 로딩 비디오 상태
    const [showStore, setShowStore] = useState(false);
    const pixiContainer = useRef(null);

    const handleLoginSuccess = () => {
        setIsLoading(true); // 로딩 시작
        setTimeout(() => {
            setIsLoggedIn(true); // 로그인 상태로 전환
            setIsLoading(false); // 로딩 종료
        }, 3000); // 로딩 비디오 지속 시간
    };

    return (
        <div className="gameboy-container">
            <img src={GameboyImage} alt="Game Boy" className="gameboy-image" />
            <div className="gameboy-screen">
                {isLoading ? (
                    // 로딩 비디오를 Gameboy 화면 내에 표시
                    <div className="loading-screen">
                        <video
                            src={loadingVideo}
                            autoPlay
                            muted
                            className="loading-video"
                            onEnded={() => setIsLoading(false)}
                        />
                    </div>
                ) : isLoggedIn ? (
                    // 로그인 상태
                    showStore ? (
                        <Store onBack={() => setShowStore(false)} pixiContainer={pixiContainer} />
                    ) : (
                        <DivineEchoGameUI onOpenStore={() => setShowStore(true)} pixiContainer={pixiContainer} />
                    )
                ) : (
                    // 로그인 화면
                    <Login onLoginSuccess={handleLoginSuccess} />
                )}
            </div>
        </div>
    );
}

export default Main;
