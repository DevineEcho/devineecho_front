import * as PIXI from 'pixi.js';
import map1 from './images/map1.jpeg';
import map2 from './images/map2.jpeg';
import map3 from './images/map3.jpeg';
import map4 from './images/map4.jpeg';
import map5 from './images/map5.jpeg';

class DivineEchoGameCore {
    constructor(app) {
        this.app = app;
        this.camera = new PIXI.Container();
        this.uiContainer = new PIXI.Container();
        this.app.stage.addChild(this.camera);
        this.app.stage.addChild(this.uiContainer);

        this.map = null;
        this.player = null;
        this.enemies = [];
        this.boss = null;
        this.stage = 1;
        this.timer = 300;
        this.health = 100;
        this.maxHealth = 100;
        this.experience = 0;
        this.experienceForNextLevel = 5;
        this.level = 1;
        this.isBossSpawned = false;
        this.stageComplete = false;
        this.playerSpeed = 7;
        this.baseMonsterSpeed = 1;
        this.bossSpeed = 2; // 보스 이동 속도
        this.mapWidth = 1920;
        this.mapHeight = 1080;
        this.keys = {};

        this.timerText = null;
        this.healthBar = null;
        this.experienceBar = null;
        this.levelText = null;

        this.init();
    }

    init() {
        this.createMap();
        this.createPlayer();
        this.createUI();
        this.spawnEnemies(); // 적 생성 시작
        this.startTimer();
        this.startGameLoop();

        window.addEventListener('keydown', (e) => (this.keys[e.key] = true));
        window.addEventListener('keyup', (e) => (this.keys[e.key] = false));
    }

    createMap() {
        const mapImages = [map1, map2, map3, map4, map5];
        const mapImage = mapImages[this.stage - 1] || map1;

        if (this.map) {
            this.camera.removeChild(this.map);
        }

        this.map = PIXI.Sprite.from(mapImage);
        this.map.width = this.mapWidth;
        this.map.height = this.mapHeight;
        this.camera.addChild(this.map);
    }

    createPlayer() {
        this.player = new PIXI.Graphics();
        this.player.beginFill(0x66ccff);
        this.player.drawCircle(0, 0, 20);
        this.player.endFill();
        this.player.x = this.mapWidth / 2;
        this.player.y = this.mapHeight / 2;
        this.camera.addChild(this.player);
    }

    createUI() {
        this.timerText = new PIXI.Text(`Time: ${this.timer}s`, {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xffffff,
        });
        this.timerText.x = 10;
        this.timerText.y = 10;
        this.uiContainer.addChild(this.timerText);

        this.healthBar = new PIXI.Graphics();
        this.healthBar.x = 10;
        this.healthBar.y = 40;
        this.uiContainer.addChild(this.healthBar);

        this.experienceBar = new PIXI.Graphics();
        this.experienceBar.x = 10;
        this.experienceBar.y = 70;
        this.uiContainer.addChild(this.experienceBar);

        this.levelText = new PIXI.Text(`Level: ${this.level}`, {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xffffff,
        });
        this.levelText.x = 10;
        this.levelText.y = 100;
        this.uiContainer.addChild(this.levelText);

        this.updateUI();
    }

    updateUI() {
        this.timerText.text = `Time: ${this.timer}s`;

        this.healthBar.clear();
        this.healthBar.beginFill(0xff0000);
        this.healthBar.drawRect(0, 0, 200 * (this.health / this.maxHealth), 20);
        this.healthBar.endFill();

        this.experienceBar.clear();
        this.experienceBar.beginFill(0x00ff00);
        this.experienceBar.drawRect(0, 0, 200 * (this.experience / this.experienceForNextLevel), 20);
        this.experienceBar.endFill();

        this.levelText.text = `Level: ${this.level}`;
    }

    startGameLoop() {
        this.app.ticker.add(() => {
            this.movePlayer();
            this.moveCamera();
            this.updateEnemies();
            this.updateUI();
        });
    }

