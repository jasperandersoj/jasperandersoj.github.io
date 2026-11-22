# jasperandersoj.github.io
A website-based portfolio for my personal engineering projects.

## CMS data

The static project and work-category lists use `data/projects.json` and
`data/works.json`. Detail pages read a record from those files using a
`?slug=<slug>` query parameter. Keep image paths relative to the repository
root; exported CMS images not already in `images/` are stored in `assets/cms/`.

The exported blog template is not wired to local data because no blog export is
available.

Work-category pages use the `Client` field as their title and list projects
whose `Project Type` matches the category slug. Legacy `(CASE)` export fields
are intentionally ignored.
