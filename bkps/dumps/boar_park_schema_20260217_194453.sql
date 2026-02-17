--
-- PostgreSQL database dump
--

\restrict PIrgSJSI6cVGA60HmXlr8fG7DbFuTPQX7Aju3XD4H4vsy9iCbyVN5cXZLcV2a2E

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE IF EXISTS boar_db;
--
-- Name: boar_db; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE boar_db WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'C.UTF-8';


ALTER DATABASE boar_db OWNER TO postgres;

\unrestrict PIrgSJSI6cVGA60HmXlr8fG7DbFuTPQX7Aju3XD4H4vsy9iCbyVN5cXZLcV2a2E
\connect boar_db
\restrict PIrgSJSI6cVGA60HmXlr8fG7DbFuTPQX7Aju3XD4H4vsy9iCbyVN5cXZLcV2a2E

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: refresh_all_stats(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.refresh_all_stats() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    REFRESH MATERIALIZED VIEW movie_stats;
    REFRESH MATERIALIZED VIEW hero_stats;
    REFRESH MATERIALIZED VIEW tag_stats;
END;
$$;


ALTER FUNCTION public.refresh_all_stats() OWNER TO postgres;

--
-- Name: refresh_hero_stats_trigger(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.refresh_hero_stats_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY hero_stats;
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.refresh_hero_stats_trigger() OWNER TO postgres;

--
-- Name: refresh_movie_stats_trigger(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.refresh_movie_stats_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY movie_stats;
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.refresh_movie_stats_trigger() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: card_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.card_tags (
    card_id bigint NOT NULL,
    tag_id bigint NOT NULL
);


ALTER TABLE public.card_tags OWNER TO postgres;

--
-- Name: cards; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cards (
    id bigint NOT NULL,
    movie_id bigint,
    hero_id bigint NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(20) NOT NULL,
    call_sign text,
    ability_text text NOT NULL,
    ability_text2 text,
    need_review boolean DEFAULT false,
    last_update_dt timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_update_user character varying(255) DEFAULT 'admin'::character varying,
    CONSTRAINT cards_type_check CHECK (((type)::text = ANY ((ARRAY['HERO'::character varying, 'VILLAIN'::character varying, 'SR1'::character varying, 'SR2'::character varying, 'WC'::character varying])::text[])))
);


ALTER TABLE public.cards OWNER TO postgres;

--
-- Name: cards_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cards_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cards_id_seq OWNER TO postgres;

--
-- Name: cards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cards_id_seq OWNED BY public.cards.id;


--
-- Name: games; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.games (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    type character varying(50) NOT NULL,
    last_update_dt timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_update_user character varying(255) DEFAULT 'admin'::character varying,
    CONSTRAINT games_type_check CHECK (((type)::text = ANY ((ARRAY['CARDS'::character varying, 'BOARDS'::character varying])::text[])))
);


ALTER TABLE public.games OWNER TO postgres;

--
-- Name: games_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.games_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.games_id_seq OWNER TO postgres;

--
-- Name: games_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.games_id_seq OWNED BY public.games.id;


--
-- Name: heroes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.heroes (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    industry character varying(50) CONSTRAINT heroes_category_not_null NOT NULL,
    game_id bigint NOT NULL,
    last_update_dt timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_update_user character varying(255) DEFAULT 'admin'::character varying
);


ALTER TABLE public.heroes OWNER TO postgres;

--
-- Name: movies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.movies (
    id bigint NOT NULL,
    hero_id bigint NOT NULL,
    title character varying(255) NOT NULL,
    need_review boolean DEFAULT false,
    last_update_dt timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_update_user character varying(255) DEFAULT 'admin'::character varying,
    locked boolean DEFAULT false NOT NULL
);


ALTER TABLE public.movies OWNER TO postgres;

--
-- Name: movie_stats; Type: MATERIALIZED VIEW; Schema: public; Owner: postgres
--

CREATE MATERIALIZED VIEW public.movie_stats AS
 SELECT m.id AS movie_id,
    m.hero_id,
    m.title,
    m.need_review,
    m.locked,
    m.last_update_user,
    m.last_update_dt,
    count(c.id) AS total_cards,
    count(
        CASE
            WHEN (c.need_review = true) THEN 1
            ELSE NULL::integer
        END) AS total_cards_need_review,
        CASE
            WHEN ((count(c.id) < 5) OR (count(
            CASE
                WHEN (c.need_review = true) THEN 1
                ELSE NULL::integer
            END) > 0)) THEN false
            ELSE true
        END AS done
   FROM (public.movies m
     LEFT JOIN public.cards c ON ((c.movie_id = m.id)))
  GROUP BY m.id, m.hero_id, m.title, m.need_review, m.locked, m.last_update_user, m.last_update_dt
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.movie_stats OWNER TO postgres;

--
-- Name: hero_stats; Type: MATERIALIZED VIEW; Schema: public; Owner: postgres
--

CREATE MATERIALIZED VIEW public.hero_stats AS
 SELECT h.id AS hero_id,
    h.name,
    h.industry,
    h.game_id,
    count(DISTINCT m.id) AS total_movies,
    count(DISTINCT
        CASE
            WHEN (ms.done = false) THEN m.id
            ELSE NULL::bigint
        END) AS pending_movies,
    count(DISTINCT c.id) AS total_cards,
    count(DISTINCT
        CASE
            WHEN (c.need_review = true) THEN c.id
            ELSE NULL::bigint
        END) AS cards_need_review
   FROM (((public.heroes h
     LEFT JOIN public.movies m ON ((m.hero_id = h.id)))
     LEFT JOIN public.movie_stats ms ON ((ms.movie_id = m.id)))
     LEFT JOIN public.cards c ON ((c.hero_id = h.id)))
  GROUP BY h.id, h.name, h.industry, h.game_id
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.hero_stats OWNER TO postgres;

--
-- Name: heroes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.heroes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.heroes_id_seq OWNER TO postgres;

--
-- Name: heroes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.heroes_id_seq OWNED BY public.heroes.id;


--
-- Name: movies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.movies_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.movies_id_seq OWNER TO postgres;

--
-- Name: movies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.movies_id_seq OWNED BY public.movies.id;


--
-- Name: password_resets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_resets (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.password_resets OWNER TO postgres;

--
-- Name: password_resets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.password_resets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.password_resets_id_seq OWNER TO postgres;

--
-- Name: password_resets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.password_resets_id_seq OWNED BY public.password_resets.id;


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.permissions OWNER TO postgres;

--
-- Name: TABLE permissions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.permissions IS 'Resource-based permissions (e.g., users:create, games:read)';


--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.permissions_id_seq OWNER TO postgres;

--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.refresh_tokens OWNER TO postgres;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.refresh_tokens_id_seq OWNER TO postgres;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    id integer NOT NULL,
    role_id integer NOT NULL,
    permission_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- Name: TABLE role_permissions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.role_permissions IS 'Many-to-many mapping between roles and permissions';


--
-- Name: role_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.role_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.role_permissions_id_seq OWNER TO postgres;

--
-- Name: role_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.role_permissions_id_seq OWNED BY public.role_permissions.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(32) NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: system_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_roles (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.system_roles OWNER TO postgres;

--
-- Name: TABLE system_roles; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.system_roles IS 'System roles that users can be assigned to';


--
-- Name: system_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.system_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_roles_id_seq OWNER TO postgres;

--
-- Name: system_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.system_roles_id_seq OWNED BY public.system_roles.id;


--
-- Name: tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tags (
    id bigint NOT NULL,
    name character varying(255) NOT NULL
);


ALTER TABLE public.tags OWNER TO postgres;

--
-- Name: tag_stats; Type: MATERIALIZED VIEW; Schema: public; Owner: postgres
--

CREATE MATERIALIZED VIEW public.tag_stats AS
 SELECT t.id AS tag_id,
    t.name AS tag_name,
    count(ct.card_id) AS card_count,
    count(DISTINCT c.hero_id) AS hero_count
   FROM ((public.tags t
     LEFT JOIN public.card_tags ct ON ((ct.tag_id = t.id)))
     LEFT JOIN public.cards c ON ((c.id = ct.card_id)))
  GROUP BY t.id, t.name
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.tag_stats OWNER TO postgres;

--
-- Name: tags_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tags_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tags_id_seq OWNER TO postgres;

--
-- Name: tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tags_id_seq OWNED BY public.tags.id;


--
-- Name: user_game_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_game_roles (
    id integer NOT NULL,
    user_id integer NOT NULL,
    game_id integer,
    role_id integer NOT NULL
);


ALTER TABLE public.user_game_roles OWNER TO postgres;

--
-- Name: user_game_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_game_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_game_roles_id_seq OWNER TO postgres;

--
-- Name: user_game_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_game_roles_id_seq OWNED BY public.user_game_roles.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(32) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255),
    is_verified boolean DEFAULT false NOT NULL,
    status character varying(16) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    role_id integer
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: COLUMN users.role_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.role_id IS 'User''s assigned role (NULL = no role assigned)';


--
-- Name: user_permissions; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.user_permissions AS
 SELECT u.id AS user_id,
    u.username,
    u.email,
    sr.id AS role_id,
    sr.name AS role_name,
    p.id AS permission_id,
    p.name AS permission_name
   FROM (((public.users u
     LEFT JOIN public.system_roles sr ON ((u.role_id = sr.id)))
     LEFT JOIN public.role_permissions rp ON ((sr.id = rp.role_id)))
     LEFT JOIN public.permissions p ON ((rp.permission_id = p.id)));


ALTER VIEW public.user_permissions OWNER TO postgres;

--
-- Name: VIEW user_permissions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.user_permissions IS 'Denormalized view of user permissions for easy querying';


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: cards id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cards ALTER COLUMN id SET DEFAULT nextval('public.cards_id_seq'::regclass);


--
-- Name: games id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.games ALTER COLUMN id SET DEFAULT nextval('public.games_id_seq'::regclass);


--
-- Name: heroes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.heroes ALTER COLUMN id SET DEFAULT nextval('public.heroes_id_seq'::regclass);


--
-- Name: movies id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movies ALTER COLUMN id SET DEFAULT nextval('public.movies_id_seq'::regclass);


--
-- Name: password_resets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_resets ALTER COLUMN id SET DEFAULT nextval('public.password_resets_id_seq'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- Name: role_permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions ALTER COLUMN id SET DEFAULT nextval('public.role_permissions_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: system_roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_roles ALTER COLUMN id SET DEFAULT nextval('public.system_roles_id_seq'::regclass);


--
-- Name: tags id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags ALTER COLUMN id SET DEFAULT nextval('public.tags_id_seq'::regclass);


--
-- Name: user_game_roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_game_roles ALTER COLUMN id SET DEFAULT nextval('public.user_game_roles_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: card_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.card_tags (card_id, tag_id) FROM stdin;
67	3
72	2
75	2
78	1
79	1
85	2
144	1
146	6
166	3
166	8
145	5
145	7
143	3
143	8
88	6
88	9
90	4
92	2
92	6
89	1
89	9
89	7
83	1
83	8
83	9
86	5
84	5
84	9
84	7
140	5
140	2
141	1
141	8
139	1
139	7
167	2
167	3
80	5
80	9
82	1
82	7
73	6
74	3
74	9
77	1
77	8
68	3
68	7
71	5
69	1
69	8
63	4
164	5
164	4
65	1
65	7
66	6
64	3
64	7
58	1
58	7
58	9
60	2
60	5
59	5
62	2
62	9
56	5
54	1
54	9
55	1
55	2
55	9
57	5
138	3
138	9
138	7
61	8
61	5
81	1
81	8
70	1
70	8
163	1
163	6
163	8
163	10
53	7
53	8
53	9
\.


--
-- Data for Name: cards; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cards (id, movie_id, hero_id, name, type, call_sign, ability_text, ability_text2, need_review, last_update_dt, last_update_user) FROM stdin;
1	1	1	Raja	HERO	\N	Swaps cards and place with another player of choice	\N	f	2025-04-03 16:12:33+02	admin
2	1	1	Yama	VILLAIN		Reverses a previous action casted on you.	With Yama Pasham, eliminate a player	f	2025-04-03 16:12:33+02	admin
3	1	1	Sathi (Ali)	SR1	You beating me, I cheating you	Helps any Hero in stealing additional card from the opponent	\N	f	2025-04-03 16:12:33+02	admin
4	1	1	Chitragupta (Brahmi)	SR2	\N	See the hand of another player	\N	f	2025-04-03 16:12:33+02	admin
5	1	1	Yama Pasham	WC	\N	Snatch one card from another player	\N	f	2025-04-03 16:12:33+02	admin
6	1	1	Locket	WC	\N	Saves cards from any player for one round	\N	f	2025-04-03 16:12:33+02	admin
7	2	1	Aadi Kesava Reddy	HERO	Amma thodu addanga narikesta	Slash the hands of any player by half (force them to discard half their cards)	\N	f	2025-04-03 16:12:33+02	admin
8	2	1	Nagi Reddy	VILLAIN	Na bhumi lo guppedu matti theesina peeka korikestha	Crunch away two cards from the last opponent who took your cards	\N	t	2025-04-03 16:12:33+02	admin
9	2	1	Veeranna Babai	SR1	\N	Protects the player through death – you can keep one card when about to be eliminated	\N	f	2025-04-03 16:12:33+02	admin
10	2	1	College Principal	SR2	\N	Ask everyone to say "Good Morning" to you. If they don't comply, take one card from each as a penalty	\N	f	2025-04-03 16:12:33+02	admin
11	2	1	Naatu Bomb	WC	\N	Bomb the opponents. shuffle and redistribute their cards	\N	f	2025-04-03 16:12:33+02	admin
12	3	1	Devara	HERO	Erra samudram potethaala	Sail on the Red Sea to steal 2 cards into your hand	\N	t	2025-04-03 16:12:33+02	admin
13	3	1	Bhaira	VILLAIN	\N	Smuggle 1 card via the Red Sea, except from Devara	\N	t	2025-04-03 16:12:33+02	admin
14	3	1	Vara	SR1	\N	Stops anyone from using the Red Sea to smuggle goods from you	\N	f	2025-04-03 16:12:33+02	admin
15	3	1	Singappa	SR2	Ee aata nadavalante… meeku mundu Devara katha theliyali.	Ask any opponent to tell Devara's story or discard half of their hand	\N	f	2025-04-03 16:12:33+02	admin
16	3	1	Aayudhalu	WC	\N	Collect all Wild Cards from players via the Red Sea and safeguard them for a round	\N	f	2025-04-03 16:12:33+02	admin
17	4	1	Anand	HERO	Environment mundu pedha enti, chinna enti	Each player must drop one card as a penalty	\N	f	2025-04-03 16:12:33+02	admin
18	4	1	Mukesh Rana	VILLAIN	Vyaparam annaka theliso theliko padi mandhi joliki veltham.	Tamper with the hands of 2 players	\N	f	2025-04-03 16:12:33+02	admin
19	4	1	Sathyam	SR1	అడ్డగోలుగా పెరిగిన కొమ్మల్ని, కొడుకుల్ని కొట్టేసిన... ఇలాగే నిలబడగలను.	If this is your last card, you don't have to drop it for 2 rounds	\N	f	2025-04-03 16:12:33+02	admin
20	4	1	K. Chandra Shekar IPS	SR2	Stress unde panlu evi cheyyakudadh	Don't drop your cards when asked to	\N	f	2025-04-03 16:12:33+02	admin
21	4	1	Garage	WC	Ichata anni repairlu cheyyabadunu	Can repair couple of your cards in your hand with cards from the deck	\N	f	2025-04-03 16:12:33+02	admin
22	5	1	Abhiram	HERO	Ekkada emotion akkade chupettali.	If you are angry at any player for a previous action, you can force them to discard 2 cards	\N	f	2025-04-03 16:12:33+02	admin
23	5	1	Krishna Murthy	VILLAIN	Idi gurthu petko… tarwatha matladadham.	Defer an action for three rounds	\N	f	2025-04-03 16:12:33+02	admin
24	5	1	Ramesh Chandra Prasad	SR1	Some bread please	Ask any player for bread (one card)	\N	f	2025-04-03 16:12:33+02	admin
25	5	1	Divya	SR2	Nanna kosam	Take and hide any Hero card from the opponent for one round	\N	f	2025-04-03 16:12:33+02	admin
26	5	1	Butterfly Effect	WC	\N	Flap the wings and create a tornado in the opponents' hands. After 2 rounds, shuffle all players' hands and redistribute them	\N	f	2025-04-03 16:12:33+02	admin
27	6	1	Rama Rao / Baadshah	HERO	Baadhshah decide aithe war one side aipothadi	Decide whom to target for one round, and everyone will cast action only on them.	\N	f	2025-04-03 16:12:33+02	admin
28	6	1	Pilli Padmanabha Simha	SR1	when fire fires the fire, fire will be fire, i am the fire.	With Inception Chair, burn half cards of any player (drop)	\N	f	2025-04-03 16:12:33+02	admin
29	6	1	Aadi IPS	VILLAIN	\N	Peek into the cards of the left and right players and make one drop a card	\N	f	2025-04-03 16:12:33+02	admin
30	6	1	Revenge Nageshwara Rao	SR2	\N	Force all players (except you) to swap 1 card with the player to their left	\N	f	2025-04-03 16:12:33+02	admin
31	6	1	Inception Chair	WC	\N	Slide into dreams until you sing "Le Le Le… Levamantava" or Skip 2 rounds (you can still be targeted)	\N	f	2025-04-03 16:12:33+02	admin
32	7	1	Veera Raghava	HERO		Ask any player to surrender 2 cards or drop 4 cards 	With Aravinda, Neutralizes opponents' actions without violence and convinces them to drop 1 card	f	2025-04-03 16:12:33+02	admin
33	7	1	Basi Reddy	VILLAIN	5rs Faction	Can force any player with more than 5 cards to drop 5 cards or get eliminated	\N	f	2025-04-03 16:12:33+02	admin
34	7	1	Jeji	SR1	Yudham rakunda aaputhade.. aadu goppa. Aade goppa.	Cancel out any action cast on you	\N	f	2025-04-03 16:12:33+02	admin
35	7	1	Aravinda	SR2	Thaggithe thappenti.	Dont cast any action for this round on any player	\N	f	2025-04-03 16:12:33+02	admin
36	7	1	Mondi Kathi	WC	\N	Combine half the cards of all players, reshuffle, and redistribute them	\N	f	2025-04-03 16:12:33+02	admin
37	8	1	Jai	HERO	Nijamanedi abadham. Nenanedi nijam.	Collect NTR Hero card from any two players	\N	f	2025-04-03 16:12:33+02	admin
38	8	1	Sarkar Sahai	VILLAIN	\N	Undermines and discards any opponent's action except if it's Jai	\N	f	2025-04-03 16:12:33+02	admin
39	8	1	Lava	SR1	\N	Helps defend the Ravana Fort for one round	\N	f	2025-04-03 16:12:33+02	admin
40	8	1	Kusa	SR2	\N	Acts as Lava and steals 2 cards from the bank (deck)	\N	f	2025-04-03 16:12:33+02	admin
41	8	1	Naatakam	WC	\N	Ask anyone to say a mythological dialogue or discard two cards	\N	f	2025-04-03 16:12:33+02	admin
42	9	1	Daya	HERO	Dandayatra, idi daya gadi dandayatra	Ask bribes from all players (one card each) or they should skip one round casting action.	\N	f	2025-04-03 16:12:33+02	admin
43	9	1	Waltair Vasu	VILLAIN	East or west, friendship is the best	If eliminated, take any two random cards from the player who eliminated you, except Daya	\N	f	2025-04-03 16:12:33+02	admin
44	9	1	Narayana Murthy	SR1	Ippatikippudu tsunami vachi andar kottukupothe baguntadi	Shuffle everyone's cards and redistribute	\N	f	2025-04-03 16:12:33+02	admin
45	9	1	Saanvi	SR2	Na babies ni evaro kidnap chesaru. Vethiki pettandi.	Ask someone to find your lost babies (give you two cards)	\N	t	2025-04-03 16:12:33+02	admin
46	9	1	Ego	WC	Na ego na chuttu Wi-Fi la untundi.	Cast the action of any Character Card on all players	\N	f	2025-04-03 16:12:33+02	admin
47	10	1	Chari	HERO	\N	Acts as Narasimha. Can steal 1 card from an opponent	\N	t	2025-04-03 16:12:33+02	admin
48	10	1	Baba Bhai	VILLAIN	\N	When asked to drop cards, hides them instead for 2 rounds	\N	f	2025-04-03 16:12:33+02	admin
49	10	1	Bhattu	SR1	\N	Brings in the whole Agraharam and sabotages an action by any Hero card in a round except for Chari	\N	f	2025-04-03 16:12:33+02	admin
50	10	1	Bhasha Bhai	SR2		Becomes invisible for one round 	Follows Bhattu from any player and cancels their action for the round	f	2025-04-03 16:12:33+02	admin
51	10	1	Thelidu! Gurthu Ledhu! Marchipoya!	WC	\N	Helps forget to drop one card when asked to discard cards	\N	f	2025-04-03 16:12:33+02	admin
52	11	2	People Killer	HERO	Disaster	Your game ends in one move	alert("hello");	f	2025-04-07 22:59:34+02	admin
54	12	3	Bhallala Deva	VILLAIN	100 adugula vigraham, 100 pranalaina bali korada....	Take 1 cards from each player to build his idol.	Pairs with Sivagami	f	2025-04-13 13:15:12+02	admin
57	12	3	Simhasanam	WC	Mahishmati Saamraajyam, Aswaakam Ajeeyam!!	Pairs with any Hero or Villain and swap hands with  next player.		f	2025-04-13 13:15:12+02	admin
58	13	3	Bujji	HERO	volvo bus running lo undaga, adham badhalu kotteskoni eppudanna bayataki velpotha anukunnava!!	Take a card from previous player and ask the next player to drop one card.	Pairs with Sivanna	f	2025-04-13 13:17:00+02	admin
59	13	3	Machi reddy	VILLAIN	naku rules, sections cheppodhu	Reverse the game direction		f	2025-04-13 13:17:00+02	admin
60	13	3	Shivanna	SR1	nuvve na second setup.. ninnu veyyadanike vacha	Choose one player. They cannot play any Action cards on you until your next turn.	Pairs with Bujji. If you were attacked earlier this round, choose one of those players and swap hands with them.	f	2025-04-13 13:17:00+02	admin
61	13	3	Sathi	SR2	chitti ni, bujji ni kalapadame na lakshyam	Can only be used if you have Chitti/Bujji. Discard Sathi and take Bujji/Chitti from the acitve players.		f	2025-04-13 13:17:00+02	admin
62	13	3	Chitti	WC	Bujji ni thappa evarini love cheyanu	Guess a player who has Bujji. If you are correct, take Bujji card. If you are wrong, discard this card.	Pair with bujji, you are safe from one attack untill your next turn.	f	2025-04-13 13:17:00+02	admin
63	14	3	Prabha	HERO	Nandini meedha pichi premani katha la cheppanu	Draw 2 cards per player and you deal the cards for two rounds		f	2025-04-13 13:18:00+02	admin
64	14	3	Rishi	VILLAIN	So.. Shall we start the game?	Challenge the next player to say a dialogue from Darling. If they fail, they must discard a Villain or SR card.		f	2025-04-13 13:18:00+02	admin
65	14	3	Nandini	SR1	vadu nannu loose annade	Take 2 cards from the next player		f	2025-04-13 13:18:00+02	admin
66	14	3	Babai	SR2	Em babu tinnara...!	Each player who has a Darling card draws 1 card from the deck, including you.		f	2025-04-13 13:18:00+02	admin
67	14	3	Bond babu	WC	nenu half ticket, black tickets tho aadanu!	Challenge the next player to mimic Nandhini. If they fail, say the call sign and don't play for a turn.		f	2025-04-13 13:18:00+02	admin
68	15	3	Jai	HERO	Ippati varaku oka lekka, ippati nundi oka lekka	Challenge the next player with a Prabhas trivia. The winner takes 3 cards from the loser and the loser must tuck in their shirt and continue playing.		f	2025-04-13 13:18:53+02	admin
69	15	3	Uma	VILLAIN	Cheppara Cheppuu...!!!!	select a player and every player  must attack the same player for the round		f	2025-04-13 13:18:53+02	admin
70	15	3	Deva	SR1	Em paapam chesthee puttav ra....!!!!	say this dialogue to any player and skip their attack once!		f	2025-04-13 13:18:53+02	admin
71	15	3	Veera Pratap	SR2	Manchi Manchi kattu batlu	everyone should give one card to their next player		f	2025-04-13 13:18:53+02	admin
72	15	3	Na Family Safe!!!	WC		you are immune to one attack for a round		f	2025-04-13 13:18:53+02	admin
73	16	3	Deva	HERO	Please, I kindly request	Take control of the game; draw cards until you have 7.		f	2025-04-13 13:19:41+02	admin
74	16	3	Varadha raja mannar	SR1		Phone call your deva and ask them for a promise, to get immunity for a round. If they are not doing drop two cards.	Pairs with Nibandhana	f	2025-04-13 13:19:41+02	admin
77	16	3	Nibandhana	WC		Varadha may use Nibadhana to start a vote to choose a player. The player with most votes discards 3 cards.		f	2025-04-13 13:19:41+02	admin
78	17	3	Billa	HERO	Trust no one, kill anyone, be only one	Every player drops a card unless they have ACP KrishnaMurthy	You can stop Devil's action	f	2025-04-13 13:20:40+02	admin
79	17	3	Devil	VILLAIN	Good for me bad for you / E deal varake ra ne avasaram	Smuggle 2 cards from pile. only billa can stop. if caught, devil card goes to them.		f	2025-04-13 13:20:40+02	admin
80	17	3	ACP krishnamurthy	SR1	Nuvvu Billa ga maaradaniki ide correct time!	Swap place with previous player	Pairs with Ranga	f	2025-04-13 13:20:40+02	admin
75	16	3	Radha rama mannar	SR2	call for cease fire	No one looses hero card for one round		f	2026-02-04 22:08:37.117871+01	admin
56	12	3	Sivagami	SR2	Idhi naa maata, naa maate shaasanam	Reset: Gather cards from players, shuffle, and redeal all cards equally.	With Bhallala Deva, Steal cards that Amarendra Baahubali rightfully gained in current round.	f	2026-02-10 19:44:31.68499+01	admin
81	17	3	Maya	SR2		Guess who has Billa card and they drop one card. If they have Ranga card instead, all other players drops one card.		f	2025-04-13 13:20:40+02	admin
82	17	3	Ranga	WC	I will be back(act as billa)	Grab Billa card when someone is using it and drop this card	With ACP Krishnamurthy - Act as Billa and Steal two cards from next player	f	2025-04-13 13:20:40+02	admin
83	19	3	Bhairava	HERO	Eesari full ga prepare ayyi vacha	Collect 2 cards as bounty from any player	Pairs with Bujji	f	2025-04-13 13:21:46+02	admin
84	19	3	Supreme Yaskin	VILLAIN	Oka kotha prapancham rabotondi	Swap next player cards with deck cards.	Pairs with Serum	f	2025-04-13 13:21:46+02	admin
85	19	3	Ashwathama	SR1	Amma ni kaapadatam kosam chivari daaka poratam	Unless there is only one opponent, you do not have to discard this card if it is the only card in your hand.		f	2025-04-13 13:21:46+02	admin
86	19	3	Bujji	SR2	Get Ready Bhairava	Take Bhairava anywhere he asks for. Shift to any position in the player circle		f	2025-04-13 13:21:46+02	admin
88	20	3	Saaho	HERO	stadium lo six kottevaadike oka range untadi.	draw cards until you have 5 cards.	pairs with David	f	2025-04-13 13:22:18+02	admin
89	20	3	Devraj	VILLAIN		Next player drops one card.	pairs with black box	f	2025-04-13 13:22:18+02	admin
90	20	3	David	SR1		Hack into the top cards of the deck equal to the number of active players. Rearrange them in any order and place them back on top.		f	2025-04-13 13:22:18+02	admin
91	20	3	Vishwank Roy	SR2		If any player played Saaho this round, discard this card. After that player's turn ends, take the Saaho card.	You have no attacks, just drop the card and watch the action.	f	2025-04-13 13:22:18+02	admin
92	20	3	Blackbox	WC	I will be a fucking billionaire	has the luxury to sit back and relax for two rounds	if Devraj gets hold of this, he can draw cards until your hand is full.	f	2025-04-13 13:22:18+02	admin
93	22	4	Gautham Nanda	HERO	Rich (nak e station kavali)	If you have this card, you can discard any two unwanted cards and draw two new cards from the pile	Everyone is a servant for one round	f	2025-04-13 13:26:12+02	admin
94	22	4	Siddappa	VILLAIN	\N	Steal one card from the opponents' hand, use it if you can, or drop the card	\N	f	2025-04-13 13:26:12+02	admin
95	22	4	Sunanda	SR1	\N	You can get back the card you discarded in the previous game; if not, draw a new card from the deck	\N	f	2025-04-13 13:26:12+02	admin
96	22	4	Baddam Bhaskar	SR2	\N	The player can swap to get one card from any player, but must sacrifice one extra card for that	\N	f	2025-04-13 13:26:12+02	admin
98	26	4	Gabbar Singh	HERO	Nakonchem thikkundhi… Kani daniko lekkundi	Each player exchanges all their cards	\N	f	2025-04-13 13:27:09+02	admin
99	26	4	Siddhappa Naidu	VILLAIN	\N	Can draw two cards from the opponent and must drop any two	\N	f	2025-04-13 13:27:09+02	admin
100	26	4	Recovery Ranjith Kumar	SR1	Mimalni aayudhalutho kaadhu ra, vaayudhalatho champestha	Can skip a round (usable once every three rounds)	\N	f	2025-04-13 13:27:09+02	admin
101	26	4	Ajay	SR2	\N	Can take an extra card from any player by asking but must fulfill their request in return	\N	f	2025-04-13 13:27:09+02	admin
102	26	4	Content Unodiki Cutout Chalu	WC	\N	If the player holds this card along with Recovery Ranjith, they can either gain the Hero card ability or withstand one round	\N	f	2025-04-13 13:27:09+02	admin
103	28	4	Sanjay "Sanju" Sahu	HERO	\N	Can bring back two cards from the discard pile	\N	f	2025-04-13 13:27:49+02	admin
104	28	4	Pranav (Head Constable)	SR1	Batch No. 58, Roll Number 132, Gold Medalist, Topper of the Batch – Pranav the HC		\N	f	2025-04-13 13:27:49+02	admin
105	28	4	Damodar Reddy	VILLAIN	Naku dabbu avasaram appa anthe istam kaadhu | Light aarpalante transformer pelchalsina avasaram ledh appa, switch off chesina chalu	Stop the opponent's Wild Card for one round | Grab two cards from the opponent	\N	f	2025-04-13 13:27:49+02	admin
106	28	4	Bunk Seenu	SR2	\N		\N	f	2025-04-13 13:27:49+02	admin
107	28	4	Yuddham lo gelavatam ante shatruvuni champadam kaadu, shatruvuni odinchadam	WC	The sword used to fight the villain	Player with this card can see all the Wild Cards of opponents	\N	f	2025-04-13 13:27:49+02	admin
108	30	4	Subbu	HERO	\N	If this card is paired with any SR or Wild Card, the player can force opponents to discard cards for the round	\N	f	2025-04-13 13:28:12+02	admin
109	30	4	Chakri	SR1	\N	Can withhold a card for one round only if an SR player asks to drop or shuffle with a Wild Card	\N	f	2025-04-13 13:28:12+02	admin
110	30	4	Rohit (Boxing Champion)	VILLAIN	\N	Can reverse the game and force one opponent to discard a card	\N	f	2025-04-13 13:28:12+02	admin
111	30	4	Jaanu	SR2	\N	Supports the Hero card, doubling its power (X2 effect on Hero abilities) - If the player gets Jaanu without a Hero card, they can take another card from the deck and discard Jaanu - Jaanu can only support a Hero	\N	f	2025-04-13 13:28:12+02	admin
112	30	4	Boxing 🥊	WC	\N	With Subbu → Can eliminate one player from the game | With any other Hero → Can force an opponent to discard one card	\N	f	2025-04-13 13:28:12+02	admin
113	23	4	Badri (Badrinath)	HERO	\N	Player with this card can get one new card from the deck (can play with 6 cards)	\N	f	2025-04-13 13:28:38+02	admin
114	23	4	Ali	SR1	\N	Player with this card can draw a new card from the deck but must drop this card	\N	f	2025-04-13 13:28:38+02	admin
115	23	4	Nanda	VILLAIN	\N	Forces the opponent to exchange two cards	\N	f	2025-04-13 13:28:38+02	admin
116	23	4	Vennela	SR2	\N	Player with this card can exchange an SR card with the opponent	\N	f	2025-04-13 13:28:38+02	admin
117	23	4	Nvu Nanda ithe enti nen Badri Badrinath	WC	\N	Player with this card can ask the opponent to drop all their SR cards	\N	f	2025-04-13 13:28:38+02	admin
118	25	4	Bheemla	HERO	\N	Bomb the deck and shuffle the cards again	\N	f	2025-04-13 13:29:06+02	admin
119	25	4	Daniel	VILLAIN	\N	Force the opponent to play a card of your choice from their hand	\N	f	2025-04-13 13:29:06+02	admin
120	25	4	Kodanda Ram	SR1	\N	Rewind - Undo the last action by the last player	\N	f	2025-04-13 13:29:06+02	admin
121	25	4	Jeevan Kumar	SR2	\N	Blackmail - Forces the opponent to skip their next turn	\N	f	2025-04-13 13:29:06+02	admin
122	25	4	Kokkili Devara	WC	\N	Cancel all current actions and start a new round with the remaining cards. Each player receives an equal number of cards in the new round	\N	f	2025-04-13 13:29:06+02	admin
123	27	4	Gudumba Shankar	HERO	Shankar evari joliki velladu… Vadiki joliki vasthe matram shape shakkalu marchandhe vadaladu	Can ask the opponent to drop all their Villain cards OR Save the Support cards for two rounds	\N	f	2025-04-13 13:29:27+02	admin
124	27	4	Kumaraswamy	VILLAIN	\N		\N	f	2025-04-13 13:29:27+02	admin
125	27	4	Parabrahma Swamy (Brahmi)	SR1	\N	Can check all the Villain cards from the opponents	\N	f	2025-04-13 13:29:27+02	admin
126	27	4	Prabhu (Sunil)	SR2	\N		\N	f	2025-04-13 13:29:27+02	admin
127	27	4	Double Pant & Head Band	WC	\N		\N	f	2025-04-13 13:29:27+02	admin
128	29	4	Jai	HERO	\N	Stun - Prevents other players' Hero cards from being played for two rounds	\N	f	2025-04-13 13:30:01+02	admin
129	29	4	Bhagavan	VILLAIN	\N	Pull a wild card from the opponent and have to sacrifice one SR for this	\N	f	2025-04-13 13:30:01+02	admin
130	29	4	M. Paparayudu	SR1	\N	ask the opponent to drop one card but have to drop another card from your hand (or) pair with any Hero card & ask opponent to discard 2 cards	\N	f	2025-04-13 13:30:01+02	admin
131	29	4	Munna	SR2	\N	with any hero card can save this card	\N	f	2025-04-13 13:30:01+02	admin
132	29	4	Paw / Pistol	WC	Sayam pondhinavadu kruthagnyatha chupinchacka povadam entha thappo, sayam chesina vadu kruthagnyatha asinchadam kuda anthe thapu	can help the player with least number of cards to draw one/ two cards- if the current player has least number he can draw or help others during the lose	\N	f	2025-04-13 13:30:01+02	admin
133	31	4	Adv. Konidela Sathyadev	HERO	\N	Can save/protect any one card for two rounds	\N	f	2025-04-13 13:30:18+02	admin
134	31	4	Viswa	VILLAIN	\N	Controls the next player, deciding which card they must choose for the play	\N	f	2025-04-13 13:30:18+02	admin
135	31	4	Pallavi	SR1	\N	Protects the SR cards for one round	\N	f	2025-04-13 13:30:18+02	admin
136	31	4	Nanda Gopal (Lawyer)	SR2	\N	Player with this card can pull any card from the opponent	\N	f	2025-04-13 13:30:18+02	admin
137	31	4	Courtroom Drama	WC	\N	Forces all players to reveal one of their cards, allowing you to choose any card to eliminate (even Salaar card, making it possible to remove powerful heroes)	\N	f	2025-04-13 13:30:18+02	admin
138	18	3	Chatrapathi	HERO	okka adugu..okkka adugu...!!!	Challenge the next player to a Chatrapathi dialogue battle; the winner takes 2 cards from the loser.	Pairs with Appalanaidu.	f	2025-04-14 13:12:44+02	admin
139	18	3	Ashok	VILLAIN	Rendu chavulu jaragali... vasakolla	Sneak two cards from next player		f	2025-04-14 13:13:58+02	admin
140	18	3	Appala Naidu	SR1	Raajakeeyam, rowdyism okkati kaadu ra rey	Reverse the game direction	Pairs with chatrapathi:\nRedirect any incoming attack back to the player who played it on you.	f	2025-04-14 13:15:01+02	admin
141	18	3	Mahesh Nanda	SR2	No No control yourself...!!!	Any player with highest num of cards should drop a card		f	2025-04-14 13:15:57+02	admin
143	21	3	Venkat	HERO	sailu kosam 10 sarlu chaavadaniki nen ready! Nuvvu ready aah?	Challenge two players to enact the Gali Gannarao–Sunil episode; the act must be approved by the other players, or they must drop two cards each.		f	2025-04-14 13:22:46+02	admin
144	21	3	Bhadranna	VILLAIN	vaadu hero avvakoodadhu...	Swap all your cards with the opponent having the highest number of cards.		f	2025-04-14 13:23:32+02	admin
145	21	3	Lola Ranga Rao	SR1	naaku nee face nachaledu	Next player cannot cast cards for the next two turns, but other players may still cast actions on them		f	2025-04-14 13:24:16+02	admin
147	32	7	Harsha/Kalabhairava	HERO	Okokkarini kaadhu Sher Khan Vanda Mandhini okesari rammanu	Harsha: Has Ability to take 2 cards from the deck	Kala Bhairava: Can Slash 2 cards of the opponent 	t	2025-04-19 22:55:54+02	admin
148	32	7	Randhev Billa	VILLAIN	Naku Dhakkanidhi inkevariki Dhakkanivvanu	If the opponent has the INDU card, Can snatch the card from them		f	2025-04-19 23:14:01+02	admin
149	33	6	Bantu	HERO		Save the Hand for one round and with ARK card he can get half of the cards from the deck (extra cards)		f	2025-04-26 18:30:15+02	admin
150	33	6	Appala Naidu	VILLAIN		Can kidnap (take a card from any one player)		f	2025-04-26 18:30:46+02	admin
151	33	6	Valmiki	SR1		Swaps a single card with the opponent		f	2025-04-26 18:31:09+02	admin
152	33	6	ARK (Thatha)	SR2		Player with this card can can break half of the players hand and ask them to take remaining half from the deck		f	2025-04-26 18:31:33+02	admin
153	33	6	Nurse Sulochana	WC		Player with card can see the other cards if swap happens (any round)		f	2025-04-26 18:31:55+02	admin
154	34	6	 Lucky	HERO		Connect with any SR and ask the opponent to drop villain card or take a any SR from opponent to connect		f	2025-04-26 18:32:53+02	admin
155	34	6	Maddali Shiva Reddy	VILLAIN	you are finished!! / Maddali shiva reddy	will blackmail one opponent to drop two cards or give an option to the opponents to pluck one card from others		f	2025-04-26 18:33:35+02	admin
156	34	6	Spandana	SR1	 Inside feeling	No use just hold the card and feel inside		f	2025-04-26 18:34:07+02	admin
157	34	6	Kill bill pandey	SR2	Bariloki dimpodhu brutal ipotha 	With any hero card + kill bill card - ask the opponent villain card to drop but has to sacrifice kill bill card		f	2025-04-26 18:34:59+02	admin
158	34	6	Devudddaa!!! / Connect ipoyav	WC		Able to get one card from the used cards - connect avvali		f	2025-04-26 18:35:24+02	admin
159	35	6	Ravindra Narayan	HERO	Class lo Evadaina Samadhanam Chepthadu kani Game Lo Cheppevaade...	Take a look at any of your opponent's deck secretly and pick any one card		f	2025-04-29 20:10:47+02	admin
160	35	6	Bittu	VILLAIN	Manaki Telsina pani free ga cheyakudadhu, Manaki raani pani try cheyakudadhu	NA		f	2025-04-29 20:17:57+02	admin
161	35	6	DIG Sitaram	SR1	veediki konchem povvulni ammayilani choopinchandra mari voilent ga unnadu	everyone gives you a heroine card to you		f	2025-04-29 20:19:17+02	admin
163	19	3	Serum	WC	Vasthunnay, vasthunnay, jagannatha ratha chakralu vasthunnay.	Regain the lost number of cards in the previous round from the deck	pairs with Yaskin, eliminate any one player.	f	2026-01-04 12:51:37+01	admin
164	16	3	Rudhra Raja Mannar	VILLAIN		Each player places 1 card face down. Shuffle these cards to create a new deck for the next round		f	2026-01-04 15:11:43+01	admin
166	21	3	Varsham	WC	NA	Ask any player to call for rain. If it doesn't rain, they lose one card.		f	2026-01-05 18:05:30+01	admin
167	18	3	Chembuu!!	WC		Replicate chembuu scene and get immunity for 2 rounds.(Must have at least two cards to use the ability)		f	2026-01-06 07:25:18+01	admin
55	12	3	Kattappa	SR1	Simhasananiki kattu baanisani	With Sivagami. When Baahubali is played this round, reveal Sivagami and Kattappa to capture him.	With Amarendra Bahubali to dodge elimination by retaining kattappa and dropping Bahubali card.	f	2026-02-04 22:27:14.59325+01	admin
146	21	3	Gun, The Jagan	SR2	vethuku vethakali vethikithe dorakandantu emi undadu...	Swap any two cards in your hand with two cards from the deck.		f	2026-02-04 22:08:41.491976+01	admin
53	12	3	Amarendra Baahubali	HERO	Jai Mahishmathi	Take two cards from next player of your choice	pairs with kattappa	f	2026-02-10 19:48:17.034142+01	admin
97	22	4	Ekkada neggalo kaadhu ekada taggalo telsina vaadu goppodu	WC	\N	If the player holds this card, they can save five cards for one round	\N	f	2026-02-10 22:54:18.492434+01	admin
\.


--
-- Data for Name: games; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.games (id, name, slug, type, last_update_dt, last_update_user) FROM stdin;
1	Talkies	talkies	CARDS	2025-04-03 16:12:33+02	admin
\.


--
-- Data for Name: heroes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.heroes (id, name, industry, game_id, last_update_dt, last_update_user) FROM stdin;
1	Jr NTR	TELUGU	1	2025-04-03 16:12:33+02	admin
3	Prabhas	TELUGU	1	2025-04-13 13:08:51+02	admin
4	Pawan Kalyan	TELUGU	1	2025-04-13 13:23:30+02	admin
5	Nani	TELUGU	1	2025-04-13 13:40:43+02	admin
6	Allu Arjunnn	TELUGU	1	2025-04-13 13:40:54+02	admin
7	Ram Charan	TELUGU	1	2025-04-13 13:41:10+02	admin
8	Mahesh Babu	TELUGU	1	2025-04-13 13:41:33+02	admin
2	Jack (for testing)	TELUGU	1	2026-02-03 22:28:14.591013+01	admin
\.


--
-- Data for Name: movies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.movies (id, hero_id, title, need_review, last_update_dt, last_update_user, locked) FROM stdin;
1	1	Yamadonga	f	2025-04-03 16:12:33+02	admin	f
2	1	Aadi	f	2025-04-03 16:12:33+02	admin	f
3	1	Devara	f	2025-04-03 16:12:33+02	admin	f
4	1	Janatha Garage	f	2025-04-03 16:12:33+02	admin	f
5	1	Nannaku Prematho	f	2025-04-03 16:12:33+02	admin	f
6	1	Baadshah	f	2025-04-03 16:12:33+02	admin	f
7	1	Aravinda Sametha Veera Raghava	f	2025-04-03 16:12:33+02	admin	f
8	1	Jai Lava Kusa	f	2025-04-03 16:12:33+02	admin	f
9	1	Temper	f	2025-04-03 16:12:33+02	admin	f
10	1	Adhurs	f	2025-04-03 16:12:33+02	admin	f
11	2	Kannappa - The Snow Tester	f	2025-04-07 22:55:54+02	admin	f
13	3	Bujjigadu	f	2025-04-13 13:11:55+02	admin	t
14	3	Darling	f	2025-04-13 13:11:55+02	admin	t
15	3	Mirchi	f	2025-04-13 13:11:55+02	admin	t
16	3	Salaar	f	2025-04-13 13:11:55+02	admin	t
17	3	Billa	f	2025-04-13 13:11:55+02	admin	t
18	3	Chatrapathi	f	2025-04-13 13:11:55+02	admin	t
19	3	Kalki 2898 AD	f	2025-04-13 13:11:55+02	admin	t
21	3	Varsham	f	2025-04-13 13:11:55+02	admin	t
23	4	Badri	f	2025-04-13 13:24:13+02	admin	f
24	4	Balu	f	2025-04-13 13:24:13+02	admin	f
25	4	Bheemla Nayak	f	2025-04-13 13:24:13+02	admin	f
26	4	Gabbar Singh	f	2025-04-13 13:24:13+02	admin	f
27	4	Gudumba Shankar	f	2025-04-13 13:24:13+02	admin	f
28	4	Jalsa	f	2025-04-13 13:24:13+02	admin	f
29	4	Panjaa	f	2025-04-13 13:24:13+02	admin	f
30	4	Thammudu	f	2025-04-13 13:24:13+02	admin	f
31	4	Vakeel Saab	f	2025-04-13 13:24:13+02	admin	f
32	7	Magadheera	f	2025-04-19 20:06:58+02	admin	f
34	6	Race Gurram	f	2025-04-26 18:32:32+02	admin	f
35	6	Julayi	f	2025-04-29 19:54:02+02	admin	f
20	3	Saaho	f	2026-02-03 23:50:23.51972+01	admin	t
12	3	Baahubali	f	2026-02-11 19:56:07.553703+01	admin	t
22	4	Attarintiki Daredi	f	2026-02-12 22:55:54.733338+01	admin	f
33	6	Ala Vaikuntapuramlo	f	2026-02-16 18:38:38.312656+01	admin	t
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permissions (id, name, description, created_at) FROM stdin;
1	users:create	Create new users	2026-02-16 17:41:23.593842
2	users:read	View user information	2026-02-16 17:41:23.593842
3	users:update	Update user information	2026-02-16 17:41:23.593842
4	users:delete	Delete users	2026-02-16 17:41:23.593842
5	games:create	Create new games	2026-02-16 17:41:23.593842
6	games:read	View games	2026-02-16 17:41:23.593842
7	games:update	Update games	2026-02-16 17:41:23.593842
8	games:delete	Delete games	2026-02-16 17:41:23.593842
9	heroes:create	Create new heroes	2026-02-16 17:41:23.593842
10	heroes:read	View heroes	2026-02-16 17:41:23.593842
11	heroes:update	Update heroes	2026-02-16 17:41:23.593842
12	heroes:delete	Delete heroes	2026-02-16 17:41:23.593842
13	movies:create	Create new movies	2026-02-16 17:41:23.593842
14	movies:read	View movies	2026-02-16 17:41:23.593842
15	movies:update	Update movies	2026-02-16 17:41:23.593842
16	movies:delete	Delete movies	2026-02-16 17:41:23.593842
17	cards:create	Create new cards	2026-02-16 17:41:23.593842
18	cards:read	View cards	2026-02-16 17:41:23.593842
19	cards:update	Update cards	2026-02-16 17:41:23.593842
20	cards:delete	Delete cards	2026-02-16 17:41:23.593842
21	tags:create	Create new tags	2026-02-16 17:41:23.593842
22	tags:read	View tags	2026-02-16 17:41:23.593842
23	tags:update	Update tags	2026-02-16 17:41:23.593842
24	tags:delete	Delete tags	2026-02-16 17:41:23.593842
25	roles:create	Create new roles	2026-02-16 17:41:23.593842
26	roles:read	View roles	2026-02-16 17:41:23.593842
27	roles:update	Update roles	2026-02-16 17:41:23.593842
28	roles:delete	Delete roles	2026-02-16 17:41:23.593842
29	permissions:create	Create new permissions	2026-02-16 17:41:23.593842
30	permissions:read	View permissions	2026-02-16 17:41:23.593842
31	permissions:update	Update permissions	2026-02-16 17:41:23.593842
32	permissions:delete	Delete permissions	2026-02-16 17:41:23.593842
33	user_management:create	Create users, roles, and permissions	2026-02-16 18:30:22.029521
34	user_management:read	View users, roles, and permissions	2026-02-16 18:30:22.029521
35	user_management:update	Update users, roles, and permissions	2026-02-16 18:30:22.029521
36	user_management:delete	Delete users, roles, and permissions	2026-02-16 18:30:22.029521
41	talkies:create	Create heroes, movies, cards, and tags	2026-02-16 18:30:22.029521
42	talkies:read	View heroes, movies, cards, and tags	2026-02-16 18:30:22.029521
43	talkies:update	Update heroes, movies, cards, and tags	2026-02-16 18:30:22.029521
44	talkies:delete	Delete heroes, movies, cards, and tags	2026-02-16 18:30:22.029521
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permissions (id, role_id, permission_id, created_at) FROM stdin;
1	1	1	2026-02-16 17:41:23.608016
2	1	2	2026-02-16 17:41:23.608016
3	1	3	2026-02-16 17:41:23.608016
4	1	4	2026-02-16 17:41:23.608016
5	1	5	2026-02-16 17:41:23.608016
6	1	6	2026-02-16 17:41:23.608016
7	1	7	2026-02-16 17:41:23.608016
8	1	8	2026-02-16 17:41:23.608016
9	1	9	2026-02-16 17:41:23.608016
10	1	10	2026-02-16 17:41:23.608016
11	1	11	2026-02-16 17:41:23.608016
12	1	12	2026-02-16 17:41:23.608016
13	1	13	2026-02-16 17:41:23.608016
14	1	14	2026-02-16 17:41:23.608016
15	1	15	2026-02-16 17:41:23.608016
16	1	16	2026-02-16 17:41:23.608016
17	1	17	2026-02-16 17:41:23.608016
18	1	18	2026-02-16 17:41:23.608016
19	1	19	2026-02-16 17:41:23.608016
20	1	20	2026-02-16 17:41:23.608016
21	1	21	2026-02-16 17:41:23.608016
22	1	22	2026-02-16 17:41:23.608016
23	1	23	2026-02-16 17:41:23.608016
24	1	24	2026-02-16 17:41:23.608016
25	1	25	2026-02-16 17:41:23.608016
26	1	26	2026-02-16 17:41:23.608016
27	1	27	2026-02-16 17:41:23.608016
28	1	28	2026-02-16 17:41:23.608016
29	1	29	2026-02-16 17:41:23.608016
30	1	30	2026-02-16 17:41:23.608016
31	1	31	2026-02-16 17:41:23.608016
32	1	32	2026-02-16 17:41:23.608016
33	2	5	2026-02-16 17:41:23.616887
34	2	6	2026-02-16 17:41:23.616887
35	2	7	2026-02-16 17:41:23.616887
36	2	8	2026-02-16 17:41:23.616887
37	2	9	2026-02-16 17:41:23.616887
38	2	10	2026-02-16 17:41:23.616887
39	2	11	2026-02-16 17:41:23.616887
40	2	12	2026-02-16 17:41:23.616887
41	2	13	2026-02-16 17:41:23.616887
42	2	14	2026-02-16 17:41:23.616887
43	2	15	2026-02-16 17:41:23.616887
44	2	16	2026-02-16 17:41:23.616887
45	2	17	2026-02-16 17:41:23.616887
46	2	18	2026-02-16 17:41:23.616887
47	2	19	2026-02-16 17:41:23.616887
48	2	20	2026-02-16 17:41:23.616887
49	2	21	2026-02-16 17:41:23.616887
50	2	22	2026-02-16 17:41:23.616887
51	2	23	2026-02-16 17:41:23.616887
52	2	24	2026-02-16 17:41:23.616887
108	1	33	2026-02-16 18:30:22.04345
109	1	34	2026-02-16 18:30:22.04345
110	1	35	2026-02-16 18:30:22.04345
111	1	36	2026-02-16 18:30:22.04345
112	1	41	2026-02-16 18:30:22.04345
113	1	42	2026-02-16 18:30:22.04345
114	1	43	2026-02-16 18:30:22.04345
115	1	44	2026-02-16 18:30:22.04345
117	2	41	2026-02-16 18:30:22.051358
118	2	42	2026-02-16 18:30:22.051358
119	2	43	2026-02-16 18:30:22.051358
120	2	44	2026-02-16 18:30:22.051358
250	3	18	2026-02-16 21:42:51.589945
251	3	6	2026-02-16 21:42:51.60831
252	3	10	2026-02-16 21:42:51.615075
253	3	14	2026-02-16 21:42:51.63396
254	3	22	2026-02-16 21:42:51.643855
255	3	42	2026-02-16 21:42:51.659238
256	3	21	2026-02-16 21:42:51.669141
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name) FROM stdin;
1	admin
2	editor
3	designer
4	reviewer
5	viewer
\.


--
-- Data for Name: system_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_roles (id, name, description, created_at, updated_at) FROM stdin;
1	admin	Full system access - all permissions	2026-02-16 17:41:23.601013	2026-02-16 17:41:23.601013
2	editor	Can manage game content (heroes, movies, cards, tags)	2026-02-16 17:41:23.601013	2026-02-16 17:41:23.601013
3	viewer	Read-only access to all content	2026-02-16 17:41:23.601013	2026-02-16 17:41:23.601013
\.


--
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tags (id, name) FROM stdin;
1	Attack
2	Defense
3	Activity
4	Deck-Control
5	Disruption
6	Hand-Fix
7	Next-Player
8	Any-Player
9	Pair-Up
10	Elimination
\.


--
-- Name: cards_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cards_id_seq', 171, true);


--
-- Name: games_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.games_id_seq', 1, true);


--
-- Name: heroes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.heroes_id_seq', 13, true);


--
-- Name: movies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.movies_id_seq', 37, true);


--
-- Name: password_resets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.password_resets_id_seq', 7, true);


--
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.permissions_id_seq', 72, true);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 8, true);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.role_permissions_id_seq', 256, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 5, true);


--
-- Name: system_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.system_roles_id_seq', 6, true);


--
-- Name: tags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tags_id_seq', 14, true);


--
-- Name: user_game_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_game_roles_id_seq', 9, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 8, true);


--
-- Name: card_tags card_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.card_tags
    ADD CONSTRAINT card_tags_pkey PRIMARY KEY (card_id, tag_id);


--
-- Name: cards cards_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cards
    ADD CONSTRAINT cards_pkey PRIMARY KEY (id);


--
-- Name: games games_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_name_key UNIQUE (name);


--
-- Name: games games_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_pkey PRIMARY KEY (id);


--
-- Name: games games_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_slug_key UNIQUE (slug);


--
-- Name: heroes heroes_game_id_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.heroes
    ADD CONSTRAINT heroes_game_id_name_key UNIQUE (game_id, name);


--
-- Name: heroes heroes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.heroes
    ADD CONSTRAINT heroes_pkey PRIMARY KEY (id);


--
-- Name: movies movies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movies
    ADD CONSTRAINT movies_pkey PRIMARY KEY (id);


--
-- Name: password_resets password_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_pkey PRIMARY KEY (id);


--
-- Name: password_resets password_resets_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_token_key UNIQUE (token);


--
-- Name: permissions permissions_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key UNIQUE (name);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_key UNIQUE (token);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_role_id_permission_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_permission_id_key UNIQUE (role_id, permission_id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: system_roles system_roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_roles
    ADD CONSTRAINT system_roles_name_key UNIQUE (name);


--
-- Name: system_roles system_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_roles
    ADD CONSTRAINT system_roles_pkey PRIMARY KEY (id);


--
-- Name: tags tags_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_name_key UNIQUE (name);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: user_game_roles user_game_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_game_roles
    ADD CONSTRAINT user_game_roles_pkey PRIMARY KEY (id);


--
-- Name: user_game_roles user_game_roles_user_id_game_id_role_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_game_roles
    ADD CONSTRAINT user_game_roles_user_id_game_id_role_id_key UNIQUE (user_id, game_id, role_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_card_tags_card_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_card_tags_card_id ON public.card_tags USING btree (card_id);


--
-- Name: idx_card_tags_tag_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_card_tags_tag_id ON public.card_tags USING btree (tag_id);


--
-- Name: idx_cards_hero_movie_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_cards_hero_movie_name ON public.cards USING btree (hero_id, movie_id, name);


--
-- Name: idx_hero_stats_game_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hero_stats_game_id ON public.hero_stats USING btree (game_id);


--
-- Name: idx_hero_stats_hero_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_hero_stats_hero_id ON public.hero_stats USING btree (hero_id);


--
-- Name: idx_hero_stats_industry; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hero_stats_industry ON public.hero_stats USING btree (industry);


--
-- Name: idx_heroes_game_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_heroes_game_id ON public.heroes USING btree (game_id);


--
-- Name: idx_movie_stats_done; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_movie_stats_done ON public.movie_stats USING btree (done);


--
-- Name: idx_movie_stats_hero_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_movie_stats_hero_id ON public.movie_stats USING btree (hero_id);


--
-- Name: idx_movie_stats_movie_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_movie_stats_movie_id ON public.movie_stats USING btree (movie_id);


--
-- Name: idx_movies_hero_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_movies_hero_id ON public.movies USING btree (hero_id);


--
-- Name: idx_movies_hero_title; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_movies_hero_title ON public.movies USING btree (hero_id, title);


--
-- Name: idx_role_permissions_permission_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_role_permissions_permission_id ON public.role_permissions USING btree (permission_id);


--
-- Name: idx_role_permissions_role_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_role_permissions_role_id ON public.role_permissions USING btree (role_id);


--
-- Name: idx_tag_stats_card_count; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tag_stats_card_count ON public.tag_stats USING btree (card_count DESC);


--
-- Name: idx_tag_stats_tag_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_tag_stats_tag_id ON public.tag_stats USING btree (tag_id);


--
-- Name: idx_users_role_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role_id ON public.users USING btree (role_id);


--
-- Name: heroes trigger_refresh_hero_stats_on_hero_change; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_refresh_hero_stats_on_hero_change AFTER INSERT OR DELETE OR UPDATE ON public.heroes FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_hero_stats_trigger();


--
-- Name: movies trigger_refresh_hero_stats_on_movie_change; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_refresh_hero_stats_on_movie_change AFTER INSERT OR DELETE OR UPDATE ON public.movies FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_hero_stats_trigger();


--
-- Name: cards trigger_refresh_movie_stats_on_card_change; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_refresh_movie_stats_on_card_change AFTER INSERT OR DELETE OR UPDATE ON public.cards FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_movie_stats_trigger();


--
-- Name: movies trigger_refresh_movie_stats_on_movie_change; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_refresh_movie_stats_on_movie_change AFTER INSERT OR DELETE OR UPDATE ON public.movies FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_movie_stats_trigger();


--
-- Name: card_tags card_tags_card_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.card_tags
    ADD CONSTRAINT card_tags_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.cards(id) ON DELETE CASCADE;


--
-- Name: card_tags card_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.card_tags
    ADD CONSTRAINT card_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;


--
-- Name: cards cards_hero_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cards
    ADD CONSTRAINT cards_hero_id_fkey FOREIGN KEY (hero_id) REFERENCES public.heroes(id) ON DELETE CASCADE;


--
-- Name: cards cards_movie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cards
    ADD CONSTRAINT cards_movie_id_fkey FOREIGN KEY (movie_id) REFERENCES public.movies(id) ON DELETE CASCADE;


--
-- Name: heroes heroes_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.heroes
    ADD CONSTRAINT heroes_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE;


--
-- Name: movies movies_hero_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movies
    ADD CONSTRAINT movies_hero_id_fkey FOREIGN KEY (hero_id) REFERENCES public.heroes(id) ON DELETE CASCADE;


--
-- Name: password_resets password_resets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.system_roles(id) ON DELETE CASCADE;


--
-- Name: user_game_roles user_game_roles_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_game_roles
    ADD CONSTRAINT user_game_roles_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE;


--
-- Name: user_game_roles user_game_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_game_roles
    ADD CONSTRAINT user_game_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: user_game_roles user_game_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_game_roles
    ADD CONSTRAINT user_game_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.system_roles(id) ON DELETE SET NULL;


--
-- Name: movie_stats; Type: MATERIALIZED VIEW DATA; Schema: public; Owner: postgres
--

REFRESH MATERIALIZED VIEW public.movie_stats;


--
-- Name: hero_stats; Type: MATERIALIZED VIEW DATA; Schema: public; Owner: postgres
--

REFRESH MATERIALIZED VIEW public.hero_stats;


--
-- Name: tag_stats; Type: MATERIALIZED VIEW DATA; Schema: public; Owner: postgres
--

REFRESH MATERIALIZED VIEW public.tag_stats;


--
-- PostgreSQL database dump complete
--

\unrestrict PIrgSJSI6cVGA60HmXlr8fG7DbFuTPQX7Aju3XD4H4vsy9iCbyVN5cXZLcV2a2E

