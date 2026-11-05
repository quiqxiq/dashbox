import { appConfig } from '@config/app.config';
import type { RouterHealth, RouterIdentity } from '@types';
import type { RouterService } from '@services/router.service';
import { mockHealth, mockIdentity } from '@mock/router.mock';

export class RouterRepository {
  constructor(private readonly service: RouterService) {}

  getIdentity(): Promise<RouterIdentity> {
    return appConfig.useMock ? mockIdentity() : this.service.getIdentity();
  }

  getHealth(): Promise<RouterHealth> {
    return appConfig.useMock ? mockHealth() : this.service.getHealth();
  }
}
