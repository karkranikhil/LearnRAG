import {
  Search,
  Hammer,
  Zap,
  Building2,
  Lock,
  Lightbulb,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Play,
  Copy,
  Upload,
  FileText,
  Database,
  Brain,
  Layers,
  Target,
  BarChart3,
  Puzzle,
  type LucideProps,
} from 'lucide-react';

// Badge icons
export const BadgeIcons = {
  explorer: Search,
  builder: Hammer,
  engineer: Zap,
  architect: Building2,
  locked: Lock,
} as const;

// Callout icons
export const CalloutIcons = {
  tip: Lightbulb,
  warning: AlertTriangle,
  important: AlertCircle,
  'plain-english': CheckCircle,
} as const;

// Feedback icons
export const FeedbackIcons = {
  positive: ThumbsUp,
  negative: ThumbsDown,
} as const;

// Chapter topic icons
export const ChapterIcons = {
  '1-why-rag': BookOpen,
  '2-chunking': Layers,
  '3-embeddings': Brain,
  '4-vector-databases': Database,
  '5-retrieval': Target,
  '6-prompting': FileText,
  '7-evaluation': BarChart3,
  '8-advanced-patterns': Puzzle,
} as const;

// Navigation
export const NavIcons = {
  next: ArrowRight,
  prev: ArrowLeft,
  chevron: ChevronRight,
  play: Play,
  copy: Copy,
  upload: Upload,
} as const;

export type { LucideProps };
