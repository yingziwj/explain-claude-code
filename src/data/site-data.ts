import { allDocs, navSections, type NavSection } from './navigation';
import { getDocContent, type DocContent, type DocSectionContent } from './doc-content';

export type SitePage = {
	title: string;
	path: string;
	slug: string;
	sourceUrl: string;
	summary: string;
	description: string;
	sectionTitle: string;
	sectionKey: string;
	content: DocContent;
};

export type SiteData = {
	generatedAt: string;
	topNav: Array<{
		key: string;
		href: string;
		label: string;
	}>;
	sections: Array<{
		key: string;
		title: string;
		sidebar: Array<{
			title: string;
			items: Array<{
				href: string;
				title: string;
				actualPath: string;
			}>;
		}>;
	}>;
	pages: SitePage[];
};

function sectionKey(title: string) {
	return title.toLowerCase().replace(/\s+/g, '-');
}

function buildSidebar(section: NavSection) {
	return [
		{
			title: section.title,
			items: section.items.map((item) => ({
				href: item.path,
				title: item.title,
				actualPath: item.path
			}))
		}
	];
}

export const siteData: SiteData = {
	generatedAt: new Date().toISOString(),
	topNav: navSections.map((section) => ({
		key: sectionKey(section.title),
		href: section.items[0]?.path ?? '/',
		label: section.title
	})),
	sections: navSections.map((section) => ({
		key: sectionKey(section.title),
		title: section.title,
		sidebar: buildSidebar(section)
	})),
	pages: allDocs.map((doc) => ({
		title: doc.title,
		path: doc.path,
		slug: doc.slug,
		sourceUrl: `https://code.claude.com/docs/en/${doc.slug}`,
		summary: doc.summary,
		description: doc.description,
		sectionTitle: doc.section,
		sectionKey: sectionKey(doc.section),
		content: getDocContent(doc)
	}))
};

export function getSitePageBySlug(slug: string) {
	return siteData.pages.find((page) => page.slug === slug);
}

export function getSitePageByPath(path: string) {
	return siteData.pages.find((page) => page.path === path);
}

export function getPracticeSection(sections: DocSectionContent[]) {
	return sections.find((section) => section.title === '上手时重点盯住什么');
}

