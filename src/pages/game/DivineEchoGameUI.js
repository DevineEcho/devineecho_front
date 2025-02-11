import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import initialBackground from './images/initialBackground.jpeg';
import introVideo from './video/Test.mp4';
import buttonClickSoundFile from './sounds/ButtonClickSound.mp3';
import DivineEchoGameCore from './DivineEchoGameCore';
import StatusBar from '../status/StatusBar';
import Login from '../login/Login';
import Store from '../store/Store';
import Inventory from '../inventory/Inventory';
import './DivineEchoGameUI.css';

function DivineEchoGameUI({ onOpenStore }) {
    const pixiContainer = useRef(null);
    const pixiApp = useRef(null);
    const gameCore = useRef(null);

    const [hoverSound, setHoverSound] = useState(null);
    const [playerData, setPlayerData] = useState(null);
    const [showStatusBar, setShowStatusBar] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const [isStoreOpen, setIsStoreOpen] = useState(false);
    const [isInventoryOpen, setIsInventoryOpen] = useState(false);

    useEffect(() => {
        const sound = new Audio(buttonClickSoundFile);
        setHoverSound(sound);
    }, []);

    const resetPlayerData = useCallback(async () => {
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
    }, []);

    const fetchEquippedSkills = useCallback(async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://localhost:8080/api/skills/equipped-skills', {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                let equippedSkills = await response.json();

                if (!equippedSkills.some((skill) => skill.name === 'Holy Circle')) {
                    console.warn('Holy Circle not found in equipped skills. Adding manually.');
                    equippedSkills.unshift({ id: 'holy-circle', name: 'Holy Circle' });
                }

                return equippedSkills;
            } else {
                console.error('Failed to fetch equipped skills');
            }
        } catch (error) {
            console.error('Error fetching equipped skills:', error);
        }
        return [{ id: 'holy-circle', name: 'Holy Circle' }];
    }, []);

    const startGame = useCallback(async () => {
        if (!pixiApp.current) {
            console.error('PIXI Application is not initialized');
            return;
        }

        setShowStatusBar(false);
        pixiApp.current.stage.removeChildren();

        try {
            let equippedSkills = await fetchEquippedSkills();

            if (!equippedSkills.some((skill) => skill.name === 'Holy Circle')) {
                equippedSkills.unshift({ id: 'holy-circle', name: 'Holy Circle' });
            }

            gameCore.current = new DivineEchoGameCore(pixiApp.current, equippedSkills);
            console.log('Game started with equipped skills:', equippedSkills);
        } catch (error) {
            console.error('Error initializing DivineEchoGameCore:', error);
        }
    }, [fetchEquippedSkills]);

    const playIntroVideo = useCallback(async () => {
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
            console.log('Intro video ended, starting game with default skills...');
            pixiContainer.current.removeChild(video);
            startGame(false);
        };

        video.load();
    }, [resetPlayerData, startGame]);

    const fetchPlayerData = useCallback(async () => {
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
    }, []);

    useEffect(() => {
        if (isLoggedIn) {
            fetchPlayerData();
        }
    }, [isLoggedIn, fetchPlayerData]);

    const handleOpenStore = useCallback(() => {
        setIsStoreOpen(true);
        if (pixiContainer.current) {
            pixiContainer.current.style.display = 'none';
        }
    }, []);

    const handleOpenInventory = useCallback(() => {
        setIsInventoryOpen(true);
        if (pixiContainer.current) {
            pixiContainer.current.style.display = 'none';
        }
    }, []);

    const addPixiButtons = useCallback(() => {
        const buttons = [
            { label: '처음부터하기', x: 200, y: 140, onClick: playIntroVideo },
            { label: '이어하기', x: 450, y: 140, onClick: () => startGame(true) },
            { label: '상점', x: 200, y: 280, onClick: handleOpenStore },
            { label: '인벤토리', x: 450, y: 280, onClick: handleOpenInventory },
            { label: '랭킹', x: 450, y: 400, onClick: () => alert('랭킹으로 이동') },
        ];

        buttons.forEach((button) => {
            const buttonContainer = new PIXI.Container();
            const buttonBackground = new PIXI.Graphics();

            const defaultColor = 0x444444;
            const hoverColor = 0x666666;
            const clickColor = 0x999999;

            buttonBackground.beginFill(defaultColor);
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

            buttonContainer.on('pointerover', () => {
                buttonBackground.clear();
                buttonBackground.beginFill(hoverColor);
                buttonBackground.drawRoundedRect(0, 0, 200, 60, 10);
                buttonBackground.endFill();
            });

            buttonContainer.on('pointerout', () => {
                buttonBackground.clear();
                buttonBackground.beginFill(defaultColor);
                buttonBackground.drawRoundedRect(0, 0, 200, 60, 10);
                buttonBackground.endFill();
            });

            buttonContainer.on('pointerdown', () => {
                buttonBackground.clear();
                buttonBackground.beginFill(clickColor);
                buttonBackground.drawRoundedRect(0, 0, 200, 60, 10);
                buttonBackground.endFill();

                if (hoverSound) {
                    hoverSound.currentTime = 0;
                    hoverSound.play().catch((error) => {
                        console.error('Failed to play click sound:', error);
                    });
                }

                button.onClick();
            });

            pixiApp.current.stage.addChild(buttonContainer);
        });
    }, [hoverSound, playIntroVideo, startGame, handleOpenStore, handleOpenInventory]);

    const initPixiApp = useCallback(() => {
        if (!pixiApp.current) {
            pixiApp.current = new PIXI.Application({
                width: 880,
                height: 528,
                backgroundColor: 0x000000,
            });
            pixiContainer.current.appendChild(pixiApp.current.view);
        }

        pixiApp.current.stage.removeChildren();

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

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
    };

    return isLoggedIn ? (
        <div className="game-container">
            {showStatusBar && playerData && <StatusBar player={playerData} onLogout={handleLogout} />}
            <div
                style={{ display: isStoreOpen || isInventoryOpen ? 'none' : 'block' }}
                className="pixi-container"
                ref={pixiContainer}
            />
            {isStoreOpen && (
                <Store
                    onBack={() => setIsStoreOpen(false)}
                    playerData={playerData}
                    onLogout={handleLogout}
                    pixiContainer={pixiContainer}
                    updatePlayerData={fetchPlayerData}
                />
            )}
            {isInventoryOpen && (
                <Inventory
                    onBack={() => setIsInventoryOpen(false)}
                    fetchPlayerItems={() => fetchPlayerData().then((data) => data.ownedItems)}
                    fetchPlayerSkills={() => fetchPlayerData().then((data) => data.ownedSkills)}
                />
            )}
        </div>
    ) : (
        <Login onLoginSuccess={() => setIsLoggedIn(true)} />
    );
}

export default DivineEchoGameUI;
