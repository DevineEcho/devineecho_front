import * as PIXI from 'pixi.js';
import map1 from './images/map1.jpeg';
import map2 from './images/map2.jpeg';
import map3 from './images/map3.jpeg';
import map4 from './images/map4.jpeg';
import map5 from './images/map5.jpeg';
import AngelKnight from './images/AngelKnight.png';
import Devil from './images/Devil.png';
import Boss1 from './images/Boss1.png';
import Boss2 from './images/Boss2.png';
import Boss3 from './images/Boss3.png';
import Boss4 from './images/Boss4.png';

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
        this.projectiles = [];
        this.boss = null;
        this.stage = 1;
        this.timer = 120;
        this.health = 100;
        this.maxHealth = 100;
        this.experience = 0;
        this.level = 1;
        this.levelExperience = [50, 100, 300, 500, 600, 700, 800, 900, 1000];
        this.isBossSpawned = false;
        this.stageComplete = false;
        this.isInvincible = false;
        this.playerSpeed = 7;
        this.baseMonsterSpeed = 1;
        this.bossSpeed = 2;
        this.mapWidth = 1920;
        this.mapHeight = 1080;
        this.keys = {};

        this.timerText = null;
        this.healthBar = null;
        this.experienceBar = null;
        this.experienceText = null;
        this.levelText = null;

        this.init();
    }

    init() {
        this.createMap();
        this.createPlayer();
        this.createUI();
        this.spawnEnemies();
        this.startPlayerAttack();
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
        this.player = PIXI.Sprite.from(AngelKnight);
        this.player.anchor.set(0.5);
        this.player.scale.set(0.2);
        this.player.x = this.mapWidth / 2;
        this.player.y = this.mapHeight / 2 - 100;
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

        this.healthText = new PIXI.Text(`HP: ${this.health}/${this.maxHealth}`, {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xffffff,
        });
        this.healthText.x = 220;
        this.healthText.y = 40;
        this.uiContainer.addChild(this.healthText);

        this.experienceBar = new PIXI.Graphics();
        this.experienceBar.x = 10;
        this.experienceBar.y = 70;
        this.uiContainer.addChild(this.experienceBar);

        this.experienceText = new PIXI.Text(`EXP: ${this.experience}/0`, {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xffffff,
        });
        this.experienceText.x = 220;
        this.experienceText.y = 70;
        this.uiContainer.addChild(this.experienceText);

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

        const currentLevelExp = this.levelExperience[this.level - 1] || 1000;
        this.experienceBar.clear();
        this.experienceBar.beginFill(0x00ff00);
        this.experienceBar.drawRect(0, 0, 200 * (this.experience / currentLevelExp), 20);
        this.experienceBar.endFill();

        this.experienceText.text = `EXP: ${this.experience}/${currentLevelExp}`;
        this.healthText.text = `HP: ${this.health}/${this.maxHealth}`;
        this.levelText.text = `Level: ${this.level}`;
    }

    startGameLoop() {
        this.app.ticker.add(() => {
            this.movePlayer();
            this.moveCamera();
            this.updateProjectiles();
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

        // 아래쪽 제한값에 캐릭터 높이만큼 추가
        const adjustedMapHeight = this.mapHeight - this.app.view.height / 2 + this.player.height / 2;

        this.player.x = Math.max(0, Math.min(this.mapWidth, this.player.x + dx * speed));
        this.player.y = Math.max(0, Math.min(adjustedMapHeight, this.player.y + dy * speed));
    }

    moveCamera() {
        const halfWidth = this.app.view.width / 2;
        const halfHeight = this.app.view.height / 2;

        this.camera.x = Math.min(0, Math.max(halfWidth - this.player.x, this.app.view.width - this.mapWidth));
        this.camera.y = Math.min(0, Math.max(halfHeight - this.player.y, this.app.view.height - this.mapHeight));
    }

    spawnEnemies() {
        if (this.enemySpawnIntervalId) {
            clearInterval(this.enemySpawnIntervalId);
        }

        const spawnInterval = 2000 / Math.pow(1.25, this.stage - 1); // 스테이지별 스폰 간격
        const enemiesPerSpawn = 3 + this.stage - 1; // 스테이지별 Devil 수 증가

        this.enemySpawnIntervalId = setInterval(() => {
            if (this.stageComplete) return; // 스테이지가 끝난 경우 스폰 중단

            for (let i = 0; i < enemiesPerSpawn; i++) {
                const enemy = PIXI.Sprite.from(Devil);
                enemy.anchor.set(0.5);
                enemy.scale.set(0.1);
                enemy.x = Math.random() * this.mapWidth;
                enemy.y = Math.random() * this.mapHeight;
                enemy.health = 10 * Math.pow(1.25, this.stage - 1);
                enemy.damage = 5 * Math.pow(1.25, this.stage - 1);

                this.camera.addChild(enemy);
                this.enemies.push(enemy);
            }
        }, spawnInterval);
    }

    spawnBoss() {
        const bossImages = [Boss1, Boss2, Boss3, Boss4];
        const bossImage = bossImages[this.stage - 1] || Boss1;

        this.boss = PIXI.Sprite.from(bossImage);
        this.boss.anchor.set(0.5);
        this.boss.scale.set(0.3);
        this.boss.x = Math.random() * this.mapWidth;
        this.boss.y = Math.random() * this.mapHeight;
        this.boss.health = 300 * Math.pow(1.25, this.stage - 1); // 보스 체력
        this.boss.damage = 15 * Math.pow(1.25, this.stage - 1); // 보스 데미지

        this.camera.addChild(this.boss);
        this.isBossSpawned = true;

        this.app.ticker.add(() => {
            if (!this.boss || this.stageComplete) return;

            const dx = this.player.x - this.boss.x;
            const dy = this.player.y - this.boss.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 1) {
                this.boss.x += (dx / distance) * this.bossSpeed;
                this.boss.y += (dy / distance) * this.bossSpeed;
            }
        });
    }

    updateEnemies() {
        this.enemies.forEach((enemy) => {
            if (enemy.health <= 0) return;

            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            enemy.x += (dx / distance) * this.baseMonsterSpeed;
            enemy.y += (dy / distance) * this.baseMonsterSpeed;

            if (distance < 20 && !this.isInvincible) {
                this.health -= enemy.damage; // Devil의 데미지 적용
                this.startInvincibility(); // 무적 상태 시작
                if (this.health <= 0) {
                    this.gameOver();
                }
            }
        });

        if (this.boss && this.boss.health > 0) {
            const dx = this.player.x - this.boss.x;
            const dy = this.player.y - this.boss.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 30 && !this.isInvincible) {
                this.health -= this.boss.damage; // 보스 데미지 적용
                this.startInvincibility(); // 무적 상태 시작
                if (this.health <= 0) {
                    this.gameOver();
                }
            }
        }
    }

    // 무적 상태 시작
    startInvincibility() {
        this.isInvincible = true; // 무적 상태 활성화
        setTimeout(() => {
            this.isInvincible = false; // 1초 후 무적 상태 해제
        }, 1000);
    }
    startPlayerAttack() {
        setInterval(() => {
            if (this.enemies.length === 0 && !this.boss) return;

            let target = null;
            let minDistance = Infinity;

            [...this.enemies, this.boss].forEach((enemy) => {
                if (!enemy || enemy.health <= 0) return;

                const dx = enemy.x - this.player.x;
                const dy = enemy.y - this.player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < minDistance) {
                    minDistance = distance;
                    target = enemy;
                }
            });

            if (!target) return;

            const dx = target.x - this.player.x;
            const dy = target.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            const projectile = new PIXI.Graphics();
            projectile.beginFill(0xffffff);
            projectile.drawCircle(0, 0, 5);
            projectile.endFill();
            projectile.x = this.player.x;
            projectile.y = this.player.y;

            this.camera.addChild(projectile);
            this.projectiles.push({
                sprite: projectile,
                speedX: (dx / distance) * 5,
                speedY: (dy / distance) * 5,
            });
        }, 500);
    }

    updateProjectiles() {
        this.projectiles = this.projectiles.filter((projectile) => {
            const { sprite, speedX, speedY } = projectile;

            sprite.x += speedX;
            sprite.y += speedY;

            if (sprite.x < 0 || sprite.x > this.mapWidth || sprite.y < 0 || sprite.y > this.mapHeight) {
                this.camera.removeChild(sprite);
                return false;
            }

            // 적과 충돌 감지
            this.enemies.forEach((enemy) => {
                const dx = sprite.x - enemy.x;
                const dy = sprite.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 20 && enemy.health > 0) {
                    enemy.health -= 10;
                    this.camera.removeChild(sprite);
                    if (enemy.health <= 0) {
                        this.camera.removeChild(enemy);
                        this.enemies = this.enemies.filter((e) => e !== enemy);
                        this.experience += 10;

                        const currentLevelExp = this.levelExperience[this.level - 1] || 1000;
                        if (this.experience >= currentLevelExp) {
                            this.level += 1;
                            this.experience -= currentLevelExp;
                        }
                    }
                    return false;
                }
            });

            // 보스와 충돌 감지
            if (this.boss && this.boss.health > 0) {
                const dx = sprite.x - this.boss.x;
                const dy = sprite.y - this.boss.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 30) {
                    this.boss.health -= 10; // 보스 체력 감소
                    this.camera.removeChild(sprite); // 발사체 제거

                    // 보스 피격 모션 (깜빡임 효과)
                    this.boss.alpha = 0.5;
                    setTimeout(() => {
                        if (this.boss) this.boss.alpha = 1;
                    }, 200);

                    if (this.boss.health <= 0) {
                        this.camera.removeChild(this.boss);
                        this.boss = null; // 보스 제거
                        this.isBossSpawned = false; // 보스 상태 초기화
                    }
                    return false;
                }
            }

            return true;
        });
    }

    resetStage() {
        this.timer = 120;
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
