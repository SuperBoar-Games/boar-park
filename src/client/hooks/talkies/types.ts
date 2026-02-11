// Talkies game data types

export interface Hero {
  id: number;
  name: string;
  industry: string;
  total_movies?: number;
  pending_movies?: number;
  total_cards?: number;
}

export interface Movie {
  id: number;
  hero_id: number;
  title: string;
  locked: boolean;
  need_review: boolean;
  total_cards?: number;
  review_cards?: number;
  hero_name?: string;
}

export interface Card {
  id: number;
  movie_id: number;
  hero_id: number;
  movie_title?: string;
  name: string;
  type: string;
  call_sign?: string;
  ability_text?: string;
  ability_text2?: string;
  need_review: boolean;
  tags?: Tag[];
  tag_ids?: number[];
}

export interface Tag {
  id: number;
  name: string;
  color: string;
  card_count?: number;
}
