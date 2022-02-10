create table states (
	id          integer
        primary key autoincrement,
	version integer
);
INSERT INTO states(version) VALUES(0);

create table calls
(
    id          integer
        primary key autoincrement,
    start       datetime,
    status      integer,
    "from"      integer,
    "to"        integer,
    from_device integer,
    to_device   integer,
    chat_id     integer
);

create table chats
(
    id           integer
        primary key autoincrement,
    name         varchar(255),
    last_message integer,
    avatar       varchar(255)
);

create table files
(
    id      integer
        primary key autoincrement,
    name    varchar(255),
    path    varchar(255),
    uid     varchar(255),
    chat_id integer
);

create table messages
(
    id      integer
        primary key autoincrement,
    text    text,
    date    datetime default CURRENT_TIMESTAMP,
    chat_id integer,
    user_id integer,
    type    integer,
    related integer
);

create table reactions
(
    id         integer
        primary key autoincrement,
    message_id integer,
    reaction   varchar(255),
    user_id    integer
);

create table user_chats
(
    id           integer
        primary key autoincrement,
    chat_id      integer,
    user_id      integer,
    unread_count integer,
    direct_id    integer,
    status       integer
);

create table users
(
    id     integer
        primary key autoincrement,
    name   varchar(255),
    email  varchar(255),
    avatar varchar(255),
    uid    varchar(255),
    status integer
);

