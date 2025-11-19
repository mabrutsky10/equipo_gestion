CREATE TABLE public.fundraising (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	date_created timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	date_end timestamp NULL,
	amount int4 DEFAULT 0 NULL,
	cash bool DEFAULT false NULL,
	bank_transfer bool DEFAULT false NULL,
	alias varchar(50) NULL,
	fundraising_public bool DEFAULT true NULL,
	id_channel int4 NULL,
	id_owner int4 NULL,
	channel int4 NULL,
	CONSTRAINT fundraising_pkey PRIMARY KEY (id)
);


-- public.fundraising foreign keys

ALTER TABLE public.fundraising ADD CONSTRAINT fk_owner_id FOREIGN KEY (id_owner) REFERENCES public.userprofile(id);

-- DROP TABLE public.fundraising_details;

CREATE TABLE public.fundraising_details (
	id serial4 NOT NULL,
	id_fundraising int4 NOT NULL,
	id_userprofile int4 NULL,
	external_user_name varchar(255) NULL,
	date_created timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	amount int4 NOT NULL,
	approved bool DEFAULT false NULL,
	detail varchar(255) NULL,
	ticket varchar(255) NULL,
	CONSTRAINT chk_amount_positive CHECK ((amount >= 0)),
	CONSTRAINT fundraising_details_pkey PRIMARY KEY (id)
);


-- public.fundraising_details foreign keys

ALTER TABLE public.fundraising_details ADD CONSTRAINT fk_fundraising_details FOREIGN KEY (id_fundraising) REFERENCES public.fundraising(id) ON DELETE CASCADE;

CREATE TABLE public.fundraising_members (
	id serial4 NOT NULL,
	id_fundraising int4 NOT NULL,
	id_userprofile int4 NULL,
	external_user_name varchar(255) NULL,
	date_created timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT fundraising_members_pkey PRIMARY KEY (id),
	CONSTRAINT unique_fundraising_user UNIQUE (id_fundraising, id_userprofile)
);


-- public.fundraising_members foreign keys

ALTER TABLE public.fundraising_members ADD CONSTRAINT fk_fundraising FOREIGN KEY (id_fundraising) REFERENCES public.fundraising(id) ON DELETE CASCADE;


-- sin constraints. 
CREATE TABLE public.userprofile (
	id int4 DEFAULT nextval('userprofile_seq_id'::regclass) NOT NULL,
	userid int4 NOT NULL,
	first_name varchar(255) NOT NULL,
	last_name varchar(255) NOT NULL,
	email varchar(255) NULL,
	avatar varchar(255) NULL,
	birth_date date NULL,
	date_created timestamp DEFAULT now() NOT NULL,
	"role" public.userprofile_role DEFAULT 'player_manual'::userprofile_role NULL,
	league int4 NULL,
	provider_email varchar(255) NULL,
	rpe bool DEFAULT false NOT NULL,
	tqr bool DEFAULT false NOT NULL,
	"statistics" bool DEFAULT false NOT NULL,
	smart_assistant bool DEFAULT false NOT NULL,
	coach bool DEFAULT false NOT NULL,
	nutritionist bool DEFAULT false NOT NULL,
	kinesiologist bool DEFAULT false NOT NULL,
	tk_fcm varchar(255) NULL,
	medicalreport varchar(255) NULL,
	blocked_user bool DEFAULT false NULL,
	motive_blocked varchar(255) NULL,
	onboarding bool DEFAULT false NULL,
	current_team varchar(255) NULL,
	id_language int4 NULL,
	current_tournament int4 NULL,
	current_fase int4 NULL,
	date_access date NULL,
	dni varchar NULL,
	is_demo bool NULL,
	migrate bool DEFAULT false NULL,
	start_migration bool DEFAULT false NULL,
	is_premium bool DEFAULT false NULL,
	trial_subs bool NULL,
	expirate_date_sub date NULL,
	email_mastrainer varchar(255) NULL,
	username varchar(50) NULL,
	description varchar NULL,
	gallery varchar NULL,
	tk_fcm_old varchar NULL,
	country int4 NULL,
	localitys int4 NULL,
	province int4 NULL,
	is_reporter bool DEFAULT false NULL,
	avatar_50 varchar(100) NULL,
	avatar_100 varchar(100) NULL,
	gender public.gender_enum NULL,
	avatar_rembg varchar(255) NULL,
	CONSTRAINT pk_userprofile PRIMARY KEY (id)
);
