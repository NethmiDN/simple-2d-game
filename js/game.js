const Game = {
    canvas: null,
    ctx: null,
    player: null,
    bullets: [],
    enemies: [],
    explosions: [],
    currentLevel: 1,
    score: 0,
    lives: 3,
    enemiesRemaining: 0,
    isGameOver: false,
    isLevelComplete: false,
    keys: {},
    lastShot: 0,
    shotDelay: 300, 
    
    init: function() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        document.getElementById('start-btn').addEventListener('click', () => {
            document.getElementById('start-screen').style.display = 'none';
            this.startLevel(1);
        });
        
        document.getElementById('next-level-btn').addEventListener('click', () => {
            document.getElementById('level-complete').style.display = 'none';
            this.startLevel(this.currentLevel + 1);
        });
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            document.getElementById('game-over').style.display = 'none';
            this.resetGame();
            this.startLevel(1);
        });
        
        document.getElementById('start-screen').style.display = 'flex';
    },
    
    startLevel: function(level) {
        this.currentLevel = level;
        this.isGameOver = false;
        this.isLevelComplete = false;
        this.bullets = [];
        this.enemies = [];
        this.explosions = [];
        
        document.getElementById('level-display').textContent = level;
        document.getElementById('score-display').textContent = this.score;
        document.getElementById('lives-display').textContent = this.lives;
        
        this.player = new Player(this.canvas.width / 2, this.canvas.height - 50, 30, 30);
        
        this.createEnemies(level);
        
        this.gameLoop();
    },
    
    createEnemies: function(level) {
        const enemyRows = Math.min(3 + level, 6); 
        const enemyCols = Math.min(3 + level, 8);
        const enemySpacing = 60;
        const startX = 100;
        const startY = 50;
        
        for (let row = 0; row < enemyRows; row++) {
            for (let col = 0; col < enemyCols; col++) {
                const x = startX + col * enemySpacing;
                const y = startY + row * enemySpacing;
                const speed = 0.5 + (level * 0.2); 
                
                this.enemies.push(new Enemy(x, y, 30, 30, speed));
            }
        }
        
        this.enemiesRemaining = this.enemies.length;
        document.getElementById('enemies-display').textContent = this.enemiesRemaining;
    },
    
    gameLoop: function() {
        if (this.isGameOver || this.isLevelComplete) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawBackground();
        
        this.update();
        
        this.draw();
        
        this.checkGameState();
        
        requestAnimationFrame(() => this.gameLoop());
    },
    
    drawBackground: function() {
        this.ctx.fillStyle = '#000033';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = 'white';
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * this.canvas.width;
            const y = (Math.random() * this.canvas.height + (Date.now() * 0.05)) % this.canvas.height;
            const size = Math.random() * 2;
            this.ctx.fillRect(x, y, size, size);
        }
    },
    
    update: function() {
        this.player.update(this);
        
        if ((this.keys[' '] || this.keys['Spacebar']) && Date.now() - this.lastShot > this.shotDelay) {
            this.bullets.push(new Bullet(
                this.player.x + this.player.width / 2 - 2.5,
                this.player.y,
                5,
                15,
                10
            ));
            this.lastShot = Date.now();
        }
        
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].update();
            
            if (this.bullets[i].y < 0) {
                this.bullets.splice(i, 1);
            }
        }
        
        let edgeReached = false;
        this.enemies.forEach(enemy => {
            enemy.update(this);
            
            if (enemy.x <= 0 || enemy.x + enemy.width >= this.canvas.width) {
                edgeReached = true;
            }
            
            if (enemy.y + enemy.height >= this.canvas.height - 50) {
                this.lives = 0;
                this.isGameOver = true;
            }
        });
        
        if (edgeReached) {
            this.enemies.forEach(enemy => {
                enemy.speed *= -1;
                enemy.y += 20; 
            });
        }
        
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            this.explosions[i].update();
            if (this.explosions[i].alpha <= 0) {
                this.explosions.splice(i, 1);
            }
        }
        
        this.checkCollisions();
    },
    
    draw: function() {
        this.player.draw(this.ctx);
        
        this.bullets.forEach(bullet => {
            bullet.draw(this.ctx);
        });
        
        this.enemies.forEach(enemy => {
            enemy.draw(this.ctx);
        });
        
        this.explosions.forEach(explosion => {
            explosion.draw(this.ctx);
        });
    },
    
    checkCollisions: function() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                if (this.bullets[i].isColliding(this.enemies[j])) {

                    this.explosions.push(new Explosion(
                        this.enemies[j].x + this.enemies[j].width / 2,
                        this.enemies[j].y + this.enemies[j].height / 2
                    ));
                    
                    this.bullets.splice(i, 1);
                    this.enemies.splice(j, 1);
                    
                    this.score += 100;
                    this.enemiesRemaining--;
                    document.getElementById('score-display').textContent = this.score;
                    document.getElementById('enemies-display').textContent = this.enemiesRemaining;
                    
                    break;
                }
            }
        }
        
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            if (this.player.isColliding(this.enemies[i])) {

                this.explosions.push(new Explosion(
                    this.enemies[i].x + this.enemies[i].width / 2,
                    this.enemies[i].y + this.enemies[i].height / 2
                ));
                
                this.enemies.splice(i, 1);
                
                this.lives--;
                document.getElementById('lives-display').textContent = this.lives;
                
                if (this.lives <= 0) {
                    this.isGameOver = true;
                }
                
                this.enemiesRemaining--;
                document.getElementById('enemies-display').textContent = this.enemiesRemaining;
            }
        }
    },
    
    checkGameState: function() {
        if (this.isGameOver) {
            document.getElementById('final-score').textContent = this.score;
            document.getElementById('game-over').style.display = 'flex';
        } else if (this.enemiesRemaining <= 0) {
            if (this.currentLevel === 4) {

                document.getElementById('level-complete').style.display = 'flex';
                document.getElementById('level-complete').innerHTML = `
                    <h2>Congratulations!</h2>
                    <p>You completed all levels!</p>
                    <p>Final Score: <span id="level-score">${this.score}</span></p>
                    <button id="restart-btn">Play Again</button>
                `;
                document.getElementById('restart-btn').addEventListener('click', () => {
                    document.getElementById('level-complete').style.display = 'none';
                    this.resetGame();
                    this.startLevel(1);
                });
            } else {
                document.getElementById('level-score').textContent = this.score;
                document.getElementById('level-complete').style.display = 'flex';
            }
        }
    },
    
    resetGame: function() {
        this.currentLevel = 1;
        this.score = 0;
        this.lives = 3;
        this.isGameOver = false;
        this.isLevelComplete = false;
    }
};

