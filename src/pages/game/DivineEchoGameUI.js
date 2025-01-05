import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import initialBackground from './images/initialBackground.jpeg';
import introVideo from './video/Test.mp4';
import hoverSoundFile from './sounds/ButtonSound.mp3';
import WebFont from 'webfontloader';
import DivineEchoGameCore from './DivineEchoGameCore';
import StatusBar from '../status/StatusBar';
import Login from '../login/Login';
import './DivineEchoGameUI.css';

const loadFonts = () => {
    return new Promise((resolve) => {
        WebFont.load({
            custom: {
                families: ['ChosunCentennial'],
                urls: ['https://gcore.jsdelivr.net/gh/projectnoonnu/noonfonts_2206-02@1.0/ChosunCentennial.woff2'],
            },
            active: resolve,
        });
    });
};

function DivineEchoGameUI() {
    const pixiContainer = useRef(null);
    const pixiApp = useRef(null);
    const gameCore = useRef(null);
    const [hoverSound, setHoverSound] = useState(null);
    const [playerData, setPlayerData] = useState(null);
    const [showStatusBar, setShowStatusBar] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(true);

    const fetchPlayerData = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch('http://localhost:8080/api/players/load', {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (response.ok) {
                const data = await response.json();
                setPlayerData(data);
                console.log('Player data loaded:', data);
            } else {
                console.error('Failed to fetch player data');
            }
        } catch (error) {
            console.error('Error during fetch player data:', error.message || JSON.stringify(error));
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            fetchPlayerData();
        }
    }, [isLoggedIn]);

    const initGame = useCallback(() => {
        const background = PIXI.Sprite.from(initialBackground);
        background.width = pixiApp.current.screen.width;
        background.height = pixiApp.current.screen.height;
        pixiApp.current.stage.addChild(background);

        addPixiButton('처음부터하기', 150, 150, () => {
            resetPlayerData();
            playIntroVideo();
            setShowStatusBar(false);
        });
        addPixiButton('이어하기', 450, 150, () => {
            fetchPlayerData();
            startGame(playerData);
            setShowStatusBar(false);
        });
        addPixiButton('상점', 150, 300, () => alert('상점으로 이동'));
        addPixiButton('인벤토리', 450, 300, () => alert('인벤토리로 이동'));
        addPixiButton('랭킹', 300, 450, () => alert('랭킹으로 이동'));
    }, [fetchPlayerData, playerData]);

    useEffect(() => {
        const initialize = async () => {
            await loadFonts();
            initGame();
        };

        pixiApp.current = new PIXI.Application({
            width: 880,
            height: 528,
            backgroundColor: 0x000000,
        });
        pixiContainer.current.appendChild(pixiApp.current.view);

        const initHoverSound = () => {
            const sound = new Audio(hoverSoundFile);
            sound.load();
            setHoverSound(sound);
            window.removeEventListener('pointerdown', initHoverSound);
        };

        window.addEventListener('pointerdown', initHoverSound);

        initialize();

        return () => {
            pixiApp.current.destroy(true, true);
            window.removeEventListener('pointerdown', initHoverSound);
        };
    }, [initGame]);

    const addPixiButton = (text, x, y, onClick) => {
        const button = new PIXI.Container();
        const buttonBackground = new PIXI.Graphics();
        buttonBackground.beginFill(0x444444);
        buttonBackground.drawRoundedRect(0, 0, 200, 60, 10);
        buttonBackground.endFill();

        const buttonText = new PIXI.Text(text, {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xffffff,
            align: 'center',
        });
        buttonText.anchor.set(0.5);
        buttonText.x = 100;
        buttonText.y = 30;

        button.addChild(buttonBackground, buttonText);
        button.x = x;
        button.y = y;
        button.interactive = true;
        button.buttonMode = true;

        button.on('pointerover', () => {
            buttonBackground.tint = 0x666666;
            if (hoverSound) {
                hoverSound.currentTime = 0;
                hoverSound.play();
            }
        });

        button.on('pointerout', () => {
            buttonBackground.tint = 0xffffff;
        });

        button.on('pointerdown', onClick);

        pixiApp.current.stage.addChild(button);
    };

    const resetPlayerData = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://localhost:8080/api/players/reset', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (response.ok) {
                console.log('Player data reset.');
            } else {
                console.error('Failed to reset player data');
            }
        } catch (error) {
            console.error('Error during reset player data:', error.message || JSON.stringify(error));
        }
    };

    const playIntroVideo = () => {
        const video = document.createElement('video');
        video.src = introVideo;
        video.autoplay = true;
        video.muted = false;
        video.width = pixiApp.current.screen.width;
        video.height = pixiApp.current.screen.height;

        const texture = PIXI.Texture.from(video);
        const videoSprite = new PIXI.Sprite(texture);

        pixiApp.current.stage.addChild(videoSprite);

        video.onended = () => {
            pixiApp.current.stage.removeChild(videoSprite);
            startGame();
        };

        video.play().catch((err) => console.error('Video playback failed:', err));
    };

    const startGame = (playerData = null) => {
        pixiApp.current.stage.removeChildren();
        gameCore.current = new DivineEchoGameCore(pixiApp.current);
        if (playerData) {
            console.log('Player data loaded into core:', playerData);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
    };

    return isLoggedIn ? (
        <div className="game-container">
            {showStatusBar && playerData && <StatusBar player={playerData} onLogout={handleLogout} />}
            <div ref={pixiContainer} className="pixi-container" />
        </div>
    ) : (
        <Login onLoginSuccess={() => setIsLoggedIn(true)} />
    );
}

export default DivineEchoGameUI;
