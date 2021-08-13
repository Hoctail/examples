*Request a demo* application contains following parts:
* Public Mini app with visual form implementation
* Deploy script creating a table

### Steps:
* Register on demo.hoctail.io, create Api Key, Create `Request A Demo` app of **Mini** type.
* Create project's folder and add `.env ` file. Mine is:
```
HOCTAIL_API_KEY=16f68ef7-a6d7-4e5c-8a78-9811998292b3
HOCTAIL_APP=Request A Demo
```
* Go to project's folder and try:
  1. `yarn` or `npm i`
  1. `hoctail install node_modules/email-validator`
  1. `hoctail deploy.js`
  1. `hoctail mini .`

### Check tour submit
From browser's console you can check your record is submitted
`Array.from(store.system.schema.table('Requests').records.values()).map(r => r.object())`
`await hoctail.query(`select * from "${store.system.schema.table('Requests').id}"`)`
