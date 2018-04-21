import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { Deescoord, command } from '../src/deescoord.js';
import { MockDiscordClient } from './helpers/mock_discord.js';
import Discord from 'discord.io';

chai.use(sinonChai);
chai.use(chaiAsPromised);
chai.should();

global.sandbox = sinon.sandbox.create();

describe('Deescoord class', () => {
  let token = Math.random().toString(36).substr(2, 20);
  let client = new MockDiscordClient();

  let Bot = class extends Deescoord {
    constructor(token, client) {
      super(token, client);
    }

    testRegisteredMethod() {
      return 'testRegisteredMethod';
    }

    testResolvedPromiseRegisteredMethod() {
      return Promise.resolve('testResolvedPromiseRegisteredMethod');
    }

    testRejectedPromiseRegisteredMethod() {
      return Promise.reject('testRejectedPromiseRegisteredMethod');
    }

    testNoReturnRegisteredMethod() { }

    @command
    testDecoratedMethod() {
      return 'testDecoratedMethod';
    }

    @command('testNamedDecoratedMethod')
    testNamedDecoratedMethodOriginalMethod() {
      return 'testNamedDecoratedMethod';
    }

    @command('*')
    testStarDecoratedMethod() {
      return 'testStarDecoratedMethod';
    }
  };

  command(Bot, 'testRegisteredMethod');
  command(Bot, 'testResolvedPromiseRegisteredMethod');
  command(Bot, 'testRejectedPromiseRegisteredMethod');
  command(Bot, 'testNoReturnRegisteredMethod');

  let instance = new Bot(token, client);

  let user = 'test-user';
  let userID = 12345;
  let channelID = 54321;
  let params = [ 'test', 'params' ];

  describe('#constructor()', () => {
    it('is an instance of Bot', () => {
      instance.should.be.an.instanceof(Bot);
    });

    it('is an instance of Deescoord', () => {
      instance.should.be.an.instanceof(Deescoord);
    });

    it('has the token in the token property', () => {
      instance.token.should.equal(token);
    });

    it('added two listeners on the on method of Discord.Client', () => {
      client.on.should.be.calledTwice;
    });

    it('has a prefix property', () => {
      instance.should.have.property('prefix', '.');
    });
  });

  describe('#_isRegistered()', () => {
    let testKey = 'testRegisteredMethod';

    it('find a registered key', () => {
      instance._isRegistered(`.${testKey}`).should.be.true;
    });

    it('does not find a non-registered method', () => {
      instance._isRegistered(Math.random().toString(12)).should.be.false;
    });
  });

  describe('#_parser()', () => {
    let parser = instance._parser();
    let _sendMessage = null;
    let starBackup = null;

    beforeEach(() => {
      _sendMessage = sinon.spy(instance, '_sendMessage');

      if ('*' in global._deescoordListeners) {
        starBackup = global._deescoordListeners['*'];
        delete global._deescoordListeners['*'];
      }
    });

    afterEach(() => {
      instance._sendMessage.restore();

      if (starBackup) {
        global._deescoordListeners['*'] = starBackup;
      }
    });

    it('returns a function', () => {
      parser.should.be.instanceOf(Function);
    });

    it('can be called with no message', () => {
      parser();

      _sendMessage.should.not.be.called;
    });

    it('can receive a message in the `@name` trigger format', () => {
      let method = 'testRegisteredMethod';
      let message = `@${instance.username} ${method} ${params.join(' ')}`;

      parser(user, userID, channelID, message, { d: message });

      _sendMessage.should.be.calledWithExactly(channelID, method, params, message);
    });

    it('can receive a message in the prefix trigger format', () => {
      let method = 'testRegisteredMethod';
      let message = `${instance.prefix}${method} ${params.join(' ')}`;

      parser(user, userID, channelID, message, { d: message });

      _sendMessage.should.be.calledWithExactly(channelID, method, params, message);
    });

    it('will not run on non-registered methods', () => {
      let method = 'testNonRegisteredMethod';
      let message = `${instance.prefix}${method} ${params.join(' ')}`;

      parser(user, userID, channelID, message, { d: message });

      _sendMessage.should.not.be.called;
    });

    it('will send to a star decorated method if it is registered', () => {
      if (starBackup) {
        global._deescoordListeners['*'] = starBackup;
      }

      let message = 'this is a test string';
      parser(user, userID, channelID, message, { d: message });

      _sendMessage.should.be.calledWithExactly(channelID, '*', message, message);
    });
  });

  describe('#_sendMessage()', () => {
    let testRegisteredMethod = sinon.spy(instance, 'testRegisteredMethod');
    let testResolvedPromiseRegisteredMethod = sinon.spy(instance, 'testResolvedPromiseRegisteredMethod');
    let testRejectedPromiseRegisteredMethod = sinon.spy(instance, 'testRejectedPromiseRegisteredMethod');
    let testDecoratedMethod = sinon.spy(instance, 'testDecoratedMethod');
    let testNamedDecoratedMethodOriginalMethod = sinon.spy(instance, 'testNamedDecoratedMethodOriginalMethod');
    let testStarDecoratedMethod = sinon.spy(instance, 'testStarDecoratedMethod');

//    beforeEach(() => {
//      instance.client.sendMessage.reset();
//    });

    it('calls a registered method with string as return value', () => {
      let method = 'testRegisteredMethod';

      instance._sendMessage(channelID, method, params, {});

      testRegisteredMethod.should.be.called;
      testRegisteredMethod.should.have.returned(method);

      instance.client.sendMessage.should.be.calledWithExactly({
        to: channelID,
        message: method,
      });
    });

    it('calls a registered method with a resolved promise as return value', () => {
      let method = 'testResolvedPromiseRegisteredMethod';

      instance._sendMessage(channelID, method, params, {});

      testResolvedPromiseRegisteredMethod.should.be.called;
      testResolvedPromiseRegisteredMethod.should.have.returned(sinon.match.instanceOf(Promise));
    });

    it('calls a registered method with a rejected promise as return value', () => {
      let method = 'testRejectedPromiseRegisteredMethod';

      instance._sendMessage(channelID, method, params, {});

      testRejectedPromiseRegisteredMethod.should.be.called;
      testRejectedPromiseRegisteredMethod.should.have.returned(sinon.match.instanceOf(Promise));
    });

    it('calls a decorated method', () => {
      let method = 'testDecoratedMethod';

      instance._sendMessage(channelID, method, params, {});

      testDecoratedMethod.should.be.called;
      testDecoratedMethod.should.have.returned(method);

      instance.client.sendMessage.should.be.calledWithExactly({
        to: channelID,
        message: method,
      });
    });

    it('calls a named decorated method', () => {
      let method = 'testNamedDecoratedMethod';

      instance._sendMessage(channelID, method, params, {});

      testNamedDecoratedMethodOriginalMethod.should.be.called;
      testNamedDecoratedMethodOriginalMethod.should.have.returned(method);

      instance.client.sendMessage.should.be.calledWithExactly({
        to: channelID,
        message: method,
      });
    });

    it('calls a * decorated catch all method', () => {
      let method = 'testStarDecoratedMethod';

      instance._sendMessage(channelID, '*', params, {});

      testStarDecoratedMethod.should.be.called;
      testStarDecoratedMethod.should.have.returned(method);

      instance.client.sendMessage.should.be.calledWithExactly({
        to: channelID,
        message: method
      });
    });
  });
});

describe('command decorator', () => {
  describe('#command()', () => {
    it('can register a new listener', () => {
      command(Object, 'testRegisteredMethod');

      global._deescoordListeners.should.be.an('object').that.has.a.property('testRegisteredMethod');
    });
  });
});
