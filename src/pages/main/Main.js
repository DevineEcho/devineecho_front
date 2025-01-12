import React, { useState, useEffect, useRef } from 'react';
import GameboyImage from './Gameboy.png';
import Login from '../login/Login';
import DivineEchoGameUI from '../game/DivineEchoGameUI';
import Store from '../store/Store';
import './Main.css';

function Main() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showStore, setShowStore] = useState(false);
    const pixiContainer = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsLoggedIn(true);
        }
    }, []);

    const handleLoginSuccess = () => {
        setIsLoggedIn(true);
    };
    return (
        <div className="gameboy-container">
            <img src={GameboyImage} alt="Game Boy" className="gameboy-image" />
            <div className="gameboy-screen">
                {isLoggedIn ? (
                    showStore ? (
                        <>
                            {console.log('Rendering Store Component')}
                            <Store onBack={() => setShowStore(false)} pixiContainer={pixiContainer} />
                        </>
                    ) : (
                        <>
                            {console.log('Rendering DivineEchoGameUI Component')}
                            <DivineEchoGameUI onOpenStore={() => setShowStore(true)} pixiContainer={pixiContainer} />
                        </>
                    )
                ) : (
                    <>
                        {console.log('Rendering Login Component')}
                        <Login onLoginSuccess={handleLoginSuccess} />
                    </>
                )}
            </div>
        </div>
    );
}

export default Main;
