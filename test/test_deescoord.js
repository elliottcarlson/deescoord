import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import { Deescoord, command } from "../src/deescoord.js";
import { MockDiscordClient } from "./helpers/mock_discord.js";
import Discord from "discord.js";
import stream from "stream";

chai.use(sinonChai);
chai.use(chaiAsPromised);
chai.should();

global.sandbox = sinon.sandbox.create();

describe("Deescoord class", () => {
  let token = Math.random().toString(36).substr(2, 20);
  let client = new MockDiscordClient();

  let Bot = class extends Deescoord {
    constructor(token, client) {
      super(token, client);
    }

    testRegisteredMethod() {
      return "testRegisteredMethod";
    }

    testResolvedPromiseRegisteredMethod() {
      return Promise.resolve("testResolvedPromiseRegisteredMethod");
    }

    testRejectedPromiseRegisteredMethod() {
      return Promise.reject("testRejectedPromiseRegisteredMethod");
    }

    testStreamRegisteredMethod() {
      let pass = new stream.PassThrough();
      let writable = new stream.Readable();

      pass.pipe(writable);
      pass.unpipe(writable);

      pass.write("testStreamRegisteredMethod");

      return pass;
    }

    testNoReturnRegisteredMethod() { }

    @command
    testDecoratedMethod() {
      return "testDecoratedMethod";
    }

    @command("testNamedDecoratedMethod")
    testNamedDecoratedMethodOriginalMethod() {
      return "testNamedDecoratedMethod";
    }

    @command("*")
    testStarDecoratedMethod() {
      return "testStarDecoratedMethod";
    }
  };

  command(Bot, "testRegisteredMethod");
  command(Bot, "testResolvedPromiseRegisteredMethod");
  command(Bot, "testRejectedPromiseRegisteredMethod");
  command(Bot, "testStreamRegisteredMethod");
  command(Bot, "testNoReturnRegisteredMethod");

  let instance = new Bot(token, client);
  let params = [ "test", "params" ];

  describe("#constructor()", () => {
    it("is an instance of Bot", () => {
      instance.should.be.an.instanceof(Bot);
    });

    it("is an instance of Deescoord", () => {
      instance.should.be.an.instanceof(Deescoord);
    });

    it("called the login method with token", () => {
      client.login.should.have.been.calledWith(token);
    });

    it("added two event listeners", () => {
      client.on.should.be.calledTwice;
    });

    it("registers an event listening for the ready event", () => {
      client.on.should.have.been.calledWith("ready");
    });

    it("registers an event listening for the message event", () => {
      client.on.should.have.been.calledWith("message");
    });

    it("has a prefix property", () => {
      instance.should.have.property("prefix", ".");
    });
  });

  describe("#_isRegistered()", () => {
    let testKey = "testRegisteredMethod";

    it("find a registered key", () => {
      instance._isRegistered(`.${testKey}`).should.be.true;
    });

    it("does not find a non-registered method", () => {
      instance._isRegistered(Math.random().toString(12)).should.be.false;
    });
  });

  describe("#_parser()", () => {
    let parser = instance._parser();
    let _sendMessage = null;
    let starBackup = null;

    let createMessage = (content) => {
      return {
        content,
        channel: {
          send: sandbox.spy()
        }
      };
    };

    beforeEach(() => {
      _sendMessage = sinon.spy(instance, "_sendMessage");

      if ("*" in global._deescoordListeners) {
        starBackup = global._deescoordListeners["*"];
        delete global._deescoordListeners["*"];
      }
    });

    afterEach(() => {
      instance._sendMessage.restore();

      if (starBackup) {
        global._deescoordListeners["*"] = starBackup;
      }
    });

    it("returns a function", () => {
      parser.should.be.instanceOf(Function);
    });

    it("can be called with no message", () => {
      parser();

      _sendMessage.should.not.be.called;
    });

    it("can receive a message in the `@name` trigger format", () => {
      let method = "testRegisteredMethod";
      let message = createMessage(`@${instance.client.user.username} ${method} ${params.join(" ")}`);

      parser(message);

      _sendMessage.should.be.calledWithExactly(method, params, message);
    });

    it("can receive a message in the `<@user_id>` trigger format", () => {
      let method = "testRegisteredMethod";
      let message = createMessage(`<@${instance.client.user.id}> ${method} ${params.join(" ")}`);

      parser(message);

      _sendMessage.should.be.calledWithExactly(method, params, message);
    });

    it("can receive a message in the prefix trigger format", () => {
      let method = "testRegisteredMethod";
      let message = createMessage(`${instance.prefix}${method} ${params.join(" ")}`);

      parser(message);

      _sendMessage.should.be.calledWithExactly(method, params, message);
    });

    it("will not run on non-registered methods", () => {
      let method = "testNonRegisteredMethod";
      let message = createMessage(`${instance.prefix}${method} ${params.join(" ")}`);

      parser(message);

      _sendMessage.should.not.be.called;
    });

    it("will send to a star decorated method if it is registered", () => {
      if (starBackup) {
        global._deescoordListeners["*"] = starBackup;
      }

      let message = createMessage("this is a test string");

      parser(message);

      _sendMessage.should.be.calledWithExactly("*", message.content, message);
    });
  });

  describe("#_sendMessage()", () => {
    let testRegisteredMethod = sinon.spy(instance, "testRegisteredMethod");
    let testResolvedPromiseRegisteredMethod = sinon.spy(instance, "testResolvedPromiseRegisteredMethod");
    let testRejectedPromiseRegisteredMethod = sinon.spy(instance, "testRejectedPromiseRegisteredMethod");
    let testStreamRegisteredMethod = sinon.spy(instance, "testStreamRegisteredMethod");
    let testDecoratedMethod = sinon.spy(instance, "testDecoratedMethod");
    let testNamedDecoratedMethodOriginalMethod = sinon.spy(instance, "testNamedDecoratedMethodOriginalMethod");
    let testStarDecoratedMethod = sinon.spy(instance, "testStarDecoratedMethod");

    let mockMessage = (content) => {
      return {
        channel: {
          send: sandbox.spy()
        }
      }
    };

    it("calls a registered method with string as return value", () => {
      let method = "testRegisteredMethod";
      let message = mockMessage();

      instance._sendMessage(method, params, message);

      testRegisteredMethod.should.be.called;
      testRegisteredMethod.should.have.returned(method);

      message.channel.send.should.be.calledWithExactly(method);
    });

    it("calls a registered method with a resolved promise as return value", () => {
      let method = "testResolvedPromiseRegisteredMethod";
      let message = mockMessage();

      instance._sendMessage(method, params, message);

      testResolvedPromiseRegisteredMethod.should.be.called;
      testResolvedPromiseRegisteredMethod.should.have.returned(sinon.match.instanceOf(Promise));

      testResolvedPromiseRegisteredMethod.returnValues[0].should.eventually.equal(method);
    });

    it("calls a registered method with a rejected promise as return value", () => {
      let method = "testRejectedPromiseRegisteredMethod";
      let message = mockMessage();

      instance._sendMessage(method, params, message);

      testRejectedPromiseRegisteredMethod.should.be.called;
      testRejectedPromiseRegisteredMethod.should.have.returned(sinon.match.instanceOf(Promise));

      testRejectedPromiseRegisteredMethod.returnValues[0].should.be.rejectedWith(method);
    });

    it("calls a registered method with a stream as return value", (done) => {
      let method = "testStreamRegisteredMethod";
      let message = {
        channel: {
          send: sandbox.spy()
        },
        member: {
          voiceChannel: {
            join: sandbox.stub().returns({
              then: sandbox.stub().returns({
                catch: sandbox.spy()
              })
            })
          }
        }
      };

      instance._sendMessage(method, params, message);

      testStreamRegisteredMethod.should.be.called;
      testStreamRegisteredMethod.should.have.returned(sinon.match.instanceOf(stream.Readable));

      testStreamRegisteredMethod.returnValues[0].on('data', (chunk) => {
        chunk.toString().should.equal(method);

        message.member.voiceChannel.join.should.be.called;
        done();
      });
      testStreamRegisteredMethod.returnValues[0].resume();
    });

    it("calls a decorated method", () => {
      let method = "testDecoratedMethod";
      let message = mockMessage();

      instance._sendMessage(method, params, message);

      testDecoratedMethod.should.be.called;
      testDecoratedMethod.should.have.returned(method);

      message.channel.send.should.be.calledWithExactly(method);
    });

    it("calls a named decorated method", () => {
      let method = "testNamedDecoratedMethod";
      let message = mockMessage();

      instance._sendMessage(method, params, message);

      testNamedDecoratedMethodOriginalMethod.should.be.called;
      testNamedDecoratedMethodOriginalMethod.should.have.returned(method);

      message.channel.send.should.be.calledWithExactly(method);
    });

    it("calls a * decorated catch all method", () => {
      let method = "testStarDecoratedMethod";
      let message = mockMessage();

      instance._sendMessage("*", params, message);

      testStarDecoratedMethod.should.be.called;
      testStarDecoratedMethod.should.have.returned(method);

      message.channel.send.should.be.calledWithExactly(method);
    });
  });
});

describe("command decorator", () => {
  describe("#command()", () => {
    it("can register a new listener", () => {
      command(Object, "testRegisteredMethod");

      global._deescoordListeners.should.be.an("object").that.has.a.property("testRegisteredMethod");
    });
  });
});
