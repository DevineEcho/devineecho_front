import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import initialBackground from './images/initialBackground.jpeg';
import introVideo from './video/Test.mp4';
import buttonClickSoundFile from './sounds/ButtonClickSound.mp3';
import DivineEchoGameCore from './DivineEchoGameCore';
import StatusBar from '../status/StatusBar';
import Login from '../login/Login';
import './DivineEchoGameUI.css';

function DivineEchoGameUI() {
    const pixiContainer = useRef(null);
    const pixiApp = useRef(null);
    const gameCore = useRef(null);
    const [hoverSound, setHoverSound] = useState(null);
    const [playerData, setPlayerData] = useState(null);
    const [showStatusBar, setShowStatusBar] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(true);

    useEffect(() => {
        // Load hover sound
        const sound = new Audio(buttonClickSoundFile);
        setHoverSound(sound);
    }, []);

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

    const addPixiButtons = useCallback(() => {
        const buttons = [
            { label: '처음부터하기', x: 150, y: 150, onClick: playIntroVideo },
            { label: '이어하기', x: 450, y: 150, onClick: () => fetchPlayerData().then(startGame) },
            { label: '상점', x: 150, y: 300, onClick: () => alert('상점으로 이동') },
            { label: '인벤토리', x: 450, y: 300, onClick: () => alert('인벤토리로 이동') },
            { label: '랭킹', x: 300, y: 450, onClick: () => alert('랭킹으로 이동') },
        ];

        // 클릭 사운드 로드
        const clickSound = new Audio(buttonClickSoundFile);

        buttons.forEach((button) => {
            const buttonContainer = new PIXI.Container();
            const buttonBackground = new PIXI.Graphics();

            // 초기 색상
            const defaultTint = 0x444444;
            const hoverTint = 0x666666;
            const clickTint = 0x999999;

            buttonBackground.beginFill(defaultTint);
            buttonBackground.drawRoundedRect(0, 0, 200, 60, 10);
            buttonBackground.endFill();

            const buttonText = new PIXI.Text(button.label, {
                fontFamily: 'Arial',
                fontSize: 20,
                fill: 0xffffff,
                align: 'center',
            });
            buttonText.anchor.set(0.5);
            buttonText.x = 100;
            buttonText.y = 30;

            buttonContainer.addChild(buttonBackground);
            buttonContainer.addChild(buttonText);
            buttonContainer.x = button.x;
            buttonContainer.y = button.y;

            buttonContainer.interactive = true;
            buttonContainer.buttonMode = true;

            // Hover 이벤트 처리
            buttonContainer.on('pointerover', () => {
                buttonBackground.tint = hoverTint;
            });

            // Hover 상태에서 벗어났을 때
            buttonContainer.on('pointerout', () => {
                buttonBackground.tint = defaultTint;
            });

            // 클릭 시 색상 변경 및 사운드 재생
            buttonContainer.on('pointerdown', () => {
                buttonBackground.tint = clickTint;
                clickSound.currentTime = 0; // 사운드를 처음부터 재생
                clickSound.play().catch((error) => {
                    console.error('Click sound playback failed:', error);
                });
            });

            // 클릭 후 상태 복원
            buttonContainer.on('pointerup', () => {
                buttonBackground.tint = hoverTint;
            });

            pixiApp.current.stage.addChild(buttonContainer);
        });
    }, [playIntroVideo, fetchPlayerData, startGame]);

    const initPixiApp = useCallback(() => {
        pixiApp.current = new PIXI.Application({
            width: 880,
            height: 528,
            backgroundColor: 0x000000,
        });

        pixiContainer.current.appendChild(pixiApp.current.view);
        console.log('Pixi Application initialized');

        const background = PIXI.Sprite.from(initialBackground);
        background.width = pixiApp.current.screen.width;
        background.height = pixiApp.current.screen.height;
        pixiApp.current.stage.addChild(background);

        addPixiButtons();
    }, [addPixiButtons]);

    useEffect(() => {
        initPixiApp();

        return () => {
            if (pixiApp.current) {
                pixiApp.current.destroy(true, true);
                pixiApp.current = null;
            }
        };
    }, [initPixiApp]);

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
            if (!response.ok) {
                throw new Error('Failed to reset player data');
            }
            console.log('Player data reset.');
        } catch (error) {
            console.error('Error during reset player data:', error.message || JSON.stringify(error));
            throw error;
        }
    };

    const playIntroVideo = async () => {
        setShowStatusBar(false);

        try {
            await resetPlayerData();
            console.log('Player data has been reset.');
        } catch (error) {
            console.error('Error resetting player data:', error);
            return;
        }

        const video = document.createElement('video');
        video.src = introVideo;
        video.autoplay = false;
        video.muted = true;
        video.playsInline = true;

        video.style.position = 'absolute';
        video.style.top = '0';
        video.style.left = '0';
        video.style.width = `${pixiApp.current.renderer.width}px`;
        video.style.height = `${pixiApp.current.renderer.height}px`;
        video.style.objectFit = 'cover';
        video.style.zIndex = '10000';

        pixiContainer.current.appendChild(video);

        video.oncanplay = () => {
            video.play().catch((err) => console.error('Video playback failed:', err));
        };

        video.onended = () => {
            console.log('Intro video ended, starting game...');
            pixiContainer.current.removeChild(video);
            startGame();
        };

        video.load();
    };

    const startGame = () => {
        if (!pixiApp.current) {
            console.error('PIXI Application is not initialized');
            return;
        }

        setShowStatusBar(false);

        pixiApp.current.stage.removeChildren();

        try {
            gameCore.current = new DivineEchoGameCore(pixiApp.current);
            console.log('Game started successfully');
        } catch (error) {
            console.error('Error initializing DivineEchoGameCore:', error);
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
