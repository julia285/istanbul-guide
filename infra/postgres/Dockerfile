# Local dev only. Mirrors what Supabase (our managed Postgres) already
# provides out of the box: Postgres + PostGIS + pgvector. Production never
# builds this image — it exists so `docker-compose up` gives every
# developer the same extensions without installing the Supabase CLI.
FROM postgis/postgis:16-3.4

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     build-essential \
     postgresql-server-dev-16 \
     git \
     ca-certificates \
  && git clone --branch v0.8.0 --depth 1 https://github.com/pgvector/pgvector.git /tmp/pgvector \
  && cd /tmp/pgvector \
  && make \
  && make install \
  && cd / \
  && rm -rf /tmp/pgvector \
  && apt-get purge -y --auto-remove build-essential postgresql-server-dev-16 git \
  && rm -rf /var/lib/apt/lists/*
