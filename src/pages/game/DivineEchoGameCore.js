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
import SaintAura from './images/SaintAura.png';
import GodsHammer from './images/GodsHammer.png';
import HolyCircle from './images/HolyCircle.png';
import Explosion from './images/Explosion.png';

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

        this.skills = {
            holyCircle: { level: 1, maxLevel: 5 },
            saintAura: { level: 0, maxLevel: 5 },
            godsHammer: { level: 0, maxLevel: 5 },
        };
        this.isPaused = false;
        this.level = 1;
        this.levelExperience = [50, 100, 300, 500, 600, 700, 800, 900, 1000];
        this.experience = 0;

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
        this.lastHolyCircleTime = 0;
        this.holyCircleCooldown = 1000;

        this.textures = {};

        this.preloadAssets().then(() => {
            this.init();
        });
    }

    async preloadAssets() {
        const imagePaths = {
            map1,
            map2,
            map3,
            map4,
            map5,
            AngelKnight,
            Devil,
            Boss1,
            Boss2,
            Boss3,
            Boss4,
            SaintAura,
            GodsHammer,
            HolyCircle,
            Explosion,
        };

        const loadTexture = (key, path) => {
            return new Promise((resolve) => {
                const image = new Image();
                image.src = path;
                image.onload = () => {
                    this.textures[key] = PIXI.Texture.from(image);
                    resolve();
                };
            });
        };

        const promises = Object.entries(imagePaths).map(([key, path]) => loadTexture(key, path));
        await Promise.all(promises);
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
        const mapImages = [
            this.textures.map1,
            this.textures.map2,
            this.textures.map3,
            this.textures.map4,
            this.textures.map5,
        ];
        const mapTexture = mapImages[this.stage - 1] || this.textures.map1;

        if (this.map) {
            this.camera.removeChild(this.map);
        }

        this.map = new PIXI.Sprite(mapTexture);
        this.map.width = this.mapWidth;
        this.map.height = this.mapHeight;
        this.camera.addChild(this.map);
    }

    createPlayer() {
        this.player = new PIXI.Sprite(this.textures.AngelKnight);
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

        this.experienceText.text = `EXP: ${Math.floor(this.experience)}/${currentLevelExp}`;
        this.healthText.text = `HP: ${Math.floor(this.health)}/${this.maxHealth}`;
        this.levelText.text = `Level: ${this.level}`;
    }

    checkLevelUp() {
        const currentExp = this.levelExperience[this.level - 1] || 1000;
        if (this.experience >= currentExp) {
            this.experience -= currentExp;
            this.level++;
            this.pauseGame();
            this.showLevelUpUI();
        }
    }

    pauseGame() {
        this.isPaused = true;
        this.app.ticker.stop();
    }

    resumeGame() {
        this.isPaused = false;
        this.app.ticker.start();
    }

    showLevelUpUI() {
        const levelUpContainer = new PIXI.Container();
        levelUpContainer.zIndex = 100;
        this.uiContainer.addChild(levelUpContainer);

        const background = new PIXI.Graphics();
        background.beginFill(0x000000, 0.8);
        background.drawRect(0, 0, this.app.view.width, this.app.view.height);
        background.endFill();
        levelUpContainer.addChild(background);

        const skillOptions = [
            {
                name: 'Holy Circle',
                image: this.textures.HolyCircle,
                level: this.skills.holyCircle.level + 1,
                description: 'Creates a holy circle that deals damage to enemies.',
            },
            {
                name: 'Saint Aura',
                image: this.textures.SaintAura,
                level: this.skills.saintAura.level + 1,
                description: 'A protective aura that increases damage.',
            },
            {
                name: "God's Hammer",
                image: this.textures.GodsHammer,
                level: this.skills.godsHammer.level + 1,
                description: 'Drops hammers from above, dealing massive damage.',
            },
        ];

        const optionWidth = this.app.view.width / 3;
        const optionHeight = this.app.view.height / 2;

        skillOptions.forEach((option, index) => {
            const xPosition = index * optionWidth;

            const optionContainer = new PIXI.Container();
            optionContainer.x = xPosition;
            optionContainer.y = this.app.view.height / 6;
            levelUpContainer.addChild(optionContainer);

            const optionBg = new PIXI.Graphics();
            optionBg.beginFill(0x222222);
            optionBg.drawRect(0, 0, optionWidth - 20, optionHeight);
            optionBg.endFill();
            optionBg.x = 10;
            optionContainer.addChild(optionBg);

            const skillImage = new PIXI.Sprite(option.image);
            skillImage.anchor.set(0.5);
            skillImage.x = (optionWidth - 20) / 2;
            skillImage.y = 60;
            skillImage.scale.set(0.25);
            optionContainer.addChild(skillImage);

            const skillName = new PIXI.Text(`${option.name} Lv${option.level}`, {
                fontFamily: 'Arial',
                fontSize: 20,
                fill: 0xffffff,
                align: 'center',
            });
            skillName.anchor.set(0.5);
            skillName.x = (optionWidth - 20) / 2;
            skillName.y = 140;
            optionContainer.addChild(skillName);

            const skillDescription = new PIXI.Text(option.description, {
                fontFamily: 'Arial',
                fontSize: 14,
                fill: 0xffffff,
                wordWrap: true,
                wordWrapWidth: optionWidth - 40,
                align: 'center',
            });
            skillDescription.anchor.set(0.5);
            skillDescription.x = (optionWidth - 20) / 2;
            skillDescription.y = 180;
            optionContainer.addChild(skillDescription);

            const selectButton = new PIXI.Text('Select', {
                fontFamily: 'Arial',
                fontSize: 18,
                fill: 0x00ff00,
                align: 'center',
            });
            selectButton.anchor.set(0.5);
            selectButton.x = (optionWidth - 20) / 2;
            selectButton.y = 240;
            selectButton.interactive = true;
            selectButton.buttonMode = true;
            selectButton.on('pointerdown', () => {
                this.upgradeSkill(index);
                this.uiContainer.removeChild(levelUpContainer);
                this.resumeGame();
            });
            optionContainer.addChild(selectButton);
        });
    }

    upgradeSkill(index) {
        const skillKeys = ['holyCircle', 'saintAura', 'godsHammer'];
        const skill = this.skills[skillKeys[index]];
        if (skill.level < skill.maxLevel) {
            skill.level++;
        }
    }

    updateSkills() {
        if (this.skills.holyCircle.level > 0) this.updateHolyCircle();
        if (this.skills.saintAura.level > 0) this.updateSaintAura();
        if (this.skills.godsHammer.level > 0) this.updateGodsHammer();
    }

    updateHolyCircle() {
        const currentTime = Date.now();
        if (currentTime - this.lastHolyCircleTime < this.holyCircleCooldown) {
            return;
        }
        this.lastHolyCircleTime = currentTime;

        const level = this.skills.holyCircle.level;
        if (level === 0) return;

        const orbsPerLevel = [1, 2, 3, 4, 5];
        const numOrbs = orbsPerLevel[Math.min(level - 1, 4)];
        const spreadAngle = Math.PI / 12;

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
        const targetAngle = Math.atan2(dy, dx);

        const targetOrbIndex = Math.floor(numOrbs / 2);

        for (let i = 0; i < numOrbs; i++) {
            const angleOffset = (i - targetOrbIndex) * spreadAngle;
            const angle = targetAngle + angleOffset;

            const speed = 5;
            const projectile = new PIXI.Graphics();
            projectile.beginFill(0xffffff);
            projectile.drawCircle(0, 0, 5);
            projectile.endFill();
            projectile.x = this.player.x;
            projectile.y = this.player.y;

            this.camera.addChild(projectile);
            this.projectiles.push({
                sprite: projectile,
                speedX: speed * Math.cos(angle),
                speedY: speed * Math.sin(angle),
            });
        }
    }

    updateSaintAura() {
        const level = this.skills.saintAura.level;
        if (level === 0 || this.saintAuraActive) return;

        const baseRadius = 250;
        const levelModifiers = [1, 1.2, 1.2, 1.4, 2];
        const durationOn = level >= 3 ? 3000 : 2000;
        const durationOff = level >= 3 ? 1500 : 2000;
        const radius = baseRadius * levelModifiers[Math.min(level - 1, 4)];
        const damage = 10;
        const damageInterval = 500;

        const auraSprite = PIXI.Sprite.from(SaintAura);
        auraSprite.anchor.set(0.5);
        auraSprite.alpha = 0.5; //투명도
        auraSprite.width = radius * 2;
        auraSprite.height = radius * 2;
        this.camera.addChild(auraSprite);

        this.saintAuraActive = true;

        const syncAuraToPlayer = () => {
            if (auraSprite && this.player) {
                auraSprite.x = this.player.x;
                auraSprite.y = this.player.y;
            }
        };
        this.app.ticker.add(syncAuraToPlayer);

        const damageIntervalId = setInterval(() => {
            if (!auraSprite.visible) return;

            [...this.enemies, this.boss].forEach((enemy) => {
                if (!enemy || enemy.health <= 0) return;

                const dx = enemy.x - this.player.x;
                const dy = enemy.y - this.player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                const effectiveRadius = radius * 0.8;
                if (distance <= effectiveRadius) {
                    enemy.health -= damage;
                    if (enemy.health <= 0) {
                        this.camera.removeChild(enemy);
                        this.enemies = this.enemies.filter((e) => e !== enemy);
                    }
                }
            });
        }, damageInterval);

        const manageAura = () => {
            auraSprite.visible = true;
            setTimeout(() => {
                auraSprite.visible = false;
                if (this.saintAuraActive) {
                    setTimeout(manageAura, durationOff);
                }
            }, durationOn);
        };

        manageAura();

        setTimeout(() => {
            this.camera.removeChild(auraSprite);
            clearInterval(damageIntervalId);
            this.app.ticker.remove(syncAuraToPlayer);
            this.saintAuraActive = false;
        }, durationOn + durationOff);
    }

    updateGodsHammer() {
        const level = this.skills.godsHammer.level;
        if (level === 0) return;

        const hammersPerLevel = [1, 2, 3, 3, 2];
        const dropDelays = [2000, 2000, 2000, 1000, 1000];
        const hammerSizes = [70, 70, 70, 70, 120];

        if (!this.godsHammerInterval) {
            this.godsHammerInterval = setInterval(() => {
                const numHammers = hammersPerLevel[Math.min(level - 1, 4)];
                for (let i = 0; i < numHammers; i++) {
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

                    const hammer = new PIXI.Sprite(this.textures.GodsHammer);
                    hammer.anchor.set(0.5);
                    const size = hammerSizes[Math.min(level - 1, 4)];
                    hammer.width = size;
                    hammer.height = size;
                    hammer.x = target.x;
                    hammer.y = target.y - 300;
                    this.camera.addChild(hammer);

                    const dropSpeed = 10;

                    const dropTicker = () => {
                        if (hammer.y < target.y) {
                            hammer.y += dropSpeed;
                        } else {
                            this.createExplosion(target.x, target.y);
                            this.camera.removeChild(hammer);
                            this.dealHammerDamage(target.x, target.y, size / 2);
                            this.app.ticker.remove(dropTicker);
                        }
                    };

                    hammer.dropTicker = dropTicker;
                    this.app.ticker.add(dropTicker);
                }
            }, dropDelays[Math.min(level - 1, 4)]);
        }
    }

    createExplosion(x, y) {
        const explosion = new PIXI.Sprite(this.textures.Explosion);
        explosion.anchor.set(0.5);
        explosion.x = x;
        explosion.y = y;
        explosion.width = 150;
        explosion.height = 150;
        this.camera.addChild(explosion);

        setTimeout(() => {
            this.camera.removeChild(explosion);
        }, 500);
    }

    dealHammerDamage(x, y, radius) {
        const damage = 30;

        [...this.enemies, this.boss].forEach((enemy) => {
            if (!enemy || enemy.health <= 0) return;

            const dx = enemy.x - x;
            const dy = enemy.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= radius) {
                enemy.health -= damage;
                if (enemy.health <= 0) {
                    this.camera.removeChild(enemy);
                    this.enemies = this.enemies.filter((e) => e !== enemy);
                }
            }
        });
    }

    startGameLoop() {
        this.app.ticker.add(() => {
            if (!this.isPaused) {
                this.movePlayer();
                this.moveCamera();
                this.updateProjectiles();
                this.updateEnemies();
                this.updateUI();
                this.checkLevelUp();
                this.updateSkills();
            }
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

        const spawnInterval = 2000 / Math.pow(1.25, this.stage - 1);
        const enemiesPerSpawn = 3 + this.stage - 1;

        this.enemySpawnIntervalId = setInterval(() => {
            if (this.stageComplete) return;

            for (let i = 0; i < enemiesPerSpawn; i++) {
                const enemy = PIXI.Sprite.from(Devil);
                enemy.anchor.set(0.5);
                enemy.scale.set(0.1);
                enemy.x = Math.random() * this.mapWidth;
                enemy.y = Math.random() * this.mapHeight;
                enemy.health = Math.floor(10 * Math.pow(1.25, this.stage - 1));
                enemy.damage = Math.floor(5 * Math.pow(1.25, this.stage - 1));

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
        this.boss.health = 300 * Math.pow(1.25, this.stage - 1);
        this.boss.damage = 15 * Math.pow(1.25, this.stage - 1);

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
                this.health -= enemy.damage;
                this.startInvincibility();
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
                this.health -= this.boss.damage;
                this.startInvincibility();
                if (this.health <= 0) {
                    this.gameOver();
                }
            }
        }
    }

    startInvincibility() {
        this.isInvincible = true;
        setTimeout(() => {
            this.isInvincible = false;
        }, 1000);
    }

    startPlayerAttack() {
        if (this.holyCircleInterval) {
            clearInterval(this.holyCircleInterval);
        }

        this.holyCircleInterval = setInterval(() => {
            if (this.skills.holyCircle.level > 0) {
                this.updateHolyCircle();
            }
        }, this.holyCircleCooldown);
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
                        this.checkLevelUp();
                    }
                    return false;
                }
            });

            if (this.boss && this.boss.health > 0) {
                const dx = sprite.x - this.boss.x;
                const dy = sprite.y - this.boss.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 30) {
                    this.boss.health -= 10;
                    this.camera.removeChild(sprite);

                    this.boss.alpha = 0.5;
                    setTimeout(() => {
                        if (this.boss) this.boss.alpha = 1;
                    }, 200);

                    if (this.boss.health <= 0) {
                        this.camera.removeChild(this.boss);
                        this.boss = null;
                        this.isBossSpawned = false;
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
        if (this.player) this.camera.removeChild(this.player);
        this.createPlayer();
        this.createMap();

        this.spawnEnemies();
        this.startTimer();
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
