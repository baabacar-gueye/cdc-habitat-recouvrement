INSERT INTO app_users(email,name,role,active)
VALUES('bgueye@cdc-habitat.sn','bgueye@cdc-habitat.sn','admin',1)
ON CONFLICT(email) DO UPDATE SET role='admin',active=1;
