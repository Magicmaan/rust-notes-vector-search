import {
	Archive,
	Article as FileText,
	Bookmark,
	CalendarMonth as CalendarDays,
	Delete as Trash2,
	Description as CheckSquare,
	Edit as PenLine,
	Folder as FolderKanban,
	GridView as Grid3X3,
	Inbox,
	MenuBook as BookOpen,
	Person as User,
} from "@project-lary/react-material-symbols-400-rounded";

// TODO: Replace with actual dynamic data
export const PRIMARY_NAV = [
	{ id: "all-notes", label: "All Notes", icon: FileText, colour: "#754658" },
	{ id: "bookmarks", label: "Bookmarks", icon: Bookmark, colour: "#465875" },
] as const;

export const SPACES = [
	{ id: "projects", label: "Projects", icon: FolderKanban },
	{ id: "writing", label: "Writing", icon: PenLine },
	{ id: "research", label: "Research", icon: BookOpen },
	{ id: "personal", label: "Personal", icon: User },
	{ id: "archive", label: "Archive", icon: Archive },
] as const;

export const TAGS = [
	{ id: "ideas", count: 12 },
	{ id: "roadmap", count: 8 },
	{ id: "product", count: 7 },
	{ id: "reading", count: 5 },
	{ id: "inspiration", count: 3 },
] as const;

export const DEFAULT_NOTE_COLORS = [
	"#e06a6a",
	"#78c26d",
	"#6f95ea",
	"#caa35e",
	"#8c7ac8",
] as const;
