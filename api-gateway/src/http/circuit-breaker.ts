type ServiceName = 'player-service' | 'game-service' | 'team-service' | 'result-service';

export class CircuitBreaker {
  canRequest(_service: ServiceName): boolean {
    return true;
  }

  recordSuccess(_service: ServiceName) {}

  recordFailure(_service: ServiceName) {}
}
