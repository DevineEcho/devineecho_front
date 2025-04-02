import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import GameboyImage from './Gameboy.png';
import Login from '../login/Login';
import DivineEchoGameUI from '../game/DivineEchoGameUI';
import Store from '../store/Store';
import loadingVideo from '../game/video/loading.mp4';
import './Main.css';

function Main() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showStore, setShowStore] = useState(false);
    const pixiContainer = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            console.log("저장된 토큰 발견, 자동 로그인 처리");
            setIsLoggedIn(true);
        }
    }, []);

    const handleLoginSuccess = () => {
        console.log("handleLoginSuccess 실행됨");
        setIsLoading(true);

        setTimeout(() => {
            setIsLoggedIn(true);
            setIsLoading(false);
            navigate("/");
        }, 3000);
    };

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
                ) : isLoggedIn ? (
                    showStore ? (
                        <Store onBack={() => setShowStore(false)} pixiContainer={pixiContainer} />
                    ) : (
                        <DivineEchoGameUI onOpenStore={() => setShowStore(true)} pixiContainer={pixiContainer} />
                    )
                ) : (
                    <Login onLoginSuccess={handleLoginSuccess} />
                )}
            </div>
        </div>
    );
}

export default Main;