function Player(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = 8;
    this.color = '#4CAF50';
}

Player.prototype.update = function(game) {
    if (game.keys['ArrowLeft'] || game.keys['a']) {
        this.x = Math.max(0, this.x - this.speed);
    }
    
    if (game.keys['ArrowRight'] || game.keys['d']) {
        this.x = Math.min(game.canvas.width - this.width, this.x + this.speed);
    }
    
    if (game.keys['ArrowUp'] || game.keys['w']) {
        this.y = Math.max(0, this.y - this.speed);
    }
    
    if (game.keys['ArrowDown'] || game.keys['s']) {
        this.y = Math.min(game.canvas.height - this.height, this.y + this.speed);
    }
};

Player.prototype.draw = function(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.x + this.width / 2, this.y);
    ctx.lineTo(this.x + this.width, this.y + this.height);
    ctx.lineTo(this.x, this.y + this.height);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#88f';
    ctx.beginPath();
    ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 5, 0, Math.PI * 2);
    ctx.fill();
};

Player.prototype.isColliding = function(other) {
    return this.x < other.x + other.width &&
           this.x + this.width > other.x &&
           this.y < other.y + other.height &&
           this.y + this.height > other.y;
};

function Bullet(x, y, width, height, speed) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.color = '#ff0';
}

Bullet.prototype.update = function() {
    this.y -= this.speed;
};

Bullet.prototype.draw = function(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
};

Bullet.prototype.isColliding = function(other) {
    return this.x < other.x + other.width &&
           this.x + this.width > other.x &&
           this.y < other.y + other.height &&
           this.y + this.height > other.y;
};

function Enemy(x, y, width, height, speed) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.color = '#f44336';
    this.originalX = x;
}

Enemy.prototype.update = function(game) {
    this.x += this.speed;
};

Enemy.prototype.draw = function(ctx) {

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x + this.width, this.y);
    ctx.lineTo(this.x + this.width / 2, this.y + this.height);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#900';
    ctx.beginPath();
    ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 5, 0, Math.PI * 2);
    ctx.fill();
};

Enemy.prototype.isColliding = function(other) {
    return this.x < other.x + other.width &&
           this.x + this.width > other.x &&
           this.y < other.y + other.height &&
           this.y + this.height > other.y;
};

function Explosion(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 5;
    this.maxRadius = 30;
    this.alpha = 1;
    this.fadeSpeed = 0.05;
}

Explosion.prototype.update = function() {
    this.radius += 1;
    this.alpha -= this.fadeSpeed;
};

Explosion.prototype.draw = function(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, ${Math.floor(255 * this.alpha)}, 0, ${this.alpha})`;
    ctx.fill();
    ctx.restore();
};

window.onload = function() {
    Game.init();
};