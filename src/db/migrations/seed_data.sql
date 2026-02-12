--
-- PostgreSQL database dump
--

\restrict 3n7ug93fsL2mz0QtTkAme8yOaBrBAr1OBNwrADTohggGDAWFGecuTA8TPelu8DE

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
2	Jack (for testing)	TELUGU	1	2026-02-03 22:28:14.591013+01	admin@example.com
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
32	7	Magadheera	f	2025-04-19 20:06:58+02	vishalb4222@gmail.com	f
33	6	Ala Vaikuntapuramlo	f	2025-04-26 18:28:30+02	mallikarjuna.bnk@protonmail.com	f
34	6	Race Gurram	f	2025-04-26 18:32:32+02	mallikarjuna.bnk@protonmail.com	f
35	6	Julayi	f	2025-04-29 19:54:02+02	dasararajurohith@gmail.com	f
20	3	Saaho	f	2026-02-03 23:50:23.51972+01	admin@example.com	t
12	3	Baahubali	f	2026-02-11 19:56:07.553703+01	admin	t
22	4	Attarintiki Daredi	f	2026-02-11 20:03:14.766445+01	admin	f
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
54	12	3	Bhallala Deva	VILLAIN	100 adugula vigraham, 100 pranalaina bali korada....	Take 1 cards from each player to build his idol.	Pairs with Sivagami	f	2025-04-13 13:15:12+02	shajid24mughal@gmail.com
57	12	3	Simhasanam	WC	Mahishmati Saamraajyam, Aswaakam Ajeeyam!!	Pairs with any Hero or Villain and swap hands with  next player.		f	2025-04-13 13:15:12+02	admin
58	13	3	Bujji	HERO	volvo bus running lo undaga, adham badhalu kotteskoni eppudanna bayataki velpotha anukunnava!!	Take a card from previous player and ask the next player to drop one card.	Pairs with Sivanna	f	2025-04-13 13:17:00+02	mallikarjuna.bnk@protonmail.com
59	13	3	Machi reddy	VILLAIN	naku rules, sections cheppodhu	Reverse the game direction		f	2025-04-13 13:17:00+02	mallikarjuna.bnk@protonmail.com
60	13	3	Shivanna	SR1	nuvve na second setup.. ninnu veyyadanike vacha	Choose one player. They cannot play any Action cards on you until your next turn.	Pairs with Bujji. If you were attacked earlier this round, choose one of those players and swap hands with them.	f	2025-04-13 13:17:00+02	mallikarjuna.bnk@protonmail.com
61	13	3	Sathi	SR2	chitti ni, bujji ni kalapadame na lakshyam	Can only be used if you have Chitti/Bujji. Discard Sathi and take Bujji/Chitti from the acitve players.		f	2025-04-13 13:17:00+02	mallikarjuna.bnk@protonmail.com
62	13	3	Chitti	WC	Bujji ni thappa evarini love cheyanu	Guess a player who has Bujji. If you are correct, take Bujji card. If you are wrong, discard this card.	Pair with bujji, you are safe from one attack untill your next turn.	f	2025-04-13 13:17:00+02	mallikarjuna.bnk@protonmail.com
63	14	3	Prabha	HERO	Nandini meedha pichi premani katha la cheppanu	Draw 2 cards per player and you deal the cards for two rounds		f	2025-04-13 13:18:00+02	mallikarjuna.bnk@protonmail.com
64	14	3	Rishi	VILLAIN	So.. Shall we start the game?	Challenge the next player to say a dialogue from Darling. If they fail, they must discard a Villain or SR card.		f	2025-04-13 13:18:00+02	mallikarjuna.bnk@protonmail.com
65	14	3	Nandini	SR1	vadu nannu loose annade	Take 2 cards from the next player		f	2025-04-13 13:18:00+02	mallikarjuna.bnk@protonmail.com
66	14	3	Babai	SR2	Em babu tinnara...!	Each player who has a Darling card draws 1 card from the deck, including you.		f	2025-04-13 13:18:00+02	mallikarjuna.bnk@protonmail.com
67	14	3	Bond babu	WC	nenu half ticket, black tickets tho aadanu!	Challenge the next player to mimic Nandhini. If they fail, say the call sign and don't play for a turn.		f	2025-04-13 13:18:00+02	mallikarjuna.bnk@protonmail.com
68	15	3	Jai	HERO	Ippati varaku oka lekka, ippati nundi oka lekka	Challenge the next player with a Prabhas trivia. The winner takes 3 cards from the loser and the loser must tuck in their shirt and continue playing.		f	2025-04-13 13:18:53+02	mallikarjuna.bnk@protonmail.com
69	15	3	Uma	VILLAIN	Cheppara Cheppuu...!!!!	select a player and every player  must attack the same player for the round		f	2025-04-13 13:18:53+02	mallikarjuna.bnk@protonmail.com
70	15	3	Deva	SR1	Em paapam chesthee puttav ra....!!!!	say this dialogue to any player and skip their attack once!		f	2025-04-13 13:18:53+02	mallikarjuna.bnk@protonmail.com
71	15	3	Veera Pratap	SR2	Manchi Manchi kattu batlu	everyone should give one card to their next player		f	2025-04-13 13:18:53+02	mallikarjuna.bnk@protonmail.com
72	15	3	Na Family Safe!!!	WC		you are immune to one attack for a round		f	2025-04-13 13:18:53+02	mallikarjuna.bnk@protonmail.com
73	16	3	Deva	HERO	Please, I kindly request	Take control of the game; draw cards until you have 7.		f	2025-04-13 13:19:41+02	mallikarjuna.bnk@protonmail.com
74	16	3	Varadha raja mannar	SR1		Phone call your deva and ask them for a promise, to get immunity for a round. If they are not doing drop two cards.	Pairs with Nibandhana	f	2025-04-13 13:19:41+02	admin
77	16	3	Nibandhana	WC		Varadha may use Nibadhana to start a vote to choose a player. The player with most votes discards 3 cards.		f	2025-04-13 13:19:41+02	mallikarjuna.bnk@protonmail.com
78	17	3	Billa	HERO	Trust no one, kill anyone, be only one	Every player drops a card unless they have ACP KrishnaMurthy	You can stop Devil's action	f	2025-04-13 13:20:40+02	mallikarjuna.bnk@protonmail.com
79	17	3	Devil	VILLAIN	Good for me bad for you / E deal varake ra ne avasaram	Smuggle 2 cards from pile. only billa can stop. if caught, devil card goes to them.		f	2025-04-13 13:20:40+02	admin
80	17	3	ACP krishnamurthy	SR1	Nuvvu Billa ga maaradaniki ide correct time!	Swap place with previous player	Pairs with Ranga	f	2025-04-13 13:20:40+02	mallikarjuna.bnk@protonmail.com
75	16	3	Radha rama mannar	SR2	call for cease fire	No one looses hero card for one round		f	2026-02-04 22:08:37.117871+01	admin
56	12	3	Sivagami	SR2	Idhi naa maata, naa maate shaasanam	Reset: Gather cards from players, shuffle, and redeal all cards equally.	With Bhallala Deva, Steal cards that Amarendra Baahubali rightfully gained in current round.	f	2026-02-10 19:44:31.68499+01	admin
81	17	3	Maya	SR2		Guess who has Billa card and they drop one card. If they have Ranga card instead, all other players drops one card.		f	2025-04-13 13:20:40+02	mallikarjuna.bnk@protonmail.com
82	17	3	Ranga	WC	I will be back(act as billa)	Grab Billa card when someone is using it and drop this card	With ACP Krishnamurthy - Act as Billa and Steal two cards from next player	f	2025-04-13 13:20:40+02	mallikarjuna.bnk@protonmail.com
83	19	3	Bhairava	HERO	Eesari full ga prepare ayyi vacha	Collect 2 cards as bounty from any player	Pairs with Bujji	f	2025-04-13 13:21:46+02	mallikarjuna.bnk@protonmail.com
84	19	3	Supreme Yaskin	VILLAIN	Oka kotha prapancham rabotondi	Swap next player cards with deck cards.	Pairs with Serum	f	2025-04-13 13:21:46+02	mallikarjuna.bnk@protonmail.com
85	19	3	Ashwathama	SR1	Amma ni kaapadatam kosam chivari daaka poratam	Unless there is only one opponent, you do not have to discard this card if it is the only card in your hand.		f	2025-04-13 13:21:46+02	mallikarjuna.bnk@protonmail.com
86	19	3	Bujji	SR2	Get Ready Bhairava	Take Bhairava anywhere he asks for. Shift to any position in the player circle		f	2025-04-13 13:21:46+02	mallikarjuna.bnk@protonmail.com
88	20	3	Saaho	HERO	stadium lo six kottevaadike oka range untadi.	draw cards until you have 5 cards.	pairs with David	f	2025-04-13 13:22:18+02	mallikarjuna.bnk@protonmail.com
89	20	3	Devraj	VILLAIN		Next player drops one card.	pairs with black box	f	2025-04-13 13:22:18+02	mallikarjuna.bnk@protonmail.com
90	20	3	David	SR1		Hack into the top cards of the deck equal to the number of active players. Rearrange them in any order and place them back on top.		f	2025-04-13 13:22:18+02	mallikarjuna.bnk@protonmail.com
91	20	3	Vishwank Roy	SR2		If any player played Saaho this round, discard this card. After that player's turn ends, take the Saaho card.	You have no attacks, just drop the card and watch the action.	f	2025-04-13 13:22:18+02	mallikarjuna.bnk@protonmail.com
92	20	3	Blackbox	WC	I will be a fucking billionaire	has the luxury to sit back and relax for two rounds	if Devraj gets hold of this, he can draw cards until your hand is full.	f	2025-04-13 13:22:18+02	mallikarjuna.bnk@protonmail.com
93	22	4	Gautham Nanda	HERO	Rich (nak e station kavali)	If you have this card, you can discard any two unwanted cards and draw two new cards from the pile	Everyone is a servant for one round	f	2025-04-13 13:26:12+02	mallikarjuna.bnk@protonmail.com
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
138	18	3	Chatrapathi	HERO	okka adugu..okkka adugu...!!!	Challenge the next player to a Chatrapathi dialogue battle; the winner takes 2 cards from the loser.	Pairs with Appalanaidu.	f	2025-04-14 13:12:44+02	mallikarjuna.bnk@protonmail.com
139	18	3	Ashok	VILLAIN	Rendu chavulu jaragali... vasakolla	Sneak two cards from next player		f	2025-04-14 13:13:58+02	admin
140	18	3	Appala Naidu	SR1	Raajakeeyam, rowdyism okkati kaadu ra rey	Reverse the game direction	Pairs with chatrapathi:\nRedirect any incoming attack back to the player who played it on you.	f	2025-04-14 13:15:01+02	mallikarjuna.bnk@protonmail.com
141	18	3	Mahesh Nanda	SR2	No No control yourself...!!!	Any player with highest num of cards should drop a card		f	2025-04-14 13:15:57+02	mallikarjuna.bnk@protonmail.com
143	21	3	Venkat	HERO	sailu kosam 10 sarlu chaavadaniki nen ready! Nuvvu ready aah?	Challenge two players to enact the Gali Gannarao–Sunil episode; the act must be approved by the other players, or they must drop two cards each.		f	2025-04-14 13:22:46+02	admin
144	21	3	Bhadranna	VILLAIN	vaadu hero avvakoodadhu...	Swap all your cards with the opponent having the highest number of cards.		f	2025-04-14 13:23:32+02	mallikarjuna.bnk@protonmail.com
145	21	3	Lola Ranga Rao	SR1	naaku nee face nachaledu	Next player cannot cast cards for the next two turns, but other players may still cast actions on them		f	2025-04-14 13:24:16+02	mallikarjuna.bnk@protonmail.com
147	32	7	Harsha/Kalabhairava	HERO	Okokkarini kaadhu Sher Khan Vanda Mandhini okesari rammanu	Harsha: Has Ability to take 2 cards from the deck	Kala Bhairava: Can Slash 2 cards of the opponent 	t	2025-04-19 22:55:54+02	admin
148	32	7	Randhev Billa	VILLAIN	Naku Dhakkanidhi inkevariki Dhakkanivvanu	If the opponent has the INDU card, Can snatch the card from them		f	2025-04-19 23:14:01+02	vishalb4222@gmail.com
149	33	6	Bantu	HERO		Save the Hand for one round and with ARK card he can get half of the cards from the deck (extra cards)		f	2025-04-26 18:30:15+02	mallikarjuna.bnk@protonmail.com
150	33	6	Appala Naidu	VILLAIN		Can kidnap (take a card from any one player)		f	2025-04-26 18:30:46+02	mallikarjuna.bnk@protonmail.com
151	33	6	Valmiki	SR1		Swaps a single card with the opponent		f	2025-04-26 18:31:09+02	mallikarjuna.bnk@protonmail.com
152	33	6	ARK (Thatha)	SR2		Player with this card can can break half of the players hand and ask them to take remaining half from the deck		f	2025-04-26 18:31:33+02	mallikarjuna.bnk@protonmail.com
153	33	6	Nurse Sulochana	WC		Player with card can see the other cards if swap happens (any round)		f	2025-04-26 18:31:55+02	mallikarjuna.bnk@protonmail.com
154	34	6	 Lucky	HERO		Connect with any SR and ask the opponent to drop villain card or take a any SR from opponent to connect		f	2025-04-26 18:32:53+02	mallikarjuna.bnk@protonmail.com
155	34	6	Maddali Shiva Reddy	VILLAIN	you are finished!! / Maddali shiva reddy	will blackmail one opponent to drop two cards or give an option to the opponents to pluck one card from others		f	2025-04-26 18:33:35+02	mallikarjuna.bnk@protonmail.com
156	34	6	Spandana	SR1	 Inside feeling	No use just hold the card and feel inside		f	2025-04-26 18:34:07+02	mallikarjuna.bnk@protonmail.com
157	34	6	Kill bill pandey	SR2	Bariloki dimpodhu brutal ipotha 	With any hero card + kill bill card - ask the opponent villain card to drop but has to sacrifice kill bill card		f	2025-04-26 18:34:59+02	mallikarjuna.bnk@protonmail.com
158	34	6	Devudddaa!!! / Connect ipoyav	WC		Able to get one card from the used cards - connect avvali		f	2025-04-26 18:35:24+02	mallikarjuna.bnk@protonmail.com
159	35	6	Ravindra Narayan	HERO	Class lo Evadaina Samadhanam Chepthadu kani Game Lo Cheppevaade...	Take a look at any of your opponent's deck secretly and pick any one card		f	2025-04-29 20:10:47+02	dasararajurohith@gmail.com
160	35	6	Bittu	VILLAIN	Manaki Telsina pani free ga cheyakudadhu, Manaki raani pani try cheyakudadhu	NA		f	2025-04-29 20:17:57+02	dasararajurohith@gmail.com
161	35	6	DIG Sitaram	SR1	veediki konchem povvulni ammayilani choopinchandra mari voilent ga unnadu	everyone gives you a heroine card to you		f	2025-04-29 20:19:17+02	dasararajurohith@gmail.com
163	19	3	Serum	WC	Vasthunnay, vasthunnay, jagannatha ratha chakralu vasthunnay.	Regain the lost number of cards in the previous round from the deck	pairs with Yaskin, eliminate any one player.	f	2026-01-04 12:51:37+01	mallikarjuna.bnk@protonmail.com
164	16	3	Rudhra Raja Mannar	VILLAIN		Each player places 1 card face down. Shuffle these cards to create a new deck for the next round		f	2026-01-04 15:11:43+01	mallikarjuna.bnk@protonmail.com
166	21	3	Varsham	WC	NA	Ask any player to call for rain. If it doesn't rain, they lose one card.		f	2026-01-05 18:05:30+01	mallikarjuna.bnk@protonmail.com
167	18	3	Chembuu!!	WC		Replicate chembuu scene and get immunity for 2 rounds.(Must have at least two cards to use the ability)		f	2026-01-06 07:25:18+01	mallikarjuna.bnk@protonmail.com
55	12	3	Kattappa	SR1	Simhasananiki kattu baanisani	With Sivagami. When Baahubali is played this round, reveal Sivagami and Kattappa to capture him.	With Amarendra Bahubali to dodge elimination by retaining kattappa and dropping Bahubali card.	f	2026-02-04 22:27:14.59325+01	admin
146	21	3	Gun, The Jagan	SR2	vethuku vethakali vethikithe dorakandantu emi undadu...	Swap any two cards in your hand with two cards from the deck.		f	2026-02-04 22:08:41.491976+01	admin
53	12	3	Amarendra Baahubali	HERO	Jai Mahishmathi	Take two cards from next player of your choice	pairs with kattappa	f	2026-02-10 19:48:17.034142+01	admin
97	22	4	Ekkada neggalo kaadhu ekada taggalo telsina vaadu goppodu	WC	\N	If the player holds this card, they can save five cards for one round	\N	f	2026-02-10 22:54:18.492434+01	admin
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
-- Data for Name: user_game_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_game_roles (id, user_id, game_id, role_id) FROM stdin;
1	2	\N	1
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
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 5, true);


--
-- Name: tags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tags_id_seq', 14, true);


--
-- Name: user_game_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_game_roles_id_seq', 4, true);


--
-- PostgreSQL database dump complete
--

\unrestrict 3n7ug93fsL2mz0QtTkAme8yOaBrBAr1OBNwrADTohggGDAWFGecuTA8TPelu8DE

