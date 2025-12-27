const assert = require('assert');
const http = require('http');
const { Test } = require('@nestjs/testing');
const request = require('supertest');

function startMockServer(handler) {
  const server = http.createServer(handler);
  return new Promise((resolve) => {
    server.listen(0, () => {
      const { port } = server.address();
      resolve({ server, port });
    });
  });
}

async function run() {
  const gameServer = await startMockServer((req, res) => {
    if (req.url.startsWith('/games/1')) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        id: '1',
        startsAt: '2025-01-01T18:00:00Z',
        location: 'Mock',
        status: 'CONFIRMED',
        participants: [{ playerId: '10', inviteStatus: 'CONFIRMED' }],
      }));
      return;
    }
    res.statusCode = 404;
    res.end();
  });

  const playerServer = await startMockServer((req, res) => {
    if (req.url === '/players/batch' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', () => {
        const ids = JSON.parse(body).ids || [];
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(ids.map((id) => ({ id: String(id), rating: 77 }))));
      });
      return;
    }
    res.statusCode = 404;
    res.end();
  });

  const teamServer = await startMockServer((req, res) => {
    if (req.url.startsWith('/games/1/team-sets')) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify([
        { id: '5', status: 'LOCKED', version: 1, teams: [{ id: '100', players: [{ playerId: '10' }] }] },
      ]));
      return;
    }
    res.statusCode = 404;
    res.end();
  });

  const resultServer = await startMockServer((req, res) => {
    if (req.url.startsWith('/games/1/results')) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ id: '20', gameId: '1', format: 'TWO_TEAMS', lines: [] }));
      return;
    }
    res.statusCode = 404;
    res.end();
  });

  process.env.PLAYER_SVC_URL = `http://localhost:${playerServer.port}`;
  process.env.GAME_SVC_URL = `http://localhost:${gameServer.port}`;
  process.env.TEAM_SVC_URL = `http://localhost:${teamServer.port}`;
  process.env.RESULT_SVC_URL = `http://localhost:${resultServer.port}`;
  process.env.HTTP_TIMEOUT_MS = '3000';

  const { AppModule } = require('../dist/app.module');
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  await app.init();

  await request(app.getHttpServer())
    .get('/api/v1/health')
    .expect(200)
    .then((res) => {
      assert.strictEqual(res.body.status, 'ok');
    });

  await request(app.getHttpServer())
    .get('/api/v1/games/1/details')
    .expect(200)
    .then((res) => {
      assert.strictEqual(res.body.game.id, '1');
      assert.strictEqual(res.body.participants.length, 1);
      assert.strictEqual(res.body.teams.lockedTeamSet.id, '5');
    });

  await app.close();
  gameServer.server.close();
  playerServer.server.close();
  teamServer.server.close();
  resultServer.server.close();

  console.log('e2e: ok');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
