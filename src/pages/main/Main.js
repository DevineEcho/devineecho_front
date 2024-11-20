import React, { useState, useEffect } from 'react';
import GameboyImage from './Gameboy.png';
import Login from '../login/Login';
import DivineEchoGame from '../game/DivineEchoGameUI';
import './Main.css';

function Main() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

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
                {isLoggedIn ? <DivineEchoGame /> : <Login onLoginSuccess={handleLoginSuccess} />}
            </div>
        </div>
    );
}

export default Main;
