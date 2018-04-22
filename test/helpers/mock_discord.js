/* eslint-disable no-undef */
export class MockDiscordClient {
  constructor() {
    this.on = sandbox.spy();
    this.sendMessage = sandbox.spy();

    this.username = 'TestBot';
    this.id = 437343149958889472;
  }
}
