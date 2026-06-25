/**
 * A list of async listeners invoked, in registration order, when something they
 * care about changes. Shared by the broker services to broadcast their
 * "credentials changed" / "API keys changed" events.
 */
export class ChangeNotifier {
  private readonly listeners: Array<() => Promise<void>> = [];

  on(listener: () => Promise<void>): void {
    this.listeners.push(listener);
  }

  /** Awaits each listener sequentially, in the order they were registered. */
  async notify(): Promise<void> {
    for (const listener of this.listeners) {
      await listener();
    }
  }
}
