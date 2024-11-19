import * as PIXI from 'pixi.js';
import axios from 'axios'; // 서버 저장용

class DivineEchoGameCore {
    constructor(app) {
        this.app = app;
        this.player = null; // 플레이어
        this.enemies = []; // 적 몬스터
        this.projectiles = []; // 발사체
        this.boss = null; // 보스 몬스터
        this.stage = 1; // 현재 스테이지
        this.timer = 300; // 스테이지 제한 시간 (5분)
        this.health = 100; // 플레이어 체력
        this.isBossSpawned = false; // 보스가 스폰되었는지 여부
        this.stageComplete = false; // 스테이지 완료 여부

        this.init();
    }

    init() {
        this.createPlayer();
        this.startGameLoop();
        this.spawnEnemies();
        this.startTimer(); // 타이머 시작
    }

    createPlayer() {
        this.player = new PIXI.Graphics();
        this.player.beginFill(0x66ccff);
        this.player.drawCircle(0, 0, 20);
        this.player.endFill();
        this.player.x = this.app.view.width / 2;
        this.player.y = this.app.view.height / 2;
        this.app.stage.addChild(this.player);

        window.addEventListener('mousemove', (e) => {
            this.player.x = e.clientX;
            this.player.y = e.clientY;
        });
    }

    spawnEnemies() {
        setInterval(() => {
            if (this.stageComplete || this.isBossSpawned) return;

            const enemy = new PIXI.Graphics();
            enemy.beginFill(0xff0000);
            enemy.drawRect(0, 0, 20, 20);
            enemy.endFill();

            enemy.x = Math.random() * this.app.view.width;
            enemy.y = Math.random() * this.app.view.height;

            this.app.stage.addChild(enemy);
            this.enemies.push(enemy);
        }, 1000);
    }

    spawnBoss() {
        this.boss = new PIXI.Graphics();
        this.boss.beginFill(0x9900ff);
        this.boss.drawCircle(0, 0, 40); // 보스 크기
        this.boss.endFill();

        this.boss.x = Math.random() * this.app.view.width;
        this.boss.y = Math.random() * this.app.view.height;

        this.app.stage.addChild(this.boss);

        // 보스 이동 속도
        this.app.ticker.add(() => {
            this.boss.x += (this.player.x - this.boss.x) * 0.01; // 플레이어 추적
            this.boss.y += (this.player.y - this.boss.y) * 0.01;
        });

        this.isBossSpawned = true;
    }

    startTimer() {
        const timerText = new PIXI.Text(`Time: ${this.timer}s`, { fill: 0xffffff });
        timerText.x = 10;
        timerText.y = 10;
        this.app.stage.addChild(timerText);

        const interval = setInterval(() => {
            if (this.stageComplete) {
                clearInterval(interval);
                return;
            }

            this.timer -= 1;
            timerText.text = `Time: ${this.timer}s`;

            // 보스 스폰 조건
            if (this.timer === 60 && !this.isBossSpawned) {
                this.spawnBoss();
            }

            // 스테이지 종료 조건
            if (this.timer === 0) {
                this.endStage();
                clearInterval(interval);
            }
        }, 1000);
    }

    endStage() {
        this.stageComplete = true;

        // 서버에 데이터 저장
        axios.post('/api/player/stage-complete', {
            stage: this.stage,
            health: this.health,
            exp: this.exp,
        });

        // 다음 스테이지로 진행
        this.stage += 1;
        if (this.stage > 5) {
            alert('모든 스테이지 완료!');
        } else {
            this.resetStage();
        }
    }

    resetStage() {
        this.timer = 300; // 5분 리셋
        this.stageComplete = false;
        this.isBossSpawned = false;

        this.enemies.forEach((enemy) => this.app.stage.removeChild(enemy));
        this.enemies = [];

        if (this.boss) {
            this.app.stage.removeChild(this.boss);
            this.boss = null;
        }

        this.spawnEnemies();
        this.startTimer();
    }

    startGameLoop() {
        this.app.ticker.add(() => {
            this.update();
        });
    }

    update() {
        // 충돌 감지 및 게임 업데이트 로직
    }
}

export default DivineEchoGameCore;
