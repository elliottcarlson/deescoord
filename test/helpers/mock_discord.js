/* eslint-disable no-undef */
export class MockDiscordClient {
  constructor() {
    this.on = sandbox.spy();
    this.sendMessage = sandbox.spy();
    this.login = sandbox.spy();

    this.user = {
      username: Math.random().toString(36).substr(2, 18),
      id: Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000
    };
  }
}
