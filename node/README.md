# VerneMQ Docker Example

This is an example of how to use VerneMQ with a Postgres ACL database.

It has a [custom Lua script](./vernemq/postgres_cockroach_commons.lua) for authentication.
The difference to the original auth script is that it does not use the client id.
A registered user can use any client id to connect to VerneMQ.

## Ports

- `1883`: MQTT Port
- `5433`: Postgres Port

## Credentials

- username: `test-user`
- password: `123`

The user has the privileges to subscribe and publish to all channels.
