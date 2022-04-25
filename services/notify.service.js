'use strict';

const Notify = require('../lib/notify');

module.exports = {
  name: 'notify',

  settings: {

  },

  actions: {
    startWorker: {
      async handler (ctx) {
        await this.notify.startWorker(async (error, msg) => {
          console.log(`Process work for session ${msg.id} at ${new Date()}`);
          return true;
        });
      }
    },

    stopWorker: {
      async handler (ctx) {
        this.notify.stopWorker();
      }
    },

    updateSession: {
      params: {
        id: 'string'
      },
      async handler (ctx) {
        await this.notify.updateSession(ctx.params.id);
        return `Update session ${ctx.params.id} at ${new Date()}`;
      }
    }
  },

  created () {
    this.notify = new Notify({
      kubemq: {
        address: 'localhost:50000',
        clientId: this.broker.nodeID
      },
      redis: {
        host: 'localhost',
        port: 6379
      },
      delay: 5
    });
  },

  async started () {

  },

  async stopped () {
    await this.notify.stopWorker();
  }
};
