# Author Open Core Boundary

This repository is the public Author 1.2.x open-source line.

Author 1.2.x remains licensed under AGPL-3.0 and is maintained as the open core for the Web and desktop writing experience. Future commercial product lines, including Author Pro and Reader, are developed outside this repository in private repositories.

## Repository Roles

| Repository | Visibility | Role |
| --- | --- | --- |
| `author` | Public | Author 1.2.x open core, Web/Desktop, AGPL-3.0 |
| `author-mobile` | Private | Author mobile authoring app |
| `author-pro` | Private | Author 1.3+ commercial Web/Desktop authoring product |
| `reader` | Private | Reader Web/Desktop reading product |
| `reader-mobile` | Private | Reader mobile reading product |
| `reader-cloud` | Private | Reader ecosystem backend, ratings, subscriptions, recommendations, training, and administration |

## Public Repository Scope

Allowed in this repository:

- Bug fixes, security fixes, and maintenance for the Author 1.2.x open-source core.
- Open-source Web/Desktop writing features that can remain under AGPL-3.0.
- Public documentation for installing, self-hosting, and operating the open-source edition.

Not allowed in this repository:

- Reader product code or private Reader implementation plans.
- Author Pro / 1.3 commercial product code.
- Payment, subscription, quota, recommendation, rating aggregation, training, or commercial backend implementation.
- Private mobile source code, internal planning documents, secrets, signing keys, release credentials, or closed-source build artifacts.

## Release Boundary

Public GitHub Releases from this repository are reserved for Author 1.2.x open-source releases. Closed-source Author Pro, Reader, Reader Mobile, and Reader Cloud artifacts must be released through their own private repositories or separate commercial distribution channels.

The public release workflows in this repository intentionally target `v1.2.*` tags.

## Codex Work Boundary

Codex work in this repository should start by confirming:

- Current working directory.
- `git remote -v`.
- `git status --short`.
- Whether the task belongs to the public Author 1.2.x line or a private product line.

Use separate working directories for private product lines:

- `D:\author` for public Author 1.2.x.
- `D:\author\mobile` for private Author mobile.
- `D:\author-pro` for private Author Pro.
- `D:\reader` for private Reader Web/Desktop.
- `D:\reader-mobile` for private Reader Mobile.
- `D:\reader-cloud` for private Reader Cloud.

## Compliance Notes

This file is not legal advice. Before commercial distribution, perform a license and contributor audit for any code reused outside the AGPL-3.0 open core. Code contributed by third parties to this public repository should not be copied into closed-source products unless the required rights are confirmed, the code is rewritten, or a separate authorization is obtained.
