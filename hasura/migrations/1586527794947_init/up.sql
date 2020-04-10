CREATE TABLE public.account (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    status text DEFAULT 'OFFLINE'::text NOT NULL,
    last_activity timestamp with time zone DEFAULT '2019-06-16 19:39:21.307939'::timestamp without time zone NOT NULL,
    credit integer DEFAULT 30,
    email text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    status_duration integer,
    notes text
);
CREATE FUNCTION public.available_credit(account_row public.account) RETURNS bigint
    LANGUAGE sql STABLE
    AS $$
  SELECT
    account_row.credit - COALESCE(SUM (("limit" - "progress") * "cost_per_one"),0)
    FROM
       like_campaign
    WHERE
        account_row.id = like_campaign.account_id
    AND
        like_campaign.status = 'ACTIVE';
$$;
CREATE FUNCTION public.set_current_timestamp_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$;
CREATE SEQUENCE public.accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.accounts_id_seq OWNED BY public.account.id;
CREATE TABLE public.campaign (
    id integer NOT NULL,
    name text,
    type text NOT NULL,
    link text NOT NULL,
    target integer DEFAULT 10 NOT NULL,
    user_id integer NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    cost_per_one integer DEFAULT 6 NOT NULL,
    overwrite text DEFAULT 'no'::text NOT NULL
);
CREATE SEQUENCE public.campaign_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.campaign_id_seq OWNED BY public.campaign.id;
CREATE TABLE public.campaign_type (
    name text NOT NULL
);
CREATE TABLE public.like_campaign (
    id integer NOT NULL,
    name text,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    user_compaign_id integer NOT NULL,
    "limit" integer DEFAULT 100 NOT NULL,
    account_id integer NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    type text NOT NULL,
    cost_per_one integer DEFAULT 6 NOT NULL
);
CREATE SEQUENCE public."likeCampaign_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public."likeCampaign_id_seq" OWNED BY public.like_campaign.id;
CREATE TABLE public.log (
    id integer NOT NULL,
    account_id integer,
    type text DEFAULT 'INFO'::text NOT NULL,
    message text,
    details text,
    host_name text,
    created_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE public.logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.logs_id_seq OWNED BY public.log.id;
CREATE TABLE public.setting (
    id integer NOT NULL,
    name text NOT NULL,
    value jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE SEQUENCE public.setting_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.setting_id_seq OWNED BY public.setting.id;
CREATE TABLE public."user" (
    id integer NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    credit integer DEFAULT 0 NOT NULL,
    role text DEFAULT 'user'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    notes text
);
CREATE SEQUENCE public.user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.user_id_seq OWNED BY public."user".id;
ALTER TABLE ONLY public.account ALTER COLUMN id SET DEFAULT nextval('public.accounts_id_seq'::regclass);
ALTER TABLE ONLY public.campaign ALTER COLUMN id SET DEFAULT nextval('public.campaign_id_seq'::regclass);
ALTER TABLE ONLY public.like_campaign ALTER COLUMN id SET DEFAULT nextval('public."likeCampaign_id_seq"'::regclass);
ALTER TABLE ONLY public.log ALTER COLUMN id SET DEFAULT nextval('public.logs_id_seq'::regclass);
ALTER TABLE ONLY public.setting ALTER COLUMN id SET DEFAULT nextval('public.setting_id_seq'::regclass);
ALTER TABLE ONLY public."user" ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);
ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_email_key UNIQUE (email);
ALTER TABLE ONLY public.account
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.campaign
    ADD CONSTRAINT campaign_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.campaign_type
    ADD CONSTRAINT campaign_type_pkey PRIMARY KEY (name);
ALTER TABLE ONLY public.like_campaign
    ADD CONSTRAINT "likeCampaign_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public.log
    ADD CONSTRAINT logs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.setting
    ADD CONSTRAINT setting_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);
ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);
CREATE TRIGGER set_public_account_updated_at BEFORE UPDATE ON public.account FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_account_updated_at ON public.account IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_campaign_updated_at BEFORE UPDATE ON public.campaign FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_campaign_updated_at ON public.campaign IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER "set_public_likeCampaign_updated_at" BEFORE UPDATE ON public.like_campaign FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER "set_public_likeCampaign_updated_at" ON public.like_campaign IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_setting_updated_at BEFORE UPDATE ON public.setting FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_setting_updated_at ON public.setting IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_user_updated_at BEFORE UPDATE ON public."user" FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_user_updated_at ON public."user" IS 'trigger to set value of column "updated_at" to current timestamp on row update';
ALTER TABLE ONLY public.campaign
    ADD CONSTRAINT campaign_account_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON UPDATE SET NULL ON DELETE SET NULL;
ALTER TABLE ONLY public.campaign
    ADD CONSTRAINT campaign_type_fkey FOREIGN KEY (type) REFERENCES public.campaign_type(name) ON UPDATE SET DEFAULT ON DELETE SET DEFAULT;
ALTER TABLE ONLY public.like_campaign
    ADD CONSTRAINT "likeCampaign_account_id_fkey" FOREIGN KEY (account_id) REFERENCES public.account(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public.like_campaign
    ADD CONSTRAINT "likeCampaign_user_compaign_id_fkey" FOREIGN KEY (user_compaign_id) REFERENCES public.campaign(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public.like_campaign
    ADD CONSTRAINT like_campaign_type_fkey FOREIGN KEY (type) REFERENCES public.campaign_type(name) ON UPDATE SET DEFAULT ON DELETE SET DEFAULT;
ALTER TABLE ONLY public.log
    ADD CONSTRAINT logs_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.account(id) ON UPDATE RESTRICT ON DELETE CASCADE;
