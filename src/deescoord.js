import Discord from "discord.js";
import stream from "stream";

global._deescoordListeners = {};

function isPromise(obj) {
  return !!obj && (typeof obj === "object" || typeof obj === "function") && typeof obj.then === "function";
}

export class Deescoord {
  constructor(token, MockClient) {
    this.client = MockClient || new Discord.Client();

    this.client.on("ready", () => {
      console.log(`Logged in as ${this.client.user.username} - ${this.client.user.id}\n`);

      if (!this.prefix) {
        this.prefix = ".";
      }
    });
    this.client.on("message", this._parser());

    this.client.login(token);

    this.prefix = ".";
  }

  commands() {
    return global._deescoordListeners;
  }

  _isRegistered(message) {
    const [ prefix ] = message.split(" ");

    if (prefix.substring(this.prefix.length) in global._deescoordListeners) {
      return true;
    }

    return false;
  }

  _parser() {
    const self = this;

    return (msg) => {
      if (!msg || !msg.content) { return; }

      if (msg.content.startsWith(`@${self.client.user.username}`) ||
          msg.content.startsWith(`<@${self.client.user.id}>`) ||
          msg.content.startsWith(self.client.user.username)) {
        const [ , method, ...params ] = msg.content.split(" ");

        if (method in global._deescoordListeners) {
          self._sendMessage(method, params, msg);
        }
      } else if (
          msg.content.startsWith(self.prefix) &&
          self._isRegistered(msg.content)) {
        const [ prefix, ...params] = msg.content.split(" ");
        const method = prefix.substring(self.prefix.length);

        self._sendMessage(method, params, msg);
      }

      if ("*" in global._deescoordListeners) {
        self._sendMessage("*", msg.content, msg);
      }
    };
  }

  _sendMessage(method, params, msg) {
    let response = this[global._deescoordListeners[method]](params, msg);

    if (response) {
      if (isPromise(response)) {
        response.then((data) => {
          msg.channel.send(data);
        }, (err) => {
          msg.channel.send(`:warning: ${err}`);
        });
      } else if (response instanceof stream.Readable) {
        if (!msg.member || !msg.member.voiceChannel) {
          msg.channel.send("Not in a voice channel...");
          return;
        }

        msg.member.voiceChannel.join()
        .then((audio) => {
          audio.playStream(response, {
            seek: 0,
            volume: 1
          });
          audio.close();
        }).catch(console.error);
      } else {
        msg.channel.send(response);
      }
    }

    return;
  }

  _getVoiceChannel(userID) {
    for (let server in this.client.servers) {
      for (let member in this.client.servers[server].members) {
        if (member === userID) {
          if (this.client.servers[server].members[member].voice_channel_id !== "undefined") {
            return this.client.servers[server].members[member].voice_channel_id;
          }
        }
      }
    }

    return null;
  }


}

export function command(target, key) {
  if (!key) {
    return (_target, _key) => {
      global._deescoordListeners[target] = _key;
    };
  } else {
    global._deescoordListeners[key] = key;
  }
}

String.prototype.startsWith = function(needle) { // eslint-disable-line no-extend-native
  return (this.indexOf(needle) === 0);
};
