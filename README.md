# deescoord [![npm version](https://badge.fury.io/js/deescoord.svg)](https://badge.fury.io/js/deescoord) [![Build Status](https://travis-ci.org/elliottcarlson/deescoord.svg?branch=master)](https://travis-ci.org/elliottcarlson/deescoord) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/f47a26d2c14544e7b9c33a7edfbc948f)](https://www.codacy.com/app/trendinteractive/deescoord?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=elliottcarlson/deescoord&amp;utm_campaign=Badge_Grade) 

A simple bot framework for [Discord](http://www.discordapp.com).

## Installation

Via npm

    $ npm install deescoord

Via git clone

    $ npm clone git@github.com:elliottcarlson/deescoord && cd deescoord
    $ npm install

## Usage

deescoord is a framework for writing bots, and does not run on it's own. For pre-made
bots, please see the [Samples](#samples) section.

If you want to quickly create your first deescoord bot, it is recommended to use
[deescoord-boilerplate](https://github.com/elliottcarlson/deescoord-boilerplate/) as it
will provide you with everything you need to quickly get a bot up and running.

## ES7 + Decorators Bot

deescoord comes with a helper function that is intended on being used as a decorator.
To use the `@command` decorator, you will need
[babel-plugin-transform-decorators-legacy](https://www.npmjs.com/package/babel-preset-decorators-legacy).
The [deescoord-boilerplate](https://github.com/elliottcarlson/deescoord-boilerplate/)
provides all the files and references needed to quickly get setup to create
your own bot.

The `command` helper function will either register the method being decorated
directly, or can be passed a parameter to register as the string to respond to.
A special parameter of `*` will cause that method to receive all inbound
messages and acts as a catch-all method.

A straight-forward bot that will respond to `.hello` and `.goodbye` messages in
Discord would look like:

    import { Deescoord, command } from 'deescoord';

    class Bot extends Deescoord {
        constructor() {
            super(YOUR_DISCORD_BOT_TOKEN);
        }

        @command
        hello() {
            return 'Hello!';
        }

        @command('goodbye')
        other_method() {
            return 'Goodbye!';
        }
    }

## ES6 Bot

If you don't want to use decorators, and want to stick with babel-preset-env,
you can still use deescoord.

The same sample as above, but without a decorator:

    import { Deescoord, command } from 'deescoord';

    class Bot extends Deescoord {
        constructor() {
            super(YOUR_DISCORD_BOT_TOKEN);

            command(this, 'hello');
            command(this, 'goodbye');
        }

        hello() {
            return 'Hello';
        }

        goodbye() {
            return 'Goodbye!';
        }
    }

## How it works (quick overview)

deescoord abstracts the background communication with Discords gateway. By
extending the deescoord base class, your Bot will perform all of the connection and
routing of requests behind the scenes.

By registering specific methods via the `command` helper (either as a decorator, or
directly), deescoord will register that methods name as a command that it can respond
to.

Your bot will respond to various styles of sending commands. In any room that
the bot has been invited to, or via private message, you will be able to trigger
a command call using the following syntaxes:

* @bot-name _command_ _(optional parameters)_
* bot-name: _command_ _(optional parameters)_
* prefix _command_ _(optional parameters)_

If the _command_ has been registered via the `command` helper, then the method will
be called with the following parameters:

* `params`: an array of individual words that were entered after the _command_
* `raw`: an object containing the raw message that was received from Discord

Please see the [wiki](https://github.com/elliottcarlson/deescoord/wiki) for a more
in-depth usage guide.

_command_'s can respond in various ways. In the above examples, we simply return
a string - this tells deescoord to respond to the command by sending the returned
string back to the source - i.e. if it were in a channel, it would respond
there, if the request was via direct message, it would respond there. Besides
returning a string, deescoord can also accept the following return types:

* `Promise`: When a Promise is returned, deescoord will act accordingly, and wait for
  a resolve or reject message to come through. The content of the resolve/reject
  message should be a string or an attachment that it can process accordingly.

Please see the [wiki](https://github.com/elliottcarlson/deescoord/wiki) for more
information on Attachments and Promises.

## Samples

- [deescoord boilerplate](https://github.com/elliottcarlson/deescoord-boilerplate/)
