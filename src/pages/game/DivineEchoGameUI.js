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
                throw new Error('플레이어 데이터 초기화 실패');
            }
            console.log('플레이어 데이터 초기화');
        } catch (error) {
            console.error('플레이어 데이터 초기화 실패', error.message || JSON.stringify(error));
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
    
                const holyCircleExists = equippedSkills.some(
                    (skill) => skill.name.toLowerCase() === 'holycircle'
                );
    
                if (!holyCircleExists) {
                    console.error('백엔드에서 홀리서클 전달 되지 않음');
                }
    
                return equippedSkills;
            } else {
                console.error('장착스킬 불러오기 실패');
            }
        } catch (error) {
            console.error('장착스킬 불러오기 실패', error);
        }
    
        return [];
    }, []);
    
    
    
    const startGame = useCallback(async (continueFromSave = false) => {
        if (!pixiApp.current) {
            console.error('픽시 실행 오류');
            return;
        }
    
        setShowStatusBar(false);
        pixiApp.current.stage.removeChildren();
    
        try {
            let equippedSkills = await fetchEquippedSkills();
    
            gameCore.current = new DivineEchoGameCore(pixiApp.current);
    
            if (continueFromSave) {
                await gameCore.current.loadStageData();
            }
    
            console.log('장착 스킬:', equippedSkills);
        } catch (error) {
            console.error('코어 실행 오류', error);
        }
    }, [fetchEquippedSkills]);
    
    

    const playIntroVideo = useCallback(async () => {
        setShowStatusBar(false);

        try {
            await resetPlayerData();
        } catch (error) {
            console.error('플레이어 데이터 리셋 오류', error);
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
            video.play().catch((err) => console.error('비디오 재생 실패', err));
        };

        video.onended = () => {
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
            } else {
                console.error('플레이어 데이터 불러오기 실패');
            }
        } catch (error) {
            console.error('플레이어 데이터 불러오기 실패', error.message || JSON.stringify(error));
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
            { label: '처음부터하기', x: 200, y: 100, onClick: () => startGame(false) },
            { label: '이어하기', x: 450, y: 100, onClick: () => startGame(true) },
            { label: '상점', x: 200, y: 220, onClick: handleOpenStore },
            { label: '인벤토리', x: 450, y: 220, onClick: handleOpenInventory },
            { label: '랭킹', x: 200, y: 340, onClick: () => alert('랭킹으로 이동') },
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
                        console.error('소리 재생 실패', error);
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
                console.log("🔻 Pixi 앱 제거");
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
