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
  title_hi?: string | null;
  subtitle_hi?: string | null;
  icon: string;
  read_count: number;
  category?: string; // 'learn' | 'ask'
}

export interface Article {
  id: number;
  topic_id: number;
  title: string;
  body: string;
  title_hi?: string | null;
  body_hi?: string | null;
  read_minutes: number;
  source: string;
}

export interface Myth {
  id: number;
  topic_id: number | null;
  myth: string;
  fact: string;
  myth_hi?: string | null;
  fact_hi?: string | null;
  source: string;
  position: number;
}

export interface MythWithTopic extends Myth {
  topic_slug?: string;
  topic_title?: string;
}

export interface MythView {
  id: number;
  myth_id: number;
  viewed_at: string;
}

export interface Question {
  id: number;
  topic_id: number | null;
  topic_slug?: string;
  question: string;
  answer: string;
  question_hi?: string | null;
  answer_hi?: string | null;
  source: string;
  is_concerning?: number;
}

export interface SuggestedQuestion {
  id: number;
  question: string;
  topic_slug: string | null;
  created_at: string;
}

export interface QuestionFeedback {
  id: number;
  question_id: number;
  is_helpful: number;
  created_at: string;
}

export interface ArticleRead {
  id: number;
  article_id: number;
  read_at: string;
}

