import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({html:false, linkify:true, typographer:true});
const styleVersion = createHash('sha256').update(fs.readFileSync('public/style.css')).digest('hex').slice(0, 10);
const s = JSON.parse(fs.readFileSync('content/site.json','utf8'));
const esc = v => String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Metadata supports single-line values and two-space-indented literal blocks (|).
function readContent(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`Missing metadata: ${file}`);
  const meta = {};
  const metadataLines = match[1].split(/\r?\n/);
  for (let n = 0; n < metadataLines.length; n++) {
    const line = metadataLines[n];
    if (!line.trim()) continue;
    const field = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!field) throw new Error(`Invalid metadata: ${file}`);
    if (field[2].trim() === '|') {
      const block = [];
      while (n + 1 < metadataLines.length && (/^  /.test(metadataLines[n + 1]) || !metadataLines[n + 1].trim())) {
        const next = metadataLines[++n];
        block.push(next.startsWith('  ') ? next.slice(2) : '');
      }
      meta[field[1]] = block.join('\n').trim();
    } else {
      meta[field[1]] = field[2].trim();
    }
  }
  if (!meta.title) throw new Error(`Missing title: ${file}`);
  return {...meta, slug:path.basename(file, '.md'), body:match[2],
    tags:splitList(meta.tags), workflow:splitList(meta.workflow)};
}
function splitList(value = '') { return value.split(',').map(x => x.trim()).filter(Boolean); }
function readCollection(directory) {
  return fs.readdirSync(directory).filter(n => n.endsWith('.md')).map(n => readContent(path.join(directory, n))).filter(p => p.draft !== 'true');
}
const blogs = readCollection('content/blogs').sort((a,b) => (b.date || '').localeCompare(a.date || ''));
for (const blog of blogs) if (!/^\d{4}-\d{2}-\d{2}$/.test(blog.date)) throw new Error(`Missing title/date: ${blog.slug}`);
const about = readContent('content/about/index.md');
const education = JSON.parse(fs.readFileSync('content/about/education.json', 'utf8'));
const experience = JSON.parse(fs.readFileSync('content/about/experience.json', 'utf8')).sort((a,b) => b.start.localeCompare(a.start));
const aboutDescription = (about.description || '').split(/\n\s*\n/).filter(p => p.trim()).map(p => `<p>${esc(p).replaceAll('\n', '<br>')}</p>`).join('');
const aboutBody = md.render(about.body)
  .replace(/<h2>(Research Motivation|Looking Ahead)<\/h2>/g, '<h2 class="about-narrative-title">$1</h2>')
  .replace(/(<li>\s*<p><strong>)([A-Z][a-z]{2} \d{4}) · /g, '$1<span class="news-date">$2</span><span class="news-separator">·</span>');
const educationSection = education.length ? `<div class="education-section" aria-labelledby="education-title"><h2 id="education-title">Education</h2><div class="education-list">${education.map(item => `<div class="education-item"><div class="education-logo${item.logo.includes('bit-emblem') ? ' education-logo-bit' : ''}"><img src="${esc(item.logo)}" alt="${esc(item.school)} emblem" loading="lazy"></div><div class="education-details"><h3>${esc(item.school)}</h3><p>${esc(item.degree)} · ${esc(item.field)}</p></div><span class="education-dates">${esc(item.dates)}</span></div>`).join('')}</div></div>` : '';
const journeySteps = splitList(about.journey);
const researchJourney = journeySteps.length ? `<div class="research-journey" role="group" aria-labelledby="journey-title"><h2 id="journey-title">Research Journey</h2><ol>${journeySteps.map((step,i)=>`<li>${i ? '<span class="journey-arrow" aria-hidden="true"></span>' : ''}<span>${esc(step)}</span></li>`).join('')}</ol></div>` : '';

