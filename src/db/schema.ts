export interface PeriodLog {
  id: number;
  start_date: string; // ISO date 'YYYY-MM-DD'
  end_date: string | null; // ISO date 'YYYY-MM-DD'
}

export interface Setting {
  key: string;
  value: string;
}

export interface Topic {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  icon: string;
  read_count: number;
  category?: string; // 'learn' | 'ask'
}

export interface Article {
  id: number;
  topic_id: number;
  title: string;
  body: string;
  read_minutes: number;
  source: string;
}

export interface Myth {
  id: number;
  topic_id: number | null;
  myth: string;
  fact: string;
  source: string;
  position: number;
}

export interface Question {
  id: number;
  topic_id: number | null;
  topic_slug?: string;
  question: string;
  answer: string;
  source: string;
}

export interface ArticleRead {
  id: number;
  article_id: number;
  read_at: string;
}

