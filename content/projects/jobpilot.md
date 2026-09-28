---
title: JobPilot
eyebrow: Local-first job search workspace
description: Turns a resume into a reusable profile, explainable job matches, and a reviewable application plan.
tags: Python, React
url: https://github.com/Codekiing/JobPilot
featured: true
order: 1
draft: false
diagram: /images/jobpilot-overview.svg
diagramAlt: JobPilot workflow from resume and preferences through a reusable profile, explainable job matching, candidate review, and application preparation.
workflow: Resume + goals, Candidate profile, Explainable matches, Review + prepare
---

## A more connected job search

Job searching often means copying the same information between a resume, job boards, spreadsheets, and application forms. JobPilot connects these steps through a structured candidate profile. Each stage produces data the next stage can reuse, while keeping the sources and intermediate results available for review.

## What it does

- **Builds a reusable profile.** Parses a resume locally, preserves the source text, and combines it with the candidate's goals and constraints.
- **Finds and explains matches.** Normalizes jobs from supported public channels or imported files, removes duplicates, and shows rule-based scores alongside matched and missing skills.
- **Supports informed selection.** Groups opportunities by company and recruitment type, with application-limit evidence and its verification status visible before a candidate chooses where to apply.
- **Prepares applications.** Reuses the confirmed profile to generate field mappings and per-job plans. Browser-assisted filling is available in supported flows; the candidate reviews the result and submits applications themselves.

## Engineering choices

The React and TypeScript workbench sits above a local Python API and independently runnable components. JSON artifacts connect resume parsing, profiling, matching, selection, and application planning. This makes each step inspectable and rerunnable without restarting the whole workflow. Playwright handles supported browser interactions, with user confirmation before personal information is entered or files are uploaded.

The current web workbench supports resume parsing, profile editing, and job search. Company-limit selection and browser-assisted filling are implemented as separate components but are not yet fully connected to the web interface. Matching is rule-based, and recruitment-site coverage depends on each site's availability and access restrictions.

[Explore the source and setup instructions](https://github.com/Codekiing/JobPilot)