const projects = readCollection('content/projects').sort((a,b) => (Number(a.order) || 0) - (Number(b.order) || 0) || a.slug.localeCompare(b.slug));
const featured = projects.filter(p => p.featured === 'true');
const forks = JSON.parse(fs.readFileSync('content/projects/explorations.json', 'utf8'));
const home = s.home || {};
const projectsPage = JSON.parse(fs.readFileSync('content/projects/index.json', 'utf8'));
const blogsPage = JSON.parse(fs.readFileSync('content/blogs/index.json', 'utf8'));
const lines = text => esc(text || '').replaceAll('\n', '<br>');
const projectUrl = p => `/projects/${encodeURIComponent(p.slug)}/`;

fs.mkdirSync('dist',{recursive:true});
// Remove only generated output, ensuring deleted articles do not remain published.
fs.rmSync('dist',{recursive:true}); fs.mkdirSync('dist'); fs.cpSync('public','dist',{recursive:true});
const avatarImage = fs.readFileSync('public/images/avatar-favicon.png');
const avatarVersion = createHash('sha256').update(avatarImage).digest('hex').slice(0, 10);
// SVG clips the existing portrait to a rounded rectangle without altering the photo.
fs.writeFileSync('dist/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><defs><clipPath id="rounded"><rect width="128" height="128" rx="28"/></clipPath></defs><image width="128" height="128" href="data:image/png;base64,${avatarImage.toString('base64')}" clip-path="url(#rounded)"/></svg>`);
const favicon = `/favicon.svg?v=${avatarVersion}`;
const touchIcon = `/images/avatar-touch.png?v=${createHash('sha256').update(fs.readFileSync('public/images/avatar-touch.png')).digest('hex').slice(0, 10)}`;
function layout(title,desc,body,active='home',route='/'){
 desc = String(desc || '').replace(/\s+/g, ' ').trim();
 const group = active === 'projects' ? {label:'Works',url:'/projects/'} : active === 'blog' ? {label:'Blogs',url:'/blog/'} : null;
 const detail = group && route !== group.url;

 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)} · ${esc(s.name)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${esc(s.url+route)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><link rel="icon" href="${favicon}" type="image/svg+xml"><link rel="apple-touch-icon" href="${touchIcon}"><script>try{const t=localStorage.getItem('ck-theme');document.documentElement.dataset.theme=t==='dark'||t==='light'?t:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}catch(e){}</script><link rel="stylesheet" href="/style.css?v=${styleVersion}"><script src="/site.js" defer></script></head><body><a class="skip" href="#main">Skip to content</a><header class="site-header"><a class="brand" href="/" aria-label="${esc(s.name)} Home">${esc(s.name)}<i>.</i></a><nav class="main-nav" aria-label="Main navigation"><a ${active==='home'?'aria-current="page"':''} href="/">Home</a><a ${active==='about'?'aria-current="page"':''} href="/about/">About</a><a ${active==='projects'?'aria-current="'+(detail?'location':'page')+'"':''} href="/projects/">Works</a><a ${active==='blog'?'aria-current="'+(detail?'location':'page')+'"':''} href="/blog/">Blogs</a></nav><div class="header-actions"><button class="theme-toggle" type="button" aria-label="Switch to dark mode" aria-pressed="false" hidden><span aria-hidden="true">◐</span></button><a class="github" href="${esc(s.github)}">GitHub <span aria-hidden="true">↗</span></a></div></header><main id="main">${body}</main><footer><p class="footer-motto">Stay hungry, stay foolish</p></footer></body></html>`;
}
function write(route, html){const dir=path.join('dist',route);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'index.html'),html);}
const heading=(title,extra='')=>`<div class="section-head reveal"><div><h2>${title}</h2></div>${extra}</div>`;
const projectWorkflow=p=>`<div class="workflow">${p.workflow.map((step,i)=>`<span><b>${String(i+1).padStart(2,'0')}</b> ${esc(step)}</span>`).join('<i aria-hidden="true">→</i>')}</div>`;
const projectCard=(p)=>`<a class="project-card reveal" href="${projectUrl(p)}"><div class="project-caption"><div class="project-title-row"><h3>${esc(p.title)} <span aria-hidden="true">↗</span></h3><div class="tags">${p.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div></div><p>${esc(p.description || '')}</p></div>${p.diagram || p.workflow.length ? `<div class="project-art${p.diagram ? ' has-diagram' : ''}"${p.diagram ? '' : ` aria-label="${esc(p.title)} workflow"`}>${p.diagram ? `<img class="project-diagram" src="${esc(p.diagram)}" alt="${esc(p.diagramAlt || `${p.title} project overview`)}" loading="lazy">` : ''}${p.workflow.length ? projectWorkflow(p) : ''}</div>` : ''}</a>`;
const projectList = items => items.length ? items.map(projectCard).join('') : '<p class="section-note">Projects are on the way.</p>';

const sampleBadge = p => p.sample === 'true' ? '<span class="sample-badge">Sample post</span>' : '';
const blogList=(items)=>items.length?`<div class="post-list">${items.map(p=>`<a class="post-row" href="/blog/${encodeURIComponent(p.slug)}/"><div class="post-date"><time datetime="${p.date}">${p.date.replaceAll('-','.')}</time>${sampleBadge(p)}</div><div class="post-summary"><div class="post-topics">${p.tags.map(t=>`<span>${esc(t)}</span>`).join(' / ')}</div><h3>${esc(p.title)}</h3><p>${esc(p.description||'')}</p><span class="post-read">Read article · ${Math.max(1,Math.ceil(p.body.length/450))} min read</span></div><span class="post-arrow" aria-hidden="true">↗</span></a>`).join('')}</div>`:`<div class="empty-blog"><span class="empty-mark" aria-hidden="true">Aa</span><div><h3>The first post is on its way.</h3><p>Notes on building projects, solving problems, and exploring new ideas.</p></div></div>`;
const explorations=()=>`<div class="explorations">${forks.map((p,i)=>`<a class="exploration-card exploration-${i}" href="${esc(p.url)}"><div class="exploration-top"><span class="repo-number">${String(i+1).padStart(2,'0')}</span><span class="repo-type">Fork</span></div><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p><div class="repo-source"><span>Source</span><span>${esc(p.source)}</span></div><div class="repo-action">View on GitHub <span aria-hidden="true">↗</span></div></a>`).join('')}</div>`;
const profileCard=`<div class="identity-card"><div class="id-top"><span>PERSONAL ID</span><span>001</span></div><img src="/images/avatar-card.jpg" alt="${esc(s.name)}’s GitHub avatar" width="512" height="512"><div class="id-name">${esc(s.name)}<span>Code · Works · Blogs</span></div><div class="id-bottom"><span>GITHUB / CODEKIING</span></div></div>`;
const experienceTimeline = `<ol class="experience-timeline">${experience.map(item => `<li class="experience-entry"><div class="experience-card"><div class="experience-meta">${item.logo ? `<span class="experience-badge has-logo${item.logoClass ? ` ${esc(item.logoClass)}` : ''}" aria-hidden="true"><img src="${esc(item.logo)}" alt="" loading="lazy"></span>` : `<span class="experience-badge" aria-hidden="true">${esc(item.badge || item.organization[0])}</span>`}<time datetime="${esc(item.start)}">${esc(item.period)}</time></div><h3>${esc(item.role)} <span>@ ${esc(item.organization)}</span></h3><p>${esc(item.summary)}</p></div></li>`).join('')}</ol>`;
write('',layout('Home',about.summary || about.description || '',`<section id="about" class="about-section hero-section" aria-label="Introduction"><div class="profile-portrait">${profileCard}</div><div class="about-copy"><h1>${esc(about.title)}</h1><p>${esc(about.summary || about.description || '')}</p>${home.note ? `<p class="about-note">${lines(home.note)}</p>` : ''}</div><a class="hero-next" href="#experience" aria-label="Continue to Experience"><span>Explore Experience</span><span aria-hidden="true">↓</span></a></section><section id="experience" class="experience-section">${heading(esc(home.experienceTitle || 'Experience'))}${experienceTimeline}</section><section id="selected">${heading(esc(home.projectsTitle || 'Works'),'<a class="text-link" href="/projects/">All Works ↗</a>')}${projectList(featured)}</section><section class="writing-section">${heading(esc(home.blogsTitle || 'Blogs'),'<a class="text-link" href="/blog/">All Blogs ↗</a>')}${blogList(blogs.slice(0,3))}</section>`));
write('projects',layout('Works',projectsPage.description,`<section class="page-hero listing-hero"><h1>${esc(projectsPage.title)}</h1><p>${esc(projectsPage.description)}</p></section><section class="project-group">${projectList(projects)}</section><section class="exploration-group"><div class="section-head"><h2>${esc(projectsPage.explorationsTitle)}</h2></div><p class="section-note">${esc(projectsPage.explorationsDescription)}</p>${explorations()}</section>`,'projects','/projects/'));
for (const p of projects) write(`projects/${p.slug}`, layout(p.title, p.description || p.title, `<article class="article"><span class="eyebrow">${esc(p.eyebrow || 'PROJECT')}</span><h1>${esc(p.title)}</h1><p>${esc(p.description || '')}</p><div class="tags">${p.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div>${p.url ? `<p><a class="button" href="${esc(p.url)}">View project ↗</a></p>` : ''}${p.diagram ? `<figure class="project-figure"><img src="${esc(p.diagram)}" alt="${esc(p.diagramAlt || `${p.title} project overview`)}"><div class="project-figure-mobile">${projectWorkflow(p)}</div><figcaption>${esc(p.title)} at a glance: a reviewable path from input to application preparation.</figcaption></figure>` : ''}<div class="prose" lang="${/[\u3400-\u9fff]/.test(p.body) ? 'zh-CN' : 'en'}">${md.render(p.body)}</div><a class="text-link article-end" href="/projects/">← Back to Works</a></article>`, 'projects', projectUrl(p)));
write('about', layout('About', about.description || about.title, `<div class="about-page-heading"><h1>Abouts</h1></div><article class="article about-article"><div class="about-intro${about.photo ? ' has-photo' : ''}"><div><h2 class="introduction-title">Introduction</h2>${aboutDescription}</div>${about.photo ? `<img class="about-photo" src="${esc(about.photo)}" alt="${esc(s.name)} outdoors" width="860" height="1251">` : ''}</div>${educationSection}${researchJourney}<div class="prose">${aboutBody}</div><a class="text-link article-end" href="${esc(s.github)}">GitHub ↗</a></article>`, 'about', '/about/'));
write('blog',layout('Blogs',blogsPage.description,`<section class="page-hero listing-hero"><h1>${esc(blogsPage.title)}</h1><p>${esc(blogsPage.description)}</p></section><section class="blog-group">${blogList(blogs)}</section>`,'blog','/blog/'));
for(const p of blogs)write(`blog/${p.slug}`,layout(p.title,p.description||p.title,`<article class="article"><div class="article-meta">${sampleBadge(p)}<time datetime="${p.date}">${p.date}</time><span>${Math.max(1,Math.ceil(p.body.length/450))} min read</span></div><h1>${esc(p.title)}</h1><div class="tags">${p.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div><div class="prose">${p.sample === 'true' ? `<aside class="sample-notice"><strong>This is a sample post.</strong>This content demonstrates the reading layout and does not represent ${esc(s.name)}’s actual project experience or technical findings.</aside>` : ''}${md.render(p.body)}</div><a class="text-link article-end" href="/blog/">← Back to Blogs</a></article>`,'blog',`/blog/${encodeURIComponent(p.slug)}/`));
fs.writeFileSync('dist/404.html',layout('Page not found','This page does not exist.','<section class="page-hero"><span class="eyebrow">404</span><h1>Nothing here yet.</h1><p>Head home to explore projects and writing.</p><a class="button" href="/">Back to Home ↗</a></section>','none','/404.html'));
fs.writeFileSync('dist/.nojekyll','');
console.log(`Built homepage, about, ${projects.length} project(s), blog and ${blogs.length} published article(s) into dist/`);
