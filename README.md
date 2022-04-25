[![Moleculer](https://badgen.net/badge/Powered%20by/Moleculer/0e83cd)](https://moleculer.services)

# mq-notify
This project is to serve the need to have a system that runs a specific job when there is inactivity for the certain time.

## Prerequisition
- Redis
  ```
  $ docker exec -d --name redis -p 6379:6379 redis:6
  ```
- KubeMQ (Message Queue)
  ```
  $ docker run -p 8080:8080 -p 50000:50000 -p 9090:9090 --name mq -d kubemq/kubemq-community:latest
  ```

## Usage
- Open terminal #1, run `npm run dev`
- Open terminal #2, run `npm run dev`
- Open terminal #3, run `npm run dev`
- In terminal #2, #3, run `call notify.startWorker`
- In terminal #1, run `call notify.updateSession --id <id>`
- Wait for 5s, you should see message appears on either terminal #2, #3
- Try to run `call notify.updateSession --id <id>` multiple time with some delays to simulate some activities for the specific id


## Useful links

* Moleculer website: https://moleculer.services/
* Moleculer Documentation: https://moleculer.services/docs/0.14/

## NPM scripts

- `npm run dev`: Start development mode (load all services locally with hot-reload & REPL)
- `npm run start`: Start production mode (set `SERVICES` env variable to load certain services)
- `npm run cli`: Start a CLI and connect to production. Don't forget to set production namespace with `--ns` argument in script
- `npm run lint`: Run ESLint
- `npm run ci`: Run continuous test mode with watching
- `npm test`: Run tests & generate coverage report
