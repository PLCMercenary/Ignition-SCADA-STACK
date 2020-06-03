CREATE EXTENSION pgcrypto;
CREATE TABLE vmq_auth_acl
 (
   mountpoint character varying(10) NOT NULL,
   username character varying(128) NOT NULL,
   password character varying(128),
   publish_acl json,
   subscribe_acl json,
   CONSTRAINT vmq_auth_acl_primary_key PRIMARY KEY (mountpoint, username)
 );