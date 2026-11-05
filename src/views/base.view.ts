export interface View {
  mount(container: HTMLElement): this;
  destroy(): void;
}
