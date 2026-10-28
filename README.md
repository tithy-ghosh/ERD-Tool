# ERD Tool

Design a PostgreSQL database visually. Draw tables, link them, and get ready-to-run SQL. Or paste SQL and get the diagram.

**Live demo:** YOUR_LIVE_LINK

![ERD Tool screenshot](./docs/screenshot.png)

## Features

- Add tables and columns, rename them, change types
- Mark Primary Keys and Foreign Keys
- Draw a line between two tables and the Foreign Key column is created for you
- Choose the relationship type: one-to-one, one-to-many, many-to-many
- Export PostgreSQL `CREATE TABLE` and `ALTER TABLE` statements, with warnings for common mistakes
- Import SQL and get the diagram back
- Download the diagram as PNG
- Your work is saved in the browser

## Tech stack

Next.js, TypeScript, Tailwind CSS, React Flow, Zustand, node-sql-parser, html-to-image

## Run locally

```bash
git clone https://github.com/tithy-ghosh/erd-tool.git
cd erd-tool
npm install
npm run dev
```

Open http://localhost:3000

## How it works

- The diagram lives in one Zustand store, which is saved to localStorage.
- SQL export reads the store and writes the `CREATE TABLE` statements first, then the Foreign Keys with `ALTER TABLE`. That way the order of tables never matters.
- SQL import parses the text into a syntax tree with node-sql-parser, then rebuilds tables, keys and lines from it.

## Roadmap

- [ ] Save diagrams to PostgreSQL and share by link
- [ ] Generate a diagram from a text description with AI
- [ ] More column types