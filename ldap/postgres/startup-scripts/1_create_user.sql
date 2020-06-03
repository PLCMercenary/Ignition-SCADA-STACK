WITH x AS (
    SELECT
        ''::text AS mountpoint,
           'yo-mama'::text AS username,
           'sofat'::text AS password,
           gen_salt('bf')::text AS salt,
           '[{"pattern": "#"}]'::json AS publish_acl,
           '[{"pattern": "#"}]'::json AS subscribe_acl
    ) 
INSERT INTO vmq_auth_acl (mountpoint, username, password, publish_acl, subscribe_acl)
    SELECT 
        x.mountpoint,
        x.username,
        crypt(x.password, x.salt),
        publish_acl,
        subscribe_acl
    FROM x;