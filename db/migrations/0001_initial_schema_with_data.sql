-- PostgreSQL Migration: Initial Schema
-- Created from SQLite database export
-- Date: 2026-02-03
-- NOTE: Data is seeded separately via seed_data.sql

-- Create games table
CREATE TABLE games (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL CHECK(type IN ('CARDS', 'BOARDS')),
  last_update_dt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  last_update_user VARCHAR(255) DEFAULT 'admin'
);

-- Create heroes table
CREATE TABLE heroes (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('TELUGU', 'HINDI', 'TAMIL', 'KANNADA', 'MALAYALAM')),
  game_id BIGINT NOT NULL,
  last_update_dt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  last_update_user VARCHAR(255) DEFAULT 'admin',
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  UNIQUE (game_id, name)
);

-- Create index on game_id for heroes
CREATE INDEX idx_heroes_game_id ON heroes(game_id);

-- Create movies table
CREATE TABLE movies (
  id BIGSERIAL PRIMARY KEY,
  hero_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  need_review BOOLEAN DEFAULT false,
  last_update_dt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  last_update_user VARCHAR(255) DEFAULT 'admin',
  locked BOOLEAN NOT NULL DEFAULT false,
  FOREIGN KEY (hero_id) REFERENCES heroes(id) ON DELETE CASCADE
);

-- Create index on hero_id for movies
CREATE INDEX idx_movies_hero_id ON movies(hero_id);

-- Create unique index on movies (hero_id, title)
CREATE UNIQUE INDEX idx_movies_hero_title ON movies(hero_id, title);

-- Create tags table
CREATE TABLE tags (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);

-- Create cards table
CREATE TABLE cards (
  id BIGSERIAL PRIMARY KEY,
  movie_id BIGINT,
  hero_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('HERO', 'VILLAIN', 'SR1', 'SR2', 'WC')),
  call_sign TEXT,
  ability_text TEXT NOT NULL,
  ability_text2 TEXT,
  need_review BOOLEAN DEFAULT false,
  last_update_dt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  last_update_user VARCHAR(255) DEFAULT 'admin',
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  FOREIGN KEY (hero_id) REFERENCES heroes(id) ON DELETE CASCADE
);

-- Create unique index on cards (hero_id, movie_id, name)
CREATE UNIQUE INDEX idx_cards_hero_movie_name ON cards(hero_id, movie_id, name);

