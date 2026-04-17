alter table projects add column if not exists is_featured boolean not null default false;
create index if not exists projects_is_featured_idx on projects (is_featured) where is_featured = true;