    startTimer() {
        const interval = setInterval(() => {
            if (this.stageComplete) {
                clearInterval(interval);
                return;
            }
            this.timer -= 1;
            this.updateUI();

            if (this.timer === 60 && !this.isBossSpawned) {
                this.spawnBoss();
            }

            if (this.timer <= 0) {
                this.resetStage();
                clearInterval(interval);
            }
        }, 1000);
    }

    movePlayer() {
        let dx = 0;
        let dy = 0;

        if (this.keys['ArrowUp']) dy -= 1;
        if (this.keys['ArrowDown']) dy += 1;
        if (this.keys['ArrowLeft']) dx -= 1;
        if (this.keys['ArrowRight']) dx += 1;

        if (dx !== 0 && dy !== 0) {
            dx *= Math.SQRT1_2;
            dy *= Math.SQRT1_2;
        }

        const speed = this.playerSpeed;
        this.player.x = Math.max(0, Math.min(this.mapWidth, this.player.x + dx * speed));
        this.player.y = Math.max(0, Math.min(this.mapHeight, this.player.y + dy * speed));
    }

    moveCamera() {
        const halfWidth = this.app.view.width / 2;
        const halfHeight = this.app.view.height / 2;

        this.camera.x = Math.min(0, Math.max(halfWidth - this.player.x, this.app.view.width - this.mapWidth));
        this.camera.y = Math.min(0, Math.max(halfHeight - this.player.y, this.app.view.height - this.mapHeight));
    }

    spawnEnemies() {
        setInterval(() => {
            if (this.stageComplete || this.isBossSpawned) return;

            const enemy = new PIXI.Graphics();
            enemy.beginFill(0xff0000);
            enemy.drawRect(0, 0, 20, 20);
            enemy.endFill();

            enemy.x = Math.random() * this.mapWidth;
            enemy.y = Math.random() * this.mapHeight;

            this.camera.addChild(enemy);
            this.enemies.push(enemy);
        }, 2000);
    }

    spawnBoss() {
        this.boss = new PIXI.Graphics();
        this.boss.beginFill(0x9900ff);
        this.boss.drawCircle(0, 0, 40);
        this.boss.endFill();

        this.boss.x = Math.random() * this.mapWidth;
        this.boss.y = Math.random() * this.mapHeight;

        this.camera.addChild(this.boss);

        this.app.ticker.add(() => {
            if (this.boss) {
                const dx = this.player.x - this.boss.x;
                const dy = this.player.y - this.boss.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                this.boss.x += (dx / distance) * this.bossSpeed;
                this.boss.y += (dy / distance) * this.bossSpeed;
            }
        });

        this.isBossSpawned = true;
    }

    updateEnemies() {
        this.enemies.forEach((enemy) => {
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            enemy.x += (dx / distance) * this.baseMonsterSpeed;
            enemy.y += (dy / distance) * this.baseMonsterSpeed;

            if (distance < 20) {
                this.health -= 1;
                if (this.health <= 0) {
                    this.gameOver();
                }
            }
        });
    }

    resetStage() {
        this.timer = 300;
        this.stageComplete = false;
        this.isBossSpawned = false;

        this.enemies.forEach((enemy) => this.camera.removeChild(enemy));
        this.enemies = [];

        if (this.boss) {
            this.camera.removeChild(this.boss);
            this.boss = null;
        }

        this.stage += 1;
        this.createMap();
        this.spawnEnemies();
    }

    gameOver() {
        this.stageComplete = true;
        const gameOverText = new PIXI.Text('사망', {
            fontFamily: 'Arial',
            fontSize: 64,
            fill: 0xff0000,
        });
        gameOverText.x = this.app.view.width / 2;
        gameOverText.y = this.app.view.height / 2;
        gameOverText.anchor.set(0.5);
        this.uiContainer.addChild(gameOverText);
    }
}

export default DivineEchoGameCore;
