import './style.css';
import { appConfig } from '@config/app.config';
import { authTokenStore } from '@services/api/auth.token-store';
import { HttpClient } from '@services/api/http-client';
import { PppSecretService } from '@services/ppp-secret.service';
import { RouterService } from '@services/router.service';
import { PppSecretRepository } from '@repositories/ppp-secret.repository';
import { RouterRepository } from '@repositories/router.repository';
import { authStore } from '@store/auth.store';
import { createPppStore } from '@store/ppp.store';
import { getLocale } from '@store/locale.store';
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
import { LoginView } from '@views/login.view';
import { subscribeLocale, t } from '@i18n/translate';
import { logger } from '@utils/logger';

function bootstrap(): void {
  logger.info('[app] booting', { mock: appConfig.useMock });

  const appRoot = document.getElementById('app');
  if (!appRoot) throw new Error('#app tidak ditemukan');

  ConfirmDialogComponent.mount();

  let activeLoginView: LoginView | null = null;
  let activeInspector: PppInspectorModal | null = null;
  let unsubscribeLocale: (() => void) | null = null;

  const teardown = (): void => {
    if (unsubscribeLocale) {
      unsubscribeLocale();
      unsubscribeLocale = null;
    }
    if (activeLoginView) {
      activeLoginView.destroy();
      activeLoginView = null;
    }
    if (activeInspector) {
      activeInspector.destroy();
      activeInspector = null;
    }
    appRoot.innerHTML = '';
  };

  const renderShell = (): void => {
    teardown();

    const skipLink = document.querySelector<HTMLAnchorElement>('a[href="#main-content"]');
    if (skipLink) skipLink.style.display = '';

    const env = import.meta.env;
    if (env.VITE_API_USERNAME && env.VITE_API_PASSWORD) {
      authTokenStore.useBasic(env.VITE_API_USERNAME, env.VITE_API_PASSWORD);
    }

    const http = new HttpClient(appConfig.apiBaseUrl);
    const secretRepository = new PppSecretRepository(new PppSecretService(http));
    const routerRepository = new RouterRepository(new RouterService(http));
    const ppp = createPppStore(secretRepository);

    const router = new ViewRouter();

    const mainSlot = document.createElement('main');
    mainSlot.id = 'main-content';
    mainSlot.tabIndex = -1;
    mainSlot.setAttribute('aria-label', t('common.mainContent'));
    mainSlot.className =
      'flex-1 flex flex-col relative w-full pt-header pb-nav md:pb-0 bg-background';
    appRoot.appendChild(mainSlot);
    router.bind(mainSlot);

    new DrawerBackdropComponent().mount(appRoot);
    new SidebarComponent(router, ppp).mount(appRoot);
    new HeaderComponent(router, routerRepository).mount(appRoot);
    new BottomNavComponent(router).mount(appRoot);
    new ToastComponent().mount(appRoot);

    activeInspector = new PppInspectorModal({
      onSubmit: async ({ mode, id, values }) => {
        if (mode === 'create') return ppp.createSecret(values);
        if (id === null) return null;
        return ppp.updateSecret(id, values);
      },
    });
    activeInspector.mount(document.body);

    router.register('dashboard', (container) => new DashboardView(router).mount(container));
    router.register('ppp', (container, params) =>
      new PppSuiteView(ppp, router, activeInspector!, params.tab).mount(container),
    );
    router.register('hotspot', (container, params) =>
      new HotspotView(params.hotspotTab, router).mount(container),
    );
    router.register('report', (container) => new ReportView().mount(container));
    router.register('monitor', (container, params) =>
      new MonitorView(params.monitorSection, router).mount(container),
    );
    router.register('settings', (container) => new SettingsView().mount(container));

    router.subscribe((_view, title) => {
      document.title = `Dashbox · ${title}`;
    });

    const syncShell = (): void => {
      document.documentElement.lang = getLocale();
      document.title = `Dashbox · ${router.currentTitle}`;
      mainSlot.setAttribute('aria-label', t('common.mainContent'));
      if (skipLink) skipLink.textContent = t('common.skipToContent');
    };

    syncShell();
    unsubscribeLocale = subscribeLocale(() => {
      syncShell();
      router.refresh();
    });

    router.navigate('dashboard');
  };

  const renderLogin = (): void => {
    teardown();

    const skipLink = document.querySelector<HTMLAnchorElement>('a[href="#main-content"]');
    if (skipLink) skipLink.style.display = 'none';

    document.title = `Dashbox · ${t('auth.loginTitle')}`;
    activeLoginView = new LoginView();
    activeLoginView.mount(appRoot);
  };

  let currentAuthStatus = authStore.getState().isAuthenticated;
  if (currentAuthStatus) {
    renderShell();
  } else {
    renderLogin();
  }

  authStore.subscribe((state) => {
    if (state.isAuthenticated !== currentAuthStatus) {
      currentAuthStatus = state.isAuthenticated;
      if (currentAuthStatus) {
        renderShell();
      } else {
        renderLogin();
      }
    }
  });
}

bootstrap();
