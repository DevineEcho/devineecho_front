import * as PIXI from 'pixi.js';
import map1 from './images/map1.jpeg';
import map2 from './images/map2.jpeg';
import map3 from './images/map3.jpeg';
import map4 from './images/map4.jpeg';
import map5 from './images/map5.jpeg';
import AngelKnight from './images/AngelKnight.png';
import Devil from './images/Devil.png';
import Angel from './images/Angel.png';
import Boss1 from './images/Boss1.png';
import Boss2 from './images/Boss2.png';
import Boss3 from './images/Boss3.png';
import Boss4 from './images/Boss4.png';
import Angel4 from './images/Angel4.png';
import SaintAura from './images/SaintAura.png';
import GodsHammer from './images/GodsHammer.png';
import HolyCircle from './images/HolyCircle.png';
import Explosion from './images/Explosion.png';
import HolyGrail from './images/HolyGrail.png';

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

        this.enemyGrowthLevel = 0;
        this.enemySpeedBoostLevel = 0;
        this.enemySpawnBoostLevel = 0;

        this.isPaused = false;
        this.level = 1;
        this.levelExperience = [
            50, 100, 300, 500, 700, 900, 1200, 1500, 1800, 2200, 2600, 3000, 3500, 4000, 4600, 5200, 5800, 6500, 7200,
            8000,
        ];
        this.experience = 0;
        this.experiencePerKill = 10;

        this.inputEnabled = false;
        this.isBossSpawned = false;
        this.stageComplete = false;
        this.isInvincible = false;
        this.playerSpeed = 7;
        this.baseMonsterSpeed = 1;
        this.bossSpeed = 1.5;
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
        this.baseHammerDamage = 20;

        this.isHallucinating = false;
        this.isHallucinationPaused = false;
        this.hallucinationInterval = null;
        this.hallucinationTimeout = null;

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
            Angel4,
            SaintAura,
            GodsHammer,
            HolyCircle,
            Explosion,
            Angel,
            HolyGrail,
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
        this.showStageText(`STAGE ${this.stage}`, () => {
            this.createMap();
            this.createPlayer();
            this.createUI();
            this.spawnEnemies();
            this.startPlayerAttack();
            this.startTimer();
            this.startGameLoop();

            if (this.stage >= 4) {
                this.startHallucinationTimer();
            }

            this.inputEnabled = true;

            window.addEventListener('keydown', (e) => {
                if (this.inputEnabled) {
                    this.keys[e.key] = true;
                }
            });
            window.addEventListener('keyup', (e) => {
                if (this.inputEnabled) {
                    this.keys[e.key] = false;
                }
            });
        });
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
        this.player.zIndex = 10;
        this.camera.sortChildren();

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

            if (this.isAllSkillsMaxed() && this.isAllEnemySkillsMaxed()) {
                this.resumeGame();
            } else if (this.isAllSkillsMaxed()) {
                this.showEnemyLevelUpUI(true);
            } else {
                this.showLevelUpUI();
            }
        }
    }

    pauseGame() {
        if (this.isPaused) return;

        this.isPaused = true;
        this.app.ticker.stop();

        if (this.timerIntervalId) {
            clearInterval(this.timerIntervalId);
            this.timerIntervalId = null;
        }
    }

    resumeGame() {
        if (!this.isPaused) return;

        this.isPaused = false;
        this.app.ticker.start();

        if (!this.timerIntervalId) {
            this.startTimer();
        }
    }

    pauseHallucinationTimer() {
        if (this.hallucinationInterval) {
            this.isHallucinationPaused = true;
        }
    }

    resumeHallucinationTimer() {
        if (this.hallucinationInterval && this.isHallucinationPaused) {
            this.isHallucinationPaused = false;
        } else if (!this.hallucinationInterval) {
            this.startHallucinationTimer();
        }
    }

    startHallucinationTimer() {
        if (this.hallucinationInterval || this.stage < 4) {
            return;
        }

        this.hallucinationInterval = setInterval(() => {
            if (!this.isPaused && !this.isHallucinationPaused) {
                this.startHallucination();

                setTimeout(() => {
                    this.endHallucination();
                }, 3000);
            }
        }, 30000);
    }

    startHallucination() {
        this.isHallucinating = true;
        this.enemies.forEach((enemy) => {
            if (enemy) {
                enemy.texture = this.textures.Angel;
            }
        });

        if (this.boss) {
            this.boss.texture = this.textures.Angel4;
        }
    }

    endHallucination() {
        this.isHallucinating = false;

        this.enemies.forEach((enemy) => {
            if (enemy) {
                enemy.texture = this.textures.Devil;
            }
        });

        if (this.boss) {
            this.boss.texture = this.textures.Boss4;
        }
    }

    isAllSkillsMaxed() {
        return Object.values(this.skills).every((skill) => skill.level >= skill.maxLevel);
    }

    isAllEnemySkillsMaxed() {
        return this.enemyGrowthLevel >= 10 && this.enemySpeedBoostLevel >= 10 && this.enemySpawnBoostLevel >= 10;
    }

    showLevelUpUI() {
        this.pauseGame();
        this.pauseHallucinationTimer();

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
                maxed: this.skills.holyCircle.level >= this.skills.holyCircle.maxLevel,
            },
            {
                name: 'Saint Aura',
                image: this.textures.SaintAura,
                level: this.skills.saintAura.level + 1,
                description: 'A protective aura that increases damage.',
                maxed: this.skills.saintAura.level >= this.skills.saintAura.maxLevel,
            },
            {
                name: "God's Hammer",
                image: this.textures.GodsHammer,
                level: this.skills.godsHammer.level + 1,
                description: 'Drops hammers from above, dealing massive damage.',
                maxed: this.skills.godsHammer.level >= this.skills.godsHammer.maxLevel,
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

            const skillName = new PIXI.Text(
                option.maxed ? `${option.name} (Max)` : `${option.name} Lv${option.level}`,
                {
                    fontFamily: 'Arial',
                    fontSize: 20,
                    fill: 0xffffff,
                    align: 'center',
                }
            );
            skillName.anchor.set(0.5);
            skillName.x = (optionWidth - 20) / 2;
            skillName.y = 140;
            optionContainer.addChild(skillName);

            const skillDescription = new PIXI.Text(
                option.maxed ? `${option.name}은 최대 레벨에 도달하였습니다.` : option.description,
                {
                    fontFamily: 'Arial',
                    fontSize: 14,
                    fill: 0xffffff,
                    wordWrap: true,
                    wordWrapWidth: optionWidth - 40,
                    align: 'center',
                }
            );
            skillDescription.anchor.set(0.5);
            skillDescription.x = (optionWidth - 20) / 2;
            skillDescription.y = 180;
            optionContainer.addChild(skillDescription);

            if (!option.maxed) {
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

                    this.showEnemyLevelUpUI();
                });

                optionContainer.addChild(selectButton);
            }
        });

        this.app.renderer.render(this.app.stage);
    }

    showEnemyLevelUpUI(doubleUpgrade = false) {
        if (this.isAllEnemySkillsMaxed()) {
            this.resumeGame();
            this.resumeHallucinationTimer();
            return;
        }

        this.pauseGame();
        this.pauseHallucinationTimer();

        const enemyLevelUpContainer = new PIXI.Container();
        enemyLevelUpContainer.zIndex = 999;
        this.uiContainer.addChild(enemyLevelUpContainer);

        const background = new PIXI.Graphics();
        background.beginFill(0x8b0000, 0.8);
        background.drawRect(0, 0, this.app.view.width, this.app.view.height);
        background.endFill();
        enemyLevelUpContainer.addChild(background);

        const optionWidth = this.app.view.width / 3;
        const optionHeight = this.app.view.height / 2;

        let upgradeCount = 0;

        const enemyOptions = [
            {
                name: '악마는 성장중',
                level: this.enemyGrowthLevel,
                description:
                    this.enemyGrowthLevel >= 10
                        ? '이 스킬은 이미 최대 레벨입니다.'
                        : `소환되는 적(보스 제외)의 크기가 10% 상승합니다. 현재 레벨: ${this.enemyGrowthLevel}`,
                levelUpEffect: () => this.increaseEnemySize(),
            },
            {
                name: '부스터',
                level: this.enemySpeedBoostLevel,
                description:
                    this.enemySpeedBoostLevel >= 10
                        ? '이 스킬은 이미 최대 레벨입니다.'
                        : `소환되는 적(보스 제외)의 이동속도가 20% 상승합니다. 현재 레벨: ${this.enemySpeedBoostLevel}`,
                levelUpEffect: () => this.increaseEnemySpeed(),
            },
            {
                name: '악마공장 가동',
                level: this.enemySpawnBoostLevel,
                description:
                    this.enemySpawnBoostLevel >= 10
                        ? '이 스킬은 이미 최대 레벨입니다.'
                        : `적(보스 제외)의 스폰이 30% 빨라집니다. 현재 레벨: ${this.enemySpawnBoostLevel}`,
                levelUpEffect: () => this.increaseEnemySpawnRate(),
            },
        ];

        const handleUpgradeSelection = (option) => {
            option.levelUpEffect();
            upgradeCount++;

            if (doubleUpgrade && upgradeCount < 2) {
                enemyLevelUpContainer.visible = false;
                this.showEnemyLevelUpUI(false);
            } else {
                this.uiContainer.removeChild(enemyLevelUpContainer);
                this.resumeGame();
                this.resumeHallucinationTimer();
            }
        };

        enemyOptions.forEach((option, index) => {
            const xPosition = index * optionWidth;

            const optionContainer = new PIXI.Container();
            optionContainer.x = xPosition;
            optionContainer.y = this.app.view.height / 6;
            enemyLevelUpContainer.addChild(optionContainer);

            const optionBg = new PIXI.Graphics();
            optionBg.beginFill(0x550000);
            optionBg.drawRect(0, 0, optionWidth - 20, optionHeight);
            optionBg.endFill();
            optionBg.x = 10;
            optionContainer.addChild(optionBg);

            const skillName = new PIXI.Text(`${option.name} (Lv${option.level})`, {
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
                fill: 0xff0000,
                align: 'center',
            });
            selectButton.anchor.set(0.5);
            selectButton.x = (optionWidth - 20) / 2;
            selectButton.y = 240;
            selectButton.interactive = true;
            selectButton.buttonMode = true;

            selectButton.on('pointerdown', () => {
                handleUpgradeSelection(option);
            });

            optionContainer.addChild(selectButton);
        });

        this.app.renderer.render(this.app.stage);
    }

    increaseEnemySize(levelIncrement = 1) {
        this.enemyGrowthLevel += levelIncrement;

        this.enemies.forEach((enemy) => {
            if (enemy) {
                enemy.scale.set(enemy.scale.x * (1 + 0.1 * levelIncrement));
                enemy.health = Math.floor(enemy.health * 1.2);
            }
        });

        if (this.boss) {
            this.boss.health = Math.floor(this.boss.health * 1.2);
        }
    }

    increaseEnemySpeed(levelIncrement = 1) {
        this.enemySpeedBoostLevel += levelIncrement;
        this.enemies.forEach((enemy) => {
            if (enemy) {
                enemy.speed *= 1 + 0.2 * levelIncrement;
            }
        });
    }

    increaseEnemySpawnRate(levelIncrement = 1) {
        this.enemySpawnBoostLevel += levelIncrement;

        // 스폰 속도 비율 계산: 1.0에서 2.0까지 선형 증가
        const maxBoostLevel = 10;
        const spawnSpeedMultiplier = 1.0 + (this.enemySpawnBoostLevel - 1) * (1.0 / (maxBoostLevel - 1));

        // 스폰 간격 업데이트
        this.spawnEnemies(spawnSpeedMultiplier);
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

    handleEnemyDeath(enemy) {
        if (enemy && enemy.health <= 0) {
            this.camera.removeChild(enemy);
            this.enemies = this.enemies.filter((e) => e !== enemy);
            this.experience += this.experiencePerKill;
            this.checkLevelUp();
        }
    }

    updateHolyCircle() {
        if (!this.player) return;

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
            if (enemy && enemy.health > 0) {
                const dx = enemy.x - this.player.x;
                const dy = enemy.y - this.player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < minDistance) {
                    minDistance = distance;
                    target = enemy;
                }
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

    getHolyCircleDamage() {
        const baseDamage = 10;
        return baseDamage + (this.skills.holyCircle.level - 1) * 5;
    }

    updateSaintAura() {
        const level = this.skills.saintAura.level;
        if (level === 0 || this.saintAuraActive) return;

        const baseRadius = 250;
        const levelModifiers = [1, 1.2, 1.2, 1.4, 2];
        const durationOn = level >= 3 ? 3000 : 2000;
        const durationOff = level >= 3 ? 1500 : 2000;
        const radius = baseRadius * levelModifiers[Math.min(level - 1, 4)];
        const damagePerLevel = [3, 5, 7, 10, 10];
        const damage = damagePerLevel[Math.min(level - 1, 4)];
        const damageInterval = 500;

        if (!this.player) return;

        this.auraSprite = PIXI.Sprite.from(this.textures.SaintAura);
        this.auraSprite.anchor.set(0.5);
        this.auraSprite.alpha = 0.5;
        this.auraSprite.width = radius * 2;
        this.auraSprite.height = radius * 2;
        this.camera.addChild(this.auraSprite);

        this.saintAuraActive = true;

        const syncAuraToPlayer = () => {
            if (this.auraSprite && this.player) {
                this.auraSprite.x = this.player.x;
                this.auraSprite.y = this.player.y;
            } else {
                this.app.ticker.remove(syncAuraToPlayer);
            }
        };
        this.syncAuraToPlayerTicker = syncAuraToPlayer;
        this.app.ticker.add(this.syncAuraToPlayerTicker);

        this.damageIntervalId = setInterval(() => {
            if (!this.auraSprite || !this.auraSprite.visible || !this.player) {
                clearInterval(this.damageIntervalId);
                this.damageIntervalId = null;
                return;
            }

            [...this.enemies, this.boss].forEach((enemy) => {
                if (!enemy || enemy.health <= 0) return;

                const dx = enemy.x - this.player.x;
                const dy = enemy.y - this.player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                const effectiveRadius = radius * 0.8;
                if (distance <= effectiveRadius) {
                    enemy.health -= damage;

                    enemy.alpha = 0.5;
                    setTimeout(() => {
                        if (enemy.health > 0) enemy.alpha = 1;
                    }, 200);

                    if (enemy.health <= 0) {
                        this.handleEnemyDeath(enemy);
                    }
                }
            });
        }, damageInterval);

        const manageAura = () => {
            if (!this.auraSprite || !this.player) return;

            this.auraSprite.visible = true;
            setTimeout(() => {
                if (this.auraSprite) this.auraSprite.visible = false;
                if (this.saintAuraActive && this.auraSprite && this.player) {
                    setTimeout(manageAura, durationOff);
                }
            }, durationOn);
        };

        manageAura();

        setTimeout(() => {
            this.cleanupSaintAura();
        }, durationOn + durationOff);
    }

    updateGodsHammer() {
        if (!this.player) return;

        const level = this.skills.godsHammer.level;
        if (level === 0) return;

        if (this.godsHammerInterval) {
            return;
        }

        this.godsHammerInterval = true;

        let numHammers = level;
        let hammerDropDelay = 4000;
        let hammerSize = 70;
        let explosionScaleFactor = 1;

        if (level === 1) {
            hammerSize = 70;
            explosionScaleFactor = 1;
        } else if (level === 2) {
            hammerSize = 70;
            explosionScaleFactor = 1.2;
        } else if (level === 3) {
            hammerSize = 70;
            explosionScaleFactor = 1.4;
        } else if (level === 4) {
            hammerSize = 70;
            explosionScaleFactor = 1.8;
        } else if (level === 5) {
            numHammers = 2;
            hammerSize = 70 * 3;
            explosionScaleFactor = 4;
        }

        this.targetedEnemies = new Set();

        for (let i = 0; i < numHammers; i++) {
            setTimeout(() => {
                if (!this.enemies || this.enemies.length === 0) return;

                let target = null;
                let minDistance = Infinity;

                [...this.enemies, this.boss].forEach((enemy) => {
                    if (enemy && enemy.health > 0 && !this.targetedEnemies.has(enemy)) {
                        const dx = enemy.x - this.player.x;
                        const dy = enemy.y - this.player.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);

                        if (distance < minDistance) {
                            minDistance = distance;
                            target = enemy;
                        }
                    }
                });

                if (!target) return;

                this.targetedEnemies.add(target);

                const hammer = new PIXI.Sprite(this.textures.GodsHammer);
                hammer.anchor.set(0.5);
                hammer.width = hammerSize;
                hammer.height = hammerSize;
                hammer.x = target.x;
                hammer.y = target.y - 300;
                this.camera.addChild(hammer);

                const dropSpeed = 10;

                const dropTicker = () => {
                    if (hammer.y < target.y) {
                        hammer.y += dropSpeed;
                    } else {
                        this.createExplosion(target.x, target.y, explosionScaleFactor);
                        this.camera.removeChild(hammer);
                        this.dealHammerDamage(target.x, target.y, hammerSize / 2, level);
                        this.app.ticker.remove(dropTicker);
                    }
                };

                this.app.ticker.add(dropTicker);
            }, i * 100);
        }

        setTimeout(() => {
            this.godsHammerInterval = null;
            if (this.targetedEnemies) this.targetedEnemies.clear();
        }, hammerDropDelay);
    }

    createExplosion(x, y, explosionScaleFactor) {
        const explosion = new PIXI.Sprite(this.textures.Explosion);
        explosion.anchor.set(0.5);
        explosion.x = x;
        explosion.y = y;

        const explosionScale = 150 * explosionScaleFactor;
        explosion.width = explosionScale;
        explosion.height = explosionScale;

        this.camera.addChild(explosion);

        const explosionDamageInterval = setInterval(() => {
            this.dealExplosionDamage(x, y, explosionScale / 2);
        }, 100);

        setTimeout(() => {
            this.camera.removeChild(explosion);
            clearInterval(explosionDamageInterval);
        }, 500);
    }

    dealHammerDamage(x, y, radius, level) {
        const damage = this.baseHammerDamage + (level - 1) * 5;

        [...this.enemies, this.boss].forEach((enemy) => {
            if (!enemy || enemy.health <= 0) return;

            const dx = enemy.x - x;
            const dy = enemy.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= radius) {
                enemy.health -= damage;

                enemy.alpha = 0.5;
                setTimeout(() => {
                    if (enemy.health > 0) enemy.alpha = 1;
                }, 200);

                if (enemy.health <= 0) {
                    this.handleEnemyDeath(enemy);
                }
            }
        });
    }

    dealExplosionDamage(x, y, radius) {
        const explosionDamage = 10;

        [...this.enemies, this.boss].forEach((enemy) => {
            if (!enemy || enemy.health <= 0) return;

            const dx = enemy.x - x;
            const dy = enemy.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= radius) {
                enemy.health -= explosionDamage;

                enemy.alpha = 0.5;
                setTimeout(() => {
                    if (enemy.health > 0) enemy.alpha = 1;
                }, 200);

                if (enemy.health <= 0) {
                    this.handleEnemyDeath(enemy);
                }
            }
        });
    }

    startGameLoop() {
        this.app.ticker.add(() => {
            if (!this.isPaused) {
                if (this.stage >= 4 && !this.hallucinationInterval) {
                    this.startHallucinationTimer();
                }

                if (this.stage === 5 && this.timer <= 30 && !this.isHallucinating) {
                    clearInterval(this.hallucinationInterval);
                    this.hallucinationInterval = null;
                    this.startHallucination();
                }

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
        if (this.timerIntervalId) return;

        this.timerIntervalId = setInterval(() => {
            if (this.stageComplete) {
                clearInterval(this.timerIntervalId);
                this.timerIntervalId = null;
                return;
            }
            this.timer -= 1;
            this.updateUI();

            this.checkHolyGrailSpawn();

            if (this.timer === 60 && !this.isBossSpawned) {
                this.spawnBoss();
            }

            if (this.timer <= 0) {
                this.resetStage();
                clearInterval(this.timerIntervalId);
                this.timerIntervalId = null;
            }
        }, 1000);
    }

    movePlayer() {
        if (!this.inputEnabled || !this.player) return;

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

        const adjustedMapHeight = this.mapHeight - this.player.height / 2;

        this.player.x = Math.max(0, Math.min(this.mapWidth, this.player.x + dx * speed));
        this.player.y = Math.max(0, Math.min(adjustedMapHeight, this.player.y + dy * speed));
    }

    moveCamera() {
        if (!this.player) return;

        const halfWidth = this.app.view.width / 2;
        const halfHeight = this.app.view.height / 2;

        if (this.player) {
            this.camera.x = Math.min(0, Math.max(halfWidth - this.player.x, this.app.view.width - this.mapWidth));
            this.camera.y = Math.min(0, Math.max(halfHeight - this.player.y, this.app.view.height - this.mapHeight));
        }
    }

    spawnEnemies(spawnSpeedMultiplier = 1.0) {
        if (this.enemySpawnIntervalId) {
            clearInterval(this.enemySpawnIntervalId);
        }

        const baseSpawnInterval = 2000;
        const spawnInterval = baseSpawnInterval / spawnSpeedMultiplier;

        const enemiesPerSpawn = 3 + this.stage - 1;

        const spawnEnemy = () => {
            const enemyTexture = this.isHallucinating ? this.textures.Angel : this.textures.Devil;
            const enemy = new PIXI.Sprite(enemyTexture);
            enemy.anchor.set(0.5);
            enemy.scale.set(0.1 * (1 + 0.1 * this.enemyGrowthLevel));

            const baseHealth = 10 * Math.pow(1.25, this.stage - 1);
            const healthMultiplier = Math.pow(1.2, this.enemyGrowthLevel);
            enemy.health = Math.floor(baseHealth * healthMultiplier);

            enemy.damage = Math.floor(5 * Math.pow(1.25, this.stage - 1));
            enemy.speed = this.baseMonsterSpeed * (1 + 0.2 * this.enemySpeedBoostLevel);
            enemy.x = Math.random() * this.mapWidth;
            enemy.y = Math.random() * this.mapHeight;

            this.camera.addChild(enemy);
            this.enemies.push(enemy);
        };

        this.enemySpawnIntervalId = setInterval(() => {
            if (this.stageComplete) return;

            for (let i = 0; i < enemiesPerSpawn; i++) {
                spawnEnemy();
            }
        }, spawnInterval);
    }

    spawnBoss() {
        const bossImages = [this.textures.Boss1, this.textures.Boss2, this.textures.Boss3, this.textures.Boss4];
        const hallucinationBossImage = this.textures.Angel4;

        const bossTexture = this.isHallucinating ? hallucinationBossImage : bossImages[this.stage - 1];

        this.boss = new PIXI.Sprite(bossTexture);
        this.boss.anchor.set(0.5);
        this.boss.scale.set(0.3);
        this.boss.x = Math.random() * this.mapWidth;
        this.boss.y = Math.random() * this.mapHeight;

        const baseHealth = 300 * Math.pow(1.25, this.stage - 1);
        const healthMultiplier = Math.pow(1.2, this.enemyGrowthLevel);
        this.boss.health = Math.floor(baseHealth * healthMultiplier);

        this.boss.damage = 15 * Math.pow(1.25, this.stage - 1);

        this.camera.addChild(this.boss);
        this.isBossSpawned = true;

        this.app.ticker.add(() => {
            if (!this.boss || !this.player || this.stageComplete || this.boss.health <= 0) return;

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
        this.enemies = this.enemies.filter((enemy) => enemy && enemy.health > 0);

        this.enemies.forEach((enemy) => {
            if (enemy && this.player) {
                const dx = this.player.x - enemy.x;
                const dy = this.player.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                enemy.x += (dx / distance) * enemy.speed;
                enemy.y += (dy / distance) * enemy.speed;

                if (distance < 20 && !this.isInvincible) {
                    this.health -= enemy.damage;
                    this.startInvincibility();
                    if (this.health <= 0) {
                        this.gameOver();
                    }
                }
            }
        });

        if (this.boss && this.boss.health > 0 && this.player) {
            const dx = this.player.x - this.boss.x;
            const dy = this.player.y - this.boss.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 1) {
                this.boss.x += (dx / distance) * this.bossSpeed;
                this.boss.y += (dy / distance) * this.bossSpeed;
            }

            if (distance < 30 && !this.isInvincible) {
                this.health -= this.boss.damage;
                this.startInvincibility();
                if (this.health <= 0) {
                    this.gameOver();
                }
            }
        } else {
            this.boss = null;
        }
    }

    startInvincibility() {
        this.isInvincible = true;

        if (this.player) {
            const originalTint = this.player.tint;
            this.player.tint = 0xff0000;
            setTimeout(() => {
                if (this.player) {
                    this.player.tint = originalTint;
                }
            }, 200);
        }

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

            let hitEnemy = false;

            this.enemies.forEach((enemy) => {
                if (hitEnemy || !enemy || enemy.health <= 0) return;

                const dx = sprite.x - enemy.x;
                const dy = sprite.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 20) {
                    enemy.health -= this.getHolyCircleDamage();

                    if (enemy.health <= 0) {
                        this.handleEnemyDeath(enemy);
                    }

                    this.camera.removeChild(sprite);
                    hitEnemy = true;
                }
            });

            if (!hitEnemy && this.boss && this.boss.health > 0) {
                const dx = sprite.x - this.boss.x;
                const dy = sprite.y - this.boss.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 30) {
                    this.boss.health -= this.getHolyCircleDamage();

                    this.boss.alpha = 0.5;
                    setTimeout(() => {
                        if (this.boss) this.boss.alpha = 1;
                    }, 200);

                    if (this.boss.health <= 0) {
                        this.handleEnemyDeath(this.boss);
                    }

                    this.camera.removeChild(sprite);
                    return false;
                }
            }

            return !hitEnemy;
        });
    }

    checkHolyGrailSpawn() {
        if (this.timer === 80 || this.timer === 40) {
            this.spawnHolyGrail();
        }
    }

    spawnHolyGrail() {
        const holyGrail = new PIXI.Sprite(this.textures.HolyGrail);
        holyGrail.anchor.set(0.5);
        holyGrail.scale.set(0.1667);
        holyGrail.x = Math.random() * this.mapWidth;
        holyGrail.y = Math.random() * this.mapHeight;

        const aurora = new PIXI.Graphics();
        aurora.beginFill(0xffff49, 0.3);
        aurora.drawCircle(0, 0, 30);
        aurora.endFill();
        aurora.x = holyGrail.x;
        aurora.y = holyGrail.y;
        aurora.alpha = 0.5;

        let auroraScaleDirection = 1;
        this.app.ticker.add(() => {
            if (aurora.parent) {
                aurora.scale.x += 0.005 * auroraScaleDirection;
                aurora.scale.y += 0.005 * auroraScaleDirection;
                if (aurora.scale.x > 1.2 || aurora.scale.x < 0.8) {
                    auroraScaleDirection *= -1;
                }
            }
        });

        this.camera.addChild(aurora);
        this.camera.addChild(holyGrail);

        let direction = 1;
        this.app.ticker.add(() => {
            if (holyGrail.parent) {
                holyGrail.y += 0.5 * direction;
                aurora.y = holyGrail.y;
                if (holyGrail.y < holyGrail.originalY - 10 || holyGrail.y > holyGrail.originalY + 10) {
                    direction *= -1;
                }
            }
        });

        holyGrail.originalY = holyGrail.y;

        const checkCollision = () => {
            if (
                this.player &&
                holyGrail &&
                Math.abs(this.player.x - holyGrail.x) < 30 &&
                Math.abs(this.player.y - holyGrail.y) < 30
            ) {
                this.health = Math.min(this.maxHealth, this.health + 15);
                this.updateUI();
                this.camera.removeChild(holyGrail);
                this.camera.removeChild(aurora);
                this.app.ticker.remove(checkCollision);
            }
        };

        this.app.ticker.add(checkCollision);
    }

    async saveStageData(playerData) {
        const token = localStorage.getItem('token'); // 인증 토큰
        try {
            const response = await fetch('http://localhost:8080/api/players/stageClear', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(playerData),
            });

            if (response.ok) {
            } else {
            }
        } catch (error) {
            console.error('Error during stage data save:', error.message || JSON.stringify(error));
        }
    }

    resetStage() {
        const playerData = {
            level: this.level,
            exp: this.experience,
            stage: this.stage,
            playerSkills: [
                {
                    name: 'Holy Circle',
                    level: this.skills.holyCircle.level,
                },
                {
                    name: 'Saint Aura',
                    level: this.skills.saintAura.level,
                },
                {
                    name: "God's Hammer",
                    level: this.skills.godsHammer.level,
                },
            ],
            enemySkills: [
                {
                    name: 'Enemy Growth',
                    level: this.enemyGrowthLevel,
                },
                {
                    name: 'Speed Boost',
                    level: this.enemySpeedBoostLevel,
                },
                {
                    name: 'Spawn Boost',
                    level: this.enemySpawnBoostLevel,
                },
            ],
        };

        // 스테이지 데이터 저장 (this.saveStageData로 호출)
        this.saveStageData(playerData);

        this.timer = 120;
        this.stageComplete = false;
        this.isBossSpawned = false;

        this.camera.children.forEach((child) => {
            if (child.texture === this.textures.HolyGrail) {
                this.camera.removeChild(child);
            }
        });

        this.enemies.forEach((enemy) => this.camera.removeChild(enemy));
        this.enemies = [];
        if (this.boss) {
            this.camera.removeChild(this.boss);
            this.boss = null;
        }

        if (this.player) {
            this.camera.removeChild(this.player);
            this.player = null;
        }

        this.projectiles.forEach((projectile) => {
            this.camera.removeChild(projectile.sprite);
        });
        this.projectiles = [];

        this.showStageText(`STAGE ${this.stage}`, () => {
            this.createMap();
            this.createPlayer();
            this.spawnEnemies();
            this.startTimer();
            this.inputEnabled = true;
        });
    }

    cleanupSaintAura() {
        if (this.saintAuraActive) {
            this.saintAuraActive = false;

            if (this.auraSprite) {
                this.camera.removeChild(this.auraSprite);
                this.auraSprite = null;
            }

            if (this.syncAuraToPlayerTicker) {
                this.app.ticker.remove(this.syncAuraToPlayerTicker);
                this.syncAuraToPlayerTicker = null;
            }
            if (this.damageIntervalId) {
                clearInterval(this.damageIntervalId);
                this.damageIntervalId = null;
            }
        }
    }

    resetPlayerPosition() {
        if (this.player) {
            this.player.x = this.mapWidth / 2;
            this.player.y = this.mapHeight / 2 - 100;
        }
    }

    showStageText(text, callback) {
        this.inputEnabled = false;

        const stageText = new PIXI.Text(text, {
            fontFamily: 'ChosunCentennial',
            fontSize: 80,
            fill: 0xffffff,
            align: 'center',
            stroke: 0x000000,
            strokeThickness: 6,
        });
        stageText.anchor.set(0.5);
        stageText.x = this.app.view.width / 2;
        stageText.y = this.app.view.height / 2 - 100;

        this.uiContainer.addChild(stageText);

        setTimeout(() => {
            this.uiContainer.removeChild(stageText);

            this.inputEnabled = true;

            if (callback) callback();
        }, 3000);
    }

    gameOver() {
        this.stageComplete = true;

        if (this.hallucinationInterval) {
            clearInterval(this.hallucinationInterval);
            this.hallucinationInterval = null;
        }

        const gameOverText = new PIXI.Text('You died', {
            fontFamily: 'ChosunCentennial',
            fontSize: 64,
            fill: 0xff0000,
        });
        gameOverText.x = this.app.view.width / 2;
        gameOverText.y = this.app.view.height / 2;
        gameOverText.anchor.set(0.5);
        this.uiContainer.addChild(gameOverText);

        this.pauseGame();

        setTimeout(() => {
            this.resetGame();
        }, 10000);
    }

    resetGame() {
        this.uiContainer.removeChildren();
        this.camera.removeChildren();

        this.enemies = [];
        this.projectiles = [];
        this.boss = null;
        this.stage = 1;
        this.timer = 120;
        this.health = this.maxHealth;
        this.experience = 0;
        this.level = 1;

        const event = new Event('resetGameUI');
        window.dispatchEvent(event);
    }
}

export default DivineEchoGameCore;
