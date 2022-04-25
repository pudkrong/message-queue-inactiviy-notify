const { Utils, QueuesClient } = require('kubemq-js');
const _ = require('lodash');
const Redis = require('ioredis');

class Notify {
  constructor (options) {
    this.options = _.defaultsDeep(options, {
      kubemq: {
        address: 'localhost:5000',
        clientId: Utils.uuid()
      },
      redis: {
        host: 'localhost',
        port: 6379,
        db: 3,
        keyPrefix: 'notify:'
      },
      channel: 'delayed-queue',
      delay: 10
    });

    this.qClient = new QueuesClient(this.options.kubemq);
    this.rClient = new Redis(this.options.redis);
  }

  async updateSession (id, meta = {}) {
    const session = await this.rClient.get(id);
    if (!session) {
      const data = {
        id,
        meta
      };
      await this.qClient.send({
        channel: this.options.channel,
        body: Utils.stringToBytes(JSON.stringify(data)),
        policy: {
          delaySeconds: this.options.delay
        }
      });
    }
    await this.rClient.set(id, `${Date.now()}`, 'ex', this.options.delay * 3);
  }

  async startWorker (cb) {
    if (this._worker) return;

    this._worker = await this.qClient.transactionStream({
      channel: this.options.channel,
      visibilitySeconds: 8,
      waitTimeoutSeconds: 10
    }, this._process(cb));
  }

  async stopWorker () {
    if (this._worker) {
      this._worker.unsubscribe();
      delete this._worker;
    }
  }

  _process (cb) {
    return async (error, message) => {
      // Error 138: Transaction mode in KubeMQ has waiting timeout.
      // If there is no message coming in during the period, it will throw error 138
      if (error && !/^Error 138\:/.test(error.message)) return cb(error);
      if (!message) return;

      try {
        const data = JSON.parse(Utils.bytesToString(message.message.body));

        // Check session. If session not found, just simply ack the message
        const session = await this.rClient.get(data.id);
        if (!session) return await message.ack();

        const lastTimestamp = Number.parseInt(session);
        const executedTimestamp = lastTimestamp + (this.options.delay * 1000);
        const currentTimestamp = Date.now();
        if (currentTimestamp >= executedTimestamp) {
          // When current time passes, just call callback, then delete the session
          await cb(null, data);
          await Promise.all([
            message.ack(),
            this.rClient.del(data.id)
          ]);
        } else {
          // When session is updated, just requeue the job with delay
          const newDelay = Math.ceil((executedTimestamp - currentTimestamp) / 1000);
          message.message.policy = {
            delaySeconds: newDelay
          };
          await message.resendNewMessage(message.message);
        }
      } catch (error) {
        await message.ack();
        await cb(error);
      }
    };
  }
}

module.exports = Notify;
