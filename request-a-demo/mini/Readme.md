*Request a demo* application has to be installed into a Mini app user creates on a Hoctail platform. App contains:
* Public Mini app
* Form View widget
* Asket View extra widget
* Deploy script for creating table, trigger, etc.

### First of all Request a demo:
Use a link [demo.hoctail.io/demo/requests](demo.hoctail.io/demo/requests) to get a ride!

### Steps:
* Register on demo.hoctail.io for free, create Api Key, Create `Request A Demo` app of a **Mini** type.
* Create project's folder and add `.env ` file. Mine is:
```
HOCTAIL_API_KEY=16f68ef7-a6d7-4e5c-8a78-9811998292b3
HOCTAIL_APP=Request A Demo
```
* Go to project's folder and try:
  1. `yarn` or `npm i`
  1. `hoctail deploy.js`
  1. `hoctail mini .`

### Additionally check your submit
From browser's console you can check your record is submitted in two ways:
* `Array.from(store.system.schema.table('Requests').records.values()).map(r => r.object())`
* `await hoctail.query(`select * from "${store.system.schema.table('Requests').id}"`)`
