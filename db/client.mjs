import { neon } from '@neondatabase/serverless';

function sqlForPostgres(query) {
  let index = 0;
  return query.replace(/\?/g, () => `$${++index}`);
}

function returningRows(query) {
  const statement = query.trim().replace(/;$/, '');
  if (/^(INSERT|UPDATE|DELETE)\b/i.test(statement) && !/\bRETURNING\b/i.test(statement)) {
    return `${statement} RETURNING 1`;
  }
  return statement;
}

export function createDb(sql) {
  const prepare = (query) => {
    let values = [];
    const statement = {
      bind(...parameters) {
        values = parameters;
        return statement;
      },
      async first() {
        const rows = await sql.query(sqlForPostgres(query), values);
        return rows[0] ?? null;
      },
      async all() {
        const results = await sql.query(sqlForPostgres(query), values);
        return { results };
      },
      async run() {
        const rows = await sql.query(sqlForPostgres(returningRows(query)), values);
        return { meta: { changes: rows.length } };
      },
      get query() {
        return query;
      },
      get values() {
        return values;
      },
    };
    return statement;
  };

  return {
    prepare,
    async batch(statements) {
      const results = await sql.transaction(
        statements.map((statement) =>
          sql.query(sqlForPostgres(returningRows(statement.query)), statement.values)
        )
      );
      return results.map((rows) => ({ results: rows, meta: { changes: rows.length } }));
    },
  };
}

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is unavailable. Configure the Neon connection string in the environment.');
  }

  return createDb(neon(url));
}
