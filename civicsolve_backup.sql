--
-- PostgreSQL database dump
--

\restrict LnntfjUr5DIANDe0wr7dceeBDUn01VXlCF88nbo2ZzY12SIMBTLuoUY6r7dLqgH

-- Dumped from database version 18.2
-- Dumped by pg_dump version 18.2

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
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_users (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.admin_users OWNER TO postgres;

--
-- Name: admin_users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admin_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_users_id_seq OWNER TO postgres;

--
-- Name: admin_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admin_users_id_seq OWNED BY public.admin_users.id;


--
-- Name: citizen_cases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.citizen_cases (
    case_reference text NOT NULL,
    status text DEFAULT 'RECEIVED'::text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    problem_id integer,
    CONSTRAINT citizen_cases_status_check CHECK ((status = ANY (ARRAY['RECEIVED'::text, 'PROCESSING'::text, 'PROCESSED'::text, 'FAILED'::text])))
);


ALTER TABLE public.citizen_cases OWNER TO postgres;

--
-- Name: faculties; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.faculties (
    id integer NOT NULL,
    university_id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    department text NOT NULL,
    expertise text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.faculties OWNER TO postgres;

--
-- Name: faculties_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.faculties_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.faculties_id_seq OWNER TO postgres;

--
-- Name: faculties_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.faculties_id_seq OWNED BY public.faculties.id;


--
-- Name: faculty_guidance_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.faculty_guidance_requests (
    id integer NOT NULL,
    student_id integer NOT NULL,
    faculty_id integer NOT NULL,
    problem_id integer NOT NULL,
    team_id integer,
    message text,
    status text DEFAULT 'PENDING'::text NOT NULL,
    response_token text NOT NULL,
    requested_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    responded_at timestamp without time zone,
    CONSTRAINT faculty_guidance_requests_status_check CHECK ((status = ANY (ARRAY['PENDING'::text, 'ACCEPTED'::text, 'DENIED'::text])))
);


ALTER TABLE public.faculty_guidance_requests OWNER TO postgres;

--
-- Name: faculty_guidance_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.faculty_guidance_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.faculty_guidance_requests_id_seq OWNER TO postgres;

--
-- Name: faculty_guidance_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.faculty_guidance_requests_id_seq OWNED BY public.faculty_guidance_requests.id;


--
-- Name: gov_access_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gov_access_log (
    id integer NOT NULL,
    gov_user_id integer NOT NULL,
    problem_id integer,
    student_id integer,
    action text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.gov_access_log OWNER TO postgres;

--
-- Name: gov_access_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.gov_access_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gov_access_log_id_seq OWNER TO postgres;

--
-- Name: gov_access_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.gov_access_log_id_seq OWNED BY public.gov_access_log.id;


--
-- Name: government_actions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.government_actions (
    id integer NOT NULL,
    gov_user_id integer NOT NULL,
    problem_id integer NOT NULL,
    action_type text NOT NULL,
    remarks text,
    budget_estimate numeric,
    timeline_days integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT government_actions_action_type_check CHECK ((action_type = ANY (ARRAY['ACKNOWLEDGED'::text, 'IN_PROGRESS'::text, 'BUDGET_ALLOCATED'::text, 'RESOLVED'::text, 'DISMISSED_FAKE'::text, 'DISMISSED_DUPLICATE'::text, 'CLOSED_EXTERNAL'::text])))
);


ALTER TABLE public.government_actions OWNER TO postgres;

--
-- Name: government_actions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.government_actions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.government_actions_id_seq OWNER TO postgres;

--
-- Name: government_actions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.government_actions_id_seq OWNED BY public.government_actions.id;


--
-- Name: government_otps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.government_otps (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    otp_hash text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    attempts integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.government_otps OWNER TO postgres;

--
-- Name: government_otps_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.government_otps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.government_otps_id_seq OWNER TO postgres;

--
-- Name: government_otps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.government_otps_id_seq OWNED BY public.government_otps.id;


--
-- Name: government_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.government_users (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    department text NOT NULL,
    jurisdiction_city text NOT NULL,
    jurisdiction_state text NOT NULL,
    phone text NOT NULL,
    email_verified boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    account_status text DEFAULT 'PENDING'::text NOT NULL,
    employee_id text,
    reviewed_by integer,
    reviewed_at timestamp without time zone,
    rejection_reason text,
    CONSTRAINT government_users_account_status_check CHECK ((account_status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'REJECTED'::text, 'SUSPENDED'::text])))
);


ALTER TABLE public.government_users OWNER TO postgres;

--
-- Name: government_users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.government_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.government_users_id_seq OWNER TO postgres;

--
-- Name: government_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.government_users_id_seq OWNED BY public.government_users.id;


--
-- Name: industries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.industries (
    id integer NOT NULL,
    company_name text NOT NULL,
    email text NOT NULL,
    domain text NOT NULL,
    password_hash text NOT NULL,
    contact_person text NOT NULL,
    designation text NOT NULL,
    phone text NOT NULL,
    sector text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    website text,
    email_verified boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.industries OWNER TO postgres;

--
-- Name: industries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.industries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.industries_id_seq OWNER TO postgres;

--
-- Name: industries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.industries_id_seq OWNED BY public.industries.id;


--
-- Name: industry_otps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.industry_otps (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    otp_hash text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    attempts integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.industry_otps OWNER TO postgres;

--
-- Name: industry_otps_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.industry_otps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.industry_otps_id_seq OWNER TO postgres;

--
-- Name: industry_otps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.industry_otps_id_seq OWNED BY public.industry_otps.id;


--
-- Name: industry_problem_adoptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.industry_problem_adoptions (
    id integer NOT NULL,
    industry_id integer NOT NULL,
    problem_id integer NOT NULL,
    commitment_type text NOT NULL,
    status text DEFAULT 'EVALUATING'::text NOT NULL,
    notes text,
    budget_estimate numeric DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT industry_problem_adoptions_commitment_type_check CHECK ((commitment_type = ANY (ARRAY['MENTORSHIP'::text, 'PILOT_FUNDING'::text, 'HARDWARE_RESOURCES'::text, 'FIELD_DEPLOYMENT'::text]))),
    CONSTRAINT industry_problem_adoptions_status_check CHECK ((status = ANY (ARRAY['EVALUATING'::text, 'ACTIVE'::text, 'PILOT_DEPLOYED'::text, 'RESOLVED'::text])))
);


ALTER TABLE public.industry_problem_adoptions OWNER TO postgres;

--
-- Name: industry_problem_adoptions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.industry_problem_adoptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.industry_problem_adoptions_id_seq OWNER TO postgres;

--
-- Name: industry_problem_adoptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.industry_problem_adoptions_id_seq OWNED BY public.industry_problem_adoptions.id;


--
-- Name: industry_solution_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.industry_solution_reviews (
    id integer NOT NULL,
    industry_id integer NOT NULL,
    student_problem_id integer NOT NULL,
    review_text text NOT NULL,
    rating integer NOT NULL,
    pilot_interest boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT industry_solution_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.industry_solution_reviews OWNER TO postgres;

--
-- Name: industry_solution_reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.industry_solution_reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.industry_solution_reviews_id_seq OWNER TO postgres;

--
-- Name: industry_solution_reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.industry_solution_reviews_id_seq OWNED BY public.industry_solution_reviews.id;


--
-- Name: industry_team_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.industry_team_messages (
    id integer NOT NULL,
    industry_id integer NOT NULL,
    team_id integer NOT NULL,
    problem_id integer NOT NULL,
    sender_type text NOT NULL,
    sender_student_id integer,
    message text NOT NULL,
    is_read_by_industry boolean DEFAULT false NOT NULL,
    is_read_by_team boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT industry_team_messages_sender_type_check CHECK ((sender_type = ANY (ARRAY['INDUSTRY'::text, 'STUDENT'::text])))
);


ALTER TABLE public.industry_team_messages OWNER TO postgres;

--
-- Name: industry_team_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.industry_team_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.industry_team_messages_id_seq OWNER TO postgres;

--
-- Name: industry_team_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.industry_team_messages_id_seq OWNED BY public.industry_team_messages.id;


--
-- Name: problem_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.problem_reports (
    id integer NOT NULL,
    problem_id integer NOT NULL,
    report_text text,
    latitude double precision,
    longitude double precision,
    image_path text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    case_reference text,
    intake_id text,
    address text,
    evidence jsonb DEFAULT '[]'::jsonb NOT NULL
);


ALTER TABLE public.problem_reports OWNER TO postgres;

--
-- Name: problem_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.problem_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.problem_reports_id_seq OWNER TO postgres;

--
-- Name: problem_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.problem_reports_id_seq OWNED BY public.problem_reports.id;


--
-- Name: reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reports (
    id integer NOT NULL,
    report_text text NOT NULL,
    problem_title text,
    problem_description text,
    domain text,
    responsible_fields text[],
    severity text,
    confidence double precision,
    image_path text,
    image_description text,
    embedding public.vector(384),
    locations jsonb DEFAULT '[]'::jsonb,
    verification_status text DEFAULT 'RECEIVED'::text CONSTRAINT reports_status_not_null NOT NULL,
    status_reason text,
    status_set_by integer,
    status_set_at timestamp without time zone,
    ai_brief jsonb,
    ai_brief_generated_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    priority_score integer,
    verification_notes text,
    verified_by integer,
    verified_at timestamp without time zone,
    published_at timestamp without time zone,
    rejection_reason text,
    status text DEFAULT 'OPEN'::text CONSTRAINT reports_status_not_null1 NOT NULL,
    gov_review_status text DEFAULT 'PENDING_REVIEW'::text NOT NULL,
    discard_reason text,
    reviewed_by integer,
    reviewed_at timestamp without time zone,
    review_remarks text,
    CONSTRAINT reports_gov_review_status_check CHECK ((gov_review_status = ANY (ARRAY['DISCARDED'::text, 'PENDING_REVIEW'::text, 'GOV_APPROVED'::text, 'GOV_REJECTED'::text]))),
    CONSTRAINT reports_priority_score_check CHECK (((priority_score >= 0) AND (priority_score <= 100))),
    CONSTRAINT reports_status_check CHECK ((status = ANY (ARRAY['OPEN'::text, 'IN_PROGRESS'::text, 'RESOLVED'::text, 'DISMISSED_FAKE'::text, 'DISMISSED_DUPLICATE'::text, 'CLOSED_EXTERNAL'::text]))),
    CONSTRAINT reports_verification_status_check CHECK ((verification_status = ANY (ARRAY['RECEIVED'::text, 'AI_PROCESSED'::text, 'UNDER_VERIFICATION'::text, 'NEEDS_INFORMATION'::text, 'REJECTED'::text, 'VERIFIED'::text, 'PUBLISHED'::text, 'IN_PROGRESS'::text, 'RESOLVED'::text])))
);


ALTER TABLE public.reports OWNER TO postgres;

--
-- Name: reports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reports_id_seq OWNER TO postgres;

--
-- Name: reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reports_id_seq OWNED BY public.reports.id;


--
-- Name: student_otps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_otps (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    otp_hash text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    attempts integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.student_otps OWNER TO postgres;

--
-- Name: student_otps_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.student_otps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.student_otps_id_seq OWNER TO postgres;

--
-- Name: student_otps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.student_otps_id_seq OWNED BY public.student_otps.id;


--
-- Name: student_problems; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_problems (
    id integer NOT NULL,
    student_id integer NOT NULL,
    problem_id integer NOT NULL,
    status text DEFAULT 'INTERESTED'::text NOT NULL,
    joined_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    solution_text text,
    solution_submitted_at timestamp without time zone,
    share_contact boolean DEFAULT false NOT NULL,
    removed_by_gov boolean DEFAULT false NOT NULL,
    removal_reason text,
    CONSTRAINT student_problems_status_check CHECK ((status = ANY (ARRAY['INTERESTED'::text, 'WORKING'::text, 'COMPLETED'::text])))
);


ALTER TABLE public.student_problems OWNER TO postgres;

--
-- Name: student_problems_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.student_problems_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.student_problems_id_seq OWNER TO postgres;

--
-- Name: student_problems_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.student_problems_id_seq OWNED BY public.student_problems.id;


--
-- Name: students; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.students (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    college text NOT NULL,
    branch text NOT NULL,
    year_of_study text NOT NULL,
    phone text NOT NULL,
    city text NOT NULL,
    email_verified boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    university_id integer
);


ALTER TABLE public.students OWNER TO postgres;

--
-- Name: students_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.students_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.students_id_seq OWNER TO postgres;

--
-- Name: students_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.students_id_seq OWNED BY public.students.id;


--
-- Name: team_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.team_members (
    id integer NOT NULL,
    team_id integer NOT NULL,
    student_id integer NOT NULL,
    role text DEFAULT 'MEMBER'::text NOT NULL,
    joined_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT team_members_role_check CHECK ((role = ANY (ARRAY['LEADER'::text, 'MEMBER'::text])))
);


ALTER TABLE public.team_members OWNER TO postgres;

--
-- Name: team_members_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.team_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.team_members_id_seq OWNER TO postgres;

--
-- Name: team_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.team_members_id_seq OWNED BY public.team_members.id;


--
-- Name: team_solutions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.team_solutions (
    id integer NOT NULL,
    team_id integer NOT NULL,
    solution_text text NOT NULL,
    evidence_link text,
    created_by integer NOT NULL,
    updated_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.team_solutions OWNER TO postgres;

--
-- Name: team_solutions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.team_solutions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.team_solutions_id_seq OWNER TO postgres;

--
-- Name: team_solutions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.team_solutions_id_seq OWNED BY public.team_solutions.id;


--
-- Name: teams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teams (
    id integer NOT NULL,
    name text NOT NULL,
    problem_id integer NOT NULL,
    invite_code text NOT NULL,
    created_by integer NOT NULL,
    max_members integer DEFAULT 6 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.teams OWNER TO postgres;

--
-- Name: teams_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.teams_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.teams_id_seq OWNER TO postgres;

--
-- Name: teams_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.teams_id_seq OWNED BY public.teams.id;


--
-- Name: universities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.universities (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    domain text NOT NULL,
    password_hash text NOT NULL,
    contact_person text NOT NULL,
    phone text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    email_verified boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.universities OWNER TO postgres;

--
-- Name: universities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.universities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.universities_id_seq OWNER TO postgres;

--
-- Name: universities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.universities_id_seq OWNED BY public.universities.id;


--
-- Name: university_otps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.university_otps (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    otp_hash text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    attempts integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.university_otps OWNER TO postgres;

--
-- Name: university_otps_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.university_otps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.university_otps_id_seq OWNER TO postgres;

--
-- Name: university_otps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.university_otps_id_seq OWNED BY public.university_otps.id;


--
-- Name: admin_users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_users ALTER COLUMN id SET DEFAULT nextval('public.admin_users_id_seq'::regclass);


--
-- Name: faculties id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faculties ALTER COLUMN id SET DEFAULT nextval('public.faculties_id_seq'::regclass);


--
-- Name: faculty_guidance_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faculty_guidance_requests ALTER COLUMN id SET DEFAULT nextval('public.faculty_guidance_requests_id_seq'::regclass);


--
-- Name: gov_access_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gov_access_log ALTER COLUMN id SET DEFAULT nextval('public.gov_access_log_id_seq'::regclass);


--
-- Name: government_actions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.government_actions ALTER COLUMN id SET DEFAULT nextval('public.government_actions_id_seq'::regclass);


--
-- Name: government_otps id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.government_otps ALTER COLUMN id SET DEFAULT nextval('public.government_otps_id_seq'::regclass);


--
-- Name: government_users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.government_users ALTER COLUMN id SET DEFAULT nextval('public.government_users_id_seq'::regclass);


--
-- Name: industries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.industries ALTER COLUMN id SET DEFAULT nextval('public.industries_id_seq'::regclass);


--
-- Name: industry_otps id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.industry_otps ALTER COLUMN id SET DEFAULT nextval('public.industry_otps_id_seq'::regclass);


--
-- Name: industry_problem_adoptions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.industry_problem_adoptions ALTER COLUMN id SET DEFAULT nextval('public.industry_problem_adoptions_id_seq'::regclass);


--
-- Name: industry_solution_reviews id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.industry_solution_reviews ALTER COLUMN id SET DEFAULT nextval('public.industry_solution_reviews_id_seq'::regclass);


--
-- Name: industry_team_messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.industry_team_messages ALTER COLUMN id SET DEFAULT nextval('public.industry_team_messages_id_seq'::regclass);


--
-- Name: problem_reports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.problem_reports ALTER COLUMN id SET DEFAULT nextval('public.problem_reports_id_seq'::regclass);


--
-- Name: reports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports ALTER COLUMN id SET DEFAULT nextval('public.reports_id_seq'::regclass);


--
-- Name: student_otps id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_otps ALTER COLUMN id SET DEFAULT nextval('public.student_otps_id_seq'::regclass);


--
-- Name: student_problems id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_problems ALTER COLUMN id SET DEFAULT nextval('public.student_problems_id_seq'::regclass);


--
-- Name: students id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students ALTER COLUMN id SET DEFAULT nextval('public.students_id_seq'::regclass);


--
-- Name: team_members id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_members ALTER COLUMN id SET DEFAULT nextval('public.team_members_id_seq'::regclass);


--
-- Name: team_solutions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_solutions ALTER COLUMN id SET DEFAULT nextval('public.team_solutions_id_seq'::regclass);


--
-- Name: teams id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams ALTER COLUMN id SET DEFAULT nextval('public.teams_id_seq'::regclass);


--
-- Name: universities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.universities ALTER COLUMN id SET DEFAULT nextval('public.universities_id_seq'::regclass);


--
-- Name: university_otps id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.university_otps ALTER COLUMN id SET DEFAULT nextval('public.university_otps_id_seq'::regclass);


--
-- Data for Name: admin_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_users (id, name, email, password_hash, created_at) FROM stdin;
1	Preetham	pusalaspreetham@gmail.com	$2b$12$F76KmoIDt.weZOyWpUZfy.01oMLq9sLOfcOgTC0VFOAPM4QZAXOVG	2026-09-08 04:01:52.36134
\.


--
-- Data for Name: citizen_cases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.citizen_cases (case_reference, status, created_at, updated_at, problem_id) FROM stdin;
CS-2026-415868	PROCESSED	2026-09-08 02:02:09.848839	2026-09-08 02:02:16.01196	1
CS-2026-314517	PROCESSED	2026-09-08 02:04:55.089748	2026-09-08 02:05:00.279343	\N
CS-2026-626710	PROCESSED	2026-09-08 02:20:33.04973	2026-09-08 02:21:38.58345	3
CS-2026-266319	PROCESSED	2026-09-08 02:40:28.00872	2026-09-08 02:41:02.91748	3
CS-2026-120266	PROCESSED	2026-09-08 03:38:10.148213	2026-09-08 03:38:16.782054	4
CS-2026-867958	PROCESSED	2026-09-08 04:19:19.030607	2026-09-08 04:19:24.581033	5
\.


--
-- Data for Name: faculties; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.faculties (id, university_id, name, email, department, expertise, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: faculty_guidance_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.faculty_guidance_requests (id, student_id, faculty_id, problem_id, team_id, message, status, response_token, requested_at, responded_at) FROM stdin;
\.


--
-- Data for Name: gov_access_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gov_access_log (id, gov_user_id, problem_id, student_id, action, created_at) FROM stdin;
1	1	1	\N	VIEW_STUDENT_LIST	2026-09-08 02:13:31.724569
2	1	1	\N	VIEW_STUDENT_LIST	2026-09-08 02:13:31.738163
3	1	1	\N	VIEW_AI_BRIEF	2026-09-08 02:13:32.184836
4	1	1	\N	VIEW_AI_BRIEF	2026-09-08 02:13:32.193294
5	1	1	\N	VIEW_AI_BRIEF	2026-09-08 02:13:34.916462
6	1	1	\N	VIEW_AI_BRIEF	2026-09-08 02:13:35.890075
7	1	1	\N	VIEW_AI_BRIEF	2026-09-08 02:13:36.709027
8	1	1	\N	VIEW_AI_BRIEF	2026-09-08 02:13:36.898448
9	1	1	\N	VIEW_AI_BRIEF	2026-09-08 02:13:37.129401
10	1	1	\N	APPROVE_PROBLEM	2026-09-08 02:13:58.681269
11	1	1	\N	VIEW_STUDENT_LIST	2026-09-08 02:22:30.922148
12	1	1	\N	VIEW_STUDENT_LIST	2026-09-08 02:22:30.933522
13	1	1	\N	VIEW_AI_BRIEF	2026-09-08 02:22:30.967035
14	1	1	\N	VIEW_AI_BRIEF	2026-09-08 02:22:30.973785
15	2	5	\N	REJECT_PROBLEM	2026-09-08 04:22:06.813053
\.


--
-- Data for Name: government_actions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.government_actions (id, gov_user_id, problem_id, action_type, remarks, budget_estimate, timeline_days, created_at) FROM stdin;
\.


--
-- Data for Name: government_otps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.government_otps (id, email, otp_hash, expires_at, attempts, created_at) FROM stdin;
\.


--
-- Data for Name: government_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.government_users (id, name, email, password_hash, department, jurisdiction_city, jurisdiction_state, phone, email_verified, created_at, updated_at, account_status, employee_id, reviewed_by, reviewed_at, rejection_reason) FROM stdin;
1	preetham	pusalaspreetham@gmail.com	$2b$10$14unzO6jnojHJxUXk16u8OEtGR3wA8n7tzWtWjquVZe/i54UnJjbq	Public Works	Vijayawada	andhra pradesh	6302079679	t	2026-09-08 01:59:19.48502	2026-09-08 01:59:19.48502	APPROVED	EMP-2026-001	\N	\N	\N
2	Preetham_pusala	preethampusala18@gmail.com	$2b$10$sTGJuz3Lv8A8MlSDEb2v2.r2d/cwcrVSCyDtvS8uQJdejXEm1WIUa	Energy & Power	Vijayawada	Andhra Pradesh	6302079679	t	2026-09-08 04:00:13.115205	2026-09-08 04:16:56.605209	APPROVED	EMP-2026-001	1	2026-09-08 04:16:56.605209	\N
\.


--
-- Data for Name: industries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.industries (id, company_name, email, domain, password_hash, contact_person, designation, phone, sector, city, state, website, email_verified, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: industry_otps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.industry_otps (id, email, otp_hash, expires_at, attempts, created_at) FROM stdin;
\.


--
-- Data for Name: industry_problem_adoptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.industry_problem_adoptions (id, industry_id, problem_id, commitment_type, status, notes, budget_estimate, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: industry_solution_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.industry_solution_reviews (id, industry_id, student_problem_id, review_text, rating, pilot_interest, created_at) FROM stdin;
\.


--
-- Data for Name: industry_team_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.industry_team_messages (id, industry_id, team_id, problem_id, sender_type, sender_student_id, message, is_read_by_industry, is_read_by_team, created_at) FROM stdin;
\.


--
-- Data for Name: problem_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.problem_reports (id, problem_id, report_text, latitude, longitude, image_path, created_at, case_reference, intake_id, address, evidence) FROM stdin;
1	1	Uh the road beside our house is filled with large potholes it was constructed before two years only but The road has been ruined within one year so now we are struggling with that pothole road	16.464588	80.508199		2026-09-08 02:02:15.94413	CS-2026-415868	\N	\N	[]
3	3	Large accumulation of uncollected household garbage and broken construction debris obstructing the pedestrian sidewalk and drainage channel. During recent rains, the water is backing up into nearby shop entrances and creating a breeding ground for mosquitoes.	16.464565	80.5082	uploads\\b72d88f7415a4c799464d82690e9e907.jpg	2026-09-08 02:21:38.48704	CS-2026-626710	\N	\N	[]
4	3	Large accumulation of uncollected household garbage and broken construction debris obstructing the pedestrian sidewalk and drainage channel. During recent rains, the water is backing up into nearby shop entrances and creating a breeding ground for mosquitoes.	16.464566	80.508221	uploads\\b000fcd828c6447e8ab18fd725bd297d.jpg	2026-09-08 02:41:02.832908	CS-2026-266319	\N	\N	[]
5	4	In our house the electricty consumtion is not able to figure out like we are using very limited resources but the current bill is high	16.464559	80.508223		2026-09-08 03:38:16.672509	CS-2026-120266	\N	\N	[]
6	5	I lost my pencil	16.464566	80.508159		2026-09-08 04:19:24.518843	CS-2026-867958	\N	\N	[]
\.


--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reports (id, report_text, problem_title, problem_description, domain, responsible_fields, severity, confidence, image_path, image_description, embedding, locations, verification_status, status_reason, status_set_by, status_set_at, ai_brief, ai_brief_generated_at, created_at, priority_score, verification_notes, verified_by, verified_at, published_at, rejection_reason, status, gov_review_status, discard_reason, reviewed_by, reviewed_at, review_remarks) FROM stdin;
1	Uh the road beside our house is filled with large potholes it was constructed before two years only but The road has been ruined within one year so now we are struggling with that pothole road	Damaged Road	The road beside our house is filled with large potholes, causing inconvenience and posing a risk to drivers.	Road Infrastructure	{"Civil Engineering"}	Medium	0.9			[0.03225879,0.019772125,0.14730147,0.11807577,-0.06858291,-0.021407532,-0.064743765,0.031491153,-0.050416697,-0.022486908,-0.070997834,0.0410459,-0.013851796,0.033234864,-0.0045128097,-0.02875391,-0.060506903,-0.045955174,-0.016489279,-0.008427581,-0.08457829,0.07656047,-0.0584633,0.0067595956,-0.06590624,0.090667754,0.012740256,0.09911843,0.01902855,-0.06350582,0.014029884,-0.033020195,-0.053276934,-0.0020683655,0.037408866,-0.028560087,-0.065533824,0.06552868,0.098706305,-0.13595222,-0.014327874,-0.03362935,0.09995989,-0.023583734,0.062663354,-0.049865816,0.067636944,-0.10142493,0.06531328,-0.06426378,0.015258306,0.0064162463,0.025235878,0.00083675043,0.014936717,-0.053744487,-0.014633415,0.033303708,-0.038510695,-0.0025139842,0.04407945,0.0009931745,0.035081476,0.024584273,-0.012202566,-0.07049576,0.023218092,-0.070233576,0.02589976,0.1111704,0.043339737,0.040628266,-0.037361976,-0.07135894,0.045612,0.03523772,-0.03654047,-0.026028953,0.015161178,-0.025560357,-0.00043528376,0.029170047,0.0012226948,0.02404082,0.046751402,0.007972161,0.006482762,0.008108977,0.07763383,-0.03723119,0.045070108,0.055489294,0.047053628,0.09430435,0.002747388,-0.013683964,-0.054151468,-0.10070621,0.027068557,0.03217621,-0.06912059,0.052679718,-0.039361443,0.024417466,0.09783046,0.08006707,-0.009480026,0.016183883,-0.035418138,0.0632647,0.109726876,0.010767312,0.054710463,-0.010616359,0.015679713,-0.037546847,0.018835664,0.038178463,-0.119238555,-0.008288944,-0.12696312,-0.043846674,-0.05384378,-0.025810424,0.021429682,-0.035547383,0.051839713,2.9898041e-33,0.0094800275,-0.0032067343,0.00976561,-0.0019565024,0.09748808,-0.033854533,-0.016044533,0.02553331,-0.10136462,-0.056526925,0.05031733,-0.056736466,-0.0138855735,-0.063882634,-0.02848822,0.0059029665,0.013257091,0.006987574,-0.07112535,0.021661216,-0.024016408,-0.07320818,0.03300807,0.017994838,-0.0034953651,0.05350752,0.06112655,0.062812775,-0.014414042,-0.022309173,-0.028195817,0.049154732,0.03745599,0.0659185,-0.0842383,0.028892761,0.0033070915,-0.012092017,-0.06053692,0.026322205,-0.027583413,-0.07122798,-0.01374318,0.04651406,0.07723066,-0.052372314,0.0040952163,0.025925886,-0.046567257,-0.0046586944,-0.12559454,0.01704613,-0.081937864,0.047019437,-0.07415855,0.024909243,0.03767928,-0.041482933,0.0042495136,0.06473819,0.0054576467,0.01569853,0.0037735298,0.009276846,0.011095376,-0.051190898,0.021649066,0.04266635,-0.011102616,0.016908694,0.0523777,-0.05207576,0.0029073614,0.046309162,0.024418226,-0.10598518,-0.09381281,0.018382486,0.04273604,0.004494991,-0.054769475,-0.018867029,0.0066359034,-0.011654148,0.0683501,-0.027464451,-0.047963247,-0.05078482,0.036621243,0.04024207,-0.06641452,0.042857636,-0.035941944,0.016227921,-0.037357844,-5.034392e-33,-0.05328902,0.03536115,-0.0528488,0.036197294,-0.029042186,-0.07713907,-0.031395026,-0.04643411,0.02418652,0.03006374,-0.10642251,0.029792024,0.06329594,-0.03669741,-0.01801139,-0.10857486,0.032403268,-0.07189696,0.014903174,0.019942563,-0.062046316,-0.022003109,-0.058557402,-0.020999568,-0.027748983,0.03225846,-0.022303257,-0.041334864,-0.021235421,0.021410916,-0.018300343,-0.028897991,-0.017042385,-0.041023977,0.019672696,0.11286339,-0.024877826,-0.107475676,-0.08029919,-0.06520479,0.083203636,0.057526674,0.069752075,0.06487899,0.052914906,-0.052436326,0.011140309,0.062209174,0.019379329,-0.0016651318,0.11237645,0.051538583,-0.009767388,0.10797041,0.012533549,0.0911443,0.04437116,0.01606386,-0.020522216,0.07441554,0.0144304065,0.090416595,-0.026341604,0.02753243,0.038134456,-0.02289565,-0.07023026,-0.032953363,0.069877855,0.0064437184,-0.011439496,0.042921282,-0.020172453,0.0036873682,0.07209683,0.06024581,-0.06320598,0.11597155,-0.015169689,0.023546143,0.08862942,0.00092045066,0.015331477,0.010348527,0.03882448,-0.03379422,-0.029983219,0.0031820838,-0.014628936,0.058060776,0.006522633,0.048172582,-0.105840944,0.007187948,-0.10349187,-4.0298406e-08,-0.049211513,0.032543164,-0.088803336,0.013775449,0.023323348,-0.11704066,0.13460277,0.025777118,0.005761638,0.027692577,-0.0581967,0.0016256269,-0.04376934,0.056047905,-0.0524579,-0.029092183,-0.04808004,-9.3240946e-05,-0.0706584,0.032580324,-0.033451874,-0.044342894,-0.069621876,0.007382083,0.023075167,-0.045223434,-0.022170855,-0.00807171,-0.12269519,0.016122764,-0.023291405,-0.0303236,-0.017128548,0.07051706,0.0967109,-0.023600234,0.016982768,0.00022948168,0.041088823,0.014889301,-0.067770004,-0.014803714,0.05306528,0.014322058,0.0004253274,-0.010121793,-0.10921866,0.019448867,0.005122855,0.025704497,-0.053233895,-0.0050799046,-0.024469327,0.018935801,-0.018942745,-0.006746757,0.021572005,-0.012639554,-0.032421496,0.04329833,-0.037135355,-0.026603809,0.06478278,0.039680354]	[{"latitude": 16.464588, "longitude": 80.508199}]	RECEIVED	\N	\N	\N	{"priority_score": 50, "impact_assessment": "AI Service temporarily unavailable. Manual assessment required.", "resource_estimate": "Pending manual evaluation", "recommended_actions": ["Investigate the reported issue", "Coordinate with local teams", "Allocate necessary budget"]}	2026-09-08 02:13:37.127721	2026-09-08 02:02:15.92379	58	\N	\N	\N	\N	\N	OPEN	GOV_APPROVED	\N	1	2026-09-08 02:13:58.677152	\N
3	Large accumulation of uncollected household garbage and broken construction debris obstructing the pedestrian sidewalk and drainage channel. During recent rains, the water is backing up into nearby shop entrances and creating a breeding ground for mosquitoes.	Uncollected Household Garbage and Broken Construction Debris	Large accumulation of uncollected household garbage and broken construction debris obstructing the pedestrian sidewalk and drainage channel.	Waste Management	{"Environmental Engineering"}	Medium	0.8	uploads\\b72d88f7415a4c799464d82690e9e907.jpg	Several large black garbage bags are piled on top of three blue, green, and gray wheeled trash bins. The bins are arranged in a row against a gray wall.	[0.03288669,0.04654484,0.09018591,-0.024720835,0.08343938,-0.022105487,0.07808536,-0.035984233,-0.028953657,0.048516236,-0.0036489547,-0.018560622,-0.064499006,0.035775963,-0.04713432,-0.0029571666,-0.023237411,-0.0028367366,-0.015102786,-0.02016877,0.011384765,0.07721686,0.051851664,-0.0004290031,-0.036341332,0.11001489,0.0070370845,-0.0074850847,0.058991414,-0.072872505,0.048694726,-0.006649007,-0.020766335,-0.025530756,0.037082877,-0.0011855747,0.016343284,0.04550506,0.053631227,-0.0016726732,-0.013281789,0.005262091,-0.026824834,-0.052959166,-0.060514584,-0.012409232,0.007996883,-0.024692643,0.020311087,-0.15501656,0.12234034,0.028875938,0.043055676,0.10158592,-0.005548486,-0.109975226,0.024020715,-0.0369986,0.00044601285,-0.033294138,0.0052851923,0.057469152,-0.0055833072,0.013435771,0.07709855,0.007947819,-0.051013906,-0.0019724932,0.084381685,0.07921188,-0.009309073,0.029045355,-0.056542344,-0.01969306,0.05311302,0.013636638,-0.033779923,-0.042766634,0.0075535807,-0.02274356,-0.057800982,-0.003233231,0.06284329,0.0333893,0.017141122,0.036168765,-0.00816866,0.08874139,0.029193236,0.027696552,-0.060535595,0.022287644,0.041179415,0.049797863,-0.08290011,-0.01916053,0.022976888,-0.06970524,0.05614466,0.08163503,-0.06935028,0.007723817,0.072903164,0.0048637735,0.04831227,-0.026775545,0.015556219,-0.050282005,-0.0068280837,0.03533249,0.003935061,-0.03388682,-0.03974184,0.0823392,-0.08256401,-0.02041109,0.029153364,0.0003547763,-0.11793024,-0.028644584,-0.0082634445,-0.041654058,-0.09090296,-0.03212494,0.018775774,-0.017569529,-6.55615e-05,3.543266e-33,0.011002461,-0.11277546,-0.00040861568,0.025945067,0.048621513,-0.06985607,-0.042719714,0.046945732,0.072711796,0.048392706,-0.00906231,-0.071233906,-0.047125615,0.114722796,0.035970017,-0.0648191,-0.0113384165,-0.0011710236,-0.05327688,0.028634371,-0.05463398,-0.052189443,-0.04808934,-0.04723268,0.062990606,0.02834859,-0.027844083,0.09253288,0.049298227,0.015361282,0.070095494,0.041613575,0.041902926,0.07685363,-0.033581626,0.012936536,-0.041797634,0.034069706,-0.00283597,-0.07246276,-0.01828501,-0.05367884,-0.041127376,-0.06176231,0.029833319,-0.06706513,0.057727773,-0.05658748,-0.023757856,0.009061309,0.06318053,0.03963022,-0.06149107,0.07227612,-0.033435233,-0.010715431,0.083528146,-0.051118936,-0.012720085,0.03690989,0.05758386,0.118420415,-0.010286892,-0.019782975,0.11723227,-0.115903035,0.04681167,0.11513964,0.05390095,-0.10304,0.021025745,0.04016202,-0.0026667947,0.040055968,-0.0533199,-0.0070122294,-0.04160725,-0.014977433,0.046190195,-0.0048649856,0.05593897,-0.05017725,0.062141284,-0.109071545,-0.02622863,0.06451114,0.007406372,-0.04414872,0.009035766,0.022541571,0.040005825,0.05506207,-0.021303028,-0.05752417,-0.0026951206,-5.6648924e-33,-0.02435339,0.0050965403,-0.04285235,-0.056247145,-0.012722445,0.008566074,-0.05795672,-0.048132267,0.003330757,0.05071222,-0.18649511,0.038142618,0.036638465,0.05032853,0.07024854,-0.07051681,0.0059127016,-5.4478573e-05,-0.05075276,-0.03489676,-0.048398353,0.030564131,0.022678332,-0.101584084,-0.101435,0.02222457,-0.031927574,0.03327053,0.01631911,-0.0441147,-0.033978786,-0.039586056,0.008720768,-0.026224338,0.022935152,-0.111223474,-0.063005745,0.0004570841,-0.022752572,-0.14020894,0.0074247336,0.032210626,0.004811117,-0.053159934,0.033255685,-0.04572525,-0.08327708,0.044279933,-0.0067054094,-0.07503168,0.04939123,0.074625745,-0.036721155,0.03946788,0.050061725,0.10211739,0.08526309,-0.037109926,0.058677357,-0.0028357296,-0.04874598,0.075604014,-0.061960753,0.06877256,0.03633264,-0.039443605,-0.038752913,-0.040516257,-0.007725596,0.016447153,0.012345526,-0.03139253,-0.052232005,-0.05697051,-0.0075968034,-0.00023812422,-0.029531058,0.05086379,0.0072107413,-0.05050847,0.029883446,-0.0037554381,0.010581134,0.016717782,-0.028351327,-0.07436285,-0.07515959,-0.049321048,-0.026205394,0.06766681,0.01879402,0.07667848,-0.03463671,0.08712624,-0.022547899,-4.1601346e-08,0.011980165,0.0013924919,-0.06872543,-0.020543236,0.020709576,-0.07449858,0.08066056,0.073624514,0.049380742,-0.05377763,-0.031079695,-0.031180695,-0.04141168,0.10305985,-0.009247313,0.007106465,-0.037143108,-0.04384583,-0.08902877,-0.02432165,-0.04782874,-0.018728686,-0.024449421,0.070450574,-0.022879569,-0.021802971,-0.049143884,0.07787066,0.03216379,0.03632638,0.04066109,0.11548877,-0.02009837,-0.03641639,0.065235436,0.016985774,0.033526514,-0.03044232,0.03385038,0.03028421,0.020127397,-0.05226103,-0.008619891,-0.0049243476,0.06425173,0.013992198,-0.11294149,0.038056124,-0.032804158,-0.043582186,-0.038146384,-0.041402623,-0.028813638,0.036073998,0.018378919,-0.032051455,-0.032229006,-0.032081567,0.034667242,-0.025791029,0.004687779,-0.00423959,-0.006460093,0.09218038]	[{"latitude": 16.464565, "longitude": 80.5082}, {"latitude": 16.464566, "longitude": 80.508221}]	RECEIVED	\N	\N	\N	{"priority_score": 50, "impact_assessment": "AI Service temporarily unavailable. Manual assessment required.", "resource_estimate": "Pending manual evaluation", "recommended_actions": ["Investigate the reported issue", "Coordinate with local teams", "Allocate necessary budget"]}	2026-09-08 02:42:37.127721	2026-09-08 02:21:38.461842	58	\N	\N	\N	\N	\N	OPEN	PENDING_REVIEW	\N	\N	\N	\N
4	In our house the electricty consumtion is not able to figure out like we are using very limited resources but the current bill is high	Electricity Consumption Prediction	Household electricity consumption has increased unexpectedly, creating a need to predict future electricity usage.	Energy	{"Artificial Intelligence and Machine Learning"}	Medium	0.9			[-0.036212202,0.00031992857,0.06742501,0.07549302,0.10977434,-0.060749732,0.0024781723,0.023059893,-0.009820985,0.03808062,-0.061272554,-0.030444779,-0.044566244,0.0069618803,0.011194175,-0.1072865,-0.023666987,-0.052405618,-0.014520851,-0.040491786,0.094305895,-0.0091504995,0.026034476,0.02963576,0.08500672,0.049772568,0.043707248,0.0024125285,-0.044282623,-0.01514214,0.03434295,0.014732446,-0.012443498,-0.08214892,-0.036936168,0.018195448,-0.080774195,0.069529735,0.052556578,0.027210679,-0.021552501,-0.08757947,0.047031943,0.023282604,-0.080663405,0.0140117025,-0.0061178016,-0.04554425,-0.06226142,0.047593422,-0.036652047,0.014065397,0.06193048,-0.07994542,0.053369377,-0.051811986,0.062615074,-0.009539405,0.040190287,-0.008865719,-0.036464725,-0.08028467,-0.0102631645,-0.019063927,0.0029416864,0.030498112,0.036517125,0.114823245,-0.029313067,-0.0021659117,0.039714713,0.024233285,-0.011581633,-0.06733584,0.023174819,-0.042222425,0.059827223,0.0494839,0.060038336,0.0082702795,0.01102833,-0.03603985,-0.047419973,0.02538869,0.07020741,0.049363144,0.026278831,-0.017159458,-0.07940029,-0.049694456,0.01006855,0.00059402664,0.009468028,0.059247885,-0.018358607,0.05640918,-0.0076401164,-0.07743336,-0.051558148,0.03875353,-0.0345203,0.05942545,0.050643306,0.049672496,0.05202148,-0.08807565,0.004026986,0.044246364,0.0096906675,-0.02813744,0.043857254,-0.013243745,-0.012298268,-0.021158593,0.039791193,-0.017532848,0.03246159,-0.051350564,0.0134067815,0.13113394,-0.0114305,-0.016084308,-0.0008166711,-0.022094944,0.06166753,0.008753039,-0.007924301,1.2890852e-33,-0.11788454,-0.039657965,0.067901835,-0.020079276,-0.057506036,-0.001841817,-0.10711493,0.09268992,0.12360809,-0.07416729,0.103666976,0.026470384,0.018220613,0.08547261,0.005037266,0.0063726353,0.031029254,0.016588135,0.048467416,-0.034573972,0.011548666,-0.042134024,-0.017223075,-0.0048778914,-0.0073895915,-0.026263358,0.078611545,0.023792017,-0.027002933,0.008263228,0.099819005,0.0456875,0.0033205461,-0.02247875,-0.052406438,-0.032211997,0.049525745,0.024496421,-0.03940275,-0.0060220337,-0.019519303,0.010894285,0.07106465,0.03195535,0.0044431495,-0.019861182,0.07232857,-0.03564135,-0.1012881,0.08412845,-0.018835923,-0.023577852,-0.073619515,0.02187868,-0.024086896,-0.0016252843,0.0007460919,-0.09665749,0.06233497,-0.04572847,-0.07096969,-0.030834414,0.015829323,-0.028585698,0.017426325,-0.005994428,0.10928342,0.025072673,-0.046814755,0.061662655,0.04687164,-0.11613641,0.0077234632,0.03023917,0.059950933,0.04560125,-0.05056089,0.030470163,-0.06836289,-0.025394963,-0.024282316,-0.09345782,0.106604464,-0.038322173,0.013417641,-0.072842196,0.050619993,0.03220277,-0.032813564,0.020321006,0.031869017,0.01839924,0.02323595,0.09713441,-0.03319546,-1.5019082e-33,-0.07088033,0.1236016,-0.057824064,-0.04114631,0.029343791,-0.07636615,-0.07963001,-0.08713621,-0.06518826,-0.01870654,-0.048977472,-0.02180547,0.0033812237,0.005896016,0.043367423,8.056397e-06,-0.0029712662,-0.04686935,-0.0004516658,-0.0007222358,-0.050882377,-0.0046128817,-0.010177037,-0.073600404,-0.025118072,0.037488908,-0.042688657,0.059231315,-0.042263027,-0.05567667,-0.122250624,-0.053502444,0.014969527,0.02534958,-0.030557344,0.015515518,-0.019876681,0.019083224,-0.03726964,0.01220517,0.06059247,0.0541839,0.018653095,-0.006890849,-0.03861514,-0.035089232,-0.052124534,0.03904406,0.0711115,0.07213035,0.12048217,0.042853925,-0.04547121,-0.060151495,-0.057044894,0.030112168,0.061861947,0.04344835,0.034512125,0.038709242,-0.019073496,0.020280203,-0.026552223,0.08355871,-0.009007839,-0.005299432,-0.07639432,-0.06401454,0.13898146,-0.061806824,-0.07078943,0.028998576,-0.07231421,-0.019086093,-0.03582977,-0.0076115597,-0.018637223,-0.007376673,-0.02670009,-0.0040529664,-0.0062576677,0.030175641,0.013675546,-0.08993969,-0.066687405,-0.06196641,-0.0011739285,-0.004785238,0.0070408355,0.037699133,-0.12024281,0.0614818,-0.11068305,0.08070073,-0.0027925943,-3.3628293e-08,0.0004730105,-0.001874939,0.10523157,0.0099878255,0.071682766,-0.085792884,0.059962433,0.059288755,0.025577098,0.03932949,0.08616951,0.021134933,0.068169035,-0.010742643,0.028382426,0.02592385,0.04204246,-0.024820842,-0.042923324,0.004136588,0.028682327,-0.03179055,0.003947873,0.071178965,0.087637894,-0.013049781,0.001684668,0.07317767,-0.059121404,0.045139387,-0.007480758,0.015745983,0.040744115,-0.055856075,-0.037570428,0.004693725,-0.029100109,-0.10338924,0.022728719,-0.034271684,0.009832626,-0.07004469,-0.055046625,0.04029079,-0.026335727,-0.12050917,0.015082476,-0.041901752,0.11605998,0.022217,-0.006088508,-0.027072495,0.030797973,-0.060357526,0.08083047,-0.034776412,-0.02950944,0.03395834,-0.025954528,0.014336613,0.0896522,0.013643987,-0.05887543,0.039581366]	[{"latitude": 16.464559, "longitude": 80.508223}]	RECEIVED	\N	\N	\N	\N	\N	2026-09-08 03:38:16.64474	58	\N	\N	\N	\N	\N	OPEN	PENDING_REVIEW	\N	\N	\N	\N
5	I lost my pencil	Lost Pencil	A citizen lost their pencil and is unable to locate it.	Energy	{"Information Technology"}	Low	0.9			[-0.055756036,0.01815192,0.041528504,-0.015099296,0.016689118,0.07674606,0.0773701,0.029366042,0.004631762,0.03476775,0.049082458,0.04940646,-0.0041121524,-0.0025623594,-0.07109872,-0.030879421,-0.08556595,-0.012448592,-0.0039754,0.025973964,0.016619878,0.03184222,0.014508645,0.014774553,0.038844317,0.06290139,-0.002717201,-0.023229163,-0.07518315,-0.015061025,-0.044830892,-0.021966072,0.008629156,0.017282858,0.10046193,-0.05848896,-0.019802278,0.046070352,0.06437418,-0.034028955,-0.026584262,-0.03808839,0.014515891,0.044206727,0.058931105,-0.0024295081,0.055097766,0.01747243,0.08695825,0.04952813,-0.0072585014,-0.03598142,-0.080386735,0.02059851,-0.008449741,-0.006409454,0.086062126,0.027191227,-0.0009110652,0.04732337,0.021822996,-0.019329438,-0.028504953,0.020272266,0.0006069589,0.061344743,-0.02330564,-0.108163685,0.04149127,-0.054895613,0.025790611,0.015996838,-0.037523072,0.0633495,0.026581068,-0.036394853,0.029657157,0.029791608,7.134262e-05,-0.04039052,-0.09557083,-0.0016913749,-0.07746619,0.08435232,-0.022036985,0.035365608,0.01613732,0.020620506,0.03966044,-0.05453168,-0.06435434,0.0006951716,-0.023097249,0.005809985,-0.072252646,-0.10906799,0.08177776,0.05538591,-0.022381067,0.047825918,0.06378465,0.01747126,0.035399664,-0.064670816,0.06783681,0.060768016,-0.061753538,-0.023563944,2.799724e-05,-0.016165882,0.02330978,-0.024873598,0.0029464606,0.10052394,0.09404156,0.008375336,-0.004369579,-0.0032133104,-0.014725321,0.037983388,-0.02335772,0.015868232,-0.03520686,-0.027033435,-0.08751702,0.06938364,0.03003856,-5.1330014e-33,-0.020937297,0.0505474,0.014258518,0.029188942,0.017247926,0.010832158,-0.015015223,0.04898499,-0.021675443,0.045983452,0.028791409,-0.061129306,0.0034249856,0.041069563,-0.009037439,0.029678881,-0.0038971528,-0.014174897,0.048340533,0.032731384,-0.032142997,0.046170574,-0.009528541,0.008948919,0.046119284,0.013308931,0.013535471,-0.032454047,0.05551115,0.011987678,0.026739802,0.07962819,0.09272488,-0.068703555,-0.034017608,-0.03513563,0.04602276,-0.07459385,-0.018887678,0.018809197,-0.019078596,0.0074589476,0.08047409,0.017863758,0.014649206,-0.027248828,-0.028041046,0.03550049,0.041264586,0.016758488,-0.063321784,0.048223317,-0.00067697064,-0.03155126,0.019720322,-0.0499866,0.027790423,0.053278066,3.5454075e-05,-0.08569101,0.09084555,0.10401505,-0.04609193,0.040640853,-0.008917702,-0.04284226,-0.0034823676,-0.037953615,0.01038523,-0.07093434,-0.035052612,-0.0043217046,0.024081996,-0.05635228,-0.026203968,-0.026532952,-0.04191122,-0.03691612,0.01274937,-0.13101433,-0.015900683,-0.018488012,-0.027384639,-0.037853897,0.012469557,-0.033269413,0.053668007,-0.14985037,-0.058990847,0.03124338,-0.11015404,-0.0125100585,-0.071973026,-0.00077411305,-0.03245235,2.6861227e-33,-0.0391908,-0.052805886,-0.046244502,0.09628936,0.03495159,-0.07914967,-0.02835127,-0.04366382,0.023691604,0.00010541171,-0.06407217,-0.054371558,0.05084799,0.06255257,0.052754335,0.07975814,-0.05582002,0.088593304,-0.020492123,-0.019429628,-0.085673675,-0.014469878,0.0159081,-0.014347273,-0.0010977923,0.016353656,0.025386274,-0.059178572,-0.05841929,-0.055120412,-0.05726896,-0.067339614,-0.06561334,0.019075157,-0.08967487,-0.00029529573,0.07891471,-0.12670358,-0.07999002,-0.01713572,-0.040846888,0.06281186,0.05706387,0.05595259,-0.10880121,0.031798586,-0.021568278,0.087871246,-0.024398897,0.115357175,0.052581273,-0.029454818,0.013176311,-0.05221165,-0.047914706,0.07526353,0.031121776,-0.04773921,0.03126601,0.020260114,-0.03201144,0.0010602312,-0.112810485,0.089370325,0.012869942,0.0127093885,0.03997812,0.057793364,-0.011502946,0.006249399,0.09770861,0.050709862,-0.0058341557,-0.050859455,0.112148754,0.11496572,-0.047369134,0.10789283,-0.08311883,-0.058379803,0.07663241,-0.04179863,-0.032967485,0.02126637,0.019490607,0.025879111,0.057035115,0.02199868,-0.03675692,-0.0057699885,-0.034938663,0.063251786,-0.06727282,-0.06806724,-0.0050847223,-1.665908e-08,-0.008854922,0.16255394,-0.03280753,-0.03322633,0.12352771,-0.03832041,0.12705831,0.04306278,-0.06958127,0.044142984,-0.06605795,-0.0213091,-0.0031162368,0.037482973,-0.03809689,-0.092222944,0.07600423,-0.031092118,-0.026957953,0.051920388,-0.045211326,0.024903815,0.013955034,-0.039925594,-0.07690604,-0.00086523785,0.0015051888,0.06765567,-0.0075291055,0.092293024,-0.051855754,0.037497863,0.015711142,-0.0052627106,-0.012643979,-0.031575162,-0.021918947,0.034428604,-0.0053361645,0.0032454107,0.013127349,-0.029971845,-0.051476203,0.02009183,0.02065777,-0.04807119,0.08150516,-0.07698227,-0.029748917,-0.011182271,-0.070073634,-0.07079322,-0.012801295,0.06342095,0.036932368,-0.048620597,0.008765435,0.09660487,-0.060884506,-0.022575002,0.0071651917,0.02138434,-0.14558518,0.031866536]	[{"latitude": 16.464566, "longitude": 80.508159}]	RECEIVED	\N	\N	\N	\N	\N	2026-09-08 04:19:24.487451	41	\N	\N	\N	\N	\N	OPEN	GOV_REJECTED	\N	2	2026-09-08 04:22:06.80322	Its a basic one
\.


--
-- Data for Name: student_otps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_otps (id, email, otp_hash, expires_at, attempts, created_at) FROM stdin;
\.


--
-- Data for Name: student_problems; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_problems (id, student_id, problem_id, status, joined_at, updated_at, solution_text, solution_submitted_at, share_contact, removed_by_gov, removal_reason) FROM stdin;
\.


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.students (id, name, email, password_hash, college, branch, year_of_study, phone, city, email_verified, created_at, updated_at, university_id) FROM stdin;
1	preetham	pusalaspreetham@gmail.com	$2b$10$nbRSRWvQVSPYOTur3U8Xs.fPTU3viAVliAgJzLXueb2OwjUF1hfwu	SRM	Computer Science and Engineering	3rd Year	6302079679	Vijaywada	t	2026-09-08 02:16:17.200496	2026-09-08 02:16:17.200496	\N
\.


--
-- Data for Name: team_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.team_members (id, team_id, student_id, role, joined_at) FROM stdin;
\.


--
-- Data for Name: team_solutions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.team_solutions (id, team_id, solution_text, evidence_link, created_by, updated_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teams (id, name, problem_id, invite_code, created_by, max_members, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: universities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.universities (id, name, email, domain, password_hash, contact_person, phone, city, state, email_verified, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: university_otps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.university_otps (id, email, otp_hash, expires_at, attempts, created_at) FROM stdin;
\.


--
-- Name: admin_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admin_users_id_seq', 1, false);


--
-- Name: faculties_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.faculties_id_seq', 1, false);


--
-- Name: faculty_guidance_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.faculty_guidance_requests_id_seq', 1, false);


--
-- Name: gov_access_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.gov_access_log_id_seq', 15, true);


--
-- Name: government_actions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.government_actions_id_seq', 1, false);


--
-- Name: government_otps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.government_otps_id_seq', 4, true);


--
-- Name: government_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.government_users_id_seq', 2, true);


--
-- Name: industries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.industries_id_seq', 1, false);


--
-- Name: industry_otps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.industry_otps_id_seq', 1, false);


--
-- Name: industry_problem_adoptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.industry_problem_adoptions_id_seq', 1, false);


--
-- Name: industry_solution_reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.industry_solution_reviews_id_seq', 1, false);


--
-- Name: industry_team_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.industry_team_messages_id_seq', 1, false);


--
-- Name: problem_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.problem_reports_id_seq', 6, true);


--
-- Name: reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reports_id_seq', 5, true);


--
-- Name: student_otps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.student_otps_id_seq', 1, true);


--
-- Name: student_problems_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.student_problems_id_seq', 1, true);


--
-- Name: students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.students_id_seq', 1, true);


--
-- Name: team_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.team_members_id_seq', 1, false);


--
-- Name: team_solutions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.team_solutions_id_seq', 1, false);


--
-- Name: teams_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.teams_id_seq', 1, false);


--
-- Name: universities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.universities_id_seq', 1, false);


--
-- Name: university_otps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.university_otps_id_seq', 1, false);


--
-- Name: admin_users admin_users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_email_key UNIQUE (email);


--
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);


--
-- Name: citizen_cases citizen_cases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.citizen_cases
    ADD CONSTRAINT citizen_cases_pkey PRIMARY KEY (case_reference);


--
-- Name: faculties faculties_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faculties
    ADD CONSTRAINT faculties_pkey PRIMARY KEY (id);


--
-- Name: faculties faculties_university_id_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faculties
    ADD CONSTRAINT faculties_university_id_email_key UNIQUE (university_id, email);


--
-- Name: faculty_guidance_requests faculty_guidance_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faculty_guidance_requests
    ADD CONSTRAINT faculty_guidance_requests_pkey PRIMARY KEY (id);


--
-- Name: faculty_guidance_requests faculty_guidance_requests_response_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faculty_guidance_requests
    ADD CONSTRAINT faculty_guidance_requests_response_token_key UNIQUE (response_token);


--
-- Name: gov_access_log gov_access_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gov_access_log
    ADD CONSTRAINT gov_access_log_pkey PRIMARY KEY (id);


--
-- Name: government_actions government_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.government_actions
    ADD CONSTRAINT government_actions_pkey PRIMARY KEY (id);


--
-- Name: government_otps government_otps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.government_otps
    ADD CONSTRAINT government_otps_pkey PRIMARY KEY (id);


--
-- Name: government_users government_users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.government_users
    ADD CONSTRAINT government_users_email_key UNIQUE (email);


--
-- Name: government_users government_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.government_users
    ADD CONSTRAINT government_users_pkey PRIMARY KEY (id);


--
-- Name: industries industries_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.industries
    ADD CONSTRAINT industries_email_key UNIQUE (email);


--
-- Name: industries industries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.industries
    ADD CONSTRAINT industries_pkey PRIMARY KEY (id);


--
-- Name: industry_otps industry_otps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.industry_otps
    ADD CONSTRAINT industry_otps_pkey PRIMARY KEY (id);


--
-- Name: industry_problem_adoptions industry_problem_adoptions_industry_id_problem_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.industry_problem_adoptions
    ADD CONSTRAINT industry_problem_adoptions_industry_id_problem_id_key UNIQUE (industry_id, problem_id);


--
-- Name: industry_problem_adoptions industry_problem_adoptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.industry_problem_adoptions
    ADD CONSTRAINT industry_problem_adoptions_pkey PRIMARY KEY (id);


--
-- Name: industry_solution_reviews industry_solution_reviews_industry_id_student_problem_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.industry_solution_reviews
    ADD CONSTRAINT industry_solution_reviews_industry_id_student_problem_id_key UNIQUE (industry_id, student_problem_id);


--
-- Name: industry_solution_reviews industry_solution_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.industry_solution_reviews
    ADD CONSTRAINT industry_solution_reviews_pkey PRIMARY KEY (id);


--
-- Name: industry_team_messages industry_team_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.industry_team_messages
    ADD CONSTRAINT industry_team_messages_pkey PRIMARY KEY (id);


--
-- Name: problem_reports problem_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.problem_reports
    ADD CONSTRAINT problem_reports_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: student_otps student_otps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_otps
    ADD CONSTRAINT student_otps_pkey PRIMARY KEY (id);


--
-- Name: student_problems student_problems_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_problems
    ADD CONSTRAINT student_problems_pkey PRIMARY KEY (id);


--
-- Name: student_problems student_problems_student_id_problem_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_problems
    ADD CONSTRAINT student_problems_student_id_problem_id_key UNIQUE (student_id, problem_id);


--
-- Name: students students_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_email_key UNIQUE (email);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- Name: team_members team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);


--
-- Name: team_members team_members_team_id_student_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_team_id_student_id_key UNIQUE (team_id, student_id);


--
-- Name: team_solutions team_solutions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_solutions
    ADD CONSTRAINT team_solutions_pkey PRIMARY KEY (id);


--
-- Name: team_solutions team_solutions_team_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_solutions
    ADD CONSTRAINT team_solutions_team_id_key UNIQUE (team_id);


--
-- Name: teams teams_invite_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_invite_code_key UNIQUE (invite_code);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: universities universities_domain_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.universities
    ADD CONSTRAINT universities_domain_key UNIQUE (domain);


--
-- Name: universities universities_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.universities
    ADD CONSTRAINT universities_email_key UNIQUE (email);


--
-- Name: universities universities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.universities
    ADD CONSTRAINT universities_pkey PRIMARY KEY (id);


--
-- Name: university_otps university_otps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.university_otps
    ADD CONSTRAINT university_otps_pkey PRIMARY KEY (id);


--
-- Name: idx_citizen_cases_problem; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_citizen_cases_problem ON public.citizen_cases USING btree (problem_id);


--
-- Name: idx_faculties_university; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_faculties_university ON public.faculties USING btree (university_id);


--
-- Name: idx_government_actions_gov_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_government_actions_gov_user_id ON public.government_actions USING btree (gov_user_id);


--
-- Name: idx_government_actions_problem_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_government_actions_problem_id ON public.government_actions USING btree (problem_id);


--
-- Name: idx_government_otps_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_government_otps_email ON public.government_otps USING btree (email);


--
-- Name: idx_guidance_requests_faculty; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_guidance_requests_faculty ON public.faculty_guidance_requests USING btree (faculty_id);


--
-- Name: idx_guidance_requests_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_guidance_requests_student ON public.faculty_guidance_requests USING btree (student_id);


--
-- Name: idx_guidance_requests_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_guidance_requests_token ON public.faculty_guidance_requests USING btree (response_token);


--
-- Name: idx_industries_domain; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_industries_domain ON public.industries USING btree (domain);


--
-- Name: idx_industries_sector; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_industries_sector ON public.industries USING btree (sector);


--
-- Name: idx_industry_adoptions_industry; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_industry_adoptions_industry ON public.industry_problem_adoptions USING btree (industry_id);


--
-- Name: idx_industry_adoptions_problem; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_industry_adoptions_problem ON public.industry_problem_adoptions USING btree (problem_id);


--
-- Name: idx_industry_adoptions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_industry_adoptions_status ON public.industry_problem_adoptions USING btree (status);


--
-- Name: idx_industry_otps_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_industry_otps_email ON public.industry_otps USING btree (email);


--
-- Name: idx_industry_reviews_industry; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_industry_reviews_industry ON public.industry_solution_reviews USING btree (industry_id);


--
-- Name: idx_industry_reviews_student_problem; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_industry_reviews_student_problem ON public.industry_solution_reviews USING btree (student_problem_id);


--
-- Name: idx_itm_industry_team; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_itm_industry_team ON public.industry_team_messages USING btree (industry_id, team_id, created_at);


--
-- Name: idx_itm_team; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_itm_team ON public.industry_team_messages USING btree (team_id, created_at);


--
-- Name: idx_itm_unread_industry; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_itm_unread_industry ON public.industry_team_messages USING btree (industry_id) WHERE (is_read_by_industry = false);


--
-- Name: idx_itm_unread_team; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_itm_unread_team ON public.industry_team_messages USING btree (team_id) WHERE (is_read_by_team = false);


--
-- Name: idx_problem_reports_case_reference; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_problem_reports_case_reference ON public.problem_reports USING btree (case_reference);


--
-- Name: idx_problem_reports_case_reference_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_problem_reports_case_reference_unique ON public.problem_reports USING btree (case_reference) WHERE (case_reference IS NOT NULL);


--
-- Name: idx_problem_reports_problem; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_problem_reports_problem ON public.problem_reports USING btree (problem_id);


--
-- Name: idx_reports_gov_review_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reports_gov_review_status ON public.reports USING btree (gov_review_status);


--
-- Name: idx_reports_priority_score; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reports_priority_score ON public.reports USING btree (priority_score DESC);


--
-- Name: idx_reports_responsible_fields; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reports_responsible_fields ON public.reports USING gin (responsible_fields);


--
-- Name: idx_student_otps_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_otps_email ON public.student_otps USING btree (email, created_at DESC);


--
-- Name: idx_student_problems_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_problems_student ON public.student_problems USING btree (student_id);


--
-- Name: idx_students_university_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_university_id ON public.students USING btree (university_id);


--
-- Name: idx_team_members_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_team_members_student ON public.team_members USING btree (student_id);


--
-- Name: idx_team_members_team; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_team_members_team ON public.team_members USING btree (team_id);


--
-- Name: idx_team_solutions_team; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_team_solutions_team ON public.team_solutions USING btree (team_id);


--
-- Name: idx_teams_problem_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_teams_problem_id ON public.teams USING btree (problem_id);


--
-- Name: idx_universities_domain; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_universities_domain ON public.universities USING btree (domain);


--
-- Name: idx_university_otps_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_university_otps_email ON public.university_otps USING btree (email);


--
-- Name: reports_embedding_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reports_embedding_idx ON public.reports USING ivfflat (embedding public.vector_cosine_ops) WITH (lists='100');


--
-- Name: reports_embedding_idx1; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reports_embedding_idx1 ON public.reports USING hnsw (embedding public.vector_cosine_ops);


--
-- Name: faculties faculties_university_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faculties
    ADD CONSTRAINT faculties_university_id_fkey FOREIGN KEY (university_id) REFERENCES public.universities(id) ON DELETE CASCADE;


--
-- Name: faculty_guidance_requests faculty_guidance_requests_faculty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faculty_guidance_requests
    ADD CONSTRAINT faculty_guidance_requests_faculty_id_fkey FOREIGN KEY (faculty_id) REFERENCES public.faculties(id) ON DELETE CASCADE;


--
-- Name: faculty_guidance_requests faculty_guidance_requests_problem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faculty_guidance_requests
    ADD CONSTRAINT faculty_guidance_requests_problem_id_fkey FOREIGN KEY (problem_id) REFERENCES public.reports(id) ON DELETE CASCADE;


--
-- Name: faculty_guidance_requests faculty_guidance_requests_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faculty_guidance_requests
    ADD CONSTRAINT faculty_guidance_requests_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: faculty_guidance_requests faculty_guidance_requests_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faculty_guidance_requests
    ADD CONSTRAINT faculty_guidance_requests_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;


--
-- Name: citizen_cases fk_citizen_cases_problem; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.citizen_cases
    ADD CONSTRAINT fk_citizen_cases_problem FOREIGN KEY (problem_id) REFERENCES public.reports(id) ON DELETE SET NULL;


--
-- Name: gov_access_log gov_access_log_gov_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gov_access_log
    ADD CONSTRAINT gov_access_log_gov_user_id_fkey FOREIGN KEY (gov_user_id) REFERENCES public.government_users(id);


--
-- Name: gov_access_log gov_access_log_problem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gov_access_log
    ADD CONSTRAINT gov_access_log_problem_id_fkey FOREIGN KEY (problem_id) REFERENCES public.reports(id);


--
-- Name: gov_access_log gov_access_log_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gov_access_log
    ADD CONSTRAINT gov_access_log_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: government_actions government_actions_gov_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.government_actions
    ADD CONSTRAINT government_actions_gov_user_id_fkey FOREIGN KEY (gov_user_id) REFERENCES public.government_users(id) ON DELETE CASCADE;


--
-- Name: government_actions government_actions_problem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.government_actions
    ADD CONSTRAINT government_actions_problem_id_fkey FOREIGN KEY (problem_id) REFERENCES public.reports(id) ON DELETE CASCADE;


--
-- Name: industry_problem_adoptions industry_problem_adoptions_industry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.industry_problem_adoptions
    ADD CONSTRAINT industry_problem_adoptions_industry_id_fkey FOREIGN KEY (industry_id) REFERENCES public.industries(id) ON DELETE CASCADE;


--
-- Name: industry_problem_adoptions industry_problem_adoptions_problem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.industry_problem_adoptions
    ADD CONSTRAINT industry_problem_adoptions_problem_id_fkey FOREIGN KEY (problem_id) REFERENCES public.reports(id) ON DELETE CASCADE;


--
-- Name: industry_solution_reviews industry_solution_reviews_industry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.industry_solution_reviews
    ADD CONSTRAINT industry_solution_reviews_industry_id_fkey FOREIGN KEY (industry_id) REFERENCES public.industries(id) ON DELETE CASCADE;


--
-- Name: industry_solution_reviews industry_solution_reviews_student_problem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.industry_solution_reviews
    ADD CONSTRAINT industry_solution_reviews_student_problem_id_fkey FOREIGN KEY (student_problem_id) REFERENCES public.student_problems(id) ON DELETE CASCADE;


--
-- Name: industry_team_messages industry_team_messages_industry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.industry_team_messages
    ADD CONSTRAINT industry_team_messages_industry_id_fkey FOREIGN KEY (industry_id) REFERENCES public.industries(id) ON DELETE CASCADE;


--
-- Name: industry_team_messages industry_team_messages_problem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.industry_team_messages
    ADD CONSTRAINT industry_team_messages_problem_id_fkey FOREIGN KEY (problem_id) REFERENCES public.reports(id) ON DELETE CASCADE;


--
-- Name: industry_team_messages industry_team_messages_sender_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.industry_team_messages
    ADD CONSTRAINT industry_team_messages_sender_student_id_fkey FOREIGN KEY (sender_student_id) REFERENCES public.students(id) ON DELETE SET NULL;


--
-- Name: industry_team_messages industry_team_messages_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.industry_team_messages
    ADD CONSTRAINT industry_team_messages_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- Name: problem_reports problem_reports_problem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.problem_reports
    ADD CONSTRAINT problem_reports_problem_id_fkey FOREIGN KEY (problem_id) REFERENCES public.reports(id) ON DELETE CASCADE;


--
-- Name: reports reports_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.government_users(id);


--
-- Name: reports reports_status_set_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_status_set_by_fkey FOREIGN KEY (status_set_by) REFERENCES public.government_users(id);


--
-- Name: reports reports_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.government_users(id);


--
-- Name: student_problems student_problems_problem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_problems
    ADD CONSTRAINT student_problems_problem_id_fkey FOREIGN KEY (problem_id) REFERENCES public.reports(id) ON DELETE CASCADE;


--
-- Name: student_problems student_problems_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_problems
    ADD CONSTRAINT student_problems_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: students students_university_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_university_id_fkey FOREIGN KEY (university_id) REFERENCES public.universities(id);


--
-- Name: team_members team_members_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: team_members team_members_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- Name: team_solutions team_solutions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_solutions
    ADD CONSTRAINT team_solutions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: team_solutions team_solutions_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_solutions
    ADD CONSTRAINT team_solutions_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- Name: team_solutions team_solutions_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_solutions
    ADD CONSTRAINT team_solutions_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.students(id) ON DELETE SET NULL;


--
-- Name: teams teams_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: teams teams_problem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_problem_id_fkey FOREIGN KEY (problem_id) REFERENCES public.reports(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict LnntfjUr5DIANDe0wr7dceeBDUn01VXlCF88nbo2ZzY12SIMBTLuoUY6r7dLqgH

