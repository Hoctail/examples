## This real-life example of application for Hoctail platform contains:
* Form View widget
* Asket View extra widget
* Deploy script for creating table, trigger, etc.

### Installation steps:
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


### Request a demo if you are not a registered user yet:
Use a link [demo.hoctail.io/demo/request](demo.hoctail.io/demo/requests) to get a ride!

### Additionally check your submit
From browser's console you can check your record is submitted in two ways:
* `Array.from(store.system.schema.table('Requests').records.values()).map(r => r.object())`
* ``` js
  store.system.schema.table('Requests').mapQueryResults(
    await hoctail.query(`select * from "${store.system.schema.table('Requests').id}"`),
  )
  ```
