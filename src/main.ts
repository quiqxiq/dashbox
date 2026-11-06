import './style.css';
import { appConfig } from '@config/app.config';
import { authTokenStore } from '@services/api/auth.token-store';
import { HttpClient } from '@services/api/http-client';
import { PppSecretService } from '@services/ppp-secret.service';
import { RouterService } from '@services/router.service';
import { PppSecretRepository } from '@repositories/ppp-secret.repository';
import { RouterRepository } from '@repositories/router.repository';
import { createPppStore } from '@store/ppp.store';
import { ViewRouter } from '@router/view-router';
import { HeaderComponent } from '@components/layout/header.component';
import { SidebarComponent } from '@components/layout/sidebar.component';
import { BottomNavComponent } from '@components/layout/bottom-nav.component';
import { DrawerBackdropComponent } from '@components/layout/drawer-backdrop.component';
import { ToastComponent } from '@components/ui/toast.component';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog.component';
import { PppInspectorModal } from '@components/ppp/ppp-inspector.modal';
import { DashboardView } from '@views/dashboard.view';
import { PppSuiteView } from '@views/ppp-suite.view';
import { HotspotView } from '@views/hotspot.view';
import { ReportView } from '@views/report.view';
import { MonitorView } from '@views/monitor.view';
import { SettingsView } from '@views/settings.view';
import { logger } from '@utils/logger';

function bootstrap(): void {
  logger.info('[app] booting', { mock: appConfig.useMock });

  const env = import.meta.env;
  if (env.VITE_API_USERNAME && env.VITE_API_PASSWORD) {
    authTokenStore.useBasic(env.VITE_API_USERNAME, env.VITE_API_PASSWORD);
  }

  const http = new HttpClient(appConfig.apiBaseUrl);
  const secretRepository = new PppSecretRepository(new PppSecretService(http));
  const routerRepository = new RouterRepository(new RouterService(http));
  const ppp = createPppStore(secretRepository);

  const appRoot = document.getElementById('app');
  if (!appRoot) throw new Error('#app tidak ditemukan');

  const router = new ViewRouter();

  const mainSlot = document.createElement('main');
  mainSlot.id = 'main-content';
  mainSlot.tabIndex = -1;
  mainSlot.setAttribute('aria-label', 'Konten utama');
  mainSlot.className = 'flex-1 flex flex-col relative w-full pt-header pb-nav bg-background';
  appRoot.appendChild(mainSlot);
  router.bind(mainSlot);

  new DrawerBackdropComponent().mount(appRoot);
  new SidebarComponent(router, ppp).mount(appRoot);
  new HeaderComponent(router, routerRepository).mount(appRoot);
  new BottomNavComponent(router).mount(appRoot);
  new ToastComponent().mount(appRoot);
  ConfirmDialogComponent.mount();

  const inspector = new PppInspectorModal({
    onSubmit: async ({ mode, id, values }) => {
      if (mode === 'create') return ppp.createSecret(values);
      if (id === null) return null;
      return ppp.updateSecret(id, values);
    },
  });
  inspector.mount(document.body);

  router.register('dashboard', (container) => new DashboardView(router).mount(container));
  router.register('ppp', (container) => new PppSuiteView(ppp, router, inspector).mount(container));
  router.register('hotspot', (container) => new HotspotView().mount(container));
  router.register('report', (container) => new ReportView().mount(container));
  router.register('monitor', (container, params) =>
    new MonitorView(params.monitorSection).mount(container),
  );
  router.register('settings', (container) => new SettingsView().mount(container));

  router.subscribe((_view, title) => {
    document.title = `Dashbox · ${title}`;
  });

  router.navigate('dashboard');
}

bootstrap();
