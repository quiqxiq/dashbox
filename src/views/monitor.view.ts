import { FirewallTableComponent } from '@components/monitor/firewall-table.component';
import { LogStreamComponent } from '@components/monitor/log-stream.component';
import { MonitorTabsComponent } from '@components/monitor/monitor-tabs.component';
import { QueueTableComponent } from '@components/monitor/queue-table.component';
import { TrafficTableComponent } from '@components/monitor/traffic-table.component';
import {
  deleteFirewallRule,
  deleteSimpleQueue,
  getMockFirewallConnections,
  getMockFirewallRules,
  getMockInterfaces,
  getMockSimpleQueues,
  resetSimpleQueueBytes,
  simulateInterfaceTick,
  simulateQueuesTick,
  toggleFirewallRule,
  toggleSimpleQueue,
} from '@mock/monitor.mock';
import type { FirewallTab, MonitorSection, ViewParams } from '@types';
import { t } from '@i18n/translate';
import { escapeHtml } from '@utils/format';
import type { View } from './base.view';

const LIVE_TICK_MS = 1_800;

export class MonitorView implements View {
  private root: HTMLElement | null = null;
  private tabsComponent: MonitorTabsComponent | null = null;
  private contentSlot: HTMLElement | null = null;
  private activeSection: MonitorSection = 'logs';

  // Sub-components
  private logStream: LogStreamComponent | null = null;
  private trafficTable: TrafficTableComponent | null = null;
  private firewallTable: FirewallTableComponent | null = null;
  private queueTable: QueueTableComponent | null = null;

  // Timers
  private liveTimer: number | null = null;

  // State
  private firewallTab: FirewallTab = 'filter';

  constructor(section: ViewParams['monitorSection'] = 'logs') {
    this.activeSection = section ?? 'logs';
  }

  mount(container: HTMLElement): this {
    const root = document.createElement('section');
    root.className = 'view flex flex-col gap-3 w-full px-3.5 pb-8';
    this.root = root;
    container.appendChild(root);

    // Header
    root.innerHTML = `
      <header class="flex items-center justify-between gap-3 px-1 pt-1">
        <div class="min-w-0">
          <h1 class="text-base font-bold font-headline text-on-surface">${escapeHtml(t('monitor.title'))}</h1>
          <p class="mt-0.5 text-[11px] text-on-surface-variant">${escapeHtml(t('monitor.subtitle'))}</p>
        </div>
      </header>
      <div data-tabs-container class="w-full"></div>
      <div data-content-slot class="w-full"></div>`;

    const tabsContainer = root.querySelector<HTMLElement>('[data-tabs-container]');
    this.contentSlot = root.querySelector<HTMLElement>('[data-content-slot]');

    if (!tabsContainer || !this.contentSlot) {
      throw new Error('Elemen MonitorView gagal diinisialisasi');
    }

    // Mount Tabs
    this.tabsComponent = new MonitorTabsComponent((section) => {
      this.switchSection(section);
    });
    this.tabsComponent.mount(tabsContainer);

    // Render initial section
    this.switchSection(this.activeSection);
    this.updateTabCounts();

    // Start background live tick for traffic & queues
    this.liveTimer = window.setInterval(() => this.handleLiveTick(), LIVE_TICK_MS);

    return this;
  }

  private switchSection(section: MonitorSection): void {
    this.activeSection = section;
    if (!this.contentSlot) return;

    this.clearContentSlot();

    if (section === 'logs') {
      this.logStream = new LogStreamComponent();
      this.logStream.mount(this.contentSlot);
    } else if (section === 'traffic') {
      this.trafficTable = new TrafficTableComponent({
        onRefresh: () => this.refreshTraffic(),
        onSearchChange: () => this.refreshTraffic(),
      });
      this.trafficTable.mount(this.contentSlot);
      this.refreshTraffic();
    } else if (section === 'firewall') {
      this.firewallTable = new FirewallTableComponent({
        onTabChange: (tab) => {
          this.firewallTab = tab;
          this.refreshFirewall();
        },
        onToggleRule: (id) => {
          toggleFirewallRule(id);
          this.refreshFirewall();
        },
        onDeleteRule: (id) => {
          deleteFirewallRule(id);
          this.refreshFirewall();
          this.updateTabCounts();
        },
        onRefresh: () => this.refreshFirewall(),
      });
      this.firewallTable.mount(this.contentSlot);
      this.refreshFirewall();
    } else if (section === 'queues') {
      this.queueTable = new QueueTableComponent({
        onToggleQueue: (id) => {
          toggleSimpleQueue(id);
          this.refreshQueues();
        },
        onDeleteQueue: (id) => {
          deleteSimpleQueue(id);
          this.refreshQueues();
          this.updateTabCounts();
        },
        onResetBytes: (id) => {
          resetSimpleQueueBytes(id);
          this.refreshQueues();
        },
        onRefresh: () => this.refreshQueues(),
      });
      this.queueTable.mount(this.contentSlot);
      this.refreshQueues();
    }

    this.updateTabCounts();
  }

  private clearContentSlot(): void {
    if (this.logStream) {
      this.logStream.destroy();
      this.logStream = null;
    }
    if (this.trafficTable) {
      this.trafficTable.destroy();
      this.trafficTable = null;
    }
    if (this.firewallTable) {
      this.firewallTable.destroy();
      this.firewallTable = null;
    }
    if (this.queueTable) {
      this.queueTable.destroy();
      this.queueTable = null;
    }
    if (this.contentSlot) {
      this.contentSlot.innerHTML = '';
    }
  }

  private refreshTraffic(): void {
    if (!this.trafficTable) return;
    const ifaces = getMockInterfaces();
    this.trafficTable.update(ifaces);
  }

  private refreshFirewall(): void {
    if (!this.firewallTable) return;
    if (this.firewallTab === 'connections') {
      const conns = getMockFirewallConnections();
      this.firewallTable.updateConnections(conns);
    } else {
      const rules = getMockFirewallRules(this.firewallTab);
      this.firewallTable.updateRules(rules);
    }
  }

  private refreshQueues(): void {
    if (!this.queueTable) return;
    const queues = getMockSimpleQueues();
    this.queueTable.update(queues);
  }

  private handleLiveTick(): void {
    if (this.activeSection === 'traffic' && this.trafficTable) {
      const updated = simulateInterfaceTick();
      this.trafficTable.update(updated);
    } else if (this.activeSection === 'queues' && this.queueTable) {
      const updated = simulateQueuesTick();
      this.queueTable.update(updated);
    }
  }

  private updateTabCounts(): void {
    if (!this.tabsComponent) return;

    const ifaces = getMockInterfaces();
    const rules = [
      ...getMockFirewallRules('filter'),
      ...getMockFirewallRules('nat'),
      ...getMockFirewallRules('mangle'),
    ];
    const queues = getMockSimpleQueues();

    this.tabsComponent.update(this.activeSection, {
      logs: 250,
      traffic: ifaces.length,
      firewall: rules.length,
      queues: queues.length,
    });
  }

  destroy(): void {
    if (this.liveTimer !== null) {
      window.clearInterval(this.liveTimer);
      this.liveTimer = null;
    }
    this.clearContentSlot();
    this.tabsComponent?.destroy();
    this.tabsComponent = null;
    this.root?.remove();
    this.root = null;
  }
}
