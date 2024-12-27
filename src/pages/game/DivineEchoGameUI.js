import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import initialBackground from './images/initialBackground.jpeg';
import introVideo from './video/Test.mp4';
import hoverSoundFile from './sounds/ButtonSound.mp3';
import WebFont from 'webfontloader';
import DivineEchoGameCore from './DivineEchoGameCore';
import StatusBar from '../status/StatusBar';

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
    const [hoverSound, setHoverSound] = useState(null);
    const [playerData, setPlayerData] = useState(null); // 상태 추가
    const gameCore = useRef(null);

    useEffect(() => {
        const fetchPlayerData = async () => {
            const token = localStorage.getItem('token');
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
                    console.error('Failed to fetch player data');
                }
            } catch (error) {
                console.error('Error:', error.message || JSON.stringify(error));
            }
        };

        fetchPlayerData();

        const initGameAfterFonts = async () => {
            await loadFonts();
            initGame();
        };

        pixiApp.current = new PIXI.Application({
            width: 960,
            height: 640,
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

        initGameAfterFonts();

        const resetGameHandler = () => {
            pixiApp.current.stage.removeChildren();
            initGame();
        };
        window.addEventListener('resetGameUI', resetGameHandler);

        return () => {
            pixiApp.current.destroy(true, true);
            window.removeEventListener('pointerdown', initHoverSound);
            window.removeEventListener('resetGameUI', resetGameHandler);
        };
    }, []);

    const loadPlayerData = async () => {
        const token = localStorage.getItem('token');
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
                console.log('Player data loaded:', data);
                setPlayerData(data); // 상태에 저장
            } else {
                console.error('Failed to fetch player data');
            }
        } catch (error) {
            console.error('Error during load player data:', error.message || JSON.stringify(error));
        }
    };

    const initGame = () => {
        const background = PIXI.Sprite.from(initialBackground);
        background.width = pixiApp.current.screen.width;
        background.height = pixiApp.current.screen.height;
        pixiApp.current.stage.addChild(background);

        const startNewButton = createButton('처음부터하기', pixiApp.current.screen.width / 4, 220, () => {
            resetPlayerData();
            playIntroVideo();
        });

        const continueButton = createButton('이어하기', (pixiApp.current.screen.width / 4) * 3, 220, () => {
            loadPlayerData();
        });

        pixiApp.current.stage.addChild(startNewButton);
        pixiApp.current.stage.addChild(continueButton);
    };

    const createButton = (text, x, y, onClick) => {
        const button = new PIXI.Container();
        const buttonBackground = new PIXI.Graphics();

        const drawButtonBackground = (color) => {
            buttonBackground.clear();
            buttonBackground.beginFill(color);
            buttonBackground.drawRoundedRect(-100, -30, 200, 60, 10);
            buttonBackground.endFill();
        };

        drawButtonBackground(0x444444);

        const buttonText = new PIXI.Text(text, {
            fontFamily: 'Arial',
            fontSize: 32,
            fill: 0xb22222,
            align: 'center',
            fontWeight: 'bold',
        });
        buttonText.anchor.set(0.5, 0.5);

        button.addChild(buttonBackground, buttonText);
        button.x = x;
        button.y = y;
        button.eventMode = 'static';
        button.buttonMode = true;
        button.interactive = true;
        button.scale.set(1.2, 1.2);

        button.on('pointerover', () => {
            drawButtonBackground(0x666666);
            if (hoverSound) {
                hoverSound.currentTime = 0;
                hoverSound.play();
            }
        });

        button.on('pointerout', () => {
            drawButtonBackground(0x444444);
        });

        button.on('pointerdown', onClick);
        return button;
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
        const videoTexture = PIXI.Texture.from(introVideo);
        const videoSprite = new PIXI.Sprite(videoTexture);

        videoSprite.width = pixiApp.current.screen.width;
        videoSprite.height = pixiApp.current.screen.height;
        videoSprite.x = 0;
        videoSprite.y = 0;

        pixiApp.current.stage.addChild(videoSprite);

        videoTexture.baseTexture.resource.source.onended = () => {
            pixiApp.current.stage.removeChild(videoSprite);
            startGame();
        };
    };

    const startGame = (playerData = null) => {
        pixiApp.current.stage.removeChildren();
        gameCore.current = new DivineEchoGameCore(pixiApp.current);
        if (playerData) {
            console.log('Player data loaded into core:', playerData);
        }
    };

    return (
        <>
            {playerData && <StatusBar player={playerData} />}
            <div ref={pixiContainer} style={{ width: '100%', height: '100%' }} />
        </>
    );
}

export default DivineEchoGameUI;