-- Create card_tags table
CREATE TABLE card_tags (
  card_id BIGINT NOT NULL,
  tag_id BIGINT NOT NULL,
  PRIMARY KEY (card_id, tag_id),
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Create indexes on card_tags
CREATE INDEX idx_card_tags_card_id ON card_tags(card_id);
CREATE INDEX idx_card_tags_tag_id ON card_tags(tag_id);
INSERT INTO games (id, name, slug, type, last_update_dt, last_update_user) VALUES
(1, 'Blast Alpha', 'blast-alpha', 'CARDS', '2025-04-03 16:12:33', 'admin');

-- Insert heroes
INSERT INTO heroes (id, name, category, game_id, last_update_dt, last_update_user) VALUES
(1, 'Jr NTR', 'TELUGU', 1, '2025-04-03 16:12:33', 'admin'),
(2, 'Jack (for testing)', 'TELUGU', 1, '2025-04-07 22:10:02', 'admin'),
(3, 'Prabhas', 'TELUGU', 1, '2025-04-13 13:08:51', 'admin'),
(4, 'Pawan Kalyan', 'TELUGU', 1, '2025-04-13 13:23:30', 'admin'),
(5, 'Nani', 'TELUGU', 1, '2025-04-13 13:40:43', 'admin'),
(6, 'Allu Arjunnn', 'TELUGU', 1, '2025-04-13 13:40:54', 'admin'),
(7, 'Ram Charan', 'TELUGU', 1, '2025-04-13 13:41:10', 'admin'),
(8, 'Mahesh Babu', 'TELUGU', 1, '2025-04-13 13:41:33', 'admin');

-- Insert movies
INSERT INTO movies (id, hero_id, title, status, need_review, last_update_dt, last_update_user, locked) VALUES
(1, 1, 'Yamadonga', 'DONE', false, '2025-04-03 16:12:33', 'admin', false),
(2, 1, 'Aadi', 'DONE', false, '2025-04-03 16:12:33', 'admin', false),
(3, 1, 'Devara', 'DONE', false, '2025-04-03 16:12:33', 'admin', false),
(4, 1, 'Janatha Garage', 'PENDING', false, '2025-04-03 16:12:33', 'admin', false),
(5, 1, 'Nannaku Prematho', 'PENDING', false, '2025-04-03 16:12:33', 'admin', false),
(6, 1, 'Baadshah', 'DONE', false, '2025-04-03 16:12:33', 'admin', false),
(7, 1, 'Aravinda Sametha Veera Raghava', 'PENDING', false, '2025-04-03 16:12:33', 'admin', false),
(8, 1, 'Jai Lava Kusa', 'PENDING', false, '2025-04-03 16:12:33', 'admin', false),
(9, 1, 'Temper', 'PENDING', false, '2025-04-03 16:12:33', 'admin', false),
(10, 1, 'Adhurs', 'DONE', false, '2025-04-03 16:12:33', 'admin', false),
(11, 2, 'Kannappa - The Snow Tester', 'PENDING', false, '2025-04-07 22:55:54', 'admin', false),
(12, 3, 'Baahubali', 'PENDING', false, '2025-04-13 13:11:55', 'admin', true),
(13, 3, 'Bujjigadu', 'PENDING', false, '2025-04-13 13:11:55', 'admin', true),
(14, 3, 'Darling', 'PENDING', false, '2025-04-13 13:11:55', 'admin', true),
(15, 3, 'Mirchi', 'PENDING', false, '2025-04-13 13:11:55', 'admin', true),
(16, 3, 'Salaar', 'PENDING', false, '2025-04-13 13:11:55', 'admin', true),
(17, 3, 'Billa', 'PENDING', false, '2025-04-13 13:11:55', 'admin', true),
(18, 3, 'Chatrapathi', 'PENDING', false, '2025-04-13 13:11:55', 'admin', true),
(19, 3, 'Kalki 2898 AD', 'PENDING', false, '2025-04-13 13:11:55', 'admin', true),
(20, 3, 'Saaho', 'PENDING', false, '2025-04-13 13:11:55', 'admin', true),
(21, 3, 'Varsham', 'PENDING', false, '2025-04-13 13:11:55', 'admin', true),
(22, 4, 'Attarintiki Daredi', 'PENDING', false, '2025-04-13 13:24:13', 'admin', false),
(23, 4, 'Badri', 'PENDING', false, '2025-04-13 13:24:13', 'admin', false),
(24, 4, 'Balu', 'PENDING', false, '2025-04-13 13:24:13', 'admin', false),
(25, 4, 'Bheemla Nayak', 'PENDING', false, '2025-04-13 13:24:13', 'admin', false),
(26, 4, 'Gabbar Singh', 'PENDING', false, '2025-04-13 13:24:13', 'admin', false),
(27, 4, 'Gudumba Shankar', 'PENDING', false, '2025-04-13 13:24:13', 'admin', false),
(28, 4, 'Jalsa', 'PENDING', false, '2025-04-13 13:24:13', 'admin', false),
(29, 4, 'Panjaa', 'PENDING', false, '2025-04-13 13:24:13', 'admin', false),
(30, 4, 'Thammudu', 'PENDING', false, '2025-04-13 13:24:13', 'admin', false),
(31, 4, 'Vakeel Saab', 'PENDING', false, '2025-04-13 13:24:13', 'admin', false),
(32, 7, 'Magadheera', 'PENDING', false, '2025-04-19 20:06:58', 'admin', false),
(33, 6, 'Ala Vaikuntapuramlo', 'PENDING', false, '2025-04-26 18:28:30', 'admin', false),
(34, 6, 'Race Gurram', 'PENDING', false, '2025-04-26 18:32:32', 'admin', false),
(35, 6, 'Julayi', 'PENDING', false, '2025-04-29 19:54:02', 'admin', false);

-- Insert tags
INSERT INTO tags (id, name) VALUES
(1, 'Attack'),
(2, 'Defense'),
(3, 'Activity'),
(4, 'Deck-Control'),
(5, 'Disruption'),
(6, 'Hand-Fix'),
(7, 'Next-Player'),
(8, 'Any-Player'),
(9, 'Pair-Up'),
(10, 'Elimination');

-- Insert cards
INSERT INTO cards (id, movie_id, hero_id, name, type, call_sign, ability_text, ability_text2, need_review, last_update_dt, last_update_user) VALUES
(1, 1, 1, 'Raja', 'HERO', NULL, 'Swaps cards and place with another player of choice', NULL, false, '2025-04-03 16:12:33', 'admin'),
(2, 1, 1, 'Yama', 'VILLAIN', '', 'Reverses a previous action casted on you.', 'With Yama Pasham, eliminate a player', false, '2025-04-03 16:12:33', 'admin'),
(3, 1, 1, 'Sathi (Ali)', 'SR1', 'You beating me, I cheating you', 'Helps any Hero in stealing additional card from the opponent', NULL, false, '2025-04-03 16:12:33', 'admin'),
(4, 1, 1, 'Chitragupta (Brahmi)', 'SR2', NULL, 'See the hand of another player', NULL, false, '2025-04-03 16:12:33', 'admin'),
(5, 1, 1, 'Yama Pasham', 'WC', NULL, 'Snatch one card from another player', NULL, false, '2025-04-03 16:12:33', 'admin'),
(6, 1, 1, 'Locket', 'WC', NULL, 'Saves cards from any player for one round', NULL, false, '2025-04-03 16:12:33', 'admin'),
(7, 2, 1, 'Aadi Kesava Reddy', 'HERO', 'Amma thodu addanga narikesta', 'Slash the hands of any player by half (force them to discard half their cards)', NULL, false, '2025-04-03 16:12:33', 'admin'),
(8, 2, 1, 'Nagi Reddy', 'VILLAIN', 'Na bhumi lo guppedu matti theesina peeka korikestha', 'Crunch away two cards from the last opponent who took your cards', NULL, true, '2025-04-03 16:12:33', 'admin'),
(9, 2, 1, 'Veeranna Babai', 'SR1', NULL, 'Protects the player through death – you can keep one card when about to be eliminated', NULL, false, '2025-04-03 16:12:33', 'admin'),
(10, 2, 1, 'College Principal', 'SR2', NULL, 'Ask everyone to say "Good Morning" to you. If they don''t comply, take one card from each as a penalty', NULL, false, '2025-04-03 16:12:33', 'admin'),
(11, 2, 1, 'Naatu Bomb', 'WC', NULL, 'Bomb the opponents. shuffle and redistribute their cards', NULL, false, '2025-04-03 16:12:33', 'admin'),
(12, 3, 1, 'Devara', 'HERO', 'Erra samudram potethaala', 'Sail on the Red Sea to steal 2 cards into your hand', NULL, true, '2025-04-03 16:12:33', 'admin'),
(13, 3, 1, 'Bhaira', 'VILLAIN', NULL, 'Smuggle 1 card via the Red Sea, except from Devara', NULL, true, '2025-04-03 16:12:33', 'admin'),
(14, 3, 1, 'Vara', 'SR1', NULL, 'Stops anyone from using the Red Sea to smuggle goods from you', NULL, false, '2025-04-03 16:12:33', 'admin'),
(15, 3, 1, 'Singappa', 'SR2', 'Ee aata nadavalante… meeku mundu Devara katha theliyali.', 'Ask any opponent to tell Devara''s story or discard half of their hand', NULL, false, '2025-04-03 16:12:33', 'admin'),
(16, 3, 1, 'Aayudhalu', 'WC', NULL, 'Collect all Wild Cards from players via the Red Sea and safeguard them for a round', NULL, false, '2025-04-03 16:12:33', 'admin'),
(17, 4, 1, 'Anand', 'HERO', 'Environment mundu pedha enti, chinna enti', 'Each player must drop one card as a penalty', NULL, false, '2025-04-03 16:12:33', 'admin'),
(18, 4, 1, 'Mukesh Rana', 'VILLAIN', 'Vyaparam annaka theliso theliko padi mandhi joliki veltham.', 'Tamper with the hands of 2 players', NULL, false, '2025-04-03 16:12:33', 'admin'),
(19, 4, 1, 'Sathyam', 'SR1', 'అడ్డగోలుగా పెరిగిన కొమ్మల్ని, కొడుకుల్ని కొట్టేసిన... ఇలాగే నిలబడగలను.', 'If this is your last card, you don''t have to drop it for 2 rounds', NULL, false, '2025-04-03 16:12:33', 'admin'),
(20, 4, 1, 'K. Chandra Shekar IPS', 'SR2', 'Stress unde panlu evi cheyyakudadh', 'Don''t drop your cards when asked to', NULL, false, '2025-04-03 16:12:33', 'admin'),
(21, 4, 1, 'Garage', 'WC', 'Ichata anni repairlu cheyyabadunu', 'Can repair couple of your cards in your hand with cards from the deck', NULL, false, '2025-04-03 16:12:33', 'admin'),
(22, 5, 1, 'Abhiram', 'HERO', 'Ekkada emotion akkade chupettali.', 'If you are angry at any player for a previous action, you can force them to discard 2 cards', NULL, false, '2025-04-03 16:12:33', 'admin'),
(23, 5, 1, 'Krishna Murthy', 'VILLAIN', 'Idi gurthu petko… tarwatha matladadham.', 'Defer an action for three rounds', NULL, false, '2025-04-03 16:12:33', 'admin'),
(24, 5, 1, 'Ramesh Chandra Prasad', 'SR1', 'Some bread please', 'Ask any player for bread (one card)', NULL, false, '2025-04-03 16:12:33', 'admin'),
(25, 5, 1, 'Divya', 'SR2', 'Nanna kosam', 'Take and hide any Hero card from the opponent for one round', NULL, false, '2025-04-03 16:12:33', 'admin'),
(26, 5, 1, 'Butterfly Effect', 'WC', NULL, 'Flap the wings and create a tornado in the opponents'' hands. After 2 rounds, shuffle all players'' hands and redistribute them', NULL, false, '2025-04-03 16:12:33', 'admin'),
(27, 6, 1, 'Rama Rao / Baadshah', 'HERO', 'Baadhshah decide aithe war one side aipothadi', 'Decide whom to target for one round, and everyone will cast action only on them.', NULL, false, '2025-04-03 16:12:33', 'admin'),
(28, 6, 1, 'Pilli Padmanabha Simha', 'SR1', 'when fire fires the fire, fire will be fire, i am the fire.', 'With Inception Chair, burn half cards of any player (drop)', NULL, false, '2025-04-03 16:12:33', 'admin'),
(29, 6, 1, 'Aadi IPS', 'VILLAIN', NULL, 'Peek into the cards of the left and right players and make one drop a card', NULL, false, '2025-04-03 16:12:33', 'admin'),
(30, 6, 1, 'Revenge Nageshwara Rao', 'SR2', NULL, 'Force all players (except you) to swap 1 card with the player to their left', NULL, false, '2025-04-03 16:12:33', 'admin'),
(31, 6, 1, 'Inception Chair', 'WC', NULL, 'Slide into dreams until you sing "Le Le Le… Levamantava" or Skip 2 rounds (you can still be targeted)', NULL, false, '2025-04-03 16:12:33', 'admin'),
(32, 7, 1, 'Veera Raghava', 'HERO', '', 'Ask any player to surrender 2 cards or drop 4 cards ', 'With Aravinda, Neutralizes opponents'' actions without violence and convinces them to drop 1 card', false, '2025-04-03 16:12:33', 'admin'),
(33, 7, 1, 'Basi Reddy', 'VILLAIN', '5rs Faction', 'Can force any player with more than 5 cards to drop 5 cards or get eliminated', NULL, false, '2025-04-03 16:12:33', 'admin'),
(34, 7, 1, 'Jeji', 'SR1', 'Yudham rakunda aaputhade.. aadu goppa. Aade goppa.', 'Cancel out any action cast on you', NULL, false, '2025-04-03 16:12:33', 'admin'),
(35, 7, 1, 'Aravinda', 'SR2', 'Thaggithe thappenti.', 'Dont cast any action for this round on any player', NULL, false, '2025-04-03 16:12:33', 'admin'),
(36, 7, 1, 'Mondi Kathi', 'WC', NULL, 'Combine half the cards of all players, reshuffle, and redistribute them', NULL, false, '2025-04-03 16:12:33', 'admin'),
(37, 8, 1, 'Jai', 'HERO', 'Nijamanedi abadham. Nenanedi nijam.', 'Collect NTR Hero card from any two players', NULL, false, '2025-04-03 16:12:33', 'admin'),
(38, 8, 1, 'Sarkar Sahai', 'VILLAIN', NULL, 'Undermines and discards any opponent''s action except if it''s Jai', NULL, false, '2025-04-03 16:12:33', 'admin'),
(39, 8, 1, 'Lava', 'SR1', NULL, 'Helps defend the Ravana Fort for one round', NULL, false, '2025-04-03 16:12:33', 'admin'),
(40, 8, 1, 'Kusa', 'SR2', NULL, 'Acts as Lava and steals 2 cards from the bank (deck)', NULL, false, '2025-04-03 16:12:33', 'admin'),
(41, 8, 1, 'Naatakam', 'WC', NULL, 'Ask anyone to say a mythological dialogue or discard two cards', NULL, false, '2025-04-03 16:12:33', 'admin'),
(42, 9, 1, 'Daya', 'HERO', 'Dandayatra, idi daya gadi dandayatra', 'Ask bribes from all players (one card each) or they should skip one round casting action.', NULL, false, '2025-04-03 16:12:33', 'admin'),
(43, 9, 1, 'Waltair Vasu', 'VILLAIN', 'East or west, friendship is the best', 'If eliminated, take any two random cards from the player who eliminated you, except Daya', NULL, false, '2025-04-03 16:12:33', 'admin'),
(44, 9, 1, 'Narayana Murthy', 'SR1', 'Ippatikippudu tsunami vachi andar kottukupothe baguntadi', 'Shuffle everyone''s cards and redistribute', NULL, false, '2025-04-03 16:12:33', 'admin'),
(45, 9, 1, 'Saanvi', 'SR2', 'Na babies ni evaro kidnap chesaru. Vethiki pettandi.', 'Ask someone to find your lost babies (give you two cards)', NULL, true, '2025-04-03 16:12:33', 'admin'),
(46, 9, 1, 'Ego', 'WC', 'Na ego na chuttu Wi-Fi la untundi.', 'Cast the action of any Character Card on all players', NULL, false, '2025-04-03 16:12:33', 'admin'),
(47, 10, 1, 'Chari', 'HERO', NULL, 'Acts as Narasimha. Can steal 1 card from an opponent', NULL, true, '2025-04-03 16:12:33', 'admin'),
(48, 10, 1, 'Baba Bhai', 'VILLAIN', NULL, 'When asked to drop cards, hides them instead for 2 rounds', NULL, false, '2025-04-03 16:12:33', 'admin'),
(49, 10, 1, 'Bhattu', 'SR1', NULL, 'Brings in the whole Agraharam and sabotages an action by any Hero card in a round except for Chari', NULL, false, '2025-04-03 16:12:33', 'admin'),
(50, 10, 1, 'Bhasha Bhai', 'SR2', '', 'Becomes invisible for one round ', 'Follows Bhattu from any player and cancels their action for the round', false, '2025-04-03 16:12:33', 'admin'),
(51, 10, 1, 'Thelidu! Gurthu Ledhu! Marchipoya!', 'WC', NULL, 'Helps forget to drop one card when asked to discard cards', NULL, false, '2025-04-03 16:12:33', 'admin'),
(52, 11, 2, 'People Killer', 'HERO', 'Disaster', 'Your game ends in one move', 'alert("hello");', false, '2025-04-07 22:59:34', 'admin'),
(53, 12, 3, 'Amarendra Baahubali', 'HERO', 'Jai Mahishmathi', 'Take two cards from next player of your choice', 'pairs with kattappa', false, '2025-04-13 13:15:12', 'admin'),
(54, 12, 3, 'Bhallala Deva', 'VILLAIN', '100 adugula vigraham, 100 pranalaina bali korada....', 'Take 1 cards from each player to build his idol.', 'Pairs with Sivagami', false, '2025-04-13 13:15:12', 'admin'),
(55, 12, 3, 'Kattappa', 'SR1', 'Simhasananiki kattu baanisani', 'With Sivagami. When Baahubali is played this round, reveal Sivagami and Kattappa to capture him.', 'With Amarendra Bahubali to dodge elimination by retaining kattappa and dropping Bahubali card.', false, '2025-04-13 13:15:12', 'admin'),
(56, 12, 3, 'Sivagami', 'SR2', 'Idhi naa maata, naa maate shaasanam', 'Reset: Gather cards from players, shuffle, and redeal all cards equally.', 'With Bhallala Deva, Steal cards that Amarendra Baahubali rightfully gained in current round.', false, '2025-04-13 13:15:12', 'admin'),
(57, 12, 3, 'Simhasanam', 'WC', 'Mahishmati Saamraajyam, Aswaakam Ajeeyam!!', 'Pairs with any Hero or Villain and swap hands with  next player.', '', false, '2025-04-13 13:15:12', 'admin'),
(58, 13, 3, 'Bujji', 'HERO', 'volvo bus running lo undaga, adham badhalu kotteskoni eppudanna bayataki velpotha anukunnava!!', 'Take a card from previous player and ask the next player to drop one card.', 'Pairs with Sivanna', false, '2025-04-13 13:17:00', 'admin'),
(59, 13, 3, 'Machi reddy', 'VILLAIN', 'naku rules, sections cheppodhu', 'Reverse the game direction', '', false, '2025-04-13 13:17:00', 'admin'),
(60, 13, 3, 'Shivanna', 'SR1', 'nuvve na second setup.. ninnu veyyadanike vacha', 'Choose one player. They cannot play any Action cards on you until your next turn.', 'Pairs with Bujji. If you were attacked earlier this round, choose one of those players and swap hands with them.', false, '2025-04-13 13:17:00', 'admin'),
(61, 13, 3, 'Sathi', 'SR2', 'chitti ni, bujji ni kalapadame na lakshyam', 'Can only be used if you have Chitti/Bujji. Discard Sathi and take Bujji/Chitti from the acitve players.', '', false, '2025-04-13 13:17:00', 'admin'),
(62, 13, 3, 'Chitti', 'WC', 'Bujji ni thappa evarini love cheyanu', 'Guess a player who has Bujji. If you are correct, take Bujji card. If you are wrong, discard this card.', 'Pair with bujji, you are safe from one attack untill your next turn.', false, '2025-04-13 13:17:00', 'admin'),
(63, 14, 3, 'Prabha', 'HERO', 'Nandini meedha pichi premani katha la cheppanu', 'Draw 2 cards per player and you deal the cards for two rounds', '', false, '2025-04-13 13:18:00', 'admin'),
(64, 14, 3, 'Rishi', 'VILLAIN', 'So.. Shall we start the game?', 'Challenge the next player to say a dialogue from Darling. If they fail, they must discard a Villain or SR card.', '', false, '2025-04-13 13:18:00', 'admin'),
(65, 14, 3, 'Nandini', 'SR1', 'vadu nannu loose annade', 'Take 2 cards from the next player', '', false, '2025-04-13 13:18:00', 'admin'),
(66, 14, 3, 'Babai', 'SR2', 'Em babu tinnara...!', 'Each player who has a Darling card draws 1 card from the deck, including you.', '', false, '2025-04-13 13:18:00', 'admin'),
(67, 14, 3, 'Bond babu', 'WC', 'nenu half ticket, black tickets tho aadanu!', 'Challenge the next player to mimic Nandhini. If they fail, say the call sign and don''t play for a turn.', '', false, '2025-04-13 13:18:00', 'admin'),
(68, 15, 3, 'Jai', 'HERO', 'Ippati varaku oka lekka, ippati nundi oka lekka', 'Challenge the next player with a Prabhas trivia. The winner takes 3 cards from the loser and the loser must tuck in their shirt and continue playing.', '', false, '2025-04-13 13:18:53', 'admin'),
(69, 15, 3, 'Uma', 'VILLAIN', 'Cheppara Cheppuu...!!!!', 'select a player and every player  must attack the same player for the round', '', false, '2025-04-13 13:18:53', 'admin'),
(70, 15, 3, 'Deva', 'SR1', 'Em paapam chesthee puttav ra....!!!!', 'say this dialogue to any player and skip their attack once!', '', false, '2025-04-13 13:18:53', 'admin'),
(71, 15, 3, 'Veera Pratap', 'SR2', 'Manchi Manchi kattu batlu', 'everyone should give one card to their next player', '', false, '2025-04-13 13:18:53', 'admin'),
(72, 15, 3, 'Na Family Safe!!!', 'WC', '', 'you are immune to one attack for a round', '', false, '2025-04-13 13:18:53', 'admin'),
(73, 16, 3, 'Deva', 'HERO', 'Please, I kindly request', 'Take control of the game; draw cards until you have 7.', '', false, '2025-04-13 13:19:41', 'admin'),
(74, 16, 3, 'Varadha raja mannar', 'SR1', '', 'Phone call your deva and ask them for a promise, to get immunity for a round. If they are not doing drop two cards.', 'Pairs with Nibandhana', false, '2025-04-13 13:19:41', 'admin'),
(75, 16, 3, 'Radha rama mannar', 'SR2', 'call for cease fire', 'No one looses hero card for one round', '', false, '2025-04-13 13:19:41', 'admin'),
(77, 16, 3, 'Nibandhana', 'WC', '', 'Varadha may use Nibadhana to start a vote to choose a player. The player with most votes discards 3 cards.', '', false, '2025-04-13 13:19:41', 'admin'),
(78, 17, 3, 'Billa', 'HERO', 'Trust no one, kill anyone, be only one', 'Every player drops a card unless they have ACP KrishnaMurthy', 'You can stop Devil''s action', false, '2025-04-13 13:20:40', 'admin'),
(79, 17, 3, 'Devil', 'VILLAIN', 'Good for me bad for you / E deal varake ra ne avasaram', 'Smuggle 2 cards from pile. only billa can stop. if caught, devil card goes to them.', '', false, '2025-04-13 13:20:40', 'admin'),
(80, 17, 3, 'ACP krishnamurthy', 'SR1', 'Nuvvu Billa ga maaradaniki ide correct time!', 'Swap place with previous player', 'Pairs with Ranga', false, '2025-04-13 13:20:40', 'admin'),
(81, 17, 3, 'Maya', 'SR2', '', 'Guess who has Billa card and they drop one card. If they have Ranga card instead, all other players drops one card.', '', false, '2025-04-13 13:20:40', 'admin'),
(82, 17, 3, 'Ranga', 'WC', 'I will be back(act as billa)', 'Grab Billa card when someone is using it and drop this card', 'With ACP Krishnamurthy - Act as Billa and Steal two cards from next player', false, '2025-04-13 13:20:40', 'admin'),
(83, 19, 3, 'Bhairava', 'HERO', 'Eesari full ga prepare ayyi vacha', 'Collect 2 cards as bounty from any player', 'Pairs with Bujji', false, '2025-04-13 13:21:46', 'admin'),
(84, 19, 3, 'Supreme Yaskin', 'VILLAIN', 'Oka kotha prapancham rabotondi', 'Swap next player cards with deck cards.', 'Pairs with Serum', false, '2025-04-13 13:21:46', 'admin'),
(85, 19, 3, 'Ashwathama', 'SR1', 'Amma ni kaapadatam kosam chivari daaka poratam', 'Unless there is only one opponent, you do not have to discard this card if it is the only card in your hand.', '', false, '2025-04-13 13:21:46', 'admin'),
(86, 19, 3, 'Bujji', 'SR2', 'Get Ready Bhairava', 'Take Bhairava anywhere he asks for. Shift to any position in the player circle', '', false, '2025-04-13 13:21:46', 'admin'),
(88, 20, 3, 'Saaho', 'HERO', 'stadium lo six kottevaadike oka range untadi.', 'draw cards until you have 5 cards.', 'pairs with David', false, '2025-04-13 13:22:18', 'admin'),
(89, 20, 3, 'Devraj', 'VILLAIN', '', 'Next player drops one card.', 'pairs with black box', false, '2025-04-13 13:22:18', 'admin'),
(90, 20, 3, 'David', 'SR1', '', 'Hack into the top cards of the deck equal to the number of active players. Rearrange them in any order and place them back on top.', '', false, '2025-04-13 13:22:18', 'admin'),
(91, 20, 3, 'Vishwank Roy', 'SR2', '', 'If any player played Saaho this round, discard this card. After that player''s turn ends, take the Saaho card.', 'You have no attacks, just drop the card and watch the action.', false, '2025-04-13 13:22:18', 'admin'),
(92, 20, 3, 'Blackbox', 'WC', 'I will be a fucking billionaire', 'has the luxury to sit back and relax for two rounds', 'if Devraj gets hold of this, he can draw cards until your hand is full.', false, '2025-04-13 13:22:18', 'admin'),
(93, 22, 4, 'Gautham Nanda', 'HERO', 'Rich (nak e station kavali)', 'If you have this card, you can discard any two unwanted cards and draw two new cards from the pile', 'Everyone is a servant for one round', false, '2025-04-13 13:26:12', 'admin'),
(94, 22, 4, 'Siddappa', 'VILLAIN', NULL, 'Steal one card from the opponents'' hand, use it if you can, or drop the card', NULL, false, '2025-04-13 13:26:12', 'admin'),
(95, 22, 4, 'Sunanda', 'SR1', NULL, 'You can get back the card you discarded in the previous game; if not, draw a new card from the deck', NULL, false, '2025-04-13 13:26:12', 'admin'),
(96, 22, 4, 'Baddam Bhaskar', 'SR2', NULL, 'The player can swap to get one card from any player, but must sacrifice one extra card for that', NULL, false, '2025-04-13 13:26:12', 'admin'),
(97, 22, 4, 'ekkada neggalo kaadhu ekada taggalo telsina vaadu goppodu', 'WC', NULL, 'If the player holds this card, they can save five cards for one round', NULL, false, '2025-04-13 13:26:12', 'admin'),
(98, 26, 4, 'Gabbar Singh', 'HERO', 'Nakonchem thikkundhi… Kani daniko lekkundi', 'Each player exchanges all their cards', NULL, false, '2025-04-13 13:27:09', 'admin'),
(99, 26, 4, 'Siddhappa Naidu', 'VILLAIN', NULL, 'Can draw two cards from the opponent and must drop any two', NULL, false, '2025-04-13 13:27:09', 'admin'),
(100, 26, 4, 'Recovery Ranjith Kumar', 'SR1', 'Mimalni aayudhalutho kaadhu ra, vaayudhalatho champestha', 'Can skip a round (usable once every three rounds)', NULL, false, '2025-04-13 13:27:09', 'admin'),
(101, 26, 4, 'Ajay', 'SR2', NULL, 'Can take an extra card from any player by asking but must fulfill their request in return', NULL, false, '2025-04-13 13:27:09', 'admin'),
(102, 26, 4, 'Content Unodiki Cutout Chalu', 'WC', NULL, 'If the player holds this card along with Recovery Ranjith, they can either gain the Hero card ability or withstand one round', NULL, false, '2025-04-13 13:27:09', 'admin'),
(103, 28, 4, 'Sanjay "Sanju" Sahu', 'HERO', NULL, 'Can bring back two cards from the discard pile', NULL, false, '2025-04-13 13:27:49', 'admin'),
(104, 28, 4, 'Pranav (Head Constable)', 'SR1', 'Batch No. 58, Roll Number 132, Gold Medalist, Topper of the Batch – Pranav the HC', '', NULL, false, '2025-04-13 13:27:49', 'admin'),
(105, 28, 4, 'Damodar Reddy', 'VILLAIN', 'Naku dabbu avasaram appa anthe istam kaadhu | Light aarpalante transformer pelchalsina avasaram ledh appa, switch off chesina chalu', 'Stop the opponent''s Wild Card for one round | Grab two cards from the opponent', NULL, false, '2025-04-13 13:27:49', 'admin'),
(106, 28, 4, 'Bunk Seenu', 'SR2', NULL, '', NULL, false, '2025-04-13 13:27:49', 'admin'),
(107, 28, 4, 'Yuddham lo gelavatam ante shatruvuni champadam kaadu, shatruvuni odinchadam', 'WC', 'The sword used to fight the villain', 'Player with this card can see all the Wild Cards of opponents', NULL, false, '2025-04-13 13:27:49', 'admin'),
(108, 30, 4, 'Subbu', 'HERO', NULL, 'If this card is paired with any SR or Wild Card, the player can force opponents to discard cards for the round', NULL, false, '2025-04-13 13:28:12', 'admin'),
(109, 30, 4, 'Chakri', 'SR1', NULL, 'Can withhold a card for one round only if an SR player asks to drop or shuffle with a Wild Card', NULL, false, '2025-04-13 13:28:12', 'admin'),
(110, 30, 4, 'Rohit (Boxing Champion)', 'VILLAIN', NULL, 'Can reverse the game and force one opponent to discard a card', NULL, false, '2025-04-13 13:28:12', 'admin'),
(111, 30, 4, 'Jaanu', 'SR2', NULL, 'Supports the Hero card, doubling its power (X2 effect on Hero abilities) - If the player gets Jaanu without a Hero card, they can take another card from the deck and discard Jaanu - Jaanu can only support a Hero', NULL, false, '2025-04-13 13:28:12', 'admin'),
(112, 30, 4, 'Boxing 🥊', 'WC', NULL, 'With Subbu → Can eliminate one player from the game | With any other Hero → Can force an opponent to discard one card', NULL, false, '2025-04-13 13:28:12', 'admin'),
(113, 23, 4, 'Badri (Badrinath)', 'HERO', NULL, 'Player with this card can get one new card from the deck (can play with 6 cards)', NULL, false, '2025-04-13 13:28:38', 'admin'),
(114, 23, 4, 'Ali', 'SR1', NULL, 'Player with this card can draw a new card from the deck but must drop this card', NULL, false, '2025-04-13 13:28:38', 'admin'),
(115, 23, 4, 'Nanda', 'VILLAIN', NULL, 'Forces the opponent to exchange two cards', NULL, false, '2025-04-13 13:28:38', 'admin'),
(116, 23, 4, 'Vennela', 'SR2', NULL, 'Player with this card can exchange an SR card with the opponent', NULL, false, '2025-04-13 13:28:38', 'admin'),
(117, 23, 4, 'Nvu Nanda ithe enti nen Badri Badrinath', 'WC', NULL, 'Player with this card can ask the opponent to drop all their SR cards', NULL, false, '2025-04-13 13:28:38', 'admin'),
(118, 25, 4, 'Bheemla', 'HERO', NULL, 'Bomb the deck and shuffle the cards again', NULL, false, '2025-04-13 13:29:06', 'admin'),
(119, 25, 4, 'Daniel', 'VILLAIN', NULL, 'Force the opponent to play a card of your choice from their hand', NULL, false, '2025-04-13 13:29:06', 'admin'),
(120, 25, 4, 'Kodanda Ram', 'SR1', NULL, 'Rewind - Undo the last action by the last player', NULL, false, '2025-04-13 13:29:06', 'admin'),
(121, 25, 4, 'Jeevan Kumar', 'SR2', NULL, 'Blackmail - Forces the opponent to skip their next turn', NULL, false, '2025-04-13 13:29:06', 'admin'),
(122, 25, 4, 'Kokkili Devara', 'WC', NULL, 'Cancel all current actions and start a new round with the remaining cards. Each player receives an equal number of cards in the new round', NULL, false, '2025-04-13 13:29:06', 'admin'),
(123, 27, 4, 'Gudumba Shankar', 'HERO', 'Shankar evari joliki velladu… Vadiki joliki vasthe matram shape shakkalu marchandhe vadaladu', 'Can ask the opponent to drop all their Villain cards OR Save the Support cards for two rounds', NULL, false, '2025-04-13 13:29:27', 'admin'),
(124, 27, 4, 'Kumaraswamy', 'VILLAIN', NULL, '', NULL, false, '2025-04-13 13:29:27', 'admin'),
(125, 27, 4, 'Parabrahma Swamy (Brahmi)', 'SR1', NULL, 'Can check all the Villain cards from the opponents', NULL, false, '2025-04-13 13:29:27', 'admin'),
(126, 27, 4, 'Prabhu (Sunil)', 'SR2', NULL, '', NULL, false, '2025-04-13 13:29:27', 'admin'),
(127, 27, 4, 'Double Pant & Head Band', 'WC', NULL, '', NULL, false, '2025-04-13 13:29:27', 'admin'),
(128, 29, 4, 'Jai', 'HERO', NULL, 'Stun - Prevents other players'' Hero cards from being played for two rounds', NULL, false, '2025-04-13 13:30:01', 'admin'),
(129, 29, 4, 'Bhagavan', 'VILLAIN', NULL, 'Pull a wild card from the opponent and have to sacrifice one SR for this', NULL, false, '2025-04-13 13:30:01', 'admin'),
(130, 29, 4, 'M. Paparayudu', 'SR1', NULL, 'ask the opponent to drop one card but have to drop another card from your hand (or) pair with any Hero card & ask opponent to discard 2 cards', NULL, false, '2025-04-13 13:30:01', 'admin'),
(131, 29, 4, 'Munna', 'SR2', NULL, 'with any hero card can save this card', NULL, false, '2025-04-13 13:30:01', 'admin'),
(132, 29, 4, 'Paw / Pistol', 'WC', 'Sayam pondhinavadu kruthagnyatha chupinchacka povadam entha thappo, sayam chesina vadu kruthagnyatha asinchadam kuda anthe thapu', 'can help the player with least number of cards to draw one/ two cards- if the current player has least number he can draw or help others during the lose', NULL, false, '2025-04-13 13:30:01', 'admin'),
(133, 31, 4, 'Adv. Konidela Sathyadev', 'HERO', NULL, 'Can save/protect any one card for two rounds', NULL, false, '2025-04-13 13:30:18', 'admin'),
(134, 31, 4, 'Viswa', 'VILLAIN', NULL, 'Controls the next player, deciding which card they must choose for the play', NULL, false, '2025-04-13 13:30:18', 'admin'),
(135, 31, 4, 'Pallavi', 'SR1', NULL, 'Protects the SR cards for one round', NULL, false, '2025-04-13 13:30:18', 'admin'),
(136, 31, 4, 'Nanda Gopal (Lawyer)', 'SR2', NULL, 'Player with this card can pull any card from the opponent', NULL, false, '2025-04-13 13:30:18', 'admin'),
(137, 31, 4, 'Courtroom Drama', 'WC', NULL, 'Forces all players to reveal one of their cards, allowing you to choose any card to eliminate (even Salaar card, making it possible to remove powerful heroes)', NULL, false, '2025-04-13 13:30:18', 'admin'),
(138, 18, 3, 'Chatrapathi', 'HERO', 'okka adugu..okkka adugu...!!!', 'Challenge the next player to a Chatrapathi dialogue battle; the winner takes 2 cards from the loser.', 'Pairs with Appalanaidu.', false, '2025-04-14 13:12:44', 'admin'),
(139, 18, 3, 'Ashok', 'VILLAIN', 'Rendu chavulu jaragali... vasakolla', 'Sneak two cards from next player', '', false, '2025-04-14 13:13:58', 'admin'),
(140, 18, 3, 'Appala Naidu', 'SR1', 'Raajakeeyam, rowdyism okkati kaadu ra rey', 'Reverse the game direction', E'Pairs with chatrapathi:\nRedirect any incoming attack back to the player who played it on you.', false, '2025-04-14 13:15:01', 'admin'),
(141, 18, 3, 'Mahesh Nanda', 'SR2', 'No No control yourself...!!!', 'Any player with highest num of cards should drop a card', '', false, '2025-04-14 13:15:57', 'admin'),
(143, 21, 3, 'Venkat', 'HERO', 'sailu kosam 10 sarlu chaavadaniki nen ready! Nuvvu ready aah?', 'Challenge two players to enact the Gali Gannarao–Sunil episode; the act must be approved by the other players, or they must drop two cards each.', '', false, '2025-04-14 13:22:46', 'admin'),
(144, 21, 3, 'Bhadranna', 'VILLAIN', 'vaadu hero avvakoodadhu...', 'Swap all your cards with the opponent having the highest number of cards.', '', false, '2025-04-14 13:23:32', 'admin'),
(145, 21, 3, 'Lola Ranga Rao', 'SR1', 'naaku nee face nachaledu', 'Next player cannot cast cards for the next two turns, but other players may still cast actions on them', '', false, '2025-04-14 13:24:16', 'admin'),
(146, 21, 3, 'Gun, The Jagan', 'SR2', 'vethuku vethakali vethikithe dorakandantu emi undadu...', 'Swap any two cards in your hand with two cards from the deck.', '', false, '2025-04-14 13:25:43', 'admin'),
(147, 32, 7, 'Harsha/Kalabhairava', 'HERO', 'Okokkarini kaadhu Sher Khan Vanda Mandhini okesari rammanu', 'Harsha: Has Ability to take 2 cards from the deck', 'Kala Bhairava: Can Slash 2 cards of the opponent ', true, '2025-04-19 22:55:54', 'admin'),
(148, 32, 7, 'Randhev Billa', 'VILLAIN', 'Naku Dhakkanidhi inkevariki Dhakkanivvanu', 'If the opponent has the INDU card, Can snatch the card from them', '', false, '2025-04-19 23:14:01', 'admin'),
(149, 33, 6, 'Bantu', 'HERO', '', 'Save the Hand for one round and with ARK card he can get half of the cards from the deck (extra cards)', '', false, '2025-04-26 18:30:15', 'admin'),
(150, 33, 6, 'Appala Naidu', 'VILLAIN', '', 'Can kidnap (take a card from any one player)', '', false, '2025-04-26 18:30:46', 'admin'),
(151, 33, 6, 'Valmiki', 'SR1', '', 'Swaps a single card with the opponent', '', false, '2025-04-26 18:31:09', 'admin'),
(152, 33, 6, 'ARK (Thatha)', 'SR2', '', 'Player with this card can can break half of the players hand and ask them to take remaining half from the deck', '', false, '2025-04-26 18:31:33', 'admin'),
(153, 33, 6, 'Nurse Sulochana', 'WC', '', 'Player with card can see the other cards if swap happens (any round)', '', false, '2025-04-26 18:31:55', 'admin'),
(154, 34, 6, ' Lucky', 'HERO', '', 'Connect with any SR and ask the opponent to drop villain card or take a any SR from opponent to connect', '', false, '2025-04-26 18:32:53', 'admin'),
(155, 34, 6, 'Maddali Shiva Reddy', 'VILLAIN', 'you are finished!! / Maddali shiva reddy', 'will blackmail one opponent to drop two cards or give an option to the opponents to pluck one card from others', '', false, '2025-04-26 18:33:35', 'admin'),
(156, 34, 6, 'Spandana', 'SR1', ' Inside feeling', 'No use just hold the card and feel inside', '', false, '2025-04-26 18:34:07', 'admin'),
(157, 34, 6, 'Kill bill pandey', 'SR2', 'Bariloki dimpodhu brutal ipotha ', 'With any hero card + kill bill card - ask the opponent villain card to drop but has to sacrifice kill bill card', '', false, '2025-04-26 18:34:59', 'admin'),
(158, 34, 6, 'Devudddaa!!! / Connect ipoyav', 'WC', '', 'Able to get one card from the used cards - connect avvali', '', false, '2025-04-26 18:35:24', 'admin'),
(159, 35, 6, 'Ravindra Narayan', 'HERO', 'Class lo Evadaina Samadhanam Chepthadu kani Game Lo Cheppevaade...', 'Take a look at any of your opponent''s deck secretly and pick any one card', '', false, '2025-04-29 20:10:47', 'admin'),
(160, 35, 6, 'Bittu', 'VILLAIN', 'Manaki Telsina pani free ga cheyakudadhu, Manaki raani pani try cheyakudadhu', 'NA', '', false, '2025-04-29 20:17:57', 'admin'),
(161, 35, 6, 'DIG Sitaram', 'SR1', 'veediki konchem povvulni ammayilani choopinchandra mari voilent ga unnadu', 'everyone gives you a heroine card to you', '', false, '2025-04-29 20:19:17', 'admin'),
(163, 19, 3, 'Serum', 'WC', 'Vasthunnay, vasthunnay, jagannatha ratha chakralu vasthunnay.', 'Regain the lost number of cards in the previous round from the deck', 'pairs with Yaskin, eliminate any one player.', false, '2026-01-04 12:51:37', 'admin'),
(164, 16, 3, 'Rudhra Raja Mannar', 'VILLAIN', '', 'Each player places 1 card face down. Shuffle these cards to create a new deck for the next round', '', false, '2026-01-04 15:11:43', 'admin'),
(166, 21, 3, 'Varsham', 'WC', 'NA', 'Ask any player to call for rain. If it doesn''t rain, they lose one card.', '', false, '2026-01-05 18:05:30', 'admin'),
(167, 18, 3, 'Chembuu!!', 'WC', '', 'Replicate chembuu scene and get immunity for 2 rounds.(Must have at least two cards to use the ability)', '', false, '2026-01-06 07:25:18', 'admin');

-- Insert card_tags
INSERT INTO card_tags (card_id, tag_id) VALUES
(67, 3), (72, 2), (75, 2), (78, 1), (79, 1), (85, 2), (144, 1), (146, 6), (166, 3),
(166, 8), (145, 5), (145, 7), (143, 3), (143, 8), (88, 6), (88, 9), (90, 4), (92, 2),
(92, 6), (89, 1), (89, 9), (89, 7), (83, 1), (83, 8), (83, 9), (86, 5), (84, 5), (84, 9),
(84, 7), (140, 5), (140, 2), (141, 1), (141, 8), (139, 1), (139, 7), (167, 2), (167, 3),
(80, 5), (80, 9), (82, 1), (82, 7), (73, 6), (74, 3), (74, 9), (77, 1), (77, 8), (68, 3),
(68, 7), (71, 5), (69, 1), (69, 8), (63, 4), (164, 5), (164, 4), (65, 1), (65, 7), (66, 6),
(64, 3), (64, 7), (58, 1), (58, 7), (58, 9), (60, 2), (60, 5), (59, 5), (62, 2), (62, 9),
(53, 1), (53, 7), (53, 9), (56, 5), (54, 1), (54, 9), (55, 1), (55, 2), (55, 9), (57, 5),
(138, 3), (138, 9), (138, 7), (61, 8), (61, 5), (81, 1), (81, 8), (70, 1), (70, 8), (163, 1),
(163, 6), (163, 8), (163, 10);

-- ============================================================================
-- SEQUENCES INITIALIZATION
-- ============================================================================
-- Reset sequences to start after the highest IDs in each table
SELECT setval('games_id_seq', 1, true);
SELECT setval('heroes_id_seq', 8, true);
SELECT setval('movies_id_seq', 35, true);
SELECT setval('tags_id_seq', 10, true);
SELECT setval('cards_id_seq', 167, true);
