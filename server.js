const WebSocket = require('ws');

// Создаем WebSocket-сервер на порту 8080
const wss = new WebSocket.Server({ port: 8080 });

// Хранение данных о подключенных игроках
const players = {};

// Обработка подключений
wss.on('connection', (ws) => {
    console.log('Новое подключение');

    // Генерация уникального ID для игрока
    const playerId = Math.random().toString(36).substring(7);
    players[playerId] = { ws, position: 0, money: 1500, properties: [] };

    // Отправляем игроку его ID и начальные данные
    ws.send(JSON.stringify({
        type: 'init',
        playerId,
        players: Object.keys(players).map(id => ({
            id,
            position: players[id].position,
            money: players[id].money,
            properties: players[id].properties,
        })),
    }));

    // Обработка сообщений от клиента
    ws.on('message', (message) => {
        const data = JSON.parse(message);

        switch (data.type) {
            case 'rollDice':
                handleRollDice(playerId);
                break;
            case 'buyProperty':
                handleBuyProperty(playerId);
                break;
            case 'endTurn':
                handleEndTurn(playerId);
                break;
        }
    });

    // Обработка отключения игрока
    ws.on('close', () => {
        console.log(`Игрок ${playerId} отключился`);
        delete players[playerId];
        broadcastPlayersUpdate();
    });
});

// Функция для броска кубиков
function handleRollDice(playerId) {
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const total = dice1 + dice2;

    players[playerId].position = (players[playerId].position + total) % 40; // 40 клеток в классической Монополии

    broadcast({
        type: 'playerUpdate',
        playerId,
        position: players[playerId].position,
        dice1,
        dice2,
    });
}

// Функция для покупки собственности
function handleBuyProperty(playerId) {
    // Логика покупки (упрощенно)
    players[playerId].properties.push('Собственность');
    broadcastPlayersUpdate();
}

// Функция для завершения хода
function handleEndTurn(playerId) {
    broadcast({
        type: 'endTurn',
        playerId,
    });
}

// Функция для рассылки обновлений всем игрокам
function broadcast(message) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

// Функция для обновления списка игроков
function broadcastPlayersUpdate() {
    broadcast({
        type: 'playersUpdate',
        players: Object.keys(players).map(id => ({
            id,
            position: players[id].position,
            money: players[id].money,
            properties: players[id].properties,
        })),
    });
}

console.log('WebSocket-сервер запущен на ws://localhost:8080');
